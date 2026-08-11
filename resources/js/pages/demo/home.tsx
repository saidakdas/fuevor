import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { Head } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    GripVertical,
    Layers3,
    ListTodo,
    LockKeyhole,
    Mail,
    Phone,
    Plus,
    Target,
    Trash2,
    TrendingUp,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type Priority = 'urgent' | 'very-important' | 'important' | 'has-time';

type BuildingBlock = {
    completed?: boolean;
    id: number;
    title: string;
};

type GoalRecord = {
    id: number;
    title: string;
    gain: string;
    buildingBlocks: BuildingBlock[];
    deadline: string;
    priority: Priority;
    createdAt: number;
};

type PanelSection = 'overview' | 'goals' | 'plan' | 'profile';
type PlanRange = 'today' | 'tomorrow' | 'week' | 'month' | 'year';

type PlanItem = {
    id: number;
    title: string;
    range: PlanRange;
    source: 'goal' | 'independent';
    goalId?: number;
    buildingBlockId?: number;
    completed: boolean;
    createdAt: number;
};

type ProfileData = {
    name: string;
    email: string;
    phone: string;
};

const TOTAL_STEPS = 6;
const DEMO_GOALS_STORAGE_KEY = 'fuevor.demo.goals';
const DEMO_PLAN_STORAGE_KEY = 'fuevor.demo.plan-items';
const DEMO_PROFILE_STORAGE_KEY = 'fuevor.demo.profile';

