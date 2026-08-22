import { getIntlLocale, type Locale, type Translate } from '@/i18n';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type SVGProps } from 'react';

type GameStatus = 'ready' | 'starting' | 'running' | 'falling' | 'game-over';
type Gap = { x: number; width: number };
type Player = { velocity: number; y: number };
export type GameScorePlayer = { name: string; avatar?: string | null };

const GRAVITY = 1_800;
const JUMP_VELOCITY = 680;
const LEVEL_DURATION_MS = 30_000;
const BASE_SPEED = 225;
const SPEED_PER_LEVEL = 24;
const MAX_SPEED = 465;
const DAILY_LIMIT = 3;

export function FuevorRunnerIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            {...props}
        >
            <circle cx="12" cy="4.5" r="2.3" />
            <path d="M12 6.8v7.4" />
            <path d="m12 9-4.2 3.2" />
            <path d="m12 9 4.2 3.2" />
            <path d="m12 14.2-3.2 5.6" />
            <path d="m12 14.2 3.2 5.6" />
        </svg>
    );
}

function getLevelSpeed(level: number): number {
    return Math.min(MAX_SPEED, BASE_SPEED + (level - 1) * SPEED_PER_LEVEL);
}

function formatScore(milliseconds: number, locale: Locale, t: Translate): string {
    const seconds = new Intl.NumberFormat(getIntlLocale(locale), {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(milliseconds / 1_000);

    return `${seconds} ${t('sn', 'sec')}`;
}

export default function CommunityGame({
    locale,
    t,
    initialBestScoreMs,
    initialBestScorePlayer,
    initialPlaysRemaining,
    playerName,
    playerAvatar,
    localOnly = false,
}: {
    locale: Locale;
    t: Translate;
    initialBestScoreMs: number;
    initialBestScorePlayer: GameScorePlayer | null;
    initialPlaysRemaining: number;
    playerName: string;
    playerAvatar?: string | null;
    localOnly?: boolean;
}) {
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
    const dimensionsRef = useRef({ height: 450, width: 768 });
    const playerRef = useRef<Player>({ velocity: 0, y: 0 });
    const activePlayIdRef = useRef<number | null>(null);
    const startingRef = useRef(false);

    const [status, setStatus] = useState<GameStatus>('ready');
    const [scoreMs, setScoreMs] = useState(0);
    const [level, setLevel] = useState(1);
    const [bestScoreMs, setBestScoreMs] = useState(initialBestScoreMs);
    const [bestScorePlayer, setBestScorePlayer] = useState<GameScorePlayer | null>(initialBestScorePlayer);
    const [playsRemaining, setPlaysRemaining] = useState(initialPlaysRemaining);
    const [error, setError] = useState('');
    const canvasLevelLabel = t('Seviye', 'Level').toLocaleUpperCase(getIntlLocale(locale));

    const changeStatus = useCallback((nextStatus: GameStatus) => {
        statusRef.current = nextStatus;
        setStatus(nextStatus);
    }, []);

    const beginRun = useCallback(() => {
        const { width } = dimensionsRef.current;
        const playerX = width * (width < 640 ? 0.25 : 0.22);

        elapsedRef.current = 0;
        finalScoreRef.current = 0;
        fallTimeRef.current = 0;
        lastScorePaintRef.current = 0;
        lastFrameRef.current = 0;
        currentLevelRef.current = 1;
        playerRef.current = { velocity: 0, y: 0 };
        gapsRef.current = [
            {
                x: playerX + Math.min(680, width * 0.72 + 320),
                width: Math.max(68, Math.min(104, width * 0.15)),
            },
        ];
        setScoreMs(0);
        setLevel(1);
        setError('');
        changeStatus('running');
    }, [changeStatus]);

    const startGame = useCallback(async () => {
        if (playsRemaining < 1 || startingRef.current) return;

        startingRef.current = true;
        changeStatus('starting');
        setError('');

        if (localOnly) {
            activePlayIdRef.current = -1;
            setPlaysRemaining((current) => Math.max(0, current - 1));
            beginRun();
            startingRef.current = false;
            return;
        }

        try {
            const response = await fetch(route('community.game.plays.start'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: requestHeaders(),
                body: JSON.stringify({ player_name: playerName, player_avatar: playerAvatar || null }),
            });
            const result = (await response.json()) as { play_id?: number; plays_remaining?: number; message?: string };

            if (!response.ok || typeof result.play_id !== 'number') {
                setPlaysRemaining(result.plays_remaining ?? 0);
                changeStatus('ready');
                setError(result.message ?? t('Oyun başlatılamadı.', 'The game could not be started.'));
                return;
            }

            activePlayIdRef.current = result.play_id;
            setPlaysRemaining(result.plays_remaining ?? Math.max(0, playsRemaining - 1));
            beginRun();
        } catch {
            changeStatus('ready');
            setError(t('Bağlantı kurulamadı. Tekrar dene.', 'Could not connect. Try again.'));
        } finally {
            startingRef.current = false;
        }
    }, [beginRun, changeStatus, localOnly, playerAvatar, playerName, playsRemaining, t]);

    const finishGame = useCallback(
        (durationMs: number) => {
            const playId = activePlayIdRef.current;
            if (playId === null) return;

            activePlayIdRef.current = null;
            setBestScoreMs((current) => {
                if (durationMs > current) setBestScorePlayer({ name: playerName, avatar: playerAvatar });
                return Math.max(current, durationMs);
            });

            if (localOnly) return;

            void fetch(route('community.game.plays.finish', playId), {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: requestHeaders(),
                body: JSON.stringify({ duration_ms: durationMs }),
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error();
                    return (await response.json()) as {
                        best_score_ms: number;
                        best_score_player: GameScorePlayer | null;
                        plays_remaining: number;
                    };
                })
                .then((result) => {
                    setBestScoreMs(result.best_score_ms);
                    setBestScorePlayer(result.best_score_player);
                    setPlaysRemaining(result.plays_remaining);
                })
                .catch(() => {
                    // The completed run remains visible if score syncing is temporarily unavailable.
                });
        },
        [localOnly, playerAvatar, playerName],
    );

    const jump = useCallback(() => {
        const player = playerRef.current;
        if (statusRef.current === 'running' && player.y <= 1) player.velocity = JUMP_VELOCITY;
    }, []);

    const interact = useCallback(() => {
        if (statusRef.current === 'ready' || statusRef.current === 'game-over') {
            void startGame();
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
        if (![' ', 'ArrowUp', 'Enter'].includes(event.key)) return;
        event.preventDefault();
        interact();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const gameArea = gameAreaRef.current;
        if (!canvas || !gameArea) return;

        const context = canvas.getContext('2d');
        if (!context) return;

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

        const drawTerrain = (startX: number, endX: number, y: number) => {
            let lineStart = startX;
            for (const gap of gapsRef.current) {
                const gapStart = Math.max(startX, gap.x);
                const gapEnd = Math.min(endX, gap.x + gap.width);
                if (gapEnd <= startX || gapStart >= endX) continue;
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
            const gradient = context.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgba(255,255,255,.55)');
            gradient.addColorStop(0.35, 'rgba(255,255,255,.98)');
            gradient.addColorStop(1, 'rgba(118,214,255,.78)');
            context.strokeStyle = gradient;
            context.shadowBlur = 14;
            context.shadowColor = 'rgba(71,177,255,.28)';
            context.beginPath();
            drawTerrain(-4, width + 4, groundY);
            context.stroke();
            context.shadowBlur = 0;

            const progress = statusRef.current === 'ready' ? 0 : (elapsedRef.current % LEVEL_DURATION_MS) / LEVEL_DURATION_MS;
            const markers = [
                { active: true, level: currentLevelRef.current, x: playerX - progress * Math.max(130, width * 0.38) },
                { active: false, level: currentLevelRef.current + 1, x: width - 32 - progress * (width - 32 - playerX) },
            ];

            for (const marker of markers) {
                if (marker.x < -30 || marker.x > width + 30) continue;
                context.beginPath();
                context.arc(marker.x, groundY, marker.active ? 16 : 18, 0, Math.PI * 2);
                context.fillStyle = marker.active ? '#fff' : '#0a84ff';
                context.shadowBlur = marker.active ? 8 : 18;
                context.shadowColor = marker.active ? 'rgba(255,255,255,.35)' : 'rgba(10,132,255,.48)';
                context.fill();
                context.shadowBlur = 0;
                context.fillStyle = marker.active ? '#07505a' : '#fff';
                context.font = `700 ${marker.active ? 12 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(String(marker.level), marker.x, groundY + 0.5);
                if (!marker.active) {
                    context.fillStyle = 'rgba(255,255,255,.62)';
                    context.font = '600 9px -apple-system, BlinkMacSystemFont, sans-serif';
                    context.fillText(canvasLevelLabel, marker.x, groundY - 30);
                }
            }
            context.restore();
        };

        const drawRunner = (groundY: number, playerX: number, timestamp: number) => {
            const player = playerRef.current;
            const runningOnGround = statusRef.current === 'running' && player.y < 3;
            const stride = runningOnGround ? Math.sin(timestamp / 78) : 0;
            const bob = runningOnGround ? Math.abs(Math.sin(timestamp / 78)) * 1.5 : 0;
            const fallOffset = statusRef.current === 'falling' ? Math.pow(fallTimeRef.current / 1_000, 2) * 410 : 0;
            const footY = groundY - player.y + fallOffset - bob;

            context.save();
            context.translate(playerX, footY);
            if (statusRef.current === 'falling') context.rotate(Math.min(fallTimeRef.current / 420, 1) * 0.72);
            context.strokeStyle = '#fff';
            context.lineWidth = 3;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.shadowBlur = 9;
            context.shadowColor = 'rgba(255,255,255,.28)';
            context.beginPath();
            context.arc(0, -49, 7, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.moveTo(0, -42);
            context.lineTo(0, -23);
            context.moveTo(0, -36);
            context.lineTo(-10 - stride * 8, -27 + Math.abs(stride) * 2);
            context.moveTo(0, -35);
            context.lineTo(10 + stride * 8, -27 - Math.abs(stride) * 2);
            context.moveTo(0, -23);
            context.lineTo(-7 - stride * 11, -11);
            context.lineTo(-12 - stride * 11, 0);
            context.moveTo(0, -23);
            context.lineTo(7 + stride * 11, -11);
            context.lineTo(12 + stride * 11, 0);
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

                const speed = getLevelSpeed(currentLevelRef.current);
                player.velocity -= GRAVITY * delta;
                player.y += player.velocity * delta;
                if (player.y <= 0) {
                    player.y = 0;
                    player.velocity = 0;
                }
                for (const gap of gapsRef.current) gap.x -= speed * delta;
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
                    gapsRef.current.push({
                        x: previousEnd + minimumSpacing + Math.random() * spacingVariance,
                        width: minimumGapWidth + Math.random() * (maximumGapWidth - minimumGapWidth),
                    });
                }

                const hasFallen = gapsRef.current.some((gap) => playerX + 7 >= gap.x && playerX - 7 <= gap.x + gap.width && player.y < 4);
                if (hasFallen) {
                    const completedScore = Math.max(250, Math.round(elapsedRef.current));
                    finalScoreRef.current = completedScore;
                    setScoreMs(completedScore);
                    fallTimeRef.current = 0;
                    changeStatus('falling');
                    finishGame(completedScore);
                } else if (elapsedRef.current - lastScorePaintRef.current > 50) {
                    lastScorePaintRef.current = elapsedRef.current;
                    setScoreMs(Math.round(elapsedRef.current));
                }
            } else if (statusRef.current === 'falling') {
                fallTimeRef.current += delta * 1_000;
                if (fallTimeRef.current > 720) changeStatus('game-over');
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
    }, [canvasLevelLabel, changeStatus, finishGame]);

    const limitReached = playsRemaining < 1 && (status === 'ready' || status === 'game-over');

    return (
        <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white p-3 shadow-[0_16px_55px_rgba(0,0,0,0.07)] sm:p-5">
            <div className="flex flex-col gap-3 px-2 pt-2 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-3">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#007aff] uppercase">
                        <Gamepad2 className="size-3.5" /> {t('Hedef yolculuğu', 'Goal journey')}
                    </span>
                    <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] sm:text-[30px]">
                        {t('Yol haritasında ne kadar ilerleyebilirsin?', 'How far can you go on the roadmap?')}
                    </h1>
                    <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#8e8e93]">
                        {t(
                            'Boşlukları aş. Her 30 saniyede seviye atla; yol hızlandıkça odağını koru.',
                            'Clear the gaps. Level up every 30 seconds and stay focused as the road gets faster.',
                        )}
                    </p>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-[#007aff]/10 px-3 py-2 text-[11px] font-semibold text-[#007aff]">
                    {t(`Bugün ${playsRemaining}/${DAILY_LIMIT} hakkın kaldı`, `${playsRemaining}/${DAILY_LIMIT} plays left today`)}
                </span>
            </div>

            <BestScoreOwner
                player={bestScorePlayer}
                value={formatScore(bestScoreMs, locale, t)}
                title={t('En iyi skor sahibi', 'Best score holder')}
                anonymousLabel={t('Rekor sahibi bilinmiyor', 'Record holder unknown')}
            />

            <div
                ref={gameAreaRef}
                className={`relative min-h-[500px] touch-none overflow-hidden rounded-[22px] bg-[#043f48] bg-[radial-gradient(circle_at_76%_10%,rgba(42,183,218,0.32),transparent_34%),linear-gradient(135deg,#022f35_0%,#075662_60%,#078da4_100%)] outline-none select-none sm:min-h-[450px] ${limitReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                role="button"
                tabIndex={0}
                aria-disabled={limitReached}
                aria-label={t('Fuevor yol haritası oyunu. Başlamak ve zıplamak için dokun.', 'Fuevor roadmap game. Tap to start and jump.')}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
            >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

                <div className="pointer-events-none absolute top-5 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center rounded-[18px] border border-white/12 bg-black/12 px-3 py-3 text-center shadow-lg backdrop-blur-xl sm:top-7 sm:py-4">
                    <Score label={t('Skor', 'Score')} value={formatScore(scoreMs, locale, t)} />
                    <span className="h-9 w-px bg-white/15" />
                    <Score label={t('Seviye', 'Level')} value={String(level)} />
                    <span className="h-9 w-px bg-white/15" />
                    <Score label={t('En iyi', 'Best')} value={formatScore(bestScoreMs, locale, t)} />
                </div>

                {(status === 'ready' || status === 'starting') && !limitReached && (
                    <div className="pointer-events-none absolute top-[42%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center text-white sm:top-[46%]">
                        <span className="relative mx-auto mb-4 grid size-13 place-items-center rounded-full border border-white/35 bg-white/12 backdrop-blur-sm">
                            {status === 'ready' && <span className="absolute inset-0 animate-ping rounded-full border border-white/18" />}
                            <ArrowRight className={`size-5 ${status === 'starting' ? 'animate-pulse' : ''}`} />
                        </span>
                        <p className="text-lg font-semibold tracking-tight">
                            {status === 'starting'
                                ? t('Oyun hazırlanıyor…', 'Preparing game…')
                                : t('Yolculuğu başlatmak için dokun', 'Tap to begin the journey')}
                        </p>
                        {error && <p className="mt-2 text-xs font-medium text-[#ffb4ae]">{error}</p>}
                    </div>
                )}

                {status === 'game-over' && !limitReached && (
                    <div className="pointer-events-none absolute top-[46%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center text-white">
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-white/55 uppercase">
                            {t('Yolculuk tamamlandı', 'Journey complete')}
                        </p>
                        <p className="mt-1 text-5xl font-semibold tracking-[-0.045em] tabular-nums">
                            {formatScore(finalScoreRef.current, locale, t)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#78d6ff]">
                            {t('Ulaşılan seviye', 'Level reached')} {level}
                        </p>
                        <p className="mt-5 text-sm font-medium text-white/72">{t('Tekrar denemek için dokun', 'Tap to try again')}</p>
                    </div>
                )}

                {limitReached && (
                    <div className="pointer-events-none absolute top-[46%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center text-white">
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#78d6ff] uppercase">
                            {t('Bugünkü yolculuk tamamlandı', 'Today’s journey is complete')}
                        </p>
                        <p className="mx-auto mt-3 max-w-sm text-2xl font-semibold tracking-[-0.035em]">
                            {t('Günlük 3 oyun hakkını kullandın.', 'You have used your 3 daily plays.')}
                        </p>
                        <p className="mt-3 text-sm text-white/62">{t('Yeni oyun hakların yarın açılacak.', 'Your plays will reset tomorrow.')}</p>
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
                    <p className="mt-3 text-center text-[9px] font-semibold tracking-[0.18em] whitespace-nowrap text-white/36 uppercase">
                        {t('Dokun', 'Tap')} · Space · ↑
                    </p>
                </div>
            </div>
        </section>
    );
}

function Score({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold tracking-[0.2em] whitespace-nowrap text-white/48 uppercase">{label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white tabular-nums sm:text-2xl">{value}</p>
        </div>
    );
}

function BestScoreOwner({
    value,
    player,
    title,
    anonymousLabel,
}: {
    value: string;
    player: GameScorePlayer | null;
    title: string;
    anonymousLabel: string;
}) {
    const initial = player?.name.trim().charAt(0).toLocaleUpperCase() || '?';

    return (
        <div className="mx-1 mb-3 flex min-w-0 items-center gap-3 rounded-[20px] border border-black/[0.055] bg-[#f5f5f7] px-4 py-3.5 sm:mx-2 sm:mb-5 sm:gap-4 sm:px-5 sm:py-4">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-[#007aff] text-[15px] font-semibold text-white shadow-[0_5px_16px_rgba(0,0,0,0.12)] sm:size-14 sm:text-[17px]">
                {player?.avatar ? <img src={player.avatar} alt="" className="size-full object-cover" /> : initial}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.13em] text-[#8e8e93] uppercase">{title}</p>
                <p className="mt-1 truncate text-[15px] font-semibold tracking-[-0.015em] text-[#1d1d1f] sm:text-[17px]">
                    {player?.name ?? anonymousLabel}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <p className="text-[18px] font-semibold tracking-[-0.025em] text-[#007aff] tabular-nums sm:text-[22px]">{value}</p>
            </div>
        </div>
    );
}

function requestHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
    };
}
