import BrandLogo from '@/components/brand-logo';
import FirstBuilderBadge from '@/components/first-builder-badge';
import FuMark from '@/components/fu-mark';
import { useSwipeDownDismiss } from '@/hooks/use-swipe-down-dismiss';
import { getIntlLocale, type Locale } from '@/i18n';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    BriefcaseBusiness,
    ChevronDown,
    HandHeart,
    Lightbulb,
    LoaderCircle,
    MapPin,
    MessageCircleMore,
    Pin,
    Search,
    Send,
    Star,
    Target,
    UserMinus,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

export type Viewer = { id: number; name: string; username?: string; avatar?: string };
export type CommunityFriendStatus = 'friend' | 'incoming' | 'outgoing';
export type ShareableGoal = { id: number | string; title: string };
export type CommunityGoalStats = { active: number; completed: number };
export type BetaAnnouncement = { supportCount: number; supportedByViewer: boolean };
export type CommunityProfile = {
    id: number;
    name: string;
    username: string;
    avatar?: string | null;
    profession?: string | null;
    location?: string | null;
    bio: string;
    fu?: number | null;
    firstBuilderNumber: number | null;
    accentFrom: string;
    accentTo: string;
};
type CommunityIdea = {
    id: number;
    body: string;
    author: string;
    authorProfile: CommunityProfile;
    supportCount: number;
    supportedByViewer: boolean;
    createdAt: string;
    replies?: CommunityIdea[];
};
export type CommunityPost = {
    id: number;
    title: string;
    description: string | null;
    author: string;
    authorProfile: CommunityProfile;
    supportCount: number;
    ideaCount: number;
    supportedByViewer: boolean;
    createdAt: string;
    ideas: CommunityIdea[];
};
type CommunityReviewReply = { id: number; body: string; author: string; createdAt: string };
type CommunityReview = {
    id: number;
    body: string | null;
    rating: number | null;
    author: string;
    createdAt: string;
    replies: CommunityReviewReply[];
};
export type CommunityBook = {
    key: string;
    title: string;
    author: string | null;
    readerCount: number;
    reviewCount: number;
    averageRating: number | null;
    latestReviewAt: string;
    reviews: CommunityReview[];
};
type Translate = (turkish: string, english: string) => string;