export default function DemoHome() {
    const { locale, t } = useLocale();
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('');
    const [gain, setGain] = useState('');
    const [buildingBlocks, setBuildingBlocks] = useState<BuildingBlock[]>([{ id: 1, title: '' }]);
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState<Priority | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [goals, setGoals] = useState<GoalRecord[]>(loadStoredGoals);
    const [showPanel, setShowPanel] = useState(() => loadStoredGoals().length > 0);
    const [panelSection, setPanelSection] = useState<PanelSection>('overview');
    const [planItems, setPlanItems] = useState<PlanItem[]>(loadStoredPlanItems);
    const [planRange, setPlanRange] = useState<PlanRange>('today');
    const [profile, setProfile] = useState<ProfileData>(loadStoredProfile);
    const nextBlockId = useRef(2);
    const nextPlanItemId = useRef(Math.max(0, ...planItems.map((item) => item.id)) + 1);

    useEffect(() => {
        storeDemoData(DEMO_GOALS_STORAGE_KEY, goals);
    }, [goals]);

    useEffect(() => {
        storeDemoData(DEMO_PLAN_STORAGE_KEY, planItems);
    }, [planItems]);

    useEffect(() => {
        storeDemoData(DEMO_PROFILE_STORAGE_KEY, profile);
    }, [profile]);

    const completed = step > TOTAL_STEPS;
    const progress = completed ? 100 : ((step - 1) / TOTAL_STEPS) * 100;
    const validBlocks = useMemo(() => buildingBlocks.filter((block) => block.title.trim() !== ''), [buildingBlocks]);

    const canContinue = useMemo(() => {
        if (step === 1) return goal.trim() !== '';
        if (step === 2) return gain.trim() !== '';
        if (step === 3 || step === 4) return validBlocks.length > 0 && validBlocks.length === buildingBlocks.length;
        if (step === 5) return deadline !== '';
        if (step === 6) return priority !== null;

        return false;
    }, [buildingBlocks.length, deadline, gain, goal, priority, step, validBlocks.length]);

    const continueFlow = () => {
        if (!canContinue) return;

        if (step === 3) {
            setBuildingBlocks(validBlocks);
        }

        if (step === TOTAL_STEPS && priority) {
            setGoals((currentGoals) => [
                ...currentGoals,
                {
                    id: Date.now(),
                    title: goal.trim(),
                    gain: gain.trim(),
                    buildingBlocks: buildingBlocks.map((block) => ({ ...block, completed: false })),
                    deadline,
                    priority,
                    createdAt: Date.now(),
                },
            ]);
        }

        setStep((current) => current + 1);
    };

    const submitCurrentStep = (event: FormEvent) => {
        event.preventDefault();
        continueFlow();
    };

    const updateBuildingBlock = (id: number, title: string) => {
        setBuildingBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, title } : block)));
    };

    const addBuildingBlock = () => {
        const id = nextBlockId.current++;
        setBuildingBlocks((blocks) => [...blocks, { id, title: '' }]);

        window.requestAnimationFrame(() => {
            document.getElementById(`building-block-${id}`)?.focus();
        });
    };

    const removeBuildingBlock = (id: number) => {
        setBuildingBlocks((blocks) => (blocks.length === 1 ? blocks : blocks.filter((block) => block.id !== id)));
    };

    const moveBuildingBlock = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= buildingBlocks.length || fromIndex === toIndex) return;

        setBuildingBlocks((blocks) => {
            const reordered = [...blocks];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);

            return reordered;
        });
    };

    const moveDraggedBlockBefore = (targetId: number) => {
        if (draggedId === null || draggedId === targetId) return;

        const fromIndex = buildingBlocks.findIndex((block) => block.id === draggedId);
        const toIndex = buildingBlocks.findIndex((block) => block.id === targetId);
        moveBuildingBlock(fromIndex, toIndex);
    };

    const startNewGoal = () => {
        setGoal('');
        setGain('');
        setBuildingBlocks([{ id: 1, title: '' }]);
        setDeadline('');
        setPriority(null);
        setDraggedId(null);
        setStep(1);
        setShowPanel(false);
        nextBlockId.current = 2;
    };

    const addPlanItem = (item: Omit<PlanItem, 'id' | 'completed' | 'createdAt'>) => {
        setPlanItems((currentItems) => [
            ...currentItems,
            {
                ...item,
                id: nextPlanItemId.current++,
                completed: false,
                createdAt: Date.now(),
            },
        ]);
    };

    const togglePlanItem = (itemId: number) => {
        const item = planItems.find((planItem) => planItem.id === itemId);
        if (!item) return;

        const completed = !item.completed;
        setPlanItems((currentItems) => currentItems.map((planItem) => (planItem.id === itemId ? { ...planItem, completed } : planItem)));

        if (item.source === 'goal' && item.goalId !== undefined && item.buildingBlockId !== undefined) {
            setGoals((currentGoals) =>
                currentGoals.map((currentGoal) =>
                    currentGoal.id === item.goalId
                        ? {
                              ...currentGoal,
                              buildingBlocks: currentGoal.buildingBlocks.map((block) =>
                                  block.id === item.buildingBlockId ? { ...block, completed } : block,
                              ),
                          }
                        : currentGoal,
                ),
            );
        }
    };

    const removePlanItem = (itemId: number) => {
        setPlanItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    };

    if (showPanel) {
        if (panelSection === 'profile') {
            return <ProfilePanel t={t} profile={profile} onNavigate={setPanelSection} onSave={setProfile} />;
        }

        if (panelSection === 'overview') {
            return (
                <OverviewPanel
                    t={t}
                    locale={locale}
                    goals={goals}
                    items={planItems}
                    range={planRange}
                    onNavigate={setPanelSection}
                    onCreateGoal={startNewGoal}
                    onRangeChange={setPlanRange}
                    onToggleItem={togglePlanItem}
                />
            );
        }

        if (panelSection === 'plan') {
            return (
                <PlanPanel
                    t={t}
                    locale={locale}
                    goals={goals}
                    items={planItems}
                    range={planRange}
                    onNavigate={setPanelSection}
                    onRangeChange={setPlanRange}
                    onAddItem={addPlanItem}
                    onToggleItem={togglePlanItem}
                    onRemoveItem={removePlanItem}
                />
            );
        }

        return <GoalsPanel t={t} locale={locale} goals={goals} onCreateGoal={startNewGoal} onNavigate={setPanelSection} />;
    }

    return (
        <>
            <Head title={t('İlk Hedefin', 'Your First Goal')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <header className="fixed inset-x-0 top-0 z-30 border-b border-black/[0.055] bg-[#f5f5f7]/80 backdrop-blur-2xl">
                    <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
                        <BrandLogo variant="color" className="h-9 w-28 sm:w-32" />
                        {!completed && (
                            <p className="text-[13px] font-medium tracking-[-0.01em] text-[#6e6e73]">
                                {step} / {TOTAL_STEPS}
                            </p>
                        )}
                    </div>
                    <div className="h-0.5 bg-black/[0.035]">
                        <div className="h-full bg-[#007aff] transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </header>

                <main className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center px-5 pt-28 pb-32 sm:px-8 sm:pt-32">
                    <div className="w-full max-w-[680px]">
                        {completed ? (
                            <CompletionScreen t={t} goal={goal} blocks={buildingBlocks} onOpenPanel={() => setShowPanel(true)} />
                        ) : (
                            <form onSubmit={submitCurrentStep}>
                                <div key={step} className="demo-step-enter">
                                    {step === 1 && <GoalStep t={t} value={goal} onChange={setGoal} />}
                                    {step === 2 && <GainStep t={t} value={gain} onChange={setGain} />}
                                    {step === 3 && (
                                        <BuildingBlocksStep
                                            t={t}
                                            blocks={buildingBlocks}
                                            onAdd={addBuildingBlock}
                                            onChange={updateBuildingBlock}
                                            onRemove={removeBuildingBlock}
                                        />
                                    )}
                                    {step === 4 && (
                                        <OrderingStep
                                            t={t}
                                            blocks={buildingBlocks}
                                            draggedId={draggedId}
                                            onDragStart={setDraggedId}
                                            onDragOver={moveDraggedBlockBefore}
                                            onDragEnd={() => setDraggedId(null)}
                                            onMove={moveBuildingBlock}
                                        />
                                    )}
                                    {step === 5 && <DeadlineStep t={t} locale={locale} value={deadline} onChange={setDeadline} />}
                                    {step === 6 && <PriorityStep t={t} value={priority} onChange={setPriority} />}
                                </div>

                                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/[0.055] bg-[#f5f5f7]/80 px-5 py-4 backdrop-blur-2xl sm:px-8">
                                    <div className="mx-auto flex max-w-[680px] items-center justify-between gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep((current) => Math.max(1, current - 1))}
                                            className={`inline-flex h-12 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-[#3a3a3c] transition hover:bg-black/[0.045] ${step === 1 ? 'pointer-events-none invisible' : ''}`}
                                        >
                                            <ArrowLeft className="size-[18px]" />
                                            {t('Geri', 'Back')}
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={!canContinue}
                                            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.22)] transition hover:bg-[#006ee6] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#d1d1d6] disabled:shadow-none"
                                        >
                                            {step === TOTAL_STEPS ? t('Tamamla', 'Finish') : t('Devam', 'Continue')}
                                            {step === TOTAL_STEPS ? <Check className="size-[18px]" /> : <ArrowRight className="size-[18px]" />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

function OverviewPanel({
    t,
    locale,
    goals,
    items,
    range,
    onNavigate,
    onCreateGoal,
    onRangeChange,
    onToggleItem,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    onNavigate: (section: PanelSection) => void;
    onCreateGoal: () => void;
    onRangeChange: (range: PlanRange) => void;
    onToggleItem: (id: number) => void;
}) {
    const periodItems = useMemo(
        () => items.filter((item) => item.range === range).sort((first, second) => first.createdAt - second.createdAt),
        [items, range],
    );
    const priorityGoals = useMemo(
        () =>
            [...goals]
                .filter((goalRecord) => goalRecord.priority === 'urgent' || goalRecord.priority === 'very-important')
                .sort((first, second) => PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt)
                .slice(0, 3),
        [goals],
    );
    const upcomingGoals = useMemo(() => [...goals].sort((first, second) => first.deadline.localeCompare(second.deadline)).slice(0, 3), [goals]);
    const overallProgress =
        goals.length === 0 ? 0 : Math.round(goals.reduce((total, goalRecord) => total + calculateGoalProgress(goalRecord), 0) / goals.length);
    const periodCompleted = periodItems.filter((item) => item.completed).length;
    const periodProgress = periodItems.length === 0 ? 0 : Math.round((periodCompleted / periodItems.length) * 100);
    const rangeOptions: Array<{ value: PlanRange; label: string }> = [
        { value: 'today', label: t('Bugün', 'Today') },
        { value: 'tomorrow', label: t('Yarın', 'Tomorrow') },
        { value: 'week', label: t('Hafta', 'Week') },
        { value: 'month', label: t('Ay', 'Month') },
        { value: 'year', label: t('Yıl', 'Year') },
    ];

    return (
        <>
            <Head title={t('Genel Bakış', 'Overview')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="overview" onNavigate={onNavigate} />

                <main className="mx-auto max-w-5xl px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff] capitalize">{formatPlanPeriod(range, locale)}</p>
                            <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                                {t('Genel Bakış', 'Overview')}
                            </h1>
                            <p className="mt-4 text-[15px] text-[#6e6e73]">
                                {t(
                                    'Seçtiğin dönemin planını ve ilerlemeni tek bakışta gör.',
                                    'See the plan and progress for your selected period at a glance.',
                                )}
                            </p>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => onNavigate('plan')}
                                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.07] bg-white px-5 text-[14px] font-semibold text-[#1d1d1f] shadow-[0_5px_18px_rgba(0,0,0,0.04)] transition hover:bg-[#fbfbfd] active:scale-[0.98] sm:flex-none"
                            >
                                <ListTodo className="size-[17px] text-[#007aff]" />
                                {t('Plan Ekle', 'Add Plan')}
                            </button>
                            <button
                                type="button"
                                onClick={onCreateGoal}
                                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#007aff] px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition hover:bg-[#006ee6] active:scale-[0.98] sm:flex-none"
                            >
                                <Plus className="size-[17px]" strokeWidth={2.5} />
                                {t('Hedef Ekle', 'Add Goal')}
                            </button>
                        </div>
                    </div>

                    <div className="mt-9 overflow-x-auto pb-1">
                        <div className="flex min-w-max items-center rounded-full bg-black/[0.045] p-1">
                            {rangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onRangeChange(option.value)}
                                    className={`min-w-24 rounded-full px-5 py-2.5 text-[14px] font-medium transition ${range === option.value ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label={t('Özet bilgiler', 'Summary information')}>
                        <OverviewStat
                            icon={TrendingUp}
                            label={t('Genel ilerleme', 'Overall progress')}
                            value={`%${overallProgress}`}
                            color="bg-[#007aff]/10 text-[#007aff]"
                        />
                        <OverviewStat
                            icon={Target}
                            label={t('Aktif hedef', 'Active goals')}
                            value={String(goals.length)}
                            color="bg-[#af52de]/10 text-[#af52de]"
                        />
                        <OverviewStat
                            icon={CircleCheck}
                            label={planRangeLabel(range, t)}
                            value={periodItems.length === 0 ? '—' : `${periodCompleted}/${periodItems.length}`}
                            color="bg-[#34c759]/10 text-[#28a745]"
                        />
                    </section>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                            <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 sm:px-6">
                                <div>
                                    <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{planRangeLabel(range, t)}</h2>
                                    <p className="mt-1 text-[12px] text-[#8e8e93]">
                                        {periodItems.length === 0
                                            ? t('Henüz plan eklenmedi', 'No plans added yet')
                                            : t(
                                                  `${periodCompleted} / ${periodItems.length} tamamlandı`,
                                                  `${periodCompleted} of ${periodItems.length} completed`,
                                              )}
                                    </p>
                                </div>
                                <span className="text-[14px] font-semibold text-[#007aff] tabular-nums">%{periodProgress}</span>
                            </div>

                            {periodItems.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <span className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[#f2f2f7] text-[#8e8e93]">
                                        <ListTodo className="size-5" />
                                    </span>
                                    <p className="mt-4 text-[14px] font-medium text-[#6e6e73]">
                                        {t('Bu dönem için ilk planını ekle.', 'Add your first plan for this period.')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('plan')}
                                        className="mt-3 text-[13px] font-semibold text-[#007aff] hover:underline"
                                    >
                                        {t('Planla', 'Plan')}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {periodItems.map((item, index) => {
                                        const sourceGoal = goals.find((goalRecord) => goalRecord.id === item.goalId);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleItem(item.id)}
                                                    className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${item.completed ? 'border-[#34c759] bg-[#34c759] text-white' : 'border-[#c7c7cc] text-transparent hover:border-[#007aff]'}`}
                                                    aria-label={
                                                        item.completed
                                                            ? t('Tamamlanmadı olarak işaretle', 'Mark incomplete')
                                                            : t('Tamamlandı olarak işaretle', 'Mark complete')
                                                    }
                                                >
                                                    <Check className="size-4" strokeWidth={3} />
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-[15px] font-medium ${item.completed ? 'text-[#8e8e93] line-through' : ''}`}
                                                    >
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 truncate text-[11px] text-[#8e8e93]">
                                                        {sourceGoal?.title ?? t('Bağımsız plan', 'Independent plan')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <div className="space-y-5">
                            <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                                <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5">
                                    <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Öncelikli Hedefler', 'Priority Goals')}</h2>
                                    <button type="button" onClick={() => onNavigate('goals')} className="text-[12px] font-semibold text-[#007aff]">
                                        {t('Tümü', 'All')}
                                    </button>
                                </div>
                                {priorityGoals.length === 0 ? (
                                    <p className="px-5 py-8 text-center text-[13px] leading-5 text-[#8e8e93]">
                                        {t('Acil veya çok önemli hedefin yok.', 'You have no urgent or very important goals.')}
                                    </p>
                                ) : (
                                    priorityGoals.map((goalRecord, index) => {
                                        const style = PRIORITY_STYLES[goalRecord.priority];
                                        const progress = calculateGoalProgress(goalRecord);

                                        return (
                                            <div
                                                key={goalRecord.id}
                                                className={`flex items-center gap-3 px-5 py-4 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                            >
                                                <span className={`size-2.5 shrink-0 rounded-full ${style.dot}`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[14px] font-semibold">{goalRecord.title}</p>
                                                    <p className={`mt-1 text-[10px] font-semibold ${style.text}`}>
                                                        {priorityLabel(goalRecord.priority, t)}
                                                    </p>
                                                </div>
                                                <span className="text-[12px] font-semibold text-[#6e6e73] tabular-nums">%{progress}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </section>

                            <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                                <div className="border-b border-black/[0.055] px-5 py-5">
                                    <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Yaklaşan Tarihler', 'Upcoming Dates')}</h2>
                                </div>
                                {upcomingGoals.map((goalRecord, index) => (
                                    <div
                                        key={goalRecord.id}
                                        className={`flex items-center gap-3 px-5 py-4 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                    >
                                        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#f2f2f7] text-[#6e6e73]">
                                            <CalendarDays className="size-4" />
                                        </span>
                                        <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{goalRecord.title}</p>
                                        <span className="text-[11px] font-medium whitespace-nowrap text-[#8e8e93]">
                                            {formatGoalDate(goalRecord.deadline, locale)}
                                        </span>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

function OverviewStat({ icon: Icon, label, value, color }: { icon: typeof Target; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-4 rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] ${color}`}>
                <Icon className="size-5" />
            </span>
            <div className="min-w-0">
                <p className="text-[22px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
                <p className="mt-1.5 truncate text-[11px] font-medium text-[#8e8e93]">{label}</p>
            </div>
        </div>
    );
}

function GoalsPanel({
    t,
    locale,
    goals,
    onCreateGoal,
    onNavigate,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    goals: GoalRecord[];
    onCreateGoal: () => void;
    onNavigate: (section: PanelSection) => void;
}) {
    const sortedGoals = useMemo(
        () =>
            [...goals].sort((first, second) => PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt),
        [goals],
    );

    return (
        <>
            <Head title={t('Hedeflerim', 'My Goals')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="goals" onNavigate={onNavigate} />

                <main className="mx-auto max-w-5xl px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff]">{t('Genel bakış', 'Overview')}</p>
                            <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                                {t('Hedeflerim', 'My Goals')}
                            </h1>
                            <p className="mt-4 text-[15px] text-[#6e6e73]">
                                {t('Hedeflerin öncelik sırasına göre listeleniyor.', 'Your goals are listed by priority.')}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onCreateGoal}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition hover:bg-[#006ee6] active:scale-[0.98] sm:w-auto"
                        >
                            <Plus className="size-[18px]" strokeWidth={2.5} />
                            {t('Yeni Hedef', 'New Goal')}
                        </button>
                    </div>

                    <section
                        className="mt-10 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                        aria-label={t('Hedef listesi', 'Goal list')}
                    >
                        {sortedGoals.map((item, index) => {
                            const priorityStyle = PRIORITY_STYLES[item.priority];
                            const goalProgress = calculateGoalProgress(item);

                            return (
                                <article
                                    key={item.id}
                                    className={`group grid gap-5 px-5 py-6 transition hover:bg-black/[0.018] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`size-2.5 shrink-0 rounded-full ${priorityStyle.dot}`} />
                                            <span className={`text-[12px] font-semibold ${priorityStyle.text}`}>
                                                {priorityLabel(item.priority, t)}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 truncate text-[21px] font-semibold tracking-[-0.025em] sm:text-[23px]">{item.title}</h2>
                                        <p className="mt-1.5 line-clamp-1 text-[14px] leading-6 text-[#6e6e73]">{item.gain}</p>

                                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-[#8e8e93]">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Layers3 className="size-3.5" />
                                                {t(`${item.buildingBlocks.length} yapı taşı`, `${item.buildingBlocks.length} building blocks`)}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarDays className="size-3.5" />
                                                {formatGoalDate(item.deadline, locale)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                                        <span className="text-[12px] font-medium text-[#8e8e93] sm:hidden">{t('İlerleme', 'Progress')}</span>
                                        <div
                                            className="relative grid size-16 place-items-center rounded-full before:absolute before:inset-1.5 before:rounded-full before:bg-white"
                                            style={{ background: `conic-gradient(#007aff ${goalProgress}%, #e5e5ea 0)` }}
                                        >
                                            <span className="relative text-[13px] font-semibold tabular-nums">%{goalProgress}</span>
                                        </div>
                                        <ArrowRight className="hidden size-[18px] text-[#c7c7cc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8e8e93] sm:block" />
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                </main>
            </div>
        </>
    );
}

function PanelHeader({ t, active, onNavigate }: { t: Translate; active: PanelSection; onNavigate: (section: PanelSection) => void }) {
    return (
        <header className="fixed inset-x-0 top-0 z-30 border-b border-black/[0.055] bg-[#f5f5f7]/80 backdrop-blur-2xl">
            <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-center gap-4 px-5 sm:justify-between sm:px-8">
                <BrandLogo variant="color" className="hidden h-9 w-32 sm:inline-grid" />
                <nav className="flex items-center rounded-full bg-black/[0.045] p-1" aria-label={t('Panel bölümleri', 'Panel sections')}>
                    <button
                        type="button"
                        onClick={() => onNavigate('overview')}
                        className={`rounded-full px-3 py-2 text-[13px] font-medium transition sm:px-4 ${active === 'overview' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    >
                        {t('Genel Bakış', 'Overview')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigate('goals')}
                        className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition sm:px-5 ${active === 'goals' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    >
                        {t('Hedefler', 'Goals')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigate('plan')}
                        className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition sm:px-5 ${active === 'plan' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    >
                        {t('Planla', 'Plan')}
                    </button>
                </nav>
                <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className={`grid size-10 shrink-0 place-items-center rounded-full border transition ${active === 'profile' ? 'border-[#007aff] bg-[#007aff] text-white shadow-[0_5px_18px_rgba(0,122,255,0.2)]' : 'border-black/[0.07] bg-white text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    aria-label={t('Profili aç', 'Open profile')}
                >
                    <UserRound className="size-[18px]" />
                </button>
            </div>
        </header>
    );
}

function ProfilePanel({
    t,
    profile,
    onNavigate,
    onSave,
}: {
    t: Translate;
    profile: ProfileData;
    onNavigate: (section: PanelSection) => void;
    onSave: (profile: ProfileData) => void;
}) {
    const [tab, setTab] = useState<'personal' | 'security'>('personal');
    const [draft, setDraft] = useState(profile);
    const [saved, setSaved] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<'success' | 'mismatch' | null>(null);
    const profileInitial = draft.name.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'K';

    const savePersonalInformation = (event: FormEvent) => {
        event.preventDefault();
        onSave({
            name: draft.name.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
        });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
    };

    const updatePassword = (event: FormEvent) => {
        event.preventDefault();

        if (newPassword !== passwordConfirmation) {
            setPasswordMessage('mismatch');
            return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setPasswordConfirmation('');
        setPasswordMessage('success');
        window.setTimeout(() => setPasswordMessage(null), 2200);
    };

    return (
        <>
            <Head title={t('Profil', 'Profile')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="profile" onNavigate={onNavigate} />

                <main className="mx-auto max-w-4xl px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
                    <div>
                        <p className="text-[13px] font-semibold text-[#007aff]">{t('Hesabın', 'Your account')}</p>
                        <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                            {t('Profil', 'Profile')}
                        </h1>
                        <p className="mt-4 text-[15px] text-[#6e6e73]">
                            {t('Bilgilerini ve hesap güvenliğini yönet.', 'Manage your information and account security.')}
                        </p>
                    </div>

                    <div className="mt-9 flex w-full items-center rounded-full bg-black/[0.045] p-1 sm:w-fit">
                        <button
                            type="button"
                            onClick={() => setTab('personal')}
                            className={`flex-1 rounded-full px-5 py-2.5 text-[14px] font-medium whitespace-nowrap transition sm:flex-none ${tab === 'personal' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'}`}
                        >
                            {t('Kişisel Bilgiler', 'Personal Information')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('security')}
                            className={`flex-1 rounded-full px-5 py-2.5 text-[14px] font-medium whitespace-nowrap transition sm:flex-none ${tab === 'security' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'}`}
                        >
                            {t('Güvenlik', 'Security')}
                        </button>
                    </div>

                    {tab === 'personal' ? (
                        <form
                            onSubmit={savePersonalInformation}
                            className="demo-step-enter mt-6 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                        >
                            <div className="flex items-center gap-4 border-b border-black/[0.055] px-5 py-6 sm:px-7">
                                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#007aff] text-[24px] font-semibold text-white shadow-[0_7px_20px_rgba(0,122,255,0.2)]">
                                    {profileInitial}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em]">
                                        {draft.name || t('Ad Soyad', 'Full Name')}
                                    </h2>
                                    <p className="mt-1 truncate text-[13px] text-[#8e8e93]">{draft.email || t('E-posta adresi', 'Email address')}</p>
                                </div>
                            </div>

                            <div className="space-y-5 px-5 py-6 sm:px-7">
                                <ProfileField
                                    label={t('Ad Soyad', 'Full Name')}
                                    value={draft.name}
                                    onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                                    autoComplete="name"
                                    icon={UserRound}
                                />
                                <ProfileField
                                    label={t('E-posta', 'Email')}
                                    value={draft.email}
                                    onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
                                    autoComplete="email"
                                    type="email"
                                    icon={Mail}
                                />
                                <ProfileField
                                    label={t('Telefon', 'Phone')}
                                    value={draft.phone}
                                    onChange={(value) => setDraft((current) => ({ ...current, phone: value }))}
                                    autoComplete="tel"
                                    type="tel"
                                    icon={Phone}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-4 border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                {saved && <span className="text-[13px] font-medium text-[#28a745]">{t('Kaydedildi', 'Saved')}</span>}
                                <button
                                    type="submit"
                                    disabled={!draft.name.trim() || !draft.email.trim()}
                                    className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition hover:bg-[#006ee6] active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                >
                                    {t('Değişiklikleri Kaydet', 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={updatePassword}
                            className="demo-step-enter mt-6 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                        >
                            <div className="flex items-center gap-4 border-b border-black/[0.055] px-5 py-6 sm:px-7">
                                <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-[#007aff]/10 text-[#007aff]">
                                    <LockKeyhole className="size-[21px]" />
                                </span>
                                <div>
                                    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{t('Şifreyi değiştir', 'Change password')}</h2>
                                    <p className="mt-1 text-[13px] text-[#8e8e93]">
                                        {t('Hesabın için güçlü ve benzersiz bir şifre kullan.', 'Use a strong, unique password for your account.')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 px-5 py-6 sm:px-7">
                                <ProfileField
                                    label={t('Mevcut Şifre', 'Current Password')}
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    autoComplete="current-password"
                                    type="password"
                                    icon={LockKeyhole}
                                />
                                <ProfileField
                                    label={t('Yeni Şifre', 'New Password')}
                                    value={newPassword}
                                    onChange={(value) => {
                                        setNewPassword(value);
                                        setPasswordMessage(null);
                                    }}
                                    autoComplete="new-password"
                                    type="password"
                                    icon={LockKeyhole}
                                />
                                <ProfileField
                                    label={t('Yeni Şifre Tekrar', 'Confirm New Password')}
                                    value={passwordConfirmation}
                                    onChange={(value) => {
                                        setPasswordConfirmation(value);
                                        setPasswordMessage(null);
                                    }}
                                    autoComplete="new-password"
                                    type="password"
                                    icon={LockKeyhole}
                                />
                                {passwordMessage === 'mismatch' && (
                                    <p className="text-[13px] font-medium text-[#ff3b30]">
                                        {t('Yeni şifreler birbiriyle eşleşmiyor.', 'The new passwords do not match.')}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-4 border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                {passwordMessage === 'success' && (
                                    <span className="text-[13px] font-medium text-[#28a745]">{t('Şifre güncellendi', 'Password updated')}</span>
                                )}
                                <button
                                    type="submit"
                                    disabled={!currentPassword || newPassword.length < 8 || !passwordConfirmation}
                                    className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition hover:bg-[#006ee6] active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                >
                                    {t('Şifreyi Güncelle', 'Update Password')}
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </>
    );
}

function ProfileField({
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: typeof UserRound;
    type?: string;
    autoComplete: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">{label}</span>
            <span className="flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8">
                <Icon className="size-[17px] shrink-0 text-[#8e8e93]" />
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    className="h-[52px] min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                />
            </span>
        </label>
    );
}

function PlanPanel({
    t,
    locale,
    goals,
    items,
    range,
    onNavigate,
    onAddItem,
    onRangeChange,
    onToggleItem,
    onRemoveItem,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    onNavigate: (section: PanelSection) => void;
    onAddItem: (item: Omit<PlanItem, 'id' | 'completed' | 'createdAt'>) => void;
    onRangeChange: (range: PlanRange) => void;
    onToggleItem: (id: number) => void;
    onRemoveItem: (id: number) => void;
}) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [independentTitle, setIndependentTitle] = useState('');

    const rangeOptions: Array<{ value: PlanRange; label: string }> = [
        { value: 'today', label: t('Bugün', 'Today') },
        { value: 'tomorrow', label: t('Yarın', 'Tomorrow') },
        { value: 'week', label: t('Hafta', 'Week') },
        { value: 'month', label: t('Ay', 'Month') },
        { value: 'year', label: t('Yıl', 'Year') },
    ];

    const visibleItems = useMemo(
        () => items.filter((item) => item.range === range).sort((first, second) => first.createdAt - second.createdAt),
        [items, range],
    );
    const completedCount = visibleItems.filter((item) => item.completed).length;
    const planProgress = visibleItems.length === 0 ? 0 : Math.round((completedCount / visibleItems.length) * 100);

    const addIndependentItem = (event: FormEvent) => {
        event.preventDefault();
        const title = independentTitle.trim();
        if (!title) return;

        onAddItem({ title, range, source: 'independent' });
        setIndependentTitle('');
        setComposerOpen(false);
    };

    const addGoalBlock = (goalRecord: GoalRecord, block: BuildingBlock) => {
        onAddItem({
            title: block.title,
            range,
            source: 'goal',
            goalId: goalRecord.id,
            buildingBlockId: block.id,
        });
    };

    const isBlockPlanned = (goalId: number, buildingBlockId: number) =>
        items.some((item) => item.goalId === goalId && item.buildingBlockId === buildingBlockId);

    return (
        <>
            <Head title={t('Planla', 'Plan')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="plan" onNavigate={onNavigate} />

                <main className="mx-auto max-w-5xl px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff]">{formatPlanPeriod(range, locale)}</p>
                            <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                                {t('Planla', 'Plan')}
                            </h1>
                            <p className="mt-4 text-[15px] text-[#6e6e73]">
                                {t('Zamanını hedeflerinle aynı yönde kullan.', 'Use your time in the same direction as your goals.')}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setComposerOpen(true)}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition hover:bg-[#006ee6] active:scale-[0.98] sm:w-auto"
                        >
                            <Plus className="size-[18px]" strokeWidth={2.5} />
                            {t('Plan Ekle', 'Add to Plan')}
                        </button>
                    </div>

                    <div className="mt-9 overflow-x-auto pb-1">
                        <div className="flex min-w-max items-center rounded-full bg-black/[0.045] p-1">
                            {rangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onRangeChange(option.value)}
                                    className={`min-w-24 rounded-full px-5 py-2.5 text-[14px] font-medium transition ${range === option.value ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <section className="mt-6 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                        <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{planRangeLabel(range, t)}</h2>
                                <p className="mt-1 text-[12px] text-[#8e8e93]">
                                    {visibleItems.length === 0
                                        ? t('Henüz plan eklenmedi', 'No plans added yet')
                                        : t(
                                              `${completedCount} / ${visibleItems.length} tamamlandı`,
                                              `${completedCount} of ${visibleItems.length} completed`,
                                          )}
                                </p>
                            </div>
                            <span className="text-[15px] font-semibold text-[#007aff] tabular-nums">%{planProgress}</span>
                        </div>

                        {visibleItems.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#f2f2f7] text-[#8e8e93]">
                                    <CalendarRange className="size-6" />
                                </span>
                                <h3 className="mt-5 text-[17px] font-semibold">
                                    {t('Planın hazır olduğunda burada görünecek.', 'Your plan will appear here when it is ready.')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setComposerOpen(true)}
                                    className="mt-3 text-[14px] font-medium text-[#007aff] hover:underline"
                                >
                                    {t('İlk maddeyi ekle', 'Add the first item')}
                                </button>
                            </div>
                        ) : (
                            <div>
                                {visibleItems.map((item, index) => {
                                    const sourceGoal = goals.find((goalRecord) => goalRecord.id === item.goalId);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group flex items-center gap-4 px-5 py-4 sm:px-7 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onToggleItem(item.id)}
                                                className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${item.completed ? 'border-[#34c759] bg-[#34c759] text-white' : 'border-[#c7c7cc] text-transparent hover:border-[#007aff]'}`}
                                                aria-label={
                                                    item.completed
                                                        ? t('Tamamlanmadı olarak işaretle', 'Mark incomplete')
                                                        : t('Tamamlandı olarak işaretle', 'Mark complete')
                                                }
                                            >
                                                <Check className="size-4" strokeWidth={3} />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`truncate text-[16px] font-medium tracking-[-0.01em] transition ${item.completed ? 'text-[#8e8e93] line-through' : ''}`}
                                                >
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium text-[#8e8e93]">
                                                    {sourceGoal ? sourceGoal.title : t('Bağımsız plan', 'Independent plan')}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveItem(item.id)}
                                                className="grid size-9 shrink-0 place-items-center rounded-full text-[#aeaeb2] opacity-100 transition hover:bg-[#ff3b30]/8 hover:text-[#ff3b30] sm:opacity-0 sm:group-hover:opacity-100"
                                                aria-label={t('Plandan kaldır', 'Remove from plan')}
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {composerOpen && (
                <div
                    className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                    role="presentation"
                    onMouseDown={() => setComposerOpen(false)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="plan-composer-title"
                        onMouseDown={(event) => event.stopPropagation()}
                        className="max-h-[88svh] w-full max-w-xl overflow-y-auto rounded-t-[30px] bg-[#f9f9fb] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:rounded-[30px]"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.055] bg-[#f9f9fb]/90 px-5 py-4 backdrop-blur-xl sm:px-6">
                            <div>
                                <h2 id="plan-composer-title" className="text-[20px] font-semibold tracking-[-0.025em]">
                                    {t('Plana ekle', 'Add to plan')}
                                </h2>
                                <p className="mt-0.5 text-[12px] text-[#8e8e93]">{planRangeLabel(range, t)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setComposerOpen(false)}
                                className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73] transition hover:bg-black/[0.09]"
                                aria-label={t('Kapat', 'Close')}
                            >
                                <X className="size-[17px]" />
                            </button>
                        </div>

                        <div className="space-y-7 p-5 sm:p-6">
                            <div>
                                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#6e6e73]">
                                    <Layers3 className="size-4" />
                                    {t('Hedeflerinden seç', 'Choose from your goals')}
                                </div>
                                <div className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-white">
                                    {goals.length === 0 ? (
                                        <p className="px-5 py-6 text-center text-[13px] text-[#8e8e93]">
                                            {t('Henüz seçilebilecek bir hedef yok.', 'There are no goals to choose from yet.')}
                                        </p>
                                    ) : (
                                        goals.map((goalRecord, goalIndex) => (
                                            <div key={goalRecord.id} className={goalIndex !== 0 ? 'border-t border-black/[0.055]' : ''}>
                                                <p className="bg-[#f9f9fb] px-4 py-2.5 text-[11px] font-semibold text-[#8e8e93]">
                                                    {goalRecord.title}
                                                </p>
                                                {goalRecord.buildingBlocks.map((block) => {
                                                    const planned = isBlockPlanned(goalRecord.id, block.id);

                                                    return (
                                                        <button
                                                            key={block.id}
                                                            type="button"
                                                            disabled={planned}
                                                            onClick={() => addGoalBlock(goalRecord, block)}
                                                            className="flex w-full items-center gap-3 border-t border-black/[0.045] px-4 py-3.5 text-left transition hover:bg-black/[0.02] disabled:cursor-default disabled:opacity-45"
                                                        >
                                                            <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{block.title}</span>
                                                            {planned ? (
                                                                <span className="text-[11px] font-medium text-[#8e8e93]">
                                                                    {t('Planlandı', 'Planned')}
                                                                </span>
                                                            ) : (
                                                                <span className="grid size-7 place-items-center rounded-full bg-[#007aff]/10 text-[#007aff]">
                                                                    <Plus className="size-4" />
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <form onSubmit={addIndependentItem}>
                                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#6e6e73]">
                                    <ListTodo className="size-4" />
                                    {t('Yeni plan maddesi', 'New plan item')}
                                </div>
                                <div className="flex items-center gap-2 rounded-[18px] border border-black/[0.07] bg-white p-2 pl-4 focus-within:border-[#007aff]/35 focus-within:ring-4 focus-within:ring-[#007aff]/8">
                                    <input
                                        value={independentTitle}
                                        onChange={(event) => setIndependentTitle(event.target.value)}
                                        placeholder={t('Yapmak istediğini yaz', 'Write what you want to do')}
                                        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!independentTitle.trim()}
                                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff] text-white transition disabled:bg-[#d1d1d6]"
                                        aria-label={t('Plana ekle', 'Add to plan')}
                                    >
                                        <ArrowRight className="size-[17px]" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
    return (
        <div className="mb-9 text-center sm:mb-11">
            <p className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-[#007aff]">{eyebrow}</p>
            <h1 className="text-[clamp(2rem,6vw,3.35rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-balance">{title}</h1>
            {description && <p className="mx-auto mt-5 max-w-xl text-[17px] leading-7 tracking-[-0.015em] text-[#6e6e73]">{description}</p>}
        </div>
    );
}

function GoalStep({ t, value, onChange }: { t: Translate; value: string; onChange: (value: string) => void }) {
    return (
        <section>
            <StepHeading eyebrow={t('Başlangıç', 'Getting started')} title={t('İlk hedefin nedir?', 'What is your first goal?')} />
            <label className="sr-only" htmlFor="first-goal">
                {t('İlk hedefin', 'Your first goal')}
            </label>
            <input
                id="first-goal"
                autoFocus
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('Hedefini yaz', 'Write your goal')}
                className="h-[68px] w-full rounded-[20px] border border-black/[0.08] bg-white px-5 text-center text-xl font-medium tracking-[-0.02em] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_38px_rgba(0,0,0,0.04)] transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/45 focus:ring-4 focus:ring-[#007aff]/10 sm:h-[76px] sm:px-7 sm:text-2xl"
            />
        </section>
    );
}

function GainStep({ t, value, onChange }: { t: Translate; value: string; onChange: (value: string) => void }) {
    return (
        <section>
            <StepHeading
                eyebrow={t('Kazanım', 'Outcome')}
                title={t('Bu hedefi gerçekleştirdiğinde kazanımın ne olacak?', 'What will you gain when you achieve this goal?')}
            />
            <label className="sr-only" htmlFor="goal-gain">
                {t('Kazanımın', 'Your outcome')}
            </label>
            <textarea
                id="goal-gain"
                autoFocus
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('Kazanımını yaz', 'Describe what you will gain')}
                rows={4}
                className="w-full resize-none rounded-[24px] border border-black/[0.08] bg-white px-6 py-5 text-lg leading-7 font-medium tracking-[-0.015em] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_38px_rgba(0,0,0,0.04)] transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/45 focus:ring-4 focus:ring-[#007aff]/10 sm:px-7 sm:py-6 sm:text-xl"
            />
        </section>
    );
}

function BuildingBlocksStep({
    t,
    blocks,
    onAdd,
    onChange,
    onRemove,
}: {
    t: Translate;
    blocks: BuildingBlock[];
    onAdd: () => void;
    onChange: (id: number, value: string) => void;
    onRemove: (id: number) => void;
}) {
    return (
        <section>
            <StepHeading
                eyebrow={t('Yapı taşları', 'Building blocks')}
                title={t('Hedefine giden yolun yapı taşlarını belirleyelim.', "Let's define the building blocks of your path.")}
                description={t(
                    'Neler yapman gerektiğini belirle. Sonrasında sıraya koyacağız.',
                    "Define what you need to do. We'll put them in order next.",
                )}
            />

            <div className="space-y-3">
                {blocks.map((block, index) => (
                    <div
                        key={block.id}
                        className="group flex items-center gap-3 rounded-[18px] border border-black/[0.07] bg-white p-2.5 pl-4 shadow-[0_6px_24px_rgba(0,0,0,0.035)]"
                    >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-xs font-semibold text-[#6e6e73]">
                            {index + 1}
                        </span>
                        <label className="sr-only" htmlFor={`building-block-${block.id}`}>
                            {t(`${index + 1}. madde`, `Item ${index + 1}`)}
                        </label>
                        <input
                            id={`building-block-${block.id}`}
                            autoFocus={index === 0}
                            value={block.title}
                            onChange={(event) => onChange(block.id, event.target.value)}
                            placeholder={t('Yapman gerekeni yaz', 'Write what you need to do')}
                            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] font-medium tracking-[-0.01em] outline-none placeholder:text-[#aeaeb2]"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(block.id)}
                            disabled={blocks.length === 1}
                            className="grid size-10 shrink-0 place-items-center rounded-full text-[#8e8e93] transition hover:bg-[#ff3b30]/8 hover:text-[#ff3b30] disabled:pointer-events-none disabled:opacity-0"
                            aria-label={t('Maddeyi sil', 'Delete item')}
                        >
                            <Trash2 className="size-[17px]" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="mx-auto mt-5 grid size-12 place-items-center rounded-full border border-black/[0.07] bg-white text-[#007aff] shadow-[0_7px_24px_rgba(0,0,0,0.06)] transition hover:scale-105 hover:bg-[#f9f9fb] active:scale-95"
                aria-label={t('Yeni madde ekle', 'Add another item')}
            >
                <Plus className="size-5" strokeWidth={2.5} />
            </button>
        </section>
    );
}

function OrderingStep({
    t,
    blocks,
    draggedId,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMove,
}: {
    t: Translate;
    blocks: BuildingBlock[];
    draggedId: number | null;
    onDragStart: (id: number) => void;
    onDragOver: (id: number) => void;
    onDragEnd: () => void;
    onMove: (fromIndex: number, toIndex: number) => void;
}) {
    const progressParts = distributeProgress(blocks.length);

    return (
        <section>
            <StepHeading
                eyebrow={t('Sıralama', 'Order')}
                title={t('Şimdi doğru sıraya koyalım.', "Now let's put them in the right order.")}
                description={t('Maddeleri tutup sürükleyerek sıralayabilirsin.', 'Press and drag the items to reorder them.')}
            />

            <div className="space-y-3">
                {blocks.map((block, index) => (
                    <div
                        key={block.id}
                        draggable
                        onDragStart={() => onDragStart(block.id)}
                        onDragEnter={() => onDragOver(block.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragEnd={onDragEnd}
                        className={`flex cursor-grab items-center gap-3 rounded-[18px] border bg-white p-3 pr-2 shadow-[0_6px_24px_rgba(0,0,0,0.035)] transition active:cursor-grabbing ${draggedId === block.id ? 'scale-[0.98] border-[#007aff]/25 opacity-45' : 'border-black/[0.07]'}`}
                    >
                        <GripVertical className="size-5 shrink-0 text-[#aeaeb2]" aria-hidden="true" />
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#007aff] text-xs font-semibold text-white">
                            {index + 1}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-[16px] font-medium tracking-[-0.01em]">{block.title}</p>
                        <span className="rounded-full bg-[#f2f2f7] px-2.5 py-1 text-[11px] font-semibold text-[#6e6e73]">
                            %{progressParts[index]}
                        </span>
                        <div className="ml-0.5 flex shrink-0 flex-col sm:hidden">
                            <button
                                type="button"
                                onClick={() => onMove(index, index - 1)}
                                disabled={index === 0}
                                className="grid size-7 place-items-center text-[#6e6e73] disabled:opacity-20"
                                aria-label={t('Yukarı taşı', 'Move up')}
                            >
                                <ChevronUp className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onMove(index, index + 1)}
                                disabled={index === blocks.length - 1}
                                className="grid size-7 place-items-center text-[#6e6e73] disabled:opacity-20"
                                aria-label={t('Aşağı taşı', 'Move down')}
                            >
                                <ChevronDown className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-5 text-center text-[13px] leading-5 text-[#8e8e93]">
                {t(
                    `${blocks.length} yapı taşı, hedef ilerlemeni eşit yüzdelere bölecek.`,
                    `${blocks.length} building blocks will divide your goal progress into equal parts.`,
                )}
            </p>
        </section>
    );
}

function DeadlineStep({ t, locale, value, onChange }: { t: Translate; locale: 'tr' | 'en'; value: string; onChange: (value: string) => void }) {
    const formattedDate = value
        ? new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(
              new Date(`${value}T12:00:00`),
          )
        : null;

    return (
        <section>
            <StepHeading
                eyebrow={t('Zaman', 'Timeline')}
                title={t('Bu hedefe ulaşmak için ne kadar zamanımız var?', 'How much time do we have to reach this goal?')}
            />
            <label
                htmlFor="goal-deadline"
                className="block rounded-[24px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_38px_rgba(0,0,0,0.04)] sm:p-6"
            >
                <span className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-[#007aff]/10 text-[#007aff]">
                        <CalendarDays className="size-[22px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-[#8e8e93]">{t('Hedef tarihi', 'Target date')}</span>
                        <span
                            className={`mt-0.5 block truncate text-[18px] font-semibold tracking-[-0.02em] ${formattedDate ? 'text-[#1d1d1f]' : 'text-[#aeaeb2]'}`}
                        >
                            {formattedDate ?? t('Bir gün seç', 'Choose a date')}
                        </span>
                    </span>
                    <input
                        id="goal-deadline"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className="h-11 max-w-[42px] cursor-pointer text-transparent [color-scheme:light] outline-none [&::-webkit-calendar-picker-indicator]:size-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
                    />
                </span>
            </label>
        </section>
    );
}

function PriorityStep({ t, value, onChange }: { t: Translate; value: Priority | null; onChange: (value: Priority) => void }) {
    const priorities: Array<{ value: Priority; label: string; color: string }> = [
        { value: 'urgent', label: t('Acil', 'Urgent'), color: 'bg-[#ff3b30]' },
        { value: 'very-important', label: t('Çok Önemli', 'Very Important'), color: 'bg-[#ff9500]' },
        { value: 'important', label: t('Önemli', 'Important'), color: 'bg-[#007aff]' },
        { value: 'has-time', label: t('Vakti Var', 'There Is Time'), color: 'bg-[#8e8e93]' },
    ];

    return (
        <section>
            <StepHeading
                eyebrow={t('Öncelik', 'Priority')}
                title={t('Son olarak bu hedef için bir öncelik sırası belirle.', 'Finally, set a priority for this goal.')}
            />
            <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_38px_rgba(0,0,0,0.04)]">
                {priorities.map((item, index) => {
                    const selected = value === item.value;

                    return (
                        <label
                            key={item.value}
                            className={`flex cursor-pointer items-center gap-4 px-5 py-[18px] transition hover:bg-black/[0.025] ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                        >
                            <input
                                type="radio"
                                name="priority"
                                value={item.value}
                                checked={selected}
                                onChange={() => onChange(item.value)}
                                className="sr-only"
                            />
                            <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
                            <span className="flex-1 text-[17px] font-medium tracking-[-0.015em]">{item.label}</span>
                            <span
                                className={`grid size-6 place-items-center rounded-full border transition ${selected ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-[#c7c7cc] text-transparent'}`}
                            >
                                <Check className="size-3.5" strokeWidth={3} />
                            </span>
                        </label>
                    );
                })}
            </div>
        </section>
    );
}

function CompletionScreen({ t, goal, blocks, onOpenPanel }: { t: Translate; goal: string; blocks: BuildingBlock[]; onOpenPanel: () => void }) {
    return (
        <section className="demo-step-enter text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#34c759] text-white shadow-[0_12px_38px_rgba(52,199,89,0.25)]">
                <CircleCheck className="size-10" strokeWidth={2.2} />
            </div>
            <p className="mt-8 text-[13px] font-semibold text-[#34a853]">{t('İlk hedefin hazır', 'Your first goal is ready')}</p>
            <h1 className="mt-3 text-[clamp(2.35rem,7vw,4rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-balance">
                {t('Süper, ağır kısmı hallettik bile.', 'Great, the hard part is already done.')}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-[17px] leading-7 text-[#6e6e73]">
                {t(
                    `“${goal}” hedefin ${blocks.length} yapı taşına ayrıldı.`,
                    `Your “${goal}” goal is divided into ${blocks.length} building blocks.`,
                )}
            </p>
            <button
                type="button"
                onClick={onOpenPanel}
                className="mx-auto mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.22)] transition hover:bg-[#006ee6] active:scale-[0.98]"
            >
                {t('Panele Geç', 'Open Panel')}
                <ArrowRight className="size-[18px]" />
            </button>
        </section>
    );
}

function priorityLabel(priority: Priority, t: Translate): string {
    return {
        urgent: t('Acil', 'Urgent'),
        'very-important': t('Çok Önemli', 'Very Important'),
        important: t('Önemli', 'Important'),
        'has-time': t('Vakti Var', 'There Is Time'),
    }[priority];
}

function formatGoalDate(date: string, locale: 'tr' | 'en'): string {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${date}T12:00:00`));
}

function calculateGoalProgress(goal: GoalRecord): number {
    if (goal.buildingBlocks.length === 0) return 0;

    const completed = goal.buildingBlocks.filter((block) => block.completed).length;
    return Math.round((completed / goal.buildingBlocks.length) * 100);
}

function planRangeLabel(range: PlanRange, t: Translate): string {
    return {
        today: t('Bugünün Planı', "Today's Plan"),
        tomorrow: t('Yarının Planı', "Tomorrow's Plan"),
        week: t('Haftalık Plan', 'Weekly Plan'),
        month: t('Aylık Plan', 'Monthly Plan'),
        year: t('Yıllık Plan', 'Yearly Plan'),
    }[range];
}

function formatPlanPeriod(range: PlanRange, locale: 'tr' | 'en'): string {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const today = new Date();

    if (range === 'today' || range === 'tomorrow') {
        const date = new Date(today);
        if (range === 'tomorrow') date.setDate(date.getDate() + 1);

        return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    }

    if (range === 'week') {
        const firstDay = new Date(today);
        const mondayOffset = (today.getDay() + 6) % 7;
        firstDay.setDate(today.getDate() - mondayOffset);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        const first = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(firstDay);
        const last = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(lastDay);

        return `${first} – ${last}`;
    }

    if (range === 'month') {
        return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(today);
    }

    return new Intl.DateTimeFormat(language, { year: 'numeric' }).format(today);
}

function loadStoredGoals(): GoalRecord[] {
    return loadStoredArray<GoalRecord>(DEMO_GOALS_STORAGE_KEY);
}

function loadStoredPlanItems(): PlanItem[] {
    return loadStoredArray<PlanItem>(DEMO_PLAN_STORAGE_KEY);
}

function loadStoredProfile(): ProfileData {
    const emptyProfile = { name: '', email: '', phone: '' };
    if (typeof window === 'undefined') return emptyProfile;

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(DEMO_PROFILE_STORAGE_KEY) ?? 'null');
        if (!value || typeof value !== 'object') return emptyProfile;

        const profile = value as Partial<ProfileData>;
        return {
            name: typeof profile.name === 'string' ? profile.name : '',
            email: typeof profile.email === 'string' ? profile.email : '',
            phone: typeof profile.phone === 'string' ? profile.phone : '',
        };
    } catch {
        return emptyProfile;
    }
}

function loadStoredArray<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
        return Array.isArray(value) ? (value as T[]) : [];
    } catch {
        return [];
    }
}

function storeDemoData(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // The live design preview continues to work if browser storage is unavailable.
    }
}

function distributeProgress(count: number): number[] {
    if (count <= 0) return [];

    const base = Math.floor(100 / count);
    const remainder = 100 % count;

    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

type Translate = (turkish: string, english: string) => string;

const PRIORITY_RANK: Record<Priority, number> = {
    urgent: 0,
    'very-important': 1,
    important: 2,
    'has-time': 3,
};

const PRIORITY_STYLES: Record<Priority, { dot: string; text: string }> = {
    urgent: { dot: 'bg-[#ff3b30]', text: 'text-[#d70015]' },
    'very-important': { dot: 'bg-[#ff9500]', text: 'text-[#c93400]' },
    important: { dot: 'bg-[#007aff]', text: 'text-[#0066cc]' },
    'has-time': { dot: 'bg-[#8e8e93]', text: 'text-[#6e6e73]' },
};
