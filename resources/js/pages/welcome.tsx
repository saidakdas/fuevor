import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Sparkles, Target } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEventHandler, type KeyboardEvent, type PointerEvent } from 'react';

type GameStatus = 'ready' | 'running' | 'falling' | 'game-over';

type Gap = {
    x: number;
    width: number;
};

type Player = {
    height: number;
    velocity: number;
    y: number;
};

type WelcomeProps = {
    bestScoreMs: number;
    registrationSuccess: string | null;
};

type RegistrationForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

const GRAVITY = 1_800;
const JUMP_VELOCITY = 680;
const RUNNER_HEIGHT = 58;
const LEVEL_DURATION_MS = 30_000;
const BASE_SPEED = 225;
const SPEED_PER_LEVEL = 24;
const MAX_SPEED = 465;

function getLevelSpeed(level: number): number {
    return Math.min(MAX_SPEED, BASE_SPEED + (level - 1) * SPEED_PER_LEVEL);
}

function formatScore(milliseconds: number, locale: 'tr' | 'en'): string {
    const seconds = new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(milliseconds / 1_000);

    return `${seconds} ${locale === 'tr' ? 'sn' : 'sec'}`;
}

export default function Welcome({ bestScoreMs: initialBestScore, registrationSuccess }: WelcomeProps) {
    const { locale, t } = useLocale();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const gameSectionRef = useRef<HTMLElement>(null);
    const statusRef = useRef<GameStatus>('ready');
    const elapsedRef = useRef(0);
    const finalScoreRef = useRef(0);
    const lastFrameRef = useRef(0);
    const lastScorePaintRef = useRef(0);
    const fallTimeRef = useRef(0);
    const gapsRef = useRef<Gap[]>([]);
    const currentLevelRef = useRef(1);
    const dimensionsRef = useRef({ height: 360, width: 1_000 });
    const playerRef = useRef<Player>({ height: RUNNER_HEIGHT, velocity: 0, y: 0 });

    const [status, setStatus] = useState<GameStatus>('ready');
    const [scoreMs, setScoreMs] = useState(0);
    const [level, setLevel] = useState(1);
    const [bestScoreMs, setBestScoreMs] = useState(initialBestScore);
    const registration = useForm<RegistrationForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!registrationSuccess) {
            return;
        }

        const scrollTimer = window.setTimeout(() => {
            gameSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);

        return () => window.clearTimeout(scrollTimer);
    }, [registrationSuccess]);

    const submitRegistration: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        registration.post(route('register'), {
            onFinish: () => registration.reset('password', 'password_confirmation'),
        });
    };

    const changeStatus = useCallback((nextStatus: GameStatus) => {
        statusRef.current = nextStatus;
        setStatus(nextStatus);
    }, []);

    const saveScore = useCallback((durationMs: number) => {
        setBestScoreMs((current) => Math.max(current, durationMs));

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        void fetch(route('game-scores.store'), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({ duration_ms: durationMs }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Skor kaydedilemedi.');
                }

                return response.json() as Promise<{ best_score_ms: number }>;
            })
            .then(({ best_score_ms }) => setBestScoreMs(best_score_ms))
            .catch(() => {
                // Oyun çevrimdışıyken de kesintisiz çalışmaya devam eder.
            });
    }, []);

    const startGame = useCallback(() => {
        const { width } = dimensionsRef.current;
        const playerX = width * (width < 640 ? 0.25 : 0.22);

        elapsedRef.current = 0;
        finalScoreRef.current = 0;
        fallTimeRef.current = 0;
        lastScorePaintRef.current = 0;
        currentLevelRef.current = 1;
        playerRef.current = { height: RUNNER_HEIGHT, velocity: 0, y: 0 };
        gapsRef.current = [
            {
                x: playerX + Math.min(680, width * 0.72 + 320),
                width: Math.max(68, Math.min(104, width * 0.15)),
            },
        ];
        setScoreMs(0);
        setLevel(1);
        changeStatus('running');
    }, [changeStatus]);

    const jump = useCallback(() => {
        const player = playerRef.current;

        if (statusRef.current === 'running' && player.y <= 1) {
            player.velocity = JUMP_VELOCITY;
        }
    }, []);

    const interact = useCallback(() => {
        if (statusRef.current === 'ready' || statusRef.current === 'game-over') {
            startGame();
            return;
        }

        jump();
    }, [jump, startGame]);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        interact();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (![' ', 'ArrowUp', 'Enter'].includes(event.key)) {
            return;
        }

        event.preventDefault();
        interact();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const gameArea = gameAreaRef.current;

        if (!canvas || !gameArea) {
            return;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        const resizeCanvas = () => {
            const bounds = gameArea.getBoundingClientRect();
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

            dimensionsRef.current = { height: bounds.height, width: bounds.width };
            canvas.width = Math.round(bounds.width * pixelRatio);
            canvas.height = Math.round(bounds.height * pixelRatio);
            canvas.style.width = `${bounds.width}px`;
            canvas.style.height = `${bounds.height}px`;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(gameArea);
        resizeCanvas();

        let animationFrame = 0;

        const drawHorizontalTerrain = (startX: number, endX: number, y: number) => {
            if (endX <= startX) {
                return;
            }

            let lineStart = startX;

            for (const gap of gapsRef.current) {
                const gapStart = Math.max(startX, gap.x);
                const gapEnd = Math.min(endX, gap.x + gap.width);

                if (gapEnd <= startX || gapStart >= endX) {
                    continue;
                }

                if (gapStart > lineStart) {
                    context.moveTo(lineStart, y);
                    context.lineTo(gapStart, y);
                }

                lineStart = Math.max(lineStart, gapEnd);
            }

            if (lineStart < endX) {
                context.moveTo(lineStart, y);
                context.lineTo(endX, y);
            }
        };

        const drawRoadmap = (groundY: number, width: number, playerX: number) => {
            context.save();
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 5;
            const roadGradient = context.createLinearGradient(0, 0, width, 0);
            roadGradient.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            roadGradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.98)');
            roadGradient.addColorStop(1, 'rgba(118, 214, 255, 0.78)');
            context.strokeStyle = roadGradient;
            context.shadowBlur = 14;
            context.shadowColor = 'rgba(71, 177, 255, 0.28)';
            context.beginPath();
            drawHorizontalTerrain(-4, width + 4, groundY);
            context.stroke();

            context.shadowBlur = 0;
            context.setLineDash([3, 10]);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255, 255, 255, 0.24)';
            context.beginPath();
            drawHorizontalTerrain(-4, width + 4, groundY + 10);
            context.stroke();
            context.setLineDash([]);

            const progress = statusRef.current === 'ready' ? 0 : (elapsedRef.current % LEVEL_DURATION_MS) / LEVEL_DURATION_MS;
            const currentMarkerX = playerX - progress * Math.max(130, width * 0.38);
            const nextMarkerX = width - 32 - progress * (width - 32 - playerX);
            const markers = [
                { active: true, level: currentLevelRef.current, x: currentMarkerX },
                { active: false, level: currentLevelRef.current + 1, x: nextMarkerX },
            ];

            for (const marker of markers) {
                if (marker.x < -30 || marker.x > width + 30) {
                    continue;
                }

                context.beginPath();
                context.arc(marker.x, groundY, marker.active ? 16 : 18, 0, Math.PI * 2);
                context.fillStyle = marker.active ? '#ffffff' : '#0a84ff';
                context.shadowBlur = marker.active ? 8 : 18;
                context.shadowColor = marker.active ? 'rgba(255, 255, 255, 0.35)' : 'rgba(10, 132, 255, 0.48)';
                context.fill();

                context.shadowBlur = 0;
                context.fillStyle = marker.active ? '#07505a' : '#ffffff';
                context.font = `700 ${marker.active ? 12 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(String(marker.level), marker.x, groundY + 0.5);

                if (!marker.active) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.62)';
                    context.font = '600 9px -apple-system, BlinkMacSystemFont, sans-serif';
                    context.fillText('LEVEL', marker.x, groundY - 30);
                }
            }

            context.restore();
        };

        const drawRunner = (groundY: number, playerX: number, timestamp: number) => {
            const player = playerRef.current;
            const isRunning = statusRef.current === 'running';
            const isFalling = statusRef.current === 'falling';
            const runningOnGround = isRunning && player.y < 3;
            const stride = runningOnGround ? Math.sin(timestamp / 78) : 0;
            const bob = runningOnGround ? Math.abs(Math.sin(timestamp / 78)) * 1.5 : 0;
            const fallOffset = isFalling ? Math.pow(fallTimeRef.current / 1_000, 2) * 410 : 0;
            const footY = groundY - player.y + fallOffset - bob;

            context.save();
            context.translate(playerX, footY);

            if (isFalling) {
                context.rotate(Math.min(fallTimeRef.current / 420, 1) * 0.72);
            }

            context.strokeStyle = '#ffffff';
            context.fillStyle = '#ffffff';
            context.lineWidth = 3;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.shadowBlur = 9;
            context.shadowColor = 'rgba(255, 255, 255, 0.28)';

            context.beginPath();
            context.arc(0, -49, 7, 0, Math.PI * 2);
            context.stroke();

            context.beginPath();
            context.moveTo(0, -42);
            context.lineTo(0, -23);
            context.stroke();

            const armSwing = stride * 8;
            context.beginPath();
            context.moveTo(0, -36);
            context.lineTo(-10 - armSwing, -27 + Math.abs(stride) * 2);
            context.moveTo(0, -35);
            context.lineTo(10 + armSwing, -27 - Math.abs(stride) * 2);
            context.stroke();

            const legSwing = stride * 11;
            context.beginPath();
            context.moveTo(0, -23);
            context.lineTo(-7 - legSwing, -11);
            context.lineTo(-12 - legSwing, 0);
            context.moveTo(0, -23);
            context.lineTo(7 + legSwing, -11);
            context.lineTo(12 + legSwing, 0);
            context.stroke();
            context.restore();
        };

        const animate = (timestamp: number) => {
            const delta = lastFrameRef.current ? Math.min((timestamp - lastFrameRef.current) / 1_000, 0.034) : 0;
            lastFrameRef.current = timestamp;

            const { height, width } = dimensionsRef.current;
            const groundY = height * 0.67;
            const playerX = width * (width < 640 ? 0.25 : 0.22);
            const player = playerRef.current;

            if (statusRef.current === 'running') {
                elapsedRef.current += delta * 1_000;
                const calculatedLevel = Math.floor(elapsedRef.current / LEVEL_DURATION_MS) + 1;

                if (calculatedLevel !== currentLevelRef.current) {
                    currentLevelRef.current = calculatedLevel;
                    setLevel(calculatedLevel);
                }

                const currentLevel = currentLevelRef.current;
                const speed = getLevelSpeed(currentLevel);

                player.velocity -= GRAVITY * delta;
                player.y += player.velocity * delta;

                if (player.y <= 0) {
                    player.y = 0;
                    player.velocity = 0;
                }

                for (const gap of gapsRef.current) {
                    gap.x -= speed * delta;
                }

                gapsRef.current = gapsRef.current.filter((gap) => gap.x + gap.width > -20);

                const lastGap = gapsRef.current.at(-1);
                if (!lastGap || lastGap.x < width + 160) {
                    const previousEnd = lastGap ? lastGap.x + lastGap.width : width;
                    const levelIndex = currentLevelRef.current - 1;
                    const minimumSpacing = Math.max(180, 350 - levelIndex * 24);
                    const spacingVariance = Math.max(85, 230 - levelIndex * 16);
                    const minimumGapWidth = Math.min(108, 68 + levelIndex * 4);
                    const baseMaximumGapWidth = Math.max(68, Math.min(112, width * 0.19));
                    const maximumGapWidth = Math.max(minimumGapWidth, Math.min(145, baseMaximumGapWidth + levelIndex * 5));
                    const nextGapX = previousEnd + minimumSpacing + Math.random() * spacingVariance;
                    const nextGapWidth = minimumGapWidth + Math.random() * (maximumGapWidth - minimumGapWidth);

                    gapsRef.current.push({
                        x: nextGapX,
                        width: nextGapWidth,
                    });
                }

                const hasFallen = gapsRef.current.some((gap) => playerX + 7 >= gap.x && playerX - 7 <= gap.x + gap.width && player.y < 4);

                if (hasFallen) {
                    const completedScore = Math.max(250, Math.round(elapsedRef.current));
                    finalScoreRef.current = completedScore;
                    setScoreMs(completedScore);
                    fallTimeRef.current = 0;
                    changeStatus('falling');
                    saveScore(completedScore);
                } else if (elapsedRef.current - lastScorePaintRef.current > 50) {
                    lastScorePaintRef.current = elapsedRef.current;
                    setScoreMs(Math.round(elapsedRef.current));
                }
            } else if (statusRef.current === 'falling') {
                fallTimeRef.current += delta * 1_000;

                if (fallTimeRef.current > 720) {
                    changeStatus('game-over');
                }
            }

            context.clearRect(0, 0, width, height);
            drawRoadmap(groundY, width, playerX);
            drawRunner(groundY, playerX, timestamp);

            animationFrame = window.requestAnimationFrame(animate);
        };

        animationFrame = window.requestAnimationFrame(animate);

        return () => {
            resizeObserver.disconnect();
            window.cancelAnimationFrame(animationFrame);
        };
    }, [changeStatus, saveScore]);

    return (
        <>
            <Head title={t('Hedeflerini Gerçeğe Dönüştür', 'Turn Your Goals Into Reality')}>
                <meta
                    name="description"
                    content={t(
                        'Hedeflerini sadeleştir, yol haritanı oluştur ve gelecekteki kendini adım adım inşa et.',
                        'Simplify your goals, build your roadmap, and create your future self one step at a time.',
                    )}
                />
            </Head>

            <div className="min-h-[100svh] overflow-x-hidden bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <header className="sticky top-0 z-40 border-b border-black/[0.055] bg-[#f5f5f7]/78 backdrop-blur-2xl">
                    <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-8">
                        <img src="/fuevor-color-logo.svg" alt="Fuevor" className="h-auto w-[112px] sm:w-[128px]" draggable={false} />
                        <div className="flex items-center gap-2">
                            <a
                                href={route('login')}
                                className="inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-semibold text-[#3a3a3c] transition hover:bg-black/[0.045] sm:px-5 sm:text-sm"
                            >
                                {t('Giriş Yap', 'Sign In')}
                            </a>
                            <a
                                href="#early-access"
                                className="inline-flex h-10 items-center justify-center rounded-full bg-[#007aff] px-4 text-[13px] font-semibold text-white shadow-[0_7px_20px_rgba(0,122,255,0.22)] transition hover:bg-[#0071e3] active:scale-[0.98] sm:px-5 sm:text-sm"
                            >
                                {t('Erken Erişim', 'Early Access')}
                            </a>
                        </div>
                    </div>
                </header>

                <main>
                    <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pt-14 pb-12 sm:px-8 sm:pt-20 sm:pb-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pt-24">
                        <div className="pointer-events-none absolute -top-32 -left-48 size-[420px] rounded-full bg-[#007aff]/7 blur-3xl" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#007aff]/12 bg-[#007aff]/7 px-3 py-1.5 text-[12px] font-semibold text-[#007aff]">
                                <Sparkles className="size-3.5" aria-hidden="true" />
                                {t('Gelecekteki kendini inşa et', 'Build your future self')}
                            </span>
                            <h1 className="mt-5 max-w-2xl text-[clamp(2.65rem,7vw,5.2rem)] leading-[0.98] font-semibold tracking-[-0.065em] text-balance">
                                {t('Hedeflerini gerçeğe dönüştür.', 'Turn your goals into reality.')}
                            </h1>
                            <p className="mt-6 max-w-xl text-[17px] leading-7 text-[#6e6e73] sm:text-xl sm:leading-8">
                                {t(
                                    'Ne istediğini belirle, yolunu sade adımlara böl ve her gün ne kadar ilerlediğini tek bakışta gör.',
                                    'Decide what you want, break the journey into simple steps, and see your progress at a glance every day.',
                                )}
                            </p>

                            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                                {[
                                    t('Hedefini belirle', 'Set your goal'),
                                    t('Yolunu planla', 'Plan your path'),
                                    t('İlerlemeni gör', 'See your progress'),
                                ].map((item, index) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2.5 rounded-[16px] border border-black/[0.055] bg-white/75 px-3.5 py-3 text-[13px] font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.035)] backdrop-blur-xl"
                                    >
                                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#007aff]/10 text-[12px] font-bold text-[#007aff]">
                                            {index + 1}
                                        </span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            id="early-access"
                            className="relative rounded-[30px] border border-white bg-white/88 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.1)] backdrop-blur-2xl sm:p-7"
                        >
                            <div className="flex items-start gap-4">
                                <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#007aff] text-white shadow-[0_8px_22px_rgba(0,122,255,0.24)]">
                                    <Target className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.16em] text-[#007aff] uppercase">
                                        {t('Sınırlı erken erişim', 'Limited early access')}
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{t('Yerini ayır', 'Reserve your place')}</h2>
                                    <p className="mt-1 text-sm leading-5 text-[#8e8e93]">
                                        {t('Fuevor hazır olduğunda ilk sen haberdar ol.', 'Be among the first to know when Fuevor is ready.')}
                                    </p>
                                </div>
                            </div>

                            <form className="mt-7 grid gap-3 text-left" onSubmit={submitRegistration}>
                                <div>
                                    <label className="sr-only" htmlFor="welcome-name">
                                        {t('Ad soyad', 'Full name')}
                                    </label>
                                    <input
                                        id="welcome-name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        autoCapitalize="words"
                                        value={registration.data.name}
                                        onChange={(event) => registration.setData('name', event.target.value)}
                                        disabled={registration.processing}
                                        placeholder={t('Ad soyad', 'Full name')}
                                        className="h-[52px] w-full rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:bg-white focus:ring-4 focus:ring-[#007aff]/8 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.name} className="mt-1.5 text-xs text-[#ff3b30]" />
                                </div>

                                <div>
                                    <label className="sr-only" htmlFor="welcome-email">
                                        {t('E-posta adresi', 'Email address')}
                                    </label>
                                    <input
                                        id="welcome-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={registration.data.email}
                                        onChange={(event) => registration.setData('email', event.target.value)}
                                        disabled={registration.processing}
                                        placeholder={t('E-posta adresi', 'Email address')}
                                        className="h-[52px] w-full rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:bg-white focus:ring-4 focus:ring-[#007aff]/8 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.email} className="mt-1.5 text-xs text-[#ff3b30]" />
                                </div>

                                <div>
                                    <label className="sr-only" htmlFor="welcome-password">
                                        {t('Şifre', 'Password')}
                                    </label>
                                    <input
                                        id="welcome-password"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={registration.data.password}
                                        onChange={(event) => {
                                            registration.setData('password', event.target.value);
                                            registration.setData('password_confirmation', event.target.value);
                                        }}
                                        disabled={registration.processing}
                                        placeholder={t('Şifreni belirle', 'Set your password')}
                                        className="h-[52px] w-full rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:bg-white focus:ring-4 focus:ring-[#007aff]/8 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.password} className="mt-1.5 text-xs text-[#ff3b30]" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={registration.processing}
                                    className="mt-1 flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#007aff] px-5 text-[15px] font-semibold text-white shadow-[0_9px_24px_rgba(0,122,255,0.22)] transition hover:bg-[#0071e3] focus:ring-4 focus:ring-[#007aff]/18 focus:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {registration.processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                    {t('Erken Erişime Katıl', 'Join Early Access')}
                                    {!registration.processing && <ArrowRight className="size-4" aria-hidden="true" />}
                                </button>
                            </form>
                            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8e8e93]">
                                <LockKeyhole className="size-3" aria-hidden="true" />
                                {t('Bilgilerin güvende. İstediğin zaman ayrılabilirsin.', 'Your information is secure. Leave anytime.')}
                            </p>
                        </div>
                    </section>

                    <section ref={gameSectionRef} className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-16 sm:scroll-mt-24 sm:px-8 sm:pb-24">
                        <div className="overflow-hidden rounded-[32px] border border-black/[0.055] bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-5">
                            {registrationSuccess && (
                                <div
                                    className="mb-3 flex items-center gap-3 rounded-[20px] border border-[#34c759]/14 bg-[#34c759]/8 px-4 py-3.5 sm:mb-5 sm:px-5 sm:py-4"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#34c759] text-white shadow-[0_7px_18px_rgba(52,199,89,0.22)]">
                                        <Check className="size-4.5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-[15px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
                                            {t('Erken erişim listesindesiniz', 'You are on the early access list')}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-[#6e6e73]">
                                            {t(
                                                'Kaydınız tamamlandı. Şimdi yolculuğa başlayabilirsiniz.',
                                                'Registration complete. You can start the journey now.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-3 px-2 pt-3 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-3 sm:pt-2 sm:pb-6">
                                <div>
                                    <span className="text-[11px] font-semibold tracking-[0.16em] text-[#007aff] uppercase">
                                        {t('Hedef yolculuğu', 'Goal journey')}
                                    </span>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                                        {t('Yol haritasında ne kadar ilerleyebilirsin?', 'How far can you go on the roadmap?')}
                                    </h2>
                                </div>
                                <p className="max-w-md text-sm leading-5 text-[#8e8e93] sm:text-right">
                                    {t(
                                        'Boşlukları aş. Her 30 saniyede seviye atla; yol hızlandıkça odağını koru.',
                                        'Clear the gaps. Level up every 30 seconds and stay focused as the road gets faster.',
                                    )}
                                </p>
                            </div>

                            <div
                                ref={gameAreaRef}
                                className="relative min-h-[500px] cursor-pointer touch-none overflow-hidden rounded-[26px] bg-[#043f48] bg-[radial-gradient(circle_at_76%_10%,rgba(42,183,218,0.32),transparent_34%),linear-gradient(135deg,#022f35_0%,#075662_60%,#078da4_100%)] outline-none select-none sm:min-h-[450px]"
                                role="button"
                                tabIndex={0}
                                aria-label={t(
                                    'Fuevor yol haritası oyunu. Başlamak ve zıplamak için dokun.',
                                    'Fuevor roadmap game. Tap to start and jump.',
                                )}
                                onPointerDown={handlePointerDown}
                                onKeyDown={handleKeyDown}
                            >
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
                                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

                                <div
                                    className="pointer-events-none absolute top-5 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center rounded-[20px] border border-white/12 bg-black/12 px-3 py-3 text-center shadow-lg backdrop-blur-xl sm:top-7 sm:py-4"
                                    aria-live="polite"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[0.56rem] font-semibold tracking-[0.25em] text-white/48 uppercase">{t('Skor', 'Score')}</p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">
                                            {formatScore(scoreMs, locale)}
                                        </p>
                                    </div>
                                    <span className="h-9 w-px bg-white/15" aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[0.56rem] font-semibold tracking-[0.25em] text-white/48 uppercase">
                                            {t('Seviye', 'Level')}
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">{level}</p>
                                    </div>
                                    <span className="h-9 w-px bg-white/15" aria-hidden="true" />
                                    <div
                                        className="min-w-0 flex-1"
                                        aria-label={`${t('En iyi skor', 'Best score')} ${formatScore(bestScoreMs, locale)}`}
                                    >
                                        <p className="text-[0.56rem] font-semibold tracking-[0.2em] whitespace-nowrap text-white/48 uppercase">
                                            {t('En iyi', 'Best')}
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">
                                            {formatScore(bestScoreMs, locale)}
                                        </p>
                                    </div>
                                </div>

                                {status === 'ready' && (
                                    <div className="pointer-events-none absolute top-[39%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center text-white sm:top-[46%]">
                                        <span className="relative mx-auto mb-3 grid size-12 place-items-center rounded-full border border-white/35 bg-white/12 backdrop-blur-sm sm:mb-5 sm:size-15">
                                            <span className="absolute inset-0 animate-ping rounded-full border border-white/18" />
                                            <ArrowRight className="size-4 sm:size-5" aria-hidden="true" />
                                        </span>
                                        <p className="text-lg font-semibold tracking-tight sm:text-xl">
                                            {t('Yolculuğu başlatmak için dokun', 'Tap to begin the journey')}
                                        </p>
                                        <p className="mt-2 hidden text-xs tracking-wide text-white/58 sm:block sm:text-sm">
                                            {t('Boşlukları geçmek için tekrar dokun ve zıpla', 'Tap again to jump over the gaps')}
                                        </p>
                                    </div>
                                )}

                                {status === 'game-over' && (
                                    <div className="pointer-events-none absolute top-[46%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center text-white">
                                        <p className="text-[0.62rem] font-semibold tracking-[0.3em] text-white/55 uppercase">
                                            {t('Yolculuk tamamlandı', 'Journey complete')}
                                        </p>
                                        <p className="mt-1 text-5xl font-semibold tracking-[-0.045em] tabular-nums sm:text-6xl">
                                            {formatScore(finalScoreRef.current, locale)}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-[#78d6ff]">
                                            {t('Ulaşılan seviye', 'Level reached')} {level}
                                        </p>
                                        <p className="mt-5 text-sm font-medium text-white/72">{t('Tekrar denemek için dokun', 'Tap to try again')}</p>
                                    </div>
                                )}

                                <div className="pointer-events-none absolute right-5 bottom-5 left-5 sm:right-7 sm:bottom-7 sm:left-7">
                                    <div className="mb-2 flex items-center justify-between text-[9px] font-semibold tracking-[0.14em] text-white/42 uppercase">
                                        <span>
                                            {t('Seviye', 'Level')} {level}
                                        </span>
                                        <span>
                                            {Math.max(0, Math.ceil((LEVEL_DURATION_MS - (scoreMs % LEVEL_DURATION_MS)) / 1_000))} {t('sn', 'sec')}
                                        </span>
                                    </div>
                                    <div className="h-1 overflow-hidden rounded-full bg-white/12">
                                        <div
                                            className="h-full rounded-full bg-[#5ac8fa] transition-[width] duration-75"
                                            style={{ width: `${((scoreMs % LEVEL_DURATION_MS) / LEVEL_DURATION_MS) * 100}%` }}
                                        />
                                    </div>
                                    <p className="mt-3 text-center text-[0.55rem] font-semibold tracking-[0.2em] whitespace-nowrap text-white/36 uppercase">
                                        {t('Dokun', 'Tap')} · Space · ↑
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-black/[0.055] px-5 py-6 text-center text-xs text-[#8e8e93]">
                    © {new Date().getFullYear()} Fuevor · {t('Gelecekteki kendini inşa et.', 'Build your future self.')}
                </footer>
            </div>
        </>
    );
}