export function GoalsCommunity({
    posts,
    viewer,
    locale,
    t,
    goalStats,
    betaAnnouncement = { supportCount: 0, supportedByViewer: false },
    demoUsername,
    availableGoals = [],
    initialGoalId,
    getFriendStatus,
    onFriendAction,
}: {
    posts: CommunityPost[];
    viewer: Viewer | null;
    locale: Locale;
    t: Translate;
    goalStats: CommunityGoalStats;
    betaAnnouncement?: BetaAnnouncement;
    demoUsername?: string;
    availableGoals?: ShareableGoal[];
    initialGoalId?: number | string | null;
    getFriendStatus?: (username: string) => CommunityFriendStatus | null;
    onFriendAction?: (username: string) => void;
}) {
    const [goalPickerOpen, setGoalPickerOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<CommunityProfile | null>(null);
    const [, setFriendRevision] = useState(0);
    const initialGoal = availableGoals.find((goal) => String(goal.id) === String(initialGoalId ?? ''));
    const shareForm = useForm({
        goalId: demoUsername ? '' : String(initialGoal?.id ?? ''),
        demoGoalId: demoUsername ? String(initialGoal?.id ?? '') : '',
        goalTitle: initialGoal?.title ?? '',
        shortComment: '',
        demoUsername: demoUsername ?? '',
    });
    const selectedGoalId = demoUsername ? shareForm.data.demoGoalId : shareForm.data.goalId;
    const selectedGoal = availableGoals.find((goal) => String(goal.id) === selectedGoalId);

    const chooseGoal = (id: string) => {
        const selectedGoal = availableGoals.find((goal) => String(goal.id) === id);
        shareForm.setData({
            ...shareForm.data,
            goalId: demoUsername ? '' : id,
            demoGoalId: demoUsername ? id : '',
            goalTitle: selectedGoal?.title ?? '',
        });
        setGoalPickerOpen(false);
    };

    const submitGoal = (event: FormEvent) => {
        event.preventDefault();
        shareForm.post(route(demoUsername ? 'demo.community.goals.store' : 'community.goals.store'), {
            preserveScroll: true,
            onSuccess: () => shareForm.reset('goalId', 'demoGoalId', 'goalTitle', 'shortComment'),
        });
    };

    return (
        <div>
            <div className="mb-5 px-1">
                <h1 className="text-[25px] font-semibold tracking-[-0.035em]">{t('Topluluk', 'Community')}</h1>
                <p className="mt-1 text-[12px] text-[#8e8e93]">
                    {t('Hedefini paylaş, destek ol, fikir ver.', 'Share a goal, show support, offer an idea.')}
                </p>
            </div>

            <PinnedBetaPost t={t} viewer={viewer} announcement={betaAnnouncement} demoUsername={demoUsername} />

            <div className="mb-5 grid grid-cols-2 gap-3">
                <section className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.035)]">
                    <p className="text-[11px] font-medium text-[#8e8e93]">{t('Aktif Hedefler', 'Active Goals')}</p>
                    <p className="mt-1 text-[27px] leading-none font-semibold tracking-[-0.035em] tabular-nums">{goalStats.active}</p>
                </section>
                <section className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.035)]">
                    <p className="text-[11px] font-medium text-[#8e8e93]">{t('Tamamlanan Hedefler', 'Completed Goals')}</p>
                    <p className="mt-1 text-[27px] leading-none font-semibold tracking-[-0.035em] tabular-nums">{goalStats.completed}</p>
                </section>
            </div>

            <div className="relative z-20 rounded-[20px] border border-black/[0.07] bg-white">
                {viewer && availableGoals.length > 0 ? (
                    <form onSubmit={submitGoal} className="p-4 sm:p-5">
                        <div className="flex gap-3">
                            <Avatar name={viewer.name} avatar={viewer.avatar} />
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setGoalPickerOpen((value) => !value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Escape') setGoalPickerOpen(false);
                                        }}
                                        className="flex h-11 w-full min-w-0 items-center gap-2 rounded-[12px] border border-black/[0.08] bg-[#f8f8fa] px-3 text-left text-[13px] font-medium outline-none focus:border-[#007aff]"
                                        aria-haspopup="listbox"
                                        aria-expanded={goalPickerOpen}
                                        aria-controls="community-goal-picker"
                                    >
                                        <span className={`min-w-0 flex-1 truncate ${selectedGoal ? 'text-[#1d1d1f]' : 'text-[#8e8e93]'}`}>
                                            {selectedGoal?.title ?? t('Profilindeki hedeflerden birini seç', 'Choose one of your profile goals')}
                                        </span>
                                        <ChevronDown className={`size-4 shrink-0 text-[#8e8e93] transition ${goalPickerOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {goalPickerOpen && (
                                        <div
                                            id="community-goal-picker"
                                            role="listbox"
                                            className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(18rem,45svh)] overflow-y-auto overscroll-contain rounded-[14px] border border-black/[0.09] bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                                        >
                                            {availableGoals.map((goal) => {
                                                const selected = String(goal.id) === selectedGoalId;

                                                return (
                                                    <button
                                                        key={goal.id}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={selected}
                                                        onClick={() => chooseGoal(String(goal.id))}
                                                        className={`flex w-full items-start rounded-[10px] px-3 py-2.5 text-left text-[12px] leading-5 break-words ${selected ? 'bg-[#007aff]/10 font-semibold text-[#007aff]' : 'text-[#1d1d1f] active:bg-black/[0.045]'}`}
                                                    >
                                                        <span className="min-w-0">{goal.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    value={shareForm.data.shortComment}
                                    onChange={(event) => shareForm.setData('shortComment', event.target.value)}
                                    maxLength={500}
                                    rows={2}
                                    placeholder={t('Hedefinle ilgili kısa bir yorum ekle…', 'Add a short note about your goal…')}
                                    className="w-full resize-none rounded-[12px] border border-black/[0.08] bg-[#f8f8fa] px-3 py-3 text-[12px] leading-5 outline-none placeholder:text-[#a1a1a6] focus:border-[#007aff]"
                                />
                                <div className="flex justify-end border-t border-black/[0.05] pt-3">
                                    <button
                                        type="submit"
                                        disabled={shareForm.processing || !(demoUsername ? shareForm.data.demoGoalId : shareForm.data.goalId)}
                                        className="flex h-9 items-center gap-2 rounded-full bg-[#007aff] px-4 text-[11px] font-semibold text-white disabled:bg-[#c7c7cc]"
                                    >
                                        {shareForm.processing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                        {t("Fuevor'da yayınla", 'Publish on Fuevor')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : viewer ? (
                    <div className="p-5 text-center">
                        <p className="text-[13px] font-semibold">{t('Paylaşılabilecek bir hedefin yok', 'You have no goal to share')}</p>
                        <p className="mt-1 text-[11px] text-[#8e8e93]">
                            {t('Önce kişisel profilinde bir hedef oluştur.', 'Create a goal in your personal profile first.')}
                        </p>
                    </div>
                ) : (
                    <GuestPrompt t={t} compact />
                )}
            </div>

            <div className="mt-4 space-y-3">
                {posts.map((post) => (
                    <GoalPostCard
                        key={post.id}
                        post={post}
                        viewer={viewer}
                        locale={locale}
                        t={t}
                        demoUsername={demoUsername}
                        onOpenProfile={setSelectedProfile}
                    />
                ))}
                {posts.length === 0 && (
                    <EmptyState
                        icon={<Target className="size-7" />}
                        title={t('Henüz paylaşılan hedef yok', 'No shared goals yet')}
                        text={t('Topluluğun ilk hedefini sen paylaşabilirsin.', 'You can share the community’s first goal.')}
                    />
                )}
            </div>
            {selectedProfile && (
                <CommunityProfilePreview
                    profile={selectedProfile}
                    posts={posts.filter((post) => post.authorProfile.id === selectedProfile.id)}
                    t={t}
                    currentUsername={demoUsername ?? viewer?.username}
                    friendStatus={getFriendStatus?.(selectedProfile.username) ?? null}
                    onFriendAction={
                        onFriendAction
                            ? () => {
                                  onFriendAction(selectedProfile.username);
                                  setFriendRevision((revision) => revision + 1);
                              }
                            : undefined
                    }
                    onClose={() => setSelectedProfile(null)}
                />
            )}
        </div>
    );
}

function PinnedBetaPost({
    t,
    viewer,
    announcement,
    demoUsername,
}: {
    t: Translate;
    viewer: Viewer | null;
    announcement: BetaAnnouncement;
    demoUsername?: string;
}) {
    const [supported, setSupported] = useState(announcement.supportedByViewer);
    const [supportCount, setSupportCount] = useState(announcement.supportCount);
    const [supportBusy, setSupportBusy] = useState(false);
    const [ideaOpen, setIdeaOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const ideaInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSupported(announcement.supportedByViewer);
        setSupportCount(announcement.supportCount);
    }, [announcement.supportCount, announcement.supportedByViewer]);

    const csrfToken = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const openIdea = () => {
        if (!viewer) return router.visit('/login');
        setIdeaOpen(true);
        window.requestAnimationFrame(() => ideaInput.current?.focus());
    };
    const selectRating = (value: number) => {
        if (!viewer) return router.visit('/login');
        setRating(value);
        setFeedbackStatus('idle');
        setIdeaOpen(true);
        window.requestAnimationFrame(() => ideaInput.current?.focus());
    };
    const toggleSupport = async () => {
        if (!viewer) return router.visit('/login');
        if (supportBusy) return;

        if (demoUsername) {
            setSupported((current) => !current);
            setSupportCount((current) => Math.max(0, current + (supported ? -1 : 1)));
            return;
        }

        setSupportBusy(true);
        try {
            const response = await fetch(route('beta.announcement.support'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const payload = (await response.json()) as { supported?: boolean; supportCount?: number };
            if (!response.ok || typeof payload.supported !== 'boolean' || typeof payload.supportCount !== 'number') return;

            setSupported(payload.supported);
            setSupportCount(payload.supportCount);
        } finally {
            setSupportBusy(false);
        }
    };
    const submitFeedback = async (event: FormEvent) => {
        event.preventDefault();
        if (!viewer) return router.visit('/login');
        if (rating === 0 || comment.trim().length < 3 || feedbackStatus === 'sending') return;

        setFeedbackStatus('sending');
        setFeedbackMessage('');

        if (demoUsername) {
            setRating(0);
            setComment('');
            setIdeaOpen(false);
            setFeedbackStatus('sent');
            window.setTimeout(() => setFeedbackStatus('idle'), 2200);
            return;
        }

        try {
            const response = await fetch(route('beta.feedback.store'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ rating, comment: comment.trim() }),
            });
            const payload = (await response.json()) as { feedback?: unknown; message?: string; errors?: Record<string, string[]> };
            if (!response.ok || !payload.feedback) {
                throw new Error(
                    payload.errors?.rating?.[0] ??
                        payload.errors?.comment?.[0] ??
                        payload.message ??
                        t('Fikrin gönderilemedi.', 'Your idea could not be sent.'),
                );
            }

            setRating(0);
            setComment('');
            setIdeaOpen(false);
            setFeedbackStatus('sent');
            window.setTimeout(() => setFeedbackStatus('idle'), 2200);
        } catch (exception) {
            setFeedbackMessage(exception instanceof Error ? exception.message : t('Fikrin gönderilemedi.', 'Your idea could not be sent.'));
            setFeedbackStatus('error');
        }
    };

    return (
        <article
            className="mb-5 overflow-hidden rounded-[20px] border border-[#7ed957]/35 bg-white shadow-[0_12px_34px_rgba(0,0,0,0.045)]"
            aria-label={t('Sabitlenmiş beta duyurusu', 'Pinned beta announcement')}
        >
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.055] px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f5f5f7] p-2">
                        <BrandLogo variant="black" className="h-5 w-7" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">Fuevor</p>
                        <p className="mt-0.5 text-[10px] text-[#8e8e93]">Beta</p>
                    </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#7ed957]/13 px-2.5 py-1 text-[10px] font-semibold text-[#438f29]">
                    <Pin className="size-3" />
                    {t('Sabitlendi', 'Pinned')}
                </span>
            </div>

            <div className="px-4 py-5 sm:px-5 sm:py-6">
                <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.025em]">
                    {t('Fuevor’a erken geldin.', 'You arrived early to Fuevor.')}
                </h2>
                <div className="mt-3 space-y-3 text-[13px] leading-6 text-[#4b4b50]">
                    <p>
                        {t(
                            'Şu an gördüğün şey tamamlanmış bir ürün değil. Fuevor’un ilk gerçek sürümü.',
                            'What you see right now is not a finished product. It is the first real version of Fuevor.',
                        )}
                    </p>
                    <p>
                        {t(
                            'Burada oluşturulan ilk hedefler, verilen ilk fikirler ve alınan ilk kararlar; Fuevor’un bundan sonra neye dönüşeceğini belirleyecek.',
                            'The first goals created, ideas shared, and decisions made here will determine what Fuevor becomes next.',
                        )}
                    </p>
                    <p className="whitespace-pre-line">
                        {t(
                            'Bir şey eksikse söyle.\nBir şey gereksizse söyle.\nBir şeyi daha iyi yapabileceğimizi düşünüyorsan fikir ver.',
                            'If something is missing, tell us.\nIf something is unnecessary, tell us.\nIf you think we can improve something, share your idea.',
                        )}
                    </p>
                    <p>{t('Çünkü bu aşamada Fuevor’u yalnızca biz geliştirmiyoruz.', 'Because at this stage, we are not building Fuevor alone.')}</p>
                    <p className="font-semibold text-[#1d1d1f]">
                        {t('İlk kullanıcılarıyla birlikte geliştiriyoruz.', 'We are building it together with its first users.')}
                    </p>
                    <p>{t('Hoş geldin.', 'Welcome.')}</p>
                    <p className="font-semibold text-[#1d1d1f]">Build Your Future Self.</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.055] pt-4">
                    <BrandLogo variant="black" className="h-6 w-20" />
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={toggleSupport}
                            disabled={supportBusy}
                            aria-pressed={supported}
                            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold transition disabled:opacity-60 ${
                                supported ? 'bg-[#ff375f]/10 text-[#d91f4d]' : 'text-[#6e6e73] hover:bg-black/[0.04]'
                            }`}
                        >
                            {supportBusy ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                                <HandHeart className={`size-3.5 ${supported ? 'fill-current' : ''}`} />
                            )}
                            {t('Destekle', 'Support')}
                            <span className="tabular-nums">{supportCount}</span>
                        </button>
                        <button
                            type="button"
                            onClick={openIdea}
                            aria-expanded={ideaOpen}
                            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold text-[#6e6e73] transition hover:bg-black/[0.04]"
                        >
                            <Lightbulb className="size-3.5" />
                            {t('Fikir Ver', 'Share an Idea')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-black/[0.055] bg-[#fafafd] px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:flex-nowrap" onMouseLeave={() => setHoveredRating(0)}>
                    <span className="shrink-0 text-[11px] font-semibold text-[#6e6e73]">{t('Puanla', 'Rate')}</span>
                    <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label={t('Beta sürümünü puanla', 'Rate the beta version')}>
                        {[1, 2, 3, 4, 5].map((value) => {
                            const active = value <= (hoveredRating || rating);

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => selectRating(value)}
                                    onMouseEnter={() => setHoveredRating(value)}
                                    className={`grid size-8 place-items-center rounded-full transition active:scale-90 ${
                                        active ? 'text-[#ff9500]' : 'text-[#c7c7cc] hover:bg-black/[0.035]'
                                    }`}
                                    aria-label={t(`${value} puan`, `${value} stars`)}
                                    aria-pressed={rating === value}
                                >
                                    <Star className={`size-[18px] ${active ? 'fill-current' : ''}`} />
                                </button>
                            );
                        })}
                    </div>
                    {feedbackStatus === 'sent' && <span className="text-[10px] font-medium text-[#248a3d]">{t('Teşekkürler!', 'Thank you!')}</span>}
                </div>

                {ideaOpen && (
                    <form onSubmit={submitFeedback} className="mt-3 flex items-center gap-2">
                        <input
                            ref={ideaInput}
                            value={comment}
                            onChange={(event) => {
                                setComment(event.target.value);
                                if (feedbackStatus === 'error') setFeedbackStatus('idle');
                            }}
                            maxLength={3000}
                            placeholder={t('Fikrini yaz…', 'Write your idea…')}
                            className="h-10 min-w-0 flex-1 rounded-full border border-black/[0.08] bg-white px-4 text-[11px] outline-none focus:border-[#007aff]"
                        />
                        <button
                            type="submit"
                            disabled={rating === 0 || comment.trim().length < 3 || feedbackStatus === 'sending'}
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff] text-white disabled:bg-[#c7c7cc]"
                            aria-label={t('Puan ve fikri gönder', 'Send rating and idea')}
                        >
                            {feedbackStatus === 'sending' ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                        </button>
                    </form>
                )}
                {feedbackStatus === 'error' && <p className="mt-2 text-[10px] text-[#ff3b30]">{feedbackMessage}</p>}
            </div>
        </article>
    );
}

