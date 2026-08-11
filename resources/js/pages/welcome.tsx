import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEventHandler, type KeyboardEvent, type PointerEvent } from 'react';

type GameStatus = 'ready' | 'running' | 'falling' | 'game-over';

type Gap = {
    x: number;
    width: number;
};

type LevelStep = {
    crossedAtMs: number | null;
    targetLevel: number;
    x: number;
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
const LEVEL_DURATION_MS = 60_000;
const LEVEL_STEP_HEIGHT = 28;
const LEVEL_STEP_LEAD_MS = 2_600;
const LEVEL_STEP_CLIMB_MS = 320;
const LEVEL_STEP_CLEARANCE = 120;
const BASE_SPEED = 235;
const SPEED_PER_LEVEL = 24;
const MAX_SPEED = 430;

function getLevelSpeed(level: number): number {
    return Math.min(MAX_SPEED, BASE_SPEED + (level - 1) * SPEED_PER_LEVEL);
}

function easeInOut(progress: number): number {
    return progress * progress * (3 - 2 * progress);
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
    const statusRef = useRef<GameStatus>('ready');
    const elapsedRef = useRef(0);
    const finalScoreRef = useRef(0);
    const lastFrameRef = useRef(0);
    const lastScorePaintRef = useRef(0);
    const fallTimeRef = useRef(0);
    const gapsRef = useRef<Gap[]>([]);
    const currentLevelRef = useRef(1);
    const levelStepRef = useRef<LevelStep | null>(null);
    const dimensionsRef = useRef({ height: 360, width: 1_000 });
    const playerRef = useRef<Player>({ height: RUNNER_HEIGHT, velocity: 0, y: 0 });

    const [status, setStatus] = useState<GameStatus>('ready');
    const [scoreMs, setScoreMs] = useState(0);
    const [bestScoreMs, setBestScoreMs] = useState(initialBestScore);
    const registration = useForm<RegistrationForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

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
        levelStepRef.current = null;
        playerRef.current = { height: RUNNER_HEIGHT, velocity: 0, y: 0 };
        gapsRef.current = [
            {
                x: playerX + Math.min(680, width * 0.72 + 320),
                width: Math.max(68, Math.min(104, width * 0.15)),
            },
        ];
        setScoreMs(0);
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

        const drawTerrain = (groundY: number, width: number, cameraElevation: number) => {
            context.save();
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 2;
            context.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            context.shadowBlur = 10;
            context.shadowColor = 'rgba(255, 255, 255, 0.32)';
            context.beginPath();

            const levelStep = levelStepRef.current;
            if (!levelStep) {
                drawHorizontalTerrain(-2, width + 2, groundY);
            } else {
                const lowerGroundY = groundY + cameraElevation;
                const upperGroundY = lowerGroundY - LEVEL_STEP_HEIGHT;

                drawHorizontalTerrain(-2, Math.min(levelStep.x, width + 2), lowerGroundY);
                drawHorizontalTerrain(Math.max(levelStep.x, -2), width + 2, upperGroundY);

                if (levelStep.x >= -2 && levelStep.x <= width + 2) {
                    context.moveTo(levelStep.x, lowerGroundY);
                    context.lineTo(levelStep.x, upperGroundY);
                }
            }

            context.stroke();
            context.restore();
        };

        const drawRunner = (groundY: number, playerX: number, timestamp: number, climbProgress: number) => {
            const player = playerRef.current;
            const isRunning = statusRef.current === 'running';
            const isFalling = statusRef.current === 'falling';
            const runningOnGround = isRunning && player.y < 3;
            const stride = runningOnGround ? Math.sin(timestamp / 78) : 0;
            const bob = runningOnGround ? Math.abs(Math.sin(timestamp / 78)) * 1.5 : 0;
            const climbBob = Math.sin(climbProgress * Math.PI) * 4;
            const fallOffset = isFalling ? Math.pow(fallTimeRef.current / 1_000, 2) * 410 : 0;
            const footY = groundY - player.y + fallOffset - bob - climbBob;

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
            let cameraElevation = 0;
            let climbProgress = 0;

            if (statusRef.current === 'running') {
                elapsedRef.current += delta * 1_000;
                const currentLevel = currentLevelRef.current;
                const speed = getLevelSpeed(currentLevel);
                const nextLevelAtMs = currentLevel * LEVEL_DURATION_MS;

                if (!levelStepRef.current && elapsedRef.current >= nextLevelAtMs - LEVEL_STEP_LEAD_MS) {
                    const remainingSeconds = Math.max(0, nextLevelAtMs - elapsedRef.current) / 1_000;
                    const stepX = playerX + speed * remainingSeconds;

                    levelStepRef.current = {
                        crossedAtMs: null,
                        targetLevel: currentLevel + 1,
                        x: stepX,
                    };
                    gapsRef.current = gapsRef.current.filter(
                        (gap) => gap.x + gap.width <= stepX - LEVEL_STEP_CLEARANCE || gap.x >= stepX + LEVEL_STEP_CLEARANCE,
                    );
                }

                player.velocity -= GRAVITY * delta;
                player.y += player.velocity * delta;

                if (player.y <= 0) {
                    player.y = 0;
                    player.velocity = 0;
                }

                for (const gap of gapsRef.current) {
                    gap.x -= speed * delta;
                }

                const levelStep = levelStepRef.current;
                if (levelStep) {
                    levelStep.x -= speed * delta;

                    if (levelStep.crossedAtMs === null && levelStep.x <= playerX) {
                        levelStep.crossedAtMs = elapsedRef.current;
                        currentLevelRef.current = levelStep.targetLevel;
                    }
                }

                gapsRef.current = gapsRef.current.filter((gap) => gap.x + gap.width > -20);

                const lastGap = gapsRef.current.at(-1);
                if (!lastGap || lastGap.x < width + 160) {
                    const previousEnd = lastGap ? lastGap.x + lastGap.width : width;
                    const levelIndex = currentLevelRef.current - 1;
                    const minimumSpacing = Math.max(220, 350 - levelIndex * 24);
                    const spacingVariance = Math.max(100, 230 - levelIndex * 16);
                    const minimumGapWidth = Math.min(104, 68 + levelIndex * 3);
                    const baseMaximumGapWidth = Math.max(68, Math.min(112, width * 0.19));
                    const maximumGapWidth = Math.max(minimumGapWidth, Math.min(140, baseMaximumGapWidth + levelIndex * 5));
                    let nextGapX = previousEnd + minimumSpacing + Math.random() * spacingVariance;
                    const nextGapWidth = minimumGapWidth + Math.random() * (maximumGapWidth - minimumGapWidth);
                    const pendingStep = levelStepRef.current;

                    if (
                        pendingStep &&
                        nextGapX < pendingStep.x + LEVEL_STEP_CLEARANCE &&
                        nextGapX + nextGapWidth > pendingStep.x - LEVEL_STEP_CLEARANCE
                    ) {
                        nextGapX = pendingStep.x + LEVEL_STEP_CLEARANCE;
                    }

                    gapsRef.current.push({
                        x: nextGapX,
                        width: nextGapWidth,
                    });
                }

                const activeStep = levelStepRef.current;
                if (activeStep && activeStep.crossedAtMs !== null) {
                    climbProgress = Math.min(1, (elapsedRef.current - activeStep.crossedAtMs) / LEVEL_STEP_CLIMB_MS);
                    cameraElevation = easeInOut(climbProgress) * LEVEL_STEP_HEIGHT;

                    if (climbProgress === 1 && activeStep.x < -LEVEL_STEP_CLEARANCE) {
                        levelStepRef.current = null;
                    }
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
            drawTerrain(groundY, width, cameraElevation);
            drawRunner(groundY, playerX, timestamp, climbProgress);

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
            <Head title={t('Gelecekteki Kendini İnşa Et', 'Build Your Future Self')}>
                <meta
                    name="description"
                    content={t(
                        'Fuevor çizgi koşu oyununda boşlukların üzerinden atla ve en iyi süreyi yakala.',
                        'Jump over the gaps in the Fuevor line-running game and set your best time.',
                    )}
                />
            </Head>

            <div className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-[#00464d] text-white">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(106deg,#002b2f_0%,#004b53_42%,#08a5bf_100%)]" />
                <div className="pointer-events-none absolute -top-32 right-[4%] h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-[-12rem] left-[24%] h-96 w-96 rounded-full bg-black/10 blur-3xl" />

                <main className="relative z-10 flex min-h-0 flex-1 flex-col pt-5 sm:pt-7">
                    <section className="flex flex-col items-center px-5 pt-2 text-center sm:pt-0">
                        <img
                            src="/fuevor-white-logo.svg"
                            alt="Fuevor"
                            className="h-auto w-[min(64vw,350px)] drop-shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
                            draggable={false}
                        />
                        <h1 className="-mt-2 text-xs font-semibold tracking-[0.18em] text-white/60 sm:text-sm">
                            {t('Gelecekteki Kendini İnşa Et', 'Build Your Future Self')}
                        </h1>
                    </section>

                    <section className="mx-auto mt-7 w-full max-w-5xl px-5 text-center sm:mt-9 sm:px-9">
                        <p className="mx-auto max-w-3xl text-lg leading-tight font-medium tracking-[-0.025em] text-balance sm:text-2xl lg:text-3xl">
                            {t(
                                'Hedeflerini kilometre taşlarına, kilometre taşlarını eyleme, eylemi de gelecekteki benliğine dönüştür.',
                                'Turn your goals into milestones, milestones into action, and action into your future self.',
                            )}
                        </p>

                        <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-6">
                            <form className="grid gap-3 text-left sm:grid-cols-3" onSubmit={submitRegistration}>
                                <div>
                                    <label className="sr-only" htmlFor="welcome-name">
                                        {t('Ad soyad', 'Full name')}
                                    </label>
                                    <input
                                        id="welcome-name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        value={registration.data.name}
                                        onChange={(event) => registration.setData('name', event.target.value)}
                                        disabled={registration.processing}
                                        placeholder={t('Ad soyad', 'Full name')}
                                        className="h-12 w-full rounded-xl border border-white/20 bg-black/10 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/55 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.name} className="mt-1.5 text-xs text-red-200" />
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
                                        className="h-12 w-full rounded-xl border border-white/20 bg-black/10 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/55 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.email} className="mt-1.5 text-xs text-red-200" />
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
                                        className="h-12 w-full rounded-xl border border-white/20 bg-black/10 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/55 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.password} className="mt-1.5 text-xs text-red-200" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={registration.processing}
                                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#00464d] transition hover:bg-cyan-50 focus:ring-2 focus:ring-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-3"
                                >
                                    {registration.processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                    {t('Erken Erişime Katıl', 'Join Early Access')}
                                </button>
                            </form>
                        </div>
                    </section>

                    <section
                        ref={gameAreaRef}
                        className="relative mt-4 min-h-[300px] flex-1 cursor-pointer touch-none outline-none select-none sm:mt-7 sm:min-h-[350px]"
                        role="button"
                        tabIndex={0}
                        aria-label={t('Fuevor koşu oyunu. Başlamak ve zıplamak için dokun.', 'Fuevor running game. Tap to start and jump.')}
                        onPointerDown={handlePointerDown}
                        onKeyDown={handleKeyDown}
                    >
                        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

                        <div
                            className="pointer-events-none absolute top-[7%] left-1/2 flex -translate-x-1/2 items-center justify-center gap-5 text-center sm:gap-7"
                            aria-live="polite"
                        >
                            <div>
                                <p className="text-[0.6rem] font-semibold tracking-[0.3em] text-white/48 uppercase">{t('Skor', 'Score')}</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{formatScore(scoreMs, locale)}</p>
                            </div>
                            <span className="h-10 w-px bg-white/20" aria-hidden="true" />
                            <div aria-label={`${t('En iyi skor', 'Best score')} ${formatScore(bestScoreMs, locale)}`}>
                                <p className="text-[0.6rem] font-semibold tracking-[0.24em] whitespace-nowrap text-white/48 uppercase">
                                    {t('En iyi skor', 'Best score')}
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                                    {formatScore(bestScoreMs, locale)}
                                </p>
                            </div>
                        </div>

                        {status === 'ready' && (
                            <div className="pointer-events-none absolute top-[43%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center">
                                <span className="relative mx-auto mb-5 grid size-14 place-items-center rounded-full border border-white/45 bg-white/10 backdrop-blur-sm">
                                    <span className="absolute inset-0 animate-ping rounded-full border border-white/20" />
                                    <span className="size-2 rounded-full bg-white" />
                                </span>
                                <p className="text-lg font-semibold tracking-tight sm:text-xl">
                                    {t('Başlamak için oyun alanına dokun', 'Tap the game area to start')}
                                </p>
                                <p className="mt-2 text-xs tracking-wide text-white/55 sm:text-sm">
                                    {t('Boşlukları geçmek için tekrar dokun ve zıpla', 'Tap again to jump over the gaps')}
                                </p>
                            </div>
                        )}

                        {status === 'game-over' && (
                            <div className="pointer-events-none absolute top-[43%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center">
                                <p className="text-[0.62rem] font-semibold tracking-[0.32em] text-white/55 uppercase">{t('Skorun', 'Your score')}</p>
                                <p className="mt-1 text-5xl font-semibold tracking-[-0.045em] tabular-nums sm:text-6xl">
                                    {formatScore(finalScoreRef.current, locale)}
                                </p>
                                <p className="mt-5 text-sm font-medium text-white/75">{t('Tekrar oynamak için dokun', 'Tap to play again')}</p>
                            </div>
                        )}

                        <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.58rem] font-semibold tracking-[0.24em] whitespace-nowrap text-white/38 uppercase sm:bottom-7">
                            {t('Dokun', 'Tap')} · Space · ↑
                        </p>
                    </section>
                </main>

                {registrationSuccess && (
                    <div
                        className="fixed inset-0 z-50 grid place-items-center bg-[#002b2f]/85 px-5 backdrop-blur-md"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('Üyelik mesajı', 'Membership message')}
                    >
                        <p className="max-w-2xl rounded-3xl border border-white/20 bg-white/10 px-7 py-10 text-center text-xl leading-relaxed font-semibold text-white shadow-2xl sm:px-12 sm:py-14 sm:text-3xl">
                            {registrationSuccess}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
