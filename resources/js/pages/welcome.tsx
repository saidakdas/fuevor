import InputError from '@/components/input-error';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
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

function formatScore(milliseconds: number): string {
    return `${(milliseconds / 1_000).toFixed(1)} sn`;
}

export default function Welcome({ bestScoreMs: initialBestScore, registrationSuccess }: WelcomeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<GameStatus>('ready');
    const elapsedRef = useRef(0);
    const finalScoreRef = useRef(0);
    const lastFrameRef = useRef(0);
    const lastScorePaintRef = useRef(0);
    const fallTimeRef = useRef(0);
    const gapsRef = useRef<Gap[]>([]);
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

        const drawLine = (groundY: number, width: number) => {
            context.save();
            context.lineCap = 'round';
            context.lineWidth = 2;
            context.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            context.shadowBlur = 10;
            context.shadowColor = 'rgba(255, 255, 255, 0.32)';
            context.beginPath();

            let lineStart = -2;
            for (const gap of gapsRef.current) {
                if (gap.x > width || gap.x + gap.width < 0) {
                    continue;
                }

                context.moveTo(lineStart, groundY);
                context.lineTo(Math.max(lineStart, gap.x), groundY);
                lineStart = gap.x + gap.width;
            }

            context.moveTo(lineStart, groundY);
            context.lineTo(width + 2, groundY);
            context.stroke();
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
                const speed = Math.min(390, 235 + elapsedRef.current / 4_500);

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
                    gapsRef.current.push({
                        x: previousEnd + 350 + Math.random() * 230,
                        width: Math.max(68, Math.min(112, width * (0.12 + Math.random() * 0.07))),
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
            drawLine(groundY, width);
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
            <Head title="Build Your Future Self">
                <meta name="description" content="Fuevor çizgi koşu oyununda boşlukların üzerinden atla ve en iyi süreyi yakala." />
            </Head>

            <div className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-[#00464d] text-white">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(106deg,#002b2f_0%,#004b53_42%,#08a5bf_100%)]" />
                <div className="pointer-events-none absolute -top-32 right-[4%] h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-[-12rem] left-[24%] h-96 w-96 rounded-full bg-black/10 blur-3xl" />

                <header className="relative z-10 flex items-start justify-end px-5 pt-5 sm:px-9 sm:pt-7">
                    <div className="text-right" aria-label={`En iyi skor ${formatScore(bestScoreMs)}`}>
                        <p className="text-[0.62rem] font-semibold tracking-[0.28em] text-white/55 uppercase">Best skor</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums sm:text-xl">{formatScore(bestScoreMs)}</p>
                    </div>
                </header>

                <main className="relative z-10 flex min-h-0 flex-1 flex-col">
                    <section className="flex flex-col items-center px-5 pt-2 text-center sm:pt-0">
                        <img
                            src="/fuevor-white-logo.svg"
                            alt="Fuevor"
                            className="h-auto w-[min(64vw,350px)] drop-shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
                            draggable={false}
                        />
                        <h1 className="-mt-2 text-xs font-semibold tracking-[0.18em] text-white/60 sm:text-sm">Build Your Future Self</h1>
                    </section>

                    <section className="mx-auto mt-7 w-full max-w-5xl px-5 text-center sm:mt-9 sm:px-9">
                        <p className="mx-auto max-w-3xl text-xl leading-tight font-medium tracking-[-0.025em] text-balance sm:text-3xl lg:text-4xl">
                            Turn your goals into milestones, milestones into action, and action into your future self.
                        </p>

                        <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-6">
                            <p className="text-sm font-semibold tracking-[0.08em] text-white/75">Erkenden Yerini Al</p>

                            <form className="mt-4 grid gap-3 text-left sm:grid-cols-3" onSubmit={submitRegistration}>
                                <div>
                                    <label className="sr-only" htmlFor="welcome-name">
                                        Ad soyad
                                    </label>
                                    <input
                                        id="welcome-name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        value={registration.data.name}
                                        onChange={(event) => registration.setData('name', event.target.value)}
                                        disabled={registration.processing}
                                        placeholder="Ad soyad"
                                        className="h-12 w-full rounded-xl border border-white/20 bg-black/10 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/55 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.name} className="mt-1.5 text-xs text-red-200" />
                                </div>

                                <div>
                                    <label className="sr-only" htmlFor="welcome-email">
                                        E-posta adresi
                                    </label>
                                    <input
                                        id="welcome-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={registration.data.email}
                                        onChange={(event) => registration.setData('email', event.target.value)}
                                        disabled={registration.processing}
                                        placeholder="E-posta adresi"
                                        className="h-12 w-full rounded-xl border border-white/20 bg-black/10 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/55 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                                    />
                                    <InputError message={registration.errors.email} className="mt-1.5 text-xs text-red-200" />
                                </div>

                                <div>
                                    <label className="sr-only" htmlFor="welcome-password">
                                        Şifre
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
                                        placeholder="Şifreni belirle"
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
                                    Kaydol
                                </button>
                            </form>
                        </div>
                    </section>

                    <section
                        ref={gameAreaRef}
                        className="relative mt-4 min-h-[300px] flex-1 cursor-pointer touch-none outline-none select-none sm:mt-7 sm:min-h-[350px]"
                        role="button"
                        tabIndex={0}
                        aria-label="Fuevor koşu oyunu. Başlamak ve zıplamak için dokun."
                        onPointerDown={handlePointerDown}
                        onKeyDown={handleKeyDown}
                    >
                        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

                        <div className="pointer-events-none absolute top-[7%] left-1/2 -translate-x-1/2 text-center" aria-live="polite">
                            <p className="text-[0.6rem] font-semibold tracking-[0.3em] text-white/48 uppercase">Skor</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{formatScore(scoreMs)}</p>
                        </div>

                        {status === 'ready' && (
                            <div className="pointer-events-none absolute top-[43%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center">
                                <span className="relative mx-auto mb-5 grid size-14 place-items-center rounded-full border border-white/45 bg-white/10 backdrop-blur-sm">
                                    <span className="absolute inset-0 animate-ping rounded-full border border-white/20" />
                                    <span className="size-2 rounded-full bg-white" />
                                </span>
                                <p className="text-lg font-semibold tracking-tight sm:text-xl">Başlamak için oyun alanına dokun</p>
                                <p className="mt-2 text-xs tracking-wide text-white/55 sm:text-sm">Boşlukları geçmek için tekrar dokun ve zıpla</p>
                            </div>
                        )}

                        {status === 'game-over' && (
                            <div className="pointer-events-none absolute top-[43%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center">
                                <p className="text-[0.62rem] font-semibold tracking-[0.32em] text-white/55 uppercase">Skorun</p>
                                <p className="mt-1 text-5xl font-semibold tracking-[-0.045em] tabular-nums sm:text-6xl">
                                    {formatScore(finalScoreRef.current)}
                                </p>
                                <p className="mt-5 text-sm font-medium text-white/75">Tekrar oynamak için dokun</p>
                            </div>
                        )}

                        <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.58rem] font-semibold tracking-[0.24em] whitespace-nowrap text-white/38 uppercase sm:bottom-7">
                            Dokun · Space · ↑
                        </p>
                    </section>
                </main>

                {registrationSuccess && (
                    <div
                        className="fixed inset-0 z-50 grid place-items-center bg-[#002b2f]/85 px-5 backdrop-blur-md"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Üyelik mesajı"
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