function GoalPostCard({
    post,
    viewer,
    locale,
    t,
    demoUsername,
    onOpenProfile,
}: {
    post: CommunityPost;
    viewer: Viewer | null;
    locale: Locale;
    t: Translate;
    demoUsername?: string;
    onOpenProfile: (profile: CommunityProfile) => void;
}) {
    const [ideasOpen, setIdeasOpen] = useState(false);
    const toggleSupport = () => {
        if (!viewer) return router.visit('/login');

        router.post(route(demoUsername ? 'demo.community.goals.support' : 'community.goals.support', post.id), demoUsername ? { demoUsername } : {}, {
            preserveScroll: true,
        });
    };

    return (
        <article className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-white">
            <div className="p-4 sm:p-5">
                <button type="button" onClick={() => onOpenProfile(post.authorProfile)} className="flex max-w-full items-start gap-3 text-left">
                    <Avatar
                        name={post.author}
                        avatar={post.authorProfile.avatar ?? undefined}
                        accentFrom={post.authorProfile.accentFrom}
                        accentTo={post.authorProfile.accentTo}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{post.author}</p>
                        <p className="mt-0.5 truncate text-[10px] text-[#8e8e93]">
                            @{post.authorProfile.username} · {formatRelativeDate(post.createdAt, locale)}
                        </p>
                    </div>
                </button>
                <h3 className="mt-4 text-[18px] leading-6 font-semibold tracking-[-0.02em]">{post.title}</h3>
                {post.description && <p className="mt-2 text-[13px] leading-5 whitespace-pre-wrap text-[#4b4b50]">{post.description}</p>}
            </div>
            <div className="flex items-center border-t border-black/[0.05] px-3 py-2.5 sm:px-4">
                <button
                    type="button"
                    onClick={toggleSupport}
                    className={`flex h-10 items-center gap-2 rounded-full px-3.5 text-[11px] font-semibold transition ${post.supportedByViewer ? 'bg-[#ff375f]/10 text-[#d91f4d]' : 'text-[#6e6e73] hover:bg-black/[0.04]'}`}
                >
                    <HandHeart className={`size-4 ${post.supportedByViewer ? 'fill-current' : ''}`} />
                    {t('Destekle', 'Support')} <span>{post.supportCount}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setIdeasOpen((value) => !value)}
                    className="flex h-10 items-center gap-2 rounded-full px-3.5 text-[11px] font-semibold text-[#6e6e73] transition hover:bg-black/[0.04]"
                >
                    <Lightbulb className="size-4" />
                    {t('Fikir Ver', 'Share an Idea')} <span>{post.ideaCount}</span>
                </button>
            </div>
            {ideasOpen && (
                <div className="border-t border-black/[0.05] bg-[#fafafd] px-4 py-4 sm:px-5">
                    <div className="mb-4">
                        <IdeaForm
                            postId={post.id}
                            viewer={viewer}
                            t={t}
                            demoUsername={demoUsername}
                            recipientUsername={post.authorProfile.username}
                        />
                    </div>
                    <div className="space-y-3">
                        {post.ideas.map((idea) => (
                            <IdeaThread
                                key={idea.id}
                                idea={idea}
                                postId={post.id}
                                viewer={viewer}
                                locale={locale}
                                t={t}
                                demoUsername={demoUsername}
                                onOpenProfile={onOpenProfile}
                            />
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}

function IdeaThread({
    idea,
    postId,
    viewer,
    locale,
    t,
    demoUsername,
    onOpenProfile,
}: {
    idea: CommunityIdea;
    postId: number;
    viewer: Viewer | null;
    locale: Locale;
    t: Translate;
    demoUsername?: string;
    onOpenProfile: (profile: CommunityProfile) => void;
}) {
    const [replying, setReplying] = useState(false);
    const toggleIdeaSupport = (ideaId: number) => {
        if (!viewer) return router.visit('/login');

        router.post(
            route(demoUsername ? 'demo.community.goals.ideas.support' : 'community.goals.ideas.support', [postId, ideaId]),
            demoUsername ? { demoUsername } : {},
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex gap-3">
            <button type="button" onClick={() => onOpenProfile(idea.authorProfile)} className="h-fit shrink-0 rounded-full">
                <Avatar
                    name={idea.author}
                    avatar={idea.authorProfile.avatar ?? undefined}
                    accentFrom={idea.authorProfile.accentFrom}
                    accentTo={idea.authorProfile.accentTo}
                    small
                />
            </button>
            <div className="min-w-0 flex-1">
                <div className="rounded-[16px] bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => onOpenProfile(idea.authorProfile)}
                            className="truncate text-left text-[11px] font-semibold hover:underline"
                        >
                            {idea.author}
                        </button>
                        <span className="shrink-0 text-[9px] text-[#8e8e93]">{formatRelativeDate(idea.createdAt, locale)}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-5 whitespace-pre-wrap text-[#4b4b50]">{idea.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => toggleIdeaSupport(idea.id)}
                            aria-pressed={idea.supportedByViewer}
                            className={`flex items-center gap-1 text-[10px] font-semibold ${idea.supportedByViewer ? 'text-[#d91f4d]' : 'text-[#6e6e73]'}`}
                        >
                            <HandHeart className={`size-3.5 ${idea.supportedByViewer ? 'fill-current' : ''}`} />
                            {t('Destekle', 'Support')} {idea.supportCount > 0 && <span>{idea.supportCount}</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => (viewer ? setReplying((value) => !value) : router.visit('/login'))}
                            className="text-[10px] font-semibold text-[#007aff]"
                        >
                            {t('Cevapla', 'Reply')}
                        </button>
                    </div>
                </div>
                {(idea.replies ?? []).map((reply) => (
                    <div key={reply.id} className="mt-2 ml-3 flex gap-2 border-l-2 border-black/[0.06] pl-3">
                        <button type="button" onClick={() => onOpenProfile(reply.authorProfile)} className="h-fit shrink-0 rounded-full">
                            <Avatar
                                name={reply.author}
                                avatar={reply.authorProfile.avatar ?? undefined}
                                accentFrom={reply.authorProfile.accentFrom}
                                accentTo={reply.authorProfile.accentTo}
                                small
                            />
                        </button>
                        <div className="min-w-0 flex-1 rounded-[14px] bg-white/80 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => onOpenProfile(reply.authorProfile)}
                                    className="truncate text-left text-[10px] font-semibold hover:underline"
                                >
                                    {reply.author}
                                </button>
                                <span className="shrink-0 text-[9px] text-[#8e8e93]">{formatRelativeDate(reply.createdAt, locale)}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-5 whitespace-pre-wrap text-[#4b4b50]">{reply.body}</p>
                            <button
                                type="button"
                                onClick={() => toggleIdeaSupport(reply.id)}
                                aria-pressed={reply.supportedByViewer}
                                className={`mt-1.5 flex items-center gap-1 text-[9px] font-semibold ${reply.supportedByViewer ? 'text-[#d91f4d]' : 'text-[#6e6e73]'}`}
                            >
                                <HandHeart className={`size-3 ${reply.supportedByViewer ? 'fill-current' : ''}`} />
                                {t('Destekle', 'Support')} {reply.supportCount > 0 && <span>{reply.supportCount}</span>}
                            </button>
                        </div>
                    </div>
                ))}
                {replying && (
                    <IdeaForm
                        postId={postId}
                        parentIdeaId={idea.id}
                        viewer={viewer}
                        t={t}
                        demoUsername={demoUsername}
                        recipientUsername={idea.authorProfile.username}
                        onSubmitted={() => setReplying(false)}
                    />
                )}
            </div>
        </div>
    );
}

function IdeaForm({
    postId,
    viewer,
    t,
    demoUsername,
    parentIdeaId,
    recipientUsername,
    onSubmitted,
}: {
    postId: number;
    viewer: Viewer | null;
    t: Translate;
    demoUsername?: string;
    parentIdeaId?: number;
    recipientUsername?: string;
    onSubmitted?: () => void;
}) {
    const form = useForm({ body: '', parentIdeaId: parentIdeaId ?? null, demoUsername: demoUsername ?? '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!viewer) return router.visit('/login');
        form.post(route(demoUsername ? 'demo.community.goals.ideas.store' : 'community.goals.ideas.store', postId), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('body');
                onSubmitted?.();
            },
        });
    };
    return (
        <form onSubmit={submit} className={`${parentIdeaId ? 'mt-3' : ''} flex gap-2`}>
            <input
                value={form.data.body}
                onChange={(event) => form.setData('body', event.target.value)}
                maxLength={800}
                placeholder={
                    viewer
                        ? parentIdeaId
                            ? t(`@${recipientUsername}'na cevap ver.`, `Reply to @${recipientUsername}.`)
                            : t(`@${recipientUsername}'na bir fikir ver.`, `Share an idea with @${recipientUsername}.`)
                        : t('Fikir vermek için giriş yap', 'Sign in to share an idea')
                }
                className="h-11 min-w-0 flex-1 rounded-full border border-black/[0.08] bg-white px-4 text-[12px] outline-none focus:border-[#007aff]"
            />
            <button
                type="submit"
                disabled={form.processing || (viewer ? !form.data.body.trim() : false)}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[#007aff] text-white disabled:bg-[#c7c7cc]"
                aria-label={t('Fikir gönder', 'Send idea')}
            >
                {form.processing ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </button>
        </form>
    );
}

function CommunityProfilePreview({
    profile,
    posts,
    t,
    currentUsername,
    friendStatus,
    onFriendAction,
    onClose,
}: {
    profile: CommunityProfile;
    posts: CommunityPost[];
    t: Translate;
    currentUsername?: string;
    friendStatus: CommunityFriendStatus | null;
    onFriendAction?: () => void;
    onClose: () => void;
}) {
    const [removeFriendConfirmOpen, setRemoveFriendConfirmOpen] = useState(false);
    const profileSheetGesture = useSwipeDownDismiss<HTMLElement>(onClose);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (removeFriendConfirmOpen) setRemoveFriendConfirmOpen(false);
            else onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose, removeFriendConfirmOpen]);

    const initials = profile.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toLocaleUpperCase())
        .join('');
    const supportCount = posts.reduce((total, post) => total + post.supportCount, 0);
    const isOwnProfile =
        currentUsername?.replace(/^@+/, '').toLocaleLowerCase('tr-TR') === profile.username.replace(/^@+/, '').toLocaleLowerCase('tr-TR');
    const friendButtonLabel =
        friendStatus === 'friend'
            ? t('Arkadaşsınız', 'Friends')
            : friendStatus === 'outgoing'
              ? t('İstek Gönderildi', 'Request Sent')
              : friendStatus === 'incoming'
                ? t('İsteği Kabul Et', 'Accept Request')
                : t('Arkadaş Ekle', 'Add Friend');
    const handleFriendButtonClick = () => {
        if (!onFriendAction) return;
        if (friendStatus === 'friend') {
            setRemoveFriendConfirmOpen(true);
            return;
        }

        onFriendAction();
    };
    const removeFriend = () => {
        setRemoveFriendConfirmOpen(false);
        onFriendAction?.();
    };

    return (
        <div
            className="fixed inset-0 z-[90] grid place-items-end bg-black/30 p-0 backdrop-blur-[3px] sm:place-items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${profile.name} ${t('profili', 'profile')}`}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                ref={profileSheetGesture.ref}
                style={profileSheetGesture.style}
                className="max-h-[92svh] w-full overflow-y-auto overscroll-contain rounded-t-[30px] bg-[#f5f5f7] shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:max-w-xl sm:rounded-[30px]"
            >
                <div
                    className="relative h-32 rounded-t-[30px] sm:h-40"
                    style={{ background: `linear-gradient(135deg, ${profile.accentFrom}, ${profile.accentTo})` }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/30"
                        aria-label={t('Profili kapat', 'Close profile')}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="relative px-5 pb-7 sm:px-7 sm:pb-8">
                    <div className="absolute -top-14 left-5 size-28 sm:left-7">
                        <div
                            className="grid size-full place-items-center overflow-hidden rounded-full border-[5px] border-[#f5f5f7] text-[25px] font-semibold text-white shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
                            style={{ background: `linear-gradient(145deg, ${profile.accentFrom}, ${profile.accentTo})` }}
                        >
                            {profile.avatar ? <img src={profile.avatar} alt="" className="size-full object-cover" /> : initials || 'FU'}
                        </div>
                    </div>

                    <div className="pt-[70px]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    {profile.firstBuilderNumber !== null && (
                                        <FirstBuilderBadge
                                            number={profile.firstBuilderNumber}
                                            t={t}
                                            sizeClassName="size-[37px]"
                                            className="drop-shadow-[0_7px_12px_rgba(0,0,0,0.2)]"
                                        />
                                    )}
                                    <h2 className="min-w-0 text-[25px] leading-8 font-semibold tracking-[-0.035em]">{profile.name}</h2>
                                    {profile.fu !== null && profile.fu !== undefined && (
                                        <span className="h-6 w-px bg-black/[0.12]" aria-hidden="true" />
                                    )}
                                    {profile.fu !== null && profile.fu !== undefined && (
                                        <span className="inline-flex items-center gap-1 text-[16px] font-semibold tabular-nums">
                                            {profile.fu} <FuMark className="size-4" />
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-[13px] font-medium text-[#8e8e93]">@{profile.username}</p>
                            </div>
                            {!isOwnProfile && onFriendAction && (
                                <button
                                    type="button"
                                    onClick={handleFriendButtonClick}
                                    title={
                                        friendStatus === 'friend'
                                            ? t('Arkadaşlıktan çıkar', 'Remove friend')
                                            : friendStatus === 'outgoing'
                                              ? t('Arkadaşlık isteğini geri çek', 'Withdraw friend request')
                                              : undefined
                                    }
                                    className={`mt-0.5 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold transition ${
                                        friendStatus === 'friend'
                                            ? 'bg-black/[0.055] text-[#6e6e73] hover:bg-[#ff3b30]/10 hover:text-[#d70015] active:scale-[0.98]'
                                            : friendStatus === 'outgoing'
                                              ? 'bg-black/[0.055] text-[#6e6e73] hover:bg-[#ff3b30]/10 hover:text-[#d70015] active:scale-[0.98]'
                                              : 'bg-[#007aff] text-white hover:bg-[#006ee6] active:scale-[0.98]'
                                    }`}
                                >
                                    <UserPlus className="size-3.5" />
                                    {friendButtonLabel}
                                </button>
                            )}
                        </div>

                        {(profile.profession || profile.location) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {profile.profession && (
                                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-[#6e6e73] shadow-sm">
                                        <BriefcaseBusiness className="size-3.5" /> {profile.profession}
                                    </span>
                                )}
                                {profile.location && (
                                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-[#6e6e73] shadow-sm">
                                        <MapPin className="size-3.5" /> {profile.location}
                                    </span>
                                )}
                            </div>
                        )}

                        <p className="mt-5 text-[13px] leading-6 text-[#4b4b50]">{profile.bio}</p>

                        <div className="mt-5 grid grid-cols-3 gap-2">
                            <ProfileStat value={posts.length} label={t('Paylaşılan hedef', 'Shared goals')} />
                            <ProfileStat value={supportCount} label={t('Toplam destek', 'Total support')} />
                            <ProfileStat value={posts.reduce((total, post) => total + post.ideaCount, 0)} label={t('Fikir', 'Ideas')} />
                        </div>

                        <div className="mt-7">
                            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#007aff] uppercase">
                                {t('Fuevor’da paylaştığı hedefler', 'Goals shared on Fuevor')}
                            </p>
                            <div className="mt-3 space-y-2.5">
                                {posts.map((post) => (
                                    <div key={post.id} className="rounded-[18px] border border-black/[0.055] bg-white p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#007aff]/10 text-[#007aff]">
                                                <Target className="size-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[14px] leading-5 font-semibold">{post.title}</h3>
                                                {post.description && (
                                                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#6e6e73]">{post.description}</p>
                                                )}
                                                <div className="mt-3 flex items-center gap-3 text-[10px] font-medium text-[#8e8e93]">
                                                    <span className="inline-flex items-center gap-1">
                                                        <HandHeart className="size-3.5" /> {post.supportCount}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Lightbulb className="size-3.5" /> {post.ideaCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {posts.length === 0 && (
                                    <p className="rounded-[18px] border border-dashed border-black/[0.1] bg-white/60 px-4 py-8 text-center text-[12px] text-[#8e8e93]">
                                        {t('Henüz paylaştığı bir hedef yok.', 'No shared goals yet.')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {removeFriendConfirmOpen && (
                <div
                    className="fixed inset-0 z-[110] grid place-items-end bg-black/25 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="remove-community-friend-title"
                    aria-describedby="remove-community-friend-description"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setRemoveFriendConfirmOpen(false);
                    }}
                >
                    <div className="w-full rounded-t-[26px] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:max-w-sm sm:rounded-[26px] sm:p-6">
                        <span className="grid size-12 place-items-center rounded-[16px] bg-[#ff3b30]/10 text-[#d70015]">
                            <UserMinus className="size-5" />
                        </span>
                        <h3 id="remove-community-friend-title" className="mt-4 text-[19px] font-semibold tracking-[-0.025em]">
                            {t('Arkadaşlıktan çıkarılsın mı?', 'Remove friend?')}
                        </h3>
                        <p id="remove-community-friend-description" className="mt-2 text-[12px] leading-5 text-[#6e6e73]">
                            {t(
                                `${profile.name} kişisini arkadaşlarından çıkarmak istiyor musun?`,
                                `Do you want to remove ${profile.name} from your friends?`,
                            )}
                        </p>
                        <div className="mt-5 grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setRemoveFriendConfirmOpen(false)}
                                className="h-11 rounded-full bg-[#f2f2f7] text-[12px] font-semibold text-[#3a3a3c] transition hover:bg-[#e9e9ee]"
                            >
                                {t('İptal', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={removeFriend}
                                className="h-11 rounded-full bg-[#ff3b30] text-[12px] font-semibold text-white transition hover:bg-[#e8332a] active:scale-[0.98]"
                            >
                                {t('Arkadaşlıktan Çıkar', 'Remove Friend')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
    return (
        <div className="rounded-[16px] bg-white px-2 py-3 text-center shadow-sm">
            <strong className="block text-[17px] font-semibold tabular-nums">{value}</strong>
            <span className="mt-0.5 block truncate text-[9px] font-medium text-[#8e8e93]">{label}</span>
        </div>
    );
}

export function PublicLibrary({
    books,
    locale,
    t,
    viewer,
    demoUsername,
}: {
    books: CommunityBook[];
    locale: Locale;
    t: Translate;
    viewer?: Viewer | null;
    demoUsername?: string;
}) {
    const [search, setSearch] = useState('');
    const visibleBooks = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return query ? books.filter((book) => `${book.title} ${book.author ?? ''}`.toLocaleLowerCase().includes(query)) : books;
    }, [books, search]);

    return (
        <div>
            <div className="mb-5 px-1">
                <h1 className="text-[25px] font-semibold tracking-[-0.035em]">{t('Kitaplık', 'Library')}</h1>
                <p className="mt-1 text-[12px] text-[#8e8e93]">
                    {t(
                        'Kişisel kitaplıklarda bitirilen kitaplar; aynı kitap ve yazar adı altında bir arada.',
                        'Finished books from personal libraries, grouped by the same title and author.',
                    )}
                </p>
            </div>

            <div className="mb-4">
                <SearchField value={search} onChange={setSearch} placeholder={t('Kitap ara', 'Search books')} />
            </div>
            <div className="space-y-3">
                {visibleBooks.map((book) => (
                    <BookReviewGroup key={book.key} book={book} locale={locale} t={t} viewer={viewer ?? null} demoUsername={demoUsername} />
                ))}
                {visibleBooks.length === 0 && (
                    <EmptyState
                        icon={<BookOpen className="size-7" />}
                        title={t('Henüz bitirilmiş kitap yok', 'No finished books yet')}
                        text={t(
                            'Kişisel kitaplıklarda bitirilen kitaplar burada otomatik görünür.',
                            'Books finished in personal libraries appear here automatically.',
                        )}
                    />
                )}
            </div>
        </div>
    );
}

function BookReviewGroup({
    book,
    locale,
    t,
    viewer,
    demoUsername,
}: {
    book: CommunityBook;
    locale: Locale;
    t: Translate;
    viewer: Viewer | null;
    demoUsername?: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <article className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-white">
            <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                <span className="relative grid h-[82px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[8px_13px_13px_8px] bg-[linear-gradient(145deg,#052f3a,#007c91,#63c7d1)] px-2 text-center shadow-[0_8px_18px_rgba(0,91,103,0.2)]">
                    <span className="absolute inset-y-0 left-1.5 w-px bg-white/25" />
                    <BookOpen className="size-5 text-white/85" />
                    <span className="absolute right-1.5 bottom-1.5 left-2.5 truncate text-[7px] font-bold tracking-wide text-white/85 uppercase">
                        {book.title}
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em]">{book.title}</h3>
                    <p className="mt-1 truncate text-[11px] text-[#8e8e93]">{book.author || t('Yazar belirtilmedi', 'Author not specified')}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {book.averageRating !== null && (
                            <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                                <Star className="size-4 fill-[#ffb800] text-[#ffb800]" />
                                {book.averageRating}/5
                            </span>
                        )}
                        <span className="text-[11px] font-medium text-[#6e6e73]">
                            {book.readerCount} {t('kişi bitirdi', 'readers finished')}
                        </span>
                        <span className="text-[11px] font-medium text-[#6e6e73]">
                            {book.reviewCount} {t('yorum', 'reviews')}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`size-5 shrink-0 text-[#8e8e93] transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="border-t border-black/[0.05] bg-[#fafafd] px-5 py-2 sm:px-6">
                    {book.reviews.length === 0 && (
                        <p className="py-6 text-center text-[11px] text-[#8e8e93]">
                            {t('Bu kitap için henüz yorum veya puan yok.', 'There is no review or rating for this book yet.')}
                        </p>
                    )}
                    {book.reviews.map((review) => (
                        <BookReviewThread key={review.id} review={review} locale={locale} t={t} viewer={viewer} demoUsername={demoUsername} />
                    ))}
                </div>
            )}
        </article>
    );
}

function BookReviewThread({
    review,
    locale,
    t,
    viewer,
    demoUsername,
}: {
    review: CommunityReview;
    locale: Locale;
    t: Translate;
    viewer: Viewer | null;
    demoUsername?: string;
}) {
    const [replying, setReplying] = useState(false);

    return (
        <div className="border-b border-black/[0.05] py-5 last:border-0">
            <div className="flex items-start gap-3">
                <Avatar name={review.author} small />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold">{review.author}</p>
                        <span className="text-[9px] text-[#8e8e93]">{formatRelativeDate(review.createdAt, locale)}</span>
                    </div>
                    {review.rating !== null && (
                        <div className="mt-1.5 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`size-3 ${star <= review.rating! ? 'fill-[#ffb800] text-[#ffb800]' : 'text-[#d1d1d6]'}`}
                                />
                            ))}
                        </div>
                    )}
                    {review.body && <p className="mt-2 text-[12px] leading-5 whitespace-pre-wrap text-[#4b4b50]">{review.body}</p>}
                    <button
                        type="button"
                        onClick={() => (viewer ? setReplying((value) => !value) : router.visit('/login'))}
                        className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#007aff]"
                        aria-expanded={replying}
                    >
                        <MessageCircleMore className="size-3.5" />
                        {t('Cevapla', 'Reply')}
                        {review.replies.length > 0 && <span className="text-[#8e8e93]">{review.replies.length}</span>}
                    </button>

                    {review.replies.map((reply) => (
                        <div key={reply.id} className="mt-3 flex gap-2 border-l-2 border-[#007aff]/15 pl-3">
                            <Avatar name={reply.author} small />
                            <div className="min-w-0 flex-1 rounded-[14px] bg-white px-3 py-2.5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-[10px] font-semibold">{reply.author}</p>
                                    <span className="shrink-0 text-[9px] text-[#8e8e93]">{formatRelativeDate(reply.createdAt, locale)}</span>
                                </div>
                                <p className="mt-1 text-[11px] leading-5 whitespace-pre-wrap text-[#4b4b50]">{reply.body}</p>
                            </div>
                        </div>
                    ))}

                    {replying && (
                        <BookReviewReplyForm
                            reviewId={review.id}
                            viewer={viewer}
                            t={t}
                            demoUsername={demoUsername}
                            recipient={review.author}
                            onSubmitted={() => setReplying(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function BookReviewReplyForm({
    reviewId,
    viewer,
    t,
    demoUsername,
    recipient,
    onSubmitted,
}: {
    reviewId: number;
    viewer: Viewer | null;
    t: Translate;
    demoUsername?: string;
    recipient: string;
    onSubmitted: () => void;
}) {
    const form = useForm({ body: '', demoUsername: demoUsername ?? '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!viewer) return router.visit('/login');

        form.post(route(demoUsername ? 'demo.community.books.reviews.replies.store' : 'community.books.reviews.replies.store', reviewId), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('body');
                onSubmitted();
            },
        });
    };

    return (
        <form onSubmit={submit} className="mt-3 flex gap-2">
            <input
                value={form.data.body}
                onChange={(event) => form.setData('body', event.target.value)}
                maxLength={800}
                autoFocus
                placeholder={t(`${recipient}'a cevap ver.`, `Reply to ${recipient}.`)}
                className="h-10 min-w-0 flex-1 rounded-full border border-black/[0.08] bg-white px-4 text-[11px] outline-none focus:border-[#007aff]"
            />
            <button
                type="submit"
                disabled={form.processing || !form.data.body.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff] text-white disabled:bg-[#c7c7cc]"
                aria-label={t('Cevabı gönder', 'Send reply')}
            >
                {form.processing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
        </form>
    );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
    return (
        <label className="flex h-11 w-full items-center gap-2 rounded-full border border-black/[0.07] bg-white px-4 sm:w-64">
            <Search className="size-4 text-[#8e8e93]" />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 border-0 bg-transparent text-[12px] outline-none"
            />
        </label>
    );
}

function Avatar({
    name,
    avatar,
    small = false,
    accentFrom = '#005b67',
    accentTo = '#52b8c4',
}: {
    name: string;
    avatar?: string;
    small?: boolean;
    accentFrom?: string;
    accentTo?: string;
}) {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toLocaleUpperCase())
        .join('');
    if (avatar) {
        return <img src={avatar} alt="" className={`shrink-0 rounded-full object-cover ${small ? 'size-8' : 'size-11'}`} />;
    }

    return (
        <span
            className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${small ? 'size-8 text-[9px]' : 'size-11 text-[11px]'}`}
            style={{ background: `linear-gradient(145deg, ${accentFrom}, ${accentTo})` }}
        >
            {initials || 'FU'}
        </span>
    );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="rounded-[28px] border border-dashed border-black/[0.12] bg-white/55 px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-black/[0.045] text-[#8e8e93]">{icon}</span>
            <h3 className="mt-4 text-[17px] font-semibold">{title}</h3>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-[#8e8e93]">{text}</p>
        </div>
    );
}

function GuestPrompt({ t, compact = false }: { t: Translate; compact?: boolean }) {
    if (compact) {
        return (
            <div className="flex items-center gap-3 p-4">
                <MessageCircleMore className="size-5 shrink-0 text-[#8e8e93]" />
                <p className="min-w-0 flex-1 text-[11px] leading-4 text-[#6e6e73]">{t('Paylaşmak için giriş yap.', 'Sign in to share.')}</p>
                <Link href="/login" className="h-9 shrink-0 rounded-full bg-black px-4 text-[10px] leading-9 font-semibold text-white">
                    {t('Giriş Yap', 'Sign In')}
                </Link>
            </div>
        );
    }

    return (
        <div className="p-5 text-center">
            <MessageCircleMore className="mx-auto size-7 text-[#8e8e93]" />
            <p className="mt-3 text-[12px] leading-5 text-[#6e6e73]">
                {t('Paylaşmak, desteklemek ve fikir vermek için giriş yap.', 'Sign in to share, support, and offer ideas.')}
            </p>
            <Link href="/login" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-[11px] font-semibold text-white">
                {t('Giriş Yap', 'Sign In')} <ArrowRight className="size-3.5" />
            </Link>
        </div>
    );
}

function formatRelativeDate(value: string, locale: Locale): string {
    const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(getIntlLocale(locale), { numeric: 'auto' });
    if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
    return formatter.format(Math.round(hours / 24), 'day');
}
