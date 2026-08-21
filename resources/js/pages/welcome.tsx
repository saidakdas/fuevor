import BrandLogo from '@/components/brand-logo';
import {
    GoalsCommunity,
    PublicLibrary,
    type BetaAnnouncement,
    type CommunityBook,
    type CommunityGoalStats,
    type CommunityPost,
    type ShareableGoal,
    type Viewer,
} from '@/components/community-feed';
import CommunityGame, { FuevorRunnerIcon, type GameScorePlayer } from '@/components/community-game';
import { useLocale } from '@/hooks/use-locale';
import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type WelcomeProps = {
    bestScoreMs: number;
    bestScorePlayer: GameScorePlayer | null;
    gamePlaysRemaining: number;
    registrationSuccess: string | null;
    communityPosts: CommunityPost[];
    communityBooks: CommunityBook[];
    communityGoals: ShareableGoal[];
    communityGoalStats: CommunityGoalStats;
    betaAnnouncement: BetaAnnouncement;
};

type SharedProps = { auth: { user: Viewer | null }; [key: string]: unknown };
type CommunitySection = 'goals' | 'library' | 'game';

export default function Welcome({
    bestScoreMs,
    bestScorePlayer,
    gamePlaysRemaining,
    registrationSuccess,
    communityPosts,
    communityBooks,
    communityGoals,
    communityGoalStats,
    betaAnnouncement,
}: WelcomeProps) {
    const { locale, t } = useLocale();
    const viewer = usePage<SharedProps>().props.auth.user;
    const [section, setSection] = useState<CommunitySection>('goals');

    return (
        <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
            <Head title={t('Topluluk', 'Community')} />
            <header className="sticky top-0 z-40 border-b border-black/[0.055] bg-[#f5f5f7]/88 backdrop-blur-2xl">
                <div className="mx-auto flex h-[68px] max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link href="/" className="relative h-9 w-28 shrink-0" aria-label="Fuevor Beta">
                        <BrandLogo variant="black" className="absolute inset-0 size-full" />
                        <img src="/fuevor-beta-text.svg" alt="Beta" className="absolute -top-1 right-2 h-2.5 w-auto" />
                    </Link>
                    <nav className="hidden items-center rounded-full bg-black/[0.045] p-1 sm:flex">
                        <NavButton active={section === 'goals'} onClick={() => setSection('goals')}>
                            {t('Hedefler', 'Goals')}
                        </NavButton>
                        <NavButton active={section === 'library'} onClick={() => setSection('library')}>
                            {t('Kitaplık', 'Library')}
                        </NavButton>
                        <NavButton active={section === 'game'} onClick={() => setSection('game')}>
                            <FuevorRunnerIcon className="size-5" />
                            <span className="sr-only">{t('Oyun', 'Game')}</span>
                        </NavButton>
                    </nav>
                    <div className="flex items-center gap-2">
                        {!viewer && (
                            <Link
                                href="/register"
                                className="h-10 rounded-full px-3 text-[11px] leading-10 font-semibold text-black sm:px-4 sm:text-[12px]"
                            >
                                {t('Erken Erişim', 'Early Access')}
                            </Link>
                        )}
                        <Link
                            href={viewer ? '/beta' : '/login'}
                            className="h-10 rounded-full bg-black px-5 text-[12px] leading-10 font-semibold text-white"
                        >
                            {viewer ? t('Panelim', 'My Panel') : t('Giriş Yap', 'Sign In')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-9">
                {registrationSuccess && (
                    <div className="mb-5 flex items-start gap-3 rounded-[16px] bg-[#34c759]/10 px-4 py-3 text-[12px] leading-5 text-[#187a2f]">
                        <Check className="mt-0.5 size-4 shrink-0" /> {registrationSuccess}
                    </div>
                )}
                <div className="mb-6 flex rounded-[14px] bg-black/[0.045] p-1 sm:hidden">
                    <NavButton active={section === 'goals'} onClick={() => setSection('goals')} grow>
                        {t('Hedefler', 'Goals')}
                    </NavButton>
                    <NavButton active={section === 'library'} onClick={() => setSection('library')} grow>
                        {t('Kitaplık', 'Library')}
                    </NavButton>
                    <NavButton active={section === 'game'} onClick={() => setSection('game')} grow>
                        <FuevorRunnerIcon className="mx-auto size-5" />
                        <span className="sr-only">{t('Oyun', 'Game')}</span>
                    </NavButton>
                </div>
                {section === 'goals' ? (
                    <GoalsCommunity
                        posts={communityPosts}
                        viewer={viewer}
                        locale={locale}
                        t={t}
                        goalStats={communityGoalStats}
                        betaAnnouncement={betaAnnouncement}
                        availableGoals={communityGoals}
                    />
                ) : section === 'library' ? (
                    <PublicLibrary books={communityBooks} viewer={viewer} locale={locale} t={t} />
                ) : (
                    <CommunityGame
                        locale={locale}
                        t={t}
                        initialBestScoreMs={bestScoreMs}
                        initialBestScorePlayer={bestScorePlayer}
                        initialPlaysRemaining={gamePlaysRemaining}
                        playerName={viewer?.name ?? t('Fuevor kullanıcısı', 'Fuevor user')}
                        playerAvatar={viewer?.avatar}
                    />
                )}
            </main>
        </div>
    );
}

function NavButton({ active, onClick, grow, children }: { active: boolean; onClick: () => void; grow?: boolean; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${grow ? 'flex-1' : ''} h-9 rounded-full px-5 text-[11px] font-semibold transition ${active ? 'bg-white text-black shadow-sm' : 'text-[#6e6e73]'}`}
        >
            {children}
        </button>
    );
}
