import { Check, ChevronLeft, ChevronRight, ImagePlus, Plus, Target, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import type { Translate } from '@/i18n';

type TeamRole = 'manager' | 'assistant' | 'member';
type TeamPriority = 'urgent' | 'very-important' | 'important' | 'has-time';
type TeamCategory = 'health' | 'work' | 'venture' | 'skill' | 'education' | 'other';

type TeamMember = {
    id: number;
    username: string;
    name: string;
    role: TeamRole;
    avatar?: string;
    joinedAt: number;
};

type TeamBuildingBlock = {
    id: number;
    title: string;
    assigneeId?: number;
    completed: boolean;
    completedAt?: number;
};

type TeamGoal = {
    id: number;
    title: string;
    gain: string;
    category: TeamCategory;
    deadline: string;
    priority: TeamPriority;
    buildingBlocks: TeamBuildingBlock[];
    createdAt: number;
};

type TeamRecord = {
    id: number;
    name: string;
    avatar: string;
    inviteCode: string;
    creatorUsername: string;
    members: TeamMember[];
    goals: TeamGoal[];
    createdAt: number;
};

type TeamWorkspaceData = {
    teams: TeamRecord[];
};

type TeamProfile = {
    name: string;
    username: string;
    avatar: string;
};

export type TeamFriendSuggestion = {
    username: string;
    name: string;
    avatar: string;
};

export type TeamPlanBlockInput = {
    teamId: number;
    teamName: string;
    goalId: number;
    goalTitle: string;
    blockId: number;
    blockTitle: string;
    priority: TeamPriority;
};

type TeamWorkspacePanelProps = {
    t: Translate;
    profile: TeamProfile;
    friendSuggestions: TeamFriendSuggestion[];
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    plannedBlockKeys: string[];
    onAddBlockToPlan: (input: TeamPlanBlockInput) => void;
    onBlockCompletionChange: (teamId: number, goalId: number, blockId: number, completed: boolean) => void;
    onDeleteTeam: (teamId: number) => void;
};

const TEAM_WORKSPACE_STORAGE_KEY = 'fuevor.demo.teams.v2';
const LEGACY_TEAM_STORAGE_KEY = 'fuevor.demo.team';

export function teamPlanBlockKey(teamId: number, goalId: number, blockId: number): string {
    return `${teamId}:${goalId}:${blockId}`;
}

export function updateStoredTeamBlockCompletion(teamId: number, goalId: number, blockId: number, completed: boolean): void {
    if (typeof window === 'undefined') return;

    try {
        const stored = JSON.parse(window.localStorage.getItem(TEAM_WORKSPACE_STORAGE_KEY) ?? 'null') as TeamWorkspaceData | null;
        if (!stored || !Array.isArray(stored.teams)) return;

        stored.teams = stored.teams.map((team) =>
            team.id === teamId
                ? {
                      ...team,
                      goals: team.goals.map((goal) =>
                          goal.id === goalId
                              ? {
                                    ...goal,
                                    buildingBlocks: goal.buildingBlocks.map((block) =>
                                        block.id === blockId ? { ...block, completed, completedAt: completed ? Date.now() : undefined } : block,
                                    ),
                                }
                              : goal,
                      ),
                  }
                : team,
        );
        window.localStorage.setItem(TEAM_WORKSPACE_STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // Demo storage failures should not block the planning flow.
    }
}

export default function TeamWorkspacePanel({
    t,
    profile,
    friendSuggestions,
    enabled,
    onEnabledChange,
    plannedBlockKeys,
    onAddBlockToPlan,
    onBlockCompletionChange,
    onDeleteTeam,
}: TeamWorkspacePanelProps) {
    const [workspace, setWorkspace] = useState<TeamWorkspaceData>(() => loadTeamWorkspace(profile));
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const workspaceRef = useRef(workspace);
    const currentUsername = normalizeUsername(profile.username) || 'ben';
    const plannedKeys = useMemo(() => new Set(plannedBlockKeys), [plannedBlockKeys]);

    useEffect(() => {
        workspaceRef.current = workspace;
        storeWorkspace(workspace);
    }, [workspace]);

    useEffect(() => {
        const username = normalizeUsername(profile.username) || 'ben';
        const name = profile.name.trim() || 'Sen';

        setWorkspace((current) => {
            let changed = false;
            const teams = current.teams.map((team) => ({
                ...team,
                members: team.members.map((member) => {
                    if (member.username !== username) return member;
                    if (member.username === username && member.name === name && member.avatar === profile.avatar) return member;
                    changed = true;
                    return { ...member, name, avatar: profile.avatar };
                }),
            }));
            return changed ? { teams } : current;
        });
    }, [profile.avatar, profile.name, profile.username]);

    useEffect(() => {
        if (!enabled || !currentUsername) return;

        let cancelled = false;
        let bootstrapped = false;
        const pullTeams = async () => {
            let remoteTeams = await fetchRemoteTeams(currentUsername);
            if (cancelled || remoteTeams === null) return;

            if (!bootstrapped && remoteTeams.length === 0) {
                bootstrapped = true;
                const ownedTeams = workspaceRef.current.teams.filter((team) => team.creatorUsername === currentUsername);
                if (ownedTeams.length > 0) {
                    await Promise.all(ownedTeams.map((team) => saveRemoteTeam(team, currentUsername)));
                    remoteTeams = (await fetchRemoteTeams(currentUsername)) ?? remoteTeams;
                }
            }

            if (cancelled) return;
            setWorkspace((current) => (JSON.stringify(current.teams) === JSON.stringify(remoteTeams) ? current : { teams: remoteTeams }));
        };

        void pullTeams();
        const timer = window.setInterval(() => void pullTeams(), 1500);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [currentUsername, enabled]);

    const selectedTeam = workspace.teams.find((team) => team.id === selectedTeamId);

    if (!enabled) {
        return (
            <main className="mx-auto max-w-6xl px-5 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-16">
                <section className="mx-auto max-w-2xl rounded-[32px] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.07)] sm:px-12 sm:py-16">
                    <span className="mx-auto grid size-20 place-items-center rounded-[24px] bg-[#5856d6]/10 text-[#5856d6]">
                        <Users className="size-9" />
                    </span>
                    <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.045em] sm:text-[42px]">{t('Ekip Modu', 'Team Mode')}</h1>
                    <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#6e6e73]">
                        {t(
                            'Birden fazla ekip kur, ortak hedefleri yapı taşlarına böl ve birlikte ilerle.',
                            'Create multiple teams, split shared goals into building blocks, and move forward together.',
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(true)}
                        className="mt-7 h-12 rounded-full bg-[#007aff] px-7 text-[15px] font-semibold text-white shadow-[0_9px_25px_rgba(0,122,255,0.24)]"
                    >
                        {t('Ekip Modunu Etkinleştir', 'Enable Team Mode')}
                    </button>
                </section>
            </main>
        );
    }

    if (!selectedTeam) {
        return (
            <TeamList
                t={t}
                profile={profile}
                workspace={workspace}
                showCreateTeam={showCreateTeam}
                onShowCreateTeam={() => setShowCreateTeam((value) => !value)}
                onOpenTeam={setSelectedTeamId}
                onCreateTeam={(team) => {
                    setWorkspace((current) => ({ teams: [...current.teams, team] }));
                    void saveRemoteTeam(team, currentUsername);
                    setShowCreateTeam(false);
                }}
                onDisable={() => onEnabledChange(false)}
            />
        );
    }

    return (
        <TeamDetail
            t={t}
            team={selectedTeam}
            profile={profile}
            friendSuggestions={friendSuggestions}
            plannedKeys={plannedKeys}
            onBack={() => setSelectedTeamId(null)}
            onUpdate={(updatedTeam) => {
                setWorkspace((current) => ({ teams: current.teams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)) }));
                void saveRemoteTeam(updatedTeam, currentUsername);
            }}
            onDelete={() => {
                setWorkspace((current) => ({ teams: current.teams.filter((team) => team.id !== selectedTeam.id) }));
                setSelectedTeamId(null);
                onDeleteTeam(selectedTeam.id);
                void deleteRemoteTeam(selectedTeam.id, currentUsername);
            }}
            onAddBlockToPlan={onAddBlockToPlan}
            onBlockCompletionChange={onBlockCompletionChange}
        />
    );
}

function TeamList({
    t,
    profile,
    workspace,
    showCreateTeam,
    onShowCreateTeam,
    onOpenTeam,
    onCreateTeam,
    onDisable,
}: {
    t: Translate;
    profile: TeamProfile;
    workspace: TeamWorkspaceData;
    showCreateTeam: boolean;
    onShowCreateTeam: () => void;
    onOpenTeam: (teamId: number) => void;
    onCreateTeam: (team: TeamRecord) => void;
    onDisable: () => void;
}) {
    return (
        <main className="mx-auto max-w-6xl px-5 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-16">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[12px] font-semibold text-[#5856d6]">{t('EKİPLERİN', 'YOUR TEAMS')}</p>
                    <h1 className="mt-2 text-[clamp(2.3rem,6vw,4rem)] leading-none font-semibold tracking-[-0.055em]">
                        {t('Ekip Modu', 'Team Mode')}
                    </h1>
                    <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#6e6e73]">
                        {t(
                            'Davetlerini bildirimlerden kabul et veya yeni bir çalışma alanı oluştur.',
                            'Accept invitations from notifications or create a new workspace.',
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onShowCreateTeam}
                        className="h-11 rounded-full bg-[#007aff] px-5 text-[13px] font-semibold text-white"
                    >
                        {t('Ekip Oluştur', 'Create Team')}
                    </button>
                    <button
                        type="button"
                        onClick={onDisable}
                        className="h-11 rounded-full bg-black/[0.055] px-4 text-[13px] font-semibold text-[#6e6e73]"
                    >
                        {t('Kapat', 'Disable')}
                    </button>
                </div>
            </div>

            {showCreateTeam && <TeamSetupCard t={t} profile={profile} onSubmit={onCreateTeam} />}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspace.teams.map((team) => {
                    const self = team.members.find((member) => member.username === normalizeUsername(profile.username));
                    const totalBlocks = team.goals.reduce((total, goal) => total + goal.buildingBlocks.length, 0);
                    const completedBlocks = team.goals.reduce(
                        (total, goal) => total + goal.buildingBlocks.filter((block) => block.completed).length,
                        0,
                    );

                    return (
                        <button
                            key={team.id}
                            type="button"
                            onClick={() => onOpenTeam(team.id)}
                            className="group overflow-hidden rounded-[28px] border border-black/[0.06] bg-white text-left shadow-[0_12px_42px_rgba(0,0,0,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(0,0,0,0.09)]"
                        >
                            <div className="h-28 bg-[linear-gradient(135deg,#052f3a,#007c91,#63c7d1)]">
                                {team.avatar && <img src={team.avatar} alt="" className="size-full object-cover" />}
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em]">{team.name}</h2>
                                        <p className="mt-1 text-[11px] font-medium text-[#8e8e93]">{roleLabel(self?.role ?? 'member', t)}</p>
                                    </div>
                                    <ChevronRight className="mt-1 size-5 text-[#c7c7cc] transition group-hover:translate-x-0.5 group-hover:text-[#007aff]" />
                                </div>
                                <div className="mt-5 flex items-center justify-between text-[11px] text-[#6e6e73]">
                                    <span>
                                        {team.members.length} {t('üye', 'members')}
                                    </span>
                                    <span>
                                        {completedBlocks}/{totalBlocks} {t('yapı taşı', 'blocks')}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {workspace.teams.length === 0 && (
                    <div className="col-span-full rounded-[28px] border border-dashed border-black/[0.12] bg-white/60 px-6 py-14 text-center text-[14px] text-[#8e8e93]">
                        {t(
                            'Henüz bir ekibin yok. Yeni ekip oluşturabilir veya gelen daveti bildirimlerden kabul edebilirsin.',
                            'You do not have a team yet. Create one or accept an invitation from notifications.',
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}

function TeamSetupCard({ t, profile, onSubmit }: { t: Translate; profile: TeamProfile; onSubmit: (team: TeamRecord) => void }) {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const teamName = name.trim();
        if (!teamName) return;

        const now = Date.now();
        onSubmit({
            id: now,
            name: teamName,
            avatar,
            inviteCode: createInviteCode(teamName),
            creatorUsername: normalizeUsername(profile.username) || 'ben',
            members: [
                {
                    id: now,
                    username: normalizeUsername(profile.username) || 'ben',
                    name: profile.name.trim() || 'Sen',
                    avatar: profile.avatar,
                    role: 'manager',
                    joinedAt: now,
                },
            ],
            goals: [],
            createdAt: now,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-7 grid gap-5 rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_12px_42px_rgba(0,0,0,0.05)] sm:grid-cols-[auto_1fr_auto] sm:items-end sm:p-6"
        >
            <label className="group relative grid size-20 cursor-pointer place-items-center overflow-hidden rounded-[22px] bg-[#f2f2f7] text-[#8e8e93]">
                {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6" />}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => readTeamImage(event.target.files?.[0], setAvatar)} />
            </label>
            <div className="grid gap-3">
                <label className="grid gap-1.5 text-[11px] font-semibold text-[#6e6e73]">
                    {t('Ekip adı', 'Team name')}
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-11 rounded-[14px] border border-black/[0.08] bg-[#fbfbfd] px-4 text-[13px] font-normal text-[#1d1d1f] outline-none focus:border-[#007aff]"
                        placeholder={t('Örn. Fuevor Ürün Ekibi', 'e.g. Fuevor Product Team')}
                    />
                </label>
            </div>
            <button
                type="submit"
                disabled={!name.trim()}
                className="h-11 rounded-full bg-[#007aff] px-6 text-[13px] font-semibold text-white disabled:bg-[#d1d1d6]"
            >
                {t('Oluştur', 'Create')}
            </button>
        </form>
    );
}

function TeamDetail({
    t,
    team,
    profile,
    friendSuggestions,
    plannedKeys,
    onBack,
    onUpdate,
    onDelete,
    onAddBlockToPlan,
    onBlockCompletionChange,
}: {
    t: Translate;
    team: TeamRecord;
    profile: TeamProfile;
    friendSuggestions: TeamFriendSuggestion[];
    plannedKeys: Set<string>;
    onBack: () => void;
    onUpdate: (team: TeamRecord) => void;
    onDelete: () => void;
    onAddBlockToPlan: (input: TeamPlanBlockInput) => void;
    onBlockCompletionChange: (teamId: number, goalId: number, blockId: number, completed: boolean) => void;
}) {
    const [showGoalCreator, setShowGoalCreator] = useState(false);
    const [memberUsername, setMemberUsername] = useState('');
    const [memberFeedback, setMemberFeedback] = useState('');
    const [invitedUsernames, setInvitedUsernames] = useState<string[]>([]);
    const viewer = team.members.find((member) => member.username === normalizeUsername(profile.username));
    const canManageTeam = viewer?.role === 'manager';
    const canManageWork = viewer?.role === 'manager' || viewer?.role === 'assistant';
    const canDeleteTeam = viewer?.username === team.creatorUsername;
    const assignedBlocks = team.goals.flatMap((goal) =>
        goal.buildingBlocks.filter((block) => block.assigneeId === viewer?.id && !block.completed).map((block) => ({ goal, block })),
    );

    const updateGoal = (goalId: number, update: (goal: TeamGoal) => TeamGoal) => {
        onUpdate({ ...team, goals: team.goals.map((goal) => (goal.id === goalId ? update(goal) : goal)) });
    };

    const toggleBlock = (goalId: number, blockId: number) => {
        const block = team.goals.find((goal) => goal.id === goalId)?.buildingBlocks.find((item) => item.id === blockId);
        if (!block || block.assigneeId !== viewer?.id) return;
        const completed = !block.completed;
        updateGoal(goalId, (goal) => ({
            ...goal,
            buildingBlocks: goal.buildingBlocks.map((item) =>
                item.id === blockId ? { ...item, completed, completedAt: completed ? Date.now() : undefined } : item,
            ),
        }));
        onBlockCompletionChange(team.id, goalId, blockId, completed);
    };

    const inviteMember = async (candidateUsername?: string) => {
        const username = normalizeUsername(candidateUsername ?? memberUsername);
        if (!canManageWork || username.length < 3 || team.members.some((member) => member.username === username)) return;
        const actorUsername = viewer?.username ?? '';
        const synchronizedTeam = await saveRemoteTeam(team, actorUsername);
        const friend = friendSuggestions.find((candidate) => candidate.username === username);
        const invited =
            synchronizedTeam !== null &&
            (await inviteRemoteTeamMember(team.id, actorUsername, username, friend?.name ?? `@${username}`, friend?.avatar ?? ''));
        setMemberFeedback(
            invited
                ? t(`@${username} kullanıcısına davet gönderildi.`, `Invitation sent to @${username}.`)
                : t('Davet gönderilemedi.', 'The invitation could not be sent.'),
        );
        if (!invited) return;
        setInvitedUsernames((current) => (current.includes(username) ? current : [...current, username]));
        setMemberUsername('');
    };

    const addMember = (event: FormEvent) => {
        event.preventDefault();
        void inviteMember();
    };

    const removeMember = async (member: TeamMember) => {
        if (!viewer) return;
        const updatedTeam = await removeRemoteTeamMember(team.id, viewer.username, member.username);
        if (!updatedTeam) {
            setMemberFeedback(t('Üye çıkarılamadı.', 'The member could not be removed.'));
            return;
        }
        setMemberFeedback(t(`@${member.username} ekipten çıkarıldı.`, `@${member.username} was removed from the team.`));
        onUpdate(updatedTeam);
    };

    return (
        <main className="mx-auto max-w-6xl px-5 pt-24 pb-32 sm:px-8 sm:pt-28 sm:pb-16">
            <button
                type="button"
                onClick={onBack}
                className="mb-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[12px] font-semibold text-[#6e6e73] shadow-sm"
            >
                <ChevronLeft className="size-4" /> {t('Ekiplerim', 'My Teams')}
            </button>

            <section className="overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-[0_14px_48px_rgba(0,0,0,0.06)]">
                <div className="relative h-44 bg-[linear-gradient(135deg,#052f3a,#007c91,#63c7d1)] sm:h-52">
                    {team.avatar && <img src={team.avatar} alt="" className="size-full object-cover" />}
                    {canManageTeam && (
                        <label className="absolute top-4 right-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-black/45 px-4 text-[11px] font-semibold text-white backdrop-blur-xl">
                            <ImagePlus className="size-4" /> {t('Fotoğraf', 'Photo')}
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) => readTeamImage(event.target.files?.[0], (avatar) => onUpdate({ ...team, avatar }))}
                            />
                        </label>
                    )}
                </div>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                    <div>
                        {canManageTeam ? (
                            <input
                                value={team.name}
                                onChange={(event) => onUpdate({ ...team, name: event.target.value.slice(0, 80) })}
                                aria-label={t('Ekip adı', 'Team name')}
                                className="w-full max-w-xl border-0 bg-transparent p-0 text-[32px] font-semibold tracking-[-0.045em] outline-none sm:text-[42px]"
                            />
                        ) : (
                            <h1 className="text-[32px] font-semibold tracking-[-0.045em] sm:text-[42px]">{team.name}</h1>
                        )}
                        <p className="mt-1 text-[12px] text-[#8e8e93]">
                            {team.members.length} {t('üye', 'members')} · {team.goals.length} {t('ortak hedef', 'shared goals')}
                        </p>
                    </div>
                    {canManageWork && (
                        <button
                            type="button"
                            onClick={() => setShowGoalCreator((value) => !value)}
                            className="h-11 rounded-full bg-[#007aff] px-5 text-[13px] font-semibold text-white"
                        >
                            <Plus className="mr-1.5 inline size-4" /> {t('Ekip Hedefi Oluştur', 'Create Team Goal')}
                        </button>
                    )}
                    {canDeleteTeam && (
                        <button
                            type="button"
                            onClick={() => {
                                if (
                                    window.confirm(
                                        t(`“${team.name}” ekibini silmek istediğine emin misin?`, `Are you sure you want to delete “${team.name}”?`),
                                    )
                                ) {
                                    onDelete();
                                }
                            }}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff3b30]/10 px-5 text-[13px] font-semibold text-[#ff3b30]"
                        >
                            <Trash2 className="size-4" /> {t('Ekibi Sil', 'Delete Team')}
                        </button>
                    )}
                </div>
            </section>

            {showGoalCreator && (
                <TeamGoalCreator
                    t={t}
                    onCancel={() => setShowGoalCreator(false)}
                    onCreate={(goal) => {
                        onUpdate({ ...team, goals: [...team.goals, goal] });
                        setShowGoalCreator(false);
                    }}
                />
            )}

            <section className="mt-6 rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_12px_42px_rgba(0,0,0,0.05)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold text-[#5856d6]">{t('BENİM GÖREVLERİM', 'MY ASSIGNMENTS')}</p>
                        <h2 className="mt-1 text-[21px] font-semibold">{t('Sana Atanan Yapı Taşları', 'Building Blocks Assigned to You')}</h2>
                    </div>
                    <span className="rounded-full bg-[#5856d6]/10 px-3 py-1.5 text-[11px] font-semibold text-[#5856d6]">{assignedBlocks.length}</span>
                </div>
                <div className="mt-4 grid gap-2">
                    {assignedBlocks.map(({ goal, block }) => {
                        const planKey = teamPlanBlockKey(team.id, goal.id, block.id);
                        return (
                            <div key={planKey} className="flex flex-col gap-3 rounded-[18px] bg-[#f5f5f7] p-4 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={() => toggleBlock(goal.id, block.id)}
                                    className="grid size-7 shrink-0 place-items-center rounded-full border border-[#c7c7cc] text-transparent hover:border-[#007aff]"
                                >
                                    <Check className="size-4" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold">{block.title}</p>
                                    <p className="mt-0.5 truncate text-[10px] text-[#8e8e93]">{goal.title}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={plannedKeys.has(planKey)}
                                    onClick={() => onAddBlockToPlan(planInput(team, goal, block))}
                                    className="h-9 rounded-full bg-white px-4 text-[11px] font-semibold text-[#007aff] shadow-sm disabled:text-[#8e8e93]"
                                >
                                    {plannedKeys.has(planKey) ? t('Planda', 'Planned') : t('Bugüne Planla', 'Plan for Today')}
                                </button>
                            </div>
                        );
                    })}
                    {assignedBlocks.length === 0 && (
                        <p className="py-5 text-center text-[12px] text-[#8e8e93]">
                            {t('Bekleyen bir yapı taşın yok.', 'You have no pending building blocks.')}
                        </p>
                    )}
                </div>
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
                <TeamMembersCard
                    t={t}
                    team={team}
                    viewer={viewer}
                    canManageTeam={canManageTeam}
                    canManageMembers={canManageWork}
                    memberUsername={memberUsername}
                    memberFeedback={memberFeedback}
                    friendSuggestions={friendSuggestions}
                    invitedUsernames={invitedUsernames}
                    onMemberUsernameChange={setMemberUsername}
                    onAddMember={addMember}
                    onInviteFriend={(username) => void inviteMember(username)}
                    onRemoveMember={removeMember}
                    onUpdate={onUpdate}
                />
                <section className="space-y-4">
                    <div className="flex items-end justify-between px-1">
                        <div>
                            <p className="text-[11px] font-semibold text-[#007aff]">{t('ORTAK İLERLEME', 'SHARED PROGRESS')}</p>
                            <h2 className="mt-1 text-[24px] font-semibold">{t('Ekip Hedefleri', 'Team Goals')}</h2>
                        </div>
                        <span className="text-[12px] text-[#8e8e93]">{team.goals.length}</span>
                    </div>
                    {team.goals.map((goal) => (
                        <TeamGoalCard
                            key={goal.id}
                            t={t}
                            team={team}
                            goal={goal}
                            viewer={viewer}
                            canManageWork={canManageWork}
                            plannedKeys={plannedKeys}
                            onAssign={(blockId, assigneeId) =>
                                updateGoal(goal.id, (current) => ({
                                    ...current,
                                    buildingBlocks: current.buildingBlocks.map((block) => (block.id === blockId ? { ...block, assigneeId } : block)),
                                }))
                            }
                            onToggle={(blockId) => toggleBlock(goal.id, blockId)}
                            onAddBlockToPlan={onAddBlockToPlan}
                        />
                    ))}
                    {team.goals.length === 0 && (
                        <div className="rounded-[24px] border border-dashed border-black/[0.12] bg-white/60 px-5 py-10 text-center text-[12px] text-[#8e8e93]">
                            {t('Henüz ekip hedefi oluşturulmadı.', 'No team goal has been created yet.')}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function TeamMembersCard({
    t,
    team,
    viewer,
    canManageTeam,
    canManageMembers,
    memberUsername,
    memberFeedback,
    friendSuggestions,
    invitedUsernames,
    onMemberUsernameChange,
    onAddMember,
    onInviteFriend,
    onRemoveMember,
    onUpdate,
}: {
    t: Translate;
    team: TeamRecord;
    viewer?: TeamMember;
    canManageTeam: boolean;
    canManageMembers: boolean;
    memberUsername: string;
    memberFeedback: string;
    friendSuggestions: TeamFriendSuggestion[];
    invitedUsernames: string[];
    onMemberUsernameChange: (value: string) => void;
    onAddMember: (event: FormEvent) => void;
    onInviteFriend: (username: string) => void;
    onRemoveMember: (member: TeamMember) => void;
    onUpdate: (team: TeamRecord) => void;
}) {
    const query = normalizeUsername(memberUsername).toLocaleLowerCase('tr-TR');
    const availableFriends = friendSuggestions
        .filter(
            (friend) =>
                !team.members.some((member) => member.username === friend.username) &&
                (!query || `${friend.name} ${friend.username}`.toLocaleLowerCase('tr-TR').includes(query)),
        )
        .slice(0, 5);

    return (
        <section className="h-fit overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_12px_42px_rgba(0,0,0,0.05)]">
            <div className="border-b border-black/[0.055] px-5 py-5">
                <h2 className="text-[18px] font-semibold">{t('Ekip Üyeleri', 'Team Members')}</h2>
                <p className="mt-0.5 text-[11px] text-[#8e8e93]">{t('Roller ve görev yetkileri', 'Roles and task permissions')}</p>
            </div>
            {team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 border-b border-black/[0.045] px-5 py-4 last:border-0">
                    <MemberAvatar member={member} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{member.name}</p>
                        <p className="mt-0.5 truncate text-[10px] text-[#8e8e93]">@{member.username}</p>
                    </div>
                    {canManageTeam ? (
                        <select
                            value={member.role}
                            onChange={(event) => {
                                const role = event.target.value as TeamRole;
                                if (member.role === 'manager' && role !== 'manager') return;
                                onUpdate({
                                    ...team,
                                    members: team.members.map((item) => {
                                        if (role === 'manager' && item.role === 'manager') return { ...item, role: 'member' as const };
                                        return item.id === member.id ? { ...item, role } : item;
                                    }),
                                });
                            }}
                            className="h-9 max-w-[150px] rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3 text-[10px] font-semibold outline-none"
                        >
                            <option value="manager">{t('Yönetici', 'Manager')}</option>
                            <option value="assistant">{t('Yönetici Yardımcısı', 'Assistant Manager')}</option>
                            <option value="member">{t('Üye', 'Member')}</option>
                        </select>
                    ) : (
                        <span className="rounded-full bg-black/[0.045] px-3 py-1.5 text-[10px] font-semibold text-[#6e6e73]">
                            {roleLabel(member.role, t)}
                        </span>
                    )}
                    {canManageMembers &&
                        member.username !== viewer?.username &&
                        member.username !== team.creatorUsername &&
                        (viewer?.role === 'manager' || member.role === 'member') && (
                            <button
                                type="button"
                                onClick={() => onRemoveMember(member)}
                                className="grid size-8 shrink-0 place-items-center rounded-full text-[#ff3b30] transition hover:bg-[#ff3b30]/10"
                                aria-label={t('Üyeyi çıkar', 'Remove member')}
                            >
                                <X className="size-4" />
                            </button>
                        )}
                </div>
            ))}
            {canManageMembers && (
                <div className="border-t border-black/[0.055] bg-[#fbfbfd] p-4">
                    <form onSubmit={onAddMember} className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[12px] text-[#8e8e93]">@</span>
                            <input
                                value={memberUsername}
                                onChange={(event) => onMemberUsernameChange(event.target.value)}
                                className="h-10 w-full rounded-full border border-black/[0.08] bg-white pr-3 pl-7 text-[12px] outline-none focus:border-[#007aff]"
                                placeholder={t('Davet edilecek kullanıcı', 'User to invite')}
                            />
                        </div>
                        <button type="submit" className="grid size-10 place-items-center rounded-full bg-[#007aff] text-white">
                            <UserPlus className="size-4" />
                        </button>
                    </form>
                    {memberFeedback && <p className="mt-2 px-2 text-[10px] font-medium text-[#6e6e73]">{memberFeedback}</p>}
                    {availableFriends.length > 0 && (
                        <div className="mt-4 border-t border-black/[0.055] pt-4">
                            <p className="px-1 text-[10px] font-semibold tracking-[0.08em] text-[#8e8e93] uppercase">
                                {t('Arkadaşlarından öneriler', 'Suggestions from your friends')}
                            </p>
                            <div className="mt-2 space-y-2">
                                {availableFriends.map((friend) => {
                                    const invited = invitedUsernames.includes(friend.username);

                                    return (
                                        <div key={friend.username} className="flex items-center gap-3 rounded-[16px] bg-white p-2.5 shadow-sm">
                                            {friend.avatar ? (
                                                <img src={friend.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                                            ) : (
                                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#005b67,#52b8c4)] text-[11px] font-semibold text-white">
                                                    {(friend.name || friend.username).charAt(0).toLocaleUpperCase('tr-TR')}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[11px] font-semibold">{friend.name}</p>
                                                <p className="truncate text-[9px] text-[#8e8e93]">@{friend.username}</p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={invited}
                                                onClick={() => onInviteFriend(friend.username)}
                                                className="h-8 shrink-0 rounded-full bg-[#007aff]/10 px-3 text-[10px] font-semibold text-[#007aff] disabled:bg-black/[0.045] disabled:text-[#8e8e93]"
                                            >
                                                {invited ? t('Gönderildi', 'Sent') : t('Davet Et', 'Invite')}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function TeamGoalCreator({ t, onCancel, onCreate }: { t: Translate; onCancel: () => void; onCreate: (goal: TeamGoal) => void }) {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<TeamCategory>('work');
    const [gain, setGain] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState<TeamPriority>('important');
    const [blocks, setBlocks] = useState<Array<{ id: number; title: string }>>([{ id: 1, title: '' }]);
    const validBlocks = blocks.filter((block) => block.title.trim());
    const canContinue =
        step === 1
            ? title.trim()
            : step === 2
              ? category
              : step === 3
                ? gain.trim()
                : step === 4
                  ? validBlocks.length === blocks.length && blocks.length > 0
                  : step === 5
                    ? deadline
                    : priority;

    const continueFlow = () => {
        if (!canContinue) return;
        if (step < 6) {
            setStep((current) => current + 1);
            return;
        }
        const now = Date.now();
        onCreate({
            id: now,
            title: title.trim(),
            gain: gain.trim(),
            category,
            deadline,
            priority,
            buildingBlocks: validBlocks.map((block) => ({ ...block, title: block.title.trim(), completed: false })),
            createdAt: now,
        });
    };

    return (
        <section className="mt-6 rounded-[28px] border border-[#007aff]/15 bg-white p-5 shadow-[0_14px_48px_rgba(0,122,255,0.08)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold text-[#007aff]">{t(`ADIM ${step}/6`, `STEP ${step}/6`)}</p>
                    <h2 className="mt-1 text-[21px] font-semibold">{goalStepTitle(step, t)}</h2>
                </div>
                <button type="button" onClick={onCancel} className="grid size-9 place-items-center rounded-full bg-black/[0.045] text-[#6e6e73]">
                    <X className="size-4" />
                </button>
            </div>
            <div className="mt-5">
                {step === 1 && (
                    <input
                        autoFocus
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="h-12 w-full rounded-[16px] border border-black/[0.08] bg-[#fbfbfd] px-4 text-[14px] outline-none focus:border-[#007aff]"
                        placeholder={t('Hedef başlığı', 'Goal title')}
                    />
                )}
                {step === 2 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(['health', 'work', 'venture', 'skill', 'education', 'other'] as TeamCategory[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setCategory(value)}
                                className={`h-11 rounded-[14px] text-[12px] font-semibold ${category === value ? 'bg-[#007aff] text-white' : 'bg-[#f5f5f7] text-[#6e6e73]'}`}
                            >
                                {categoryLabel(value, t)}
                            </button>
                        ))}
                    </div>
                )}
                {step === 3 && (
                    <textarea
                        autoFocus
                        value={gain}
                        onChange={(event) => setGain(event.target.value)}
                        className="min-h-28 w-full rounded-[16px] border border-black/[0.08] bg-[#fbfbfd] p-4 text-[13px] outline-none focus:border-[#007aff]"
                        placeholder={t('Bu hedef sana ve ekibe ne kazandıracak?', 'What will this goal bring to you and the team?')}
                    />
                )}
                {step === 4 && (
                    <div className="space-y-2">
                        {blocks.map((block, index) => (
                            <div key={block.id} className="flex gap-2">
                                <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#f5f5f7] text-[12px] font-semibold text-[#8e8e93]">
                                    {index + 1}
                                </span>
                                <input
                                    autoFocus={index === 0}
                                    value={block.title}
                                    onChange={(event) =>
                                        setBlocks((current) =>
                                            current.map((item) => (item.id === block.id ? { ...item, title: event.target.value } : item)),
                                        )
                                    }
                                    className="h-11 min-w-0 flex-1 rounded-[14px] border border-black/[0.08] px-4 text-[13px] outline-none focus:border-[#007aff]"
                                    placeholder={t('Yapı taşı', 'Building block')}
                                />
                                {blocks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))}
                                        className="grid size-11 place-items-center rounded-[14px] bg-[#ff3b30]/8 text-[#ff3b30]"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                setBlocks((current) => [...current, { id: Math.max(0, ...current.map((block) => block.id)) + 1, title: '' }])
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#007aff]/10 px-4 text-[11px] font-semibold text-[#007aff]"
                        >
                            <Plus className="size-4" /> {t('Yapı taşı ekle', 'Add building block')}
                        </button>
                    </div>
                )}
                {step === 5 && (
                    <input
                        type="date"
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                        className="h-12 w-full rounded-[16px] border border-black/[0.08] bg-[#fbfbfd] px-4 text-[14px] outline-none focus:border-[#007aff]"
                    />
                )}
                {step === 6 && (
                    <div className="grid grid-cols-2 gap-2">
                        {(['urgent', 'very-important', 'important', 'has-time'] as TeamPriority[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setPriority(value)}
                                className={`h-12 rounded-[14px] text-[12px] font-semibold ${priority === value ? 'bg-[#007aff] text-white' : 'bg-[#f5f5f7] text-[#6e6e73]'}`}
                            >
                                {priorityLabel(value, t)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-between gap-3">
                <button
                    type="button"
                    onClick={() => (step === 1 ? onCancel() : setStep((current) => current - 1))}
                    className="h-11 rounded-full bg-[#f5f5f7] px-5 text-[12px] font-semibold text-[#6e6e73]"
                >
                    {t('Geri', 'Back')}
                </button>
                <button
                    type="button"
                    onClick={continueFlow}
                    disabled={!canContinue}
                    className="h-11 rounded-full bg-[#007aff] px-6 text-[12px] font-semibold text-white disabled:bg-[#d1d1d6]"
                >
                    {step === 6 ? t('Hedefi Oluştur', 'Create Goal') : t('Devam Et', 'Continue')}
                </button>
            </div>
        </section>
    );
}

function TeamGoalCard({
    t,
    team,
    goal,
    viewer,
    canManageWork,
    plannedKeys,
    onAssign,
    onToggle,
    onAddBlockToPlan,
}: {
    t: Translate;
    team: TeamRecord;
    goal: TeamGoal;
    viewer?: TeamMember;
    canManageWork: boolean;
    plannedKeys: Set<string>;
    onAssign: (blockId: number, assigneeId?: number) => void;
    onToggle: (blockId: number) => void;
    onAddBlockToPlan: (input: TeamPlanBlockInput) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const completedCount = goal.buildingBlocks.filter((block) => block.completed).length;
    const progress = goal.buildingBlocks.length ? Math.round((completedCount / goal.buildingBlocks.length) * 100) : 0;
    const shares = blockShares(goal.buildingBlocks.length);
    const memberShares = team.members
        .map((member) => ({
            member,
            share: goal.buildingBlocks.reduce((total, block, index) => total + (block.assigneeId === member.id ? shares[index] : 0), 0),
        }))
        .filter((item) => item.share > 0);

    return (
        <article className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => setExpanded((value) => !value)} className="w-full p-5 text-left sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#007aff]/10 text-[#007aff]">
                        <Target className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[18px] font-semibold">{goal.title}</h3>
                        <p className="mt-1 text-[11px] text-[#8e8e93]">
                            {completedCount}/{goal.buildingBlocks.length} {t('yapı taşı tamamlandı', 'building blocks completed')}
                        </p>
                    </div>
                    <span className="text-[20px] font-semibold text-[#007aff]">%{progress}</span>
                    <ChevronRight className={`mt-1 size-5 text-[#aeaeb2] transition ${expanded ? 'rotate-90' : ''}`} />
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.055]">
                    <div className="h-full rounded-full bg-[#007aff]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {memberShares.map(({ member, share }) => (
                        <span key={member.id} className="rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[10px] font-semibold">
                            @{member.username} <strong className="text-[#5856d6]">%{share}</strong>
                        </span>
                    ))}
                </div>
            </button>
            {expanded && (
                <div className="border-t border-black/[0.055]">
                    {goal.buildingBlocks.map((block, index) => {
                        const assignee = team.members.find((member) => member.id === block.assigneeId);
                        const canToggle = block.assigneeId === viewer?.id;
                        const planKey = teamPlanBlockKey(team.id, goal.id, block.id);
                        return (
                            <div
                                key={block.id}
                                className="flex flex-col gap-3 border-b border-black/[0.045] px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:px-6"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={!canToggle}
                                        onClick={() => onToggle(block.id)}
                                        className={`grid size-7 shrink-0 place-items-center rounded-full border ${block.completed ? 'border-[#34c759] bg-[#34c759] text-white' : 'border-[#c7c7cc] text-transparent'} disabled:opacity-50`}
                                    >
                                        <Check className="size-4" />
                                    </button>
                                    <div className="min-w-0">
                                        <p className={`truncate text-[13px] font-semibold ${block.completed ? 'text-[#8e8e93] line-through' : ''}`}>
                                            {block.title}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-[#8e8e93]">
                                            {assignee ? `@${assignee.username}` : t('Atama bekliyor', 'Waiting for assignment')} · %{shares[index]}
                                        </p>
                                    </div>
                                </div>
                                {canManageWork ? (
                                    <select
                                        value={block.assigneeId ?? ''}
                                        onChange={(event) => onAssign(block.id, event.target.value ? Number(event.target.value) : undefined)}
                                        className="h-9 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3 text-[10px] font-semibold outline-none"
                                    >
                                        <option value="">{t('Üye ata', 'Assign member')}</option>
                                        {team.members.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                @{member.username}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[10px] font-semibold">
                                        {assignee ? `@${assignee.username}` : '—'}
                                    </span>
                                )}{' '}
                                {(block.assigneeId === viewer?.id || canManageWork) && (
                                    <button
                                        type="button"
                                        disabled={plannedKeys.has(planKey)}
                                        onClick={() => onAddBlockToPlan(planInput(team, goal, block))}
                                        className="h-9 rounded-full bg-[#007aff]/10 px-3 text-[10px] font-semibold text-[#007aff] disabled:bg-black/[0.04] disabled:text-[#8e8e93]"
                                    >
                                        {plannedKeys.has(planKey) ? t('Planda', 'Planned') : t('Planla', 'Plan')}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
}

function MemberAvatar({ member }: { member: TeamMember }) {
    return member.avatar ? (
        <img src={member.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
    ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff] text-[12px] font-semibold text-white">
            {(member.name || member.username).charAt(0).toLocaleUpperCase()}
        </span>
    );
}

function planInput(team: TeamRecord, goal: TeamGoal, block: TeamBuildingBlock): TeamPlanBlockInput {
    return {
        teamId: team.id,
        teamName: team.name,
        goalId: goal.id,
        goalTitle: goal.title,
        blockId: block.id,
        blockTitle: block.title,
        priority: goal.priority,
    };
}

function blockShares(count: number): number[] {
    if (count <= 0) return [];
    const base = Math.floor(100 / count);
    const remainder = 100 % count;
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function goalStepTitle(step: number, t: Translate): string {
    return [
        t('Hedef nedir?', 'What is the goal?'),
        t('Kategori seç', 'Choose a category'),
        t('Kazanımın ne?', 'What is the gain?'),
        t('Yapı taşlarını belirle', 'Define building blocks'),
        t('Bitiş tarihini seç', 'Choose a deadline'),
        t('Önceliği belirle', 'Set priority'),
    ][step - 1];
}

function categoryLabel(category: TeamCategory, t: Translate): string {
    return {
        health: t('Sağlık & Spor', 'Health & Sports'),
        work: t('İş', 'Work'),
        venture: t('Girişim', 'Venture'),
        skill: t('Yetenek', 'Skill'),
        education: t('Eğitim', 'Education'),
        other: t('Diğer', 'Other'),
    }[category];
}

function priorityLabel(priority: TeamPriority, t: Translate): string {
    return {
        urgent: t('Acil', 'Urgent'),
        'very-important': t('Çok Önemli', 'Very Important'),
        important: t('Önemli', 'Important'),
        'has-time': t('Zaman Var', 'Has Time'),
    }[priority];
}

function roleLabel(role: TeamRole, t: Translate): string {
    return { manager: t('Yönetici', 'Manager'), assistant: t('Yönetici Yardımcısı', 'Assistant Manager'), member: t('Üye', 'Member') }[role];
}

function normalizeUsername(value: string): string {
    return value
        .trim()
        .replace(/^@+/, '')
        .replace(/\s+/g, '')
        .replace(/[^\p{L}\p{N}._]/gu, '')
        .slice(0, 30)
        .toLocaleLowerCase('tr-TR');
}

function createInviteCode(name: string): string {
    const prefix =
        normalizeUsername(name)
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 6)
            .toLocaleUpperCase('en-US') || 'EKIP';
    return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function readTeamImage(file: File | undefined, onLoad: (source: string) => void): void {
    if (!file || !file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.readAsDataURL(file);
}

function demoRequestHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
    };
}

async function fetchRemoteTeams(username: string): Promise<TeamRecord[] | null> {
    try {
        const response = await fetch(`/demo/team-workspaces?username=${encodeURIComponent(username)}`, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) return null;
        const result = (await response.json()) as { teams?: TeamRecord[] };
        return Array.isArray(result.teams) ? result.teams : [];
    } catch {
        return null;
    }
}

async function saveRemoteTeam(team: TeamRecord, username: string): Promise<TeamRecord | null> {
    try {
        const response = await fetch('/demo/team-workspaces', {
            method: 'POST',
            credentials: 'same-origin',
            headers: demoRequestHeaders(),
            body: JSON.stringify({ username, team }),
        });
        if (!response.ok) return null;
        const result = (await response.json()) as { team?: TeamRecord };
        return result.team ?? null;
    } catch {
        return null;
    }
}

async function inviteRemoteTeamMember(
    teamId: number,
    username: string,
    invitedUsername: string,
    invitedName: string,
    invitedAvatar: string,
): Promise<boolean> {
    try {
        const response = await fetch(`/demo/team-workspaces/${teamId}/invitations`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: demoRequestHeaders(),
            body: JSON.stringify({ username, invitedUsername, invitedName, invitedAvatar }),
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function removeRemoteTeamMember(teamId: number, username: string, memberUsername: string): Promise<TeamRecord | null> {
    try {
        const response = await fetch(`/demo/team-workspaces/${teamId}/members/${encodeURIComponent(memberUsername)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: demoRequestHeaders(),
            body: JSON.stringify({ username }),
        });
        if (!response.ok) return null;
        const result = (await response.json()) as { team?: TeamRecord };
        return result.team ?? null;
    } catch {
        return null;
    }
}

async function deleteRemoteTeam(teamId: number, username: string): Promise<void> {
    try {
        await fetch(`/demo/team-workspaces/${teamId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: demoRequestHeaders(),
            body: JSON.stringify({ username }),
        });
    } catch {
        // Local deletion remains available if the demo server is offline.
    }
}

function storeWorkspace(workspace: TeamWorkspaceData): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(TEAM_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    } catch {
        // The demo remains usable when local storage is unavailable.
    }
}

function loadTeamWorkspace(profile: TeamProfile): TeamWorkspaceData {
    const empty: TeamWorkspaceData = { teams: [] };
    if (typeof window === 'undefined') return empty;
    try {
        const stored = JSON.parse(window.localStorage.getItem(TEAM_WORKSPACE_STORAGE_KEY) ?? 'null') as TeamWorkspaceData | null;
        if (stored && Array.isArray(stored.teams)) {
            return {
                teams: stored.teams.map((team) => ({
                    ...team,
                    creatorUsername:
                        typeof team.creatorUsername === 'string' && team.creatorUsername
                            ? team.creatorUsername
                            : (team.members.find((member) => member.role === 'manager')?.username ?? ''),
                })),
            };
        }

        const legacy = JSON.parse(window.localStorage.getItem(LEGACY_TEAM_STORAGE_KEY) ?? 'null') as {
            members?: TeamMember[];
            goals?: Array<{
                id: number;
                title: string;
                tasks?: Array<{ id: number; title: string; assigneeId: number; completed: boolean; completedAt?: number }>;
                createdAt?: number;
            }>;
        } | null;
        if (!legacy || !Array.isArray(legacy.members)) return empty;
        const now = Date.now();
        return {
            teams: [
                {
                    id: now,
                    name: 'Ekip Modu',
                    avatar: '',
                    inviteCode: 'EKIP-001',
                    creatorUsername: legacy.members.find((member) => member.role === 'manager')?.username ?? '',
                    members: legacy.members.map((member) => ({
                        ...member,
                        avatar: member.username === normalizeUsername(profile.username) ? profile.avatar : member.avatar,
                    })),
                    goals: (legacy.goals ?? []).map((goal) => ({
                        id: goal.id,
                        title: goal.title,
                        gain: '',
                        category: 'work',
                        deadline: '',
                        priority: 'important',
                        buildingBlocks: (goal.tasks ?? []).map((task) => ({ ...task })),
                        createdAt: goal.createdAt ?? now,
                    })),
                    createdAt: now,
                },
            ],
        };
    } catch {
        return empty;
    }
}
