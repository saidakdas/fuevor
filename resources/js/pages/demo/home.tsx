import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { Head } from '@inertiajs/react';
import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, validatePhoneNumberLength, type CountryCode } from 'libphonenumber-js';
import mobilePhoneExamples from 'libphonenumber-js/examples.mobile.json';
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    CakeSlice,
    CalendarDays,
    CalendarRange,
    Camera,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircleCheck,
    Globe2,
    GripVertical,
    Languages,
    Layers3,
    ListTodo,
    LockKeyhole,
    Mail,
    Moon,
    Phone,
    Plus,
    Search,
    Sun,
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
    scheduledFor: string;
};

type ProfileData = {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    country: string;
    profession: string;
    avatar: string;
};

type SettingsData = {
    appearance: 'light' | 'dark';
    language: 'tr' | 'en';
};

type CropPosition = {
    x: number;
    y: number;
};

type ImageDimensions = {
    width: number;
    height: number;
};

const TOTAL_STEPS = 6;
const DEMO_GOALS_STORAGE_KEY = 'fuevor.demo.goals';
const DEMO_PLAN_STORAGE_KEY = 'fuevor.demo.plan-items';
const DEMO_PROFILE_STORAGE_KEY = 'fuevor.demo.profile';
const DEMO_SETTINGS_STORAGE_KEY = 'fuevor.demo.settings';
const COUNTRY_CODES = getCountries();

export default function DemoHome() {
    const { locale: detectedLocale } = useLocale();
    const [settings, setSettings] = useState<SettingsData>(() => loadStoredSettings(detectedLocale));
    const locale = settings.language;
    const t = (turkish: string, english: string) => (locale === 'tr' ? turkish : english);
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
    const [planDate, setPlanDate] = useState(() => formatDateKey(new Date()));
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

    useEffect(() => {
        storeDemoData(DEMO_SETTINGS_STORAGE_KEY, settings);
        document.documentElement.dataset.demoTheme = settings.appearance;
        document.documentElement.lang = settings.language;
    }, [settings]);

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

    const changePlanRange = (range: PlanRange) => {
        setPlanRange(range);
        setPlanDate(defaultDateForRange(range));
    };

    const changePlanDate = (date: string) => {
        if (!isDateKey(date)) return;

        setPlanDate(date);
        if (planRange === 'today' || planRange === 'tomorrow') {
            setPlanRange(date === defaultDateForRange('tomorrow') ? 'tomorrow' : 'today');
        }
    };

    if (showPanel) {
        if (panelSection === 'profile') {
            return (
                <ProfilePanel
                    t={t}
                    locale={locale}
                    profile={profile}
                    settings={settings}
                    onNavigate={setPanelSection}
                    onSave={setProfile}
                    onSettingsChange={setSettings}
                />
            );
        }

        if (panelSection === 'overview') {
            return (
                <OverviewPanel
                    t={t}
                    locale={locale}
                    goals={goals}
                    items={planItems}
                    range={planRange}
                    date={planDate}
                    onNavigate={setPanelSection}
                    onCreateGoal={startNewGoal}
                    onRangeChange={changePlanRange}
                    onDateChange={changePlanDate}
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
                    date={planDate}
                    onNavigate={setPanelSection}
                    onRangeChange={changePlanRange}
                    onDateChange={changePlanDate}
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
    date,
    onNavigate,
    onCreateGoal,
    onRangeChange,
    onDateChange,
    onToggleItem,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    date: string;
    onNavigate: (section: PanelSection) => void;
    onCreateGoal: () => void;
    onRangeChange: (range: PlanRange) => void;
    onDateChange: (date: string) => void;
    onToggleItem: (id: number) => void;
}) {
    const periodItems = useMemo(
        () => items.filter((item) => isPlanItemInPeriod(item, range, date)).sort((first, second) => second.createdAt - first.createdAt),
        [date, items, range],
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

                <main className="mx-auto max-w-5xl px-5 pt-24 pb-28 sm:px-8 sm:pt-36 sm:pb-16">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff] capitalize">{formatPlanPeriod(range, locale, date)}</p>
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

                    <div className="mt-9 pb-1">
                        <div className="grid w-full grid-cols-5 items-center rounded-full bg-black/[0.045] p-1">
                            {rangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onRangeChange(option.value)}
                                    className={`min-w-0 rounded-full px-1 py-2.5 text-[12px] font-medium transition sm:px-5 sm:text-[14px] ${isRangeOptionActive(option.value, range, date) ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PlanDateNavigator t={t} locale={locale} range={range} date={date} onDateChange={onDateChange} />

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
                            label={planRangeLabel(range, t, date)}
                            value={periodItems.length === 0 ? '—' : `${periodCompleted}/${periodItems.length}`}
                            color="bg-[#34c759]/10 text-[#28a745]"
                        />
                    </section>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                            <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 sm:px-6">
                                <div>
                                    <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{planRangeLabel(range, t, date)}</h2>
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

                <main className="mx-auto max-w-5xl px-5 pt-24 pb-28 sm:px-8 sm:pt-36 sm:pb-16">
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
    const navigationItems = [
        { section: 'overview' as const, label: t('Genel Bakış', 'Overview'), icon: Layers3 },
        { section: 'goals' as const, label: t('Hedefler', 'Goals'), icon: Target },
        { section: 'plan' as const, label: t('Planla', 'Plan'), icon: ListTodo },
        { section: 'profile' as const, label: t('Profil', 'Profile'), icon: UserRound },
    ];

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-30 border-b border-black/[0.055] bg-[#f5f5f7]/80 backdrop-blur-2xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-center gap-4 px-5 sm:h-[72px] sm:justify-between sm:px-8">
                    <div className="relative h-9 w-28 shrink-0 sm:w-32">
                        <BrandLogo variant="color" className="demo-logo-light absolute inset-0 h-full w-full transition-opacity" />
                        <BrandLogo variant="white" className="demo-logo-dark absolute inset-0 h-full w-full opacity-0 transition-opacity" />
                    </div>
                    <nav
                        className="hidden items-center rounded-full bg-black/[0.045] p-1 sm:flex"
                        aria-label={t('Panel bölümleri', 'Panel sections')}
                    >
                        {navigationItems.slice(0, 3).map((item) => (
                            <button
                                key={item.section}
                                type="button"
                                onClick={() => onNavigate(item.section)}
                                className={`rounded-full px-5 py-2 text-[13px] font-medium whitespace-nowrap transition ${active === item.section ? 'bg-white text-[#1d1d1f] shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        {navigationItems.slice(3).map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.section}
                                    type="button"
                                    onClick={() => onNavigate(item.section)}
                                    className={`grid size-10 place-items-center rounded-full border transition ${active === item.section ? 'border-[#007aff] bg-[#007aff] text-white shadow-[0_5px_18px_rgba(0,122,255,0.2)]' : 'border-black/[0.07] bg-white text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                                    aria-label={item.label}
                                >
                                    <Icon className="size-[18px]" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <nav
                className="demo-mobile-navigation fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/[0.055] bg-[#f5f5f7]/80 px-1 pt-2 backdrop-blur-2xl sm:hidden"
                aria-label={t('Mobil panel bölümleri', 'Mobile panel sections')}
            >
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const selected = active === item.section;

                    return (
                        <button
                            key={item.section}
                            type="button"
                            onClick={() => onNavigate(item.section)}
                            className={`flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] leading-none font-medium whitespace-nowrap transition ${selected ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}
                            aria-current={selected ? 'page' : undefined}
                        >
                            <Icon className="size-[21px]" strokeWidth={selected ? 2.4 : 2} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}

function ProfilePreferences({ t, settings, onChange }: { t: Translate; settings: SettingsData; onChange: (settings: SettingsData) => void }) {
    return (
        <div>
            <section>
                <h2 className="mb-3 px-1 text-[13px] font-semibold text-[#6e6e73]">{t('Görünüm', 'Appearance')}</h2>
                <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.04)]">
                    <SettingOption
                        icon={Sun}
                        label={t('Açık', 'Light')}
                        description={t('Aydınlık ve ferah görünüm', 'Bright and airy appearance')}
                        selected={settings.appearance === 'light'}
                        onSelect={() => onChange({ ...settings, appearance: 'light' })}
                    />
                    <SettingOption
                        icon={Moon}
                        label={t('Koyu', 'Dark')}
                        description={t('Düşük ışık için koyu görünüm', 'Dark appearance for low light')}
                        selected={settings.appearance === 'dark'}
                        onSelect={() => onChange({ ...settings, appearance: 'dark' })}
                        divided
                    />
                </div>
            </section>

            <section className="mt-8">
                <h2 className="mb-3 px-1 text-[13px] font-semibold text-[#6e6e73]">{t('Dil', 'Language')}</h2>
                <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.04)]">
                    <SettingOption
                        icon={Languages}
                        label="Türkçe"
                        description="Fuevor’u Türkçe kullan"
                        selected={settings.language === 'tr'}
                        onSelect={() => onChange({ ...settings, language: 'tr' })}
                    />
                    <SettingOption
                        icon={Languages}
                        label="English"
                        description="Use Fuevor in English"
                        selected={settings.language === 'en'}
                        onSelect={() => onChange({ ...settings, language: 'en' })}
                        divided
                    />
                </div>
            </section>

            <p className="mt-5 px-1 text-[12px] leading-relaxed text-[#8e8e93]">
                {t('Değişiklikler anında uygulanır ve bu cihazda saklanır.', 'Changes apply instantly and are saved on this device.')}
            </p>
        </div>
    );
}

function SettingOption({
    icon: Icon,
    label,
    description,
    selected,
    onSelect,
    divided = false,
}: {
    icon: typeof Sun;
    label: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
    divided?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.025] active:bg-black/[0.045] sm:px-6 ${divided ? 'border-t border-black/[0.055]' : ''}`}
            aria-pressed={selected}
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#007aff]/10 text-[#007aff]">
                <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold tracking-[-0.01em]">{label}</span>
                <span className="mt-0.5 block text-[13px] text-[#8e8e93]">{description}</span>
            </span>
            <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${selected ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-black/[0.12] text-transparent'}`}
                aria-hidden="true"
            >
                <Check className="size-3.5 stroke-[3]" />
            </span>
        </button>
    );
}

function ProfilePanel({
    t,
    locale,
    profile,
    settings,
    onNavigate,
    onSave,
    onSettingsChange,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    profile: ProfileData;
    settings: SettingsData;
    onNavigate: (section: PanelSection) => void;
    onSave: (profile: ProfileData) => void;
    onSettingsChange: (settings: SettingsData) => void;
}) {
    const [tab, setTab] = useState<'personal' | 'settings'>('personal');
    const [draft, setDraft] = useState(profile);
    const [saved, setSaved] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<'success' | 'mismatch' | null>(null);
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState(profile.email);
    const [resetSent, setResetSent] = useState(false);
    const profileInitial = draft.name.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'K';
    const selectedCountry = isCountryCode(draft.country) ? draft.country : null;
    const phoneIsValid = selectedCountry ? isNationalPhoneLengthValid(draft.phone, selectedCountry) : false;

    const savePersonalInformation = (event: FormEvent) => {
        event.preventDefault();
        onSave({
            name: draft.name.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            birthDate: draft.birthDate,
            country: draft.country,
            profession: draft.profession,
            avatar: draft.avatar,
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

                <main className="mx-auto max-w-4xl px-5 pt-24 pb-28 sm:px-8 sm:pt-36 sm:pb-16">
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
                            onClick={() => setTab('settings')}
                            className={`flex-1 rounded-full px-5 py-2.5 text-[14px] font-medium whitespace-nowrap transition sm:flex-none ${tab === 'settings' ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'}`}
                        >
                            {t('Ayarlar', 'Settings')}
                        </button>
                    </div>

                    {tab === 'personal' ? (
                        <form
                            onSubmit={savePersonalInformation}
                            className="demo-step-enter mt-6 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                        >
                            <div className="flex items-center gap-4 border-b border-black/[0.055] px-5 py-6 sm:px-7">
                                <div className="relative shrink-0">
                                    {draft.avatar ? (
                                        <img
                                            src={draft.avatar}
                                            alt={t('Profil fotoğrafı', 'Profile photo')}
                                            className="size-16 rounded-full object-cover shadow-[0_7px_20px_rgba(0,0,0,0.14)]"
                                        />
                                    ) : (
                                        <span className="grid size-16 place-items-center rounded-full bg-[#007aff] text-[24px] font-semibold text-white shadow-[0_7px_20px_rgba(0,122,255,0.2)]">
                                            {profileInitial}
                                        </span>
                                    )}
                                    <label
                                        htmlFor="demo-profile-photo"
                                        className="absolute -right-1 -bottom-1 grid size-7 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#1d1d1f] text-white shadow-md transition hover:scale-105"
                                        title={t('Profil fotoğrafını değiştir', 'Change profile photo')}
                                    >
                                        <Camera className="size-3.5" />
                                    </label>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em]">
                                        {draft.name || t('Ad Soyad', 'Full Name')}
                                    </h2>
                                    <p className="mt-1 truncate text-[13px] text-[#8e8e93]">{draft.email || t('E-posta adresi', 'Email address')}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                        <label
                                            htmlFor="demo-profile-photo"
                                            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-[#007aff]"
                                        >
                                            <Camera className="size-3.5" />
                                            {draft.avatar ? t('Değiştir', 'Change') : t('Fotoğraf ekle', 'Add photo')}
                                        </label>
                                        {draft.avatar && (
                                            <button
                                                type="button"
                                                onClick={() => setDraft((current) => ({ ...current, avatar: '' }))}
                                                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#ff3b30]"
                                            >
                                                <Trash2 className="size-3.5" />
                                                {t('Sil', 'Delete')}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="demo-profile-photo"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        aria-label={t('Profil fotoğrafı seç', 'Choose profile photo')}
                                        onChange={async (event) => {
                                            const input = event.currentTarget;
                                            const file = input.files?.[0];
                                            if (!file) return;

                                            try {
                                                const source = await readProfileImage(file);
                                                setCropSource(source);
                                            } catch {
                                                // Unsupported image files leave the current profile photo unchanged.
                                            } finally {
                                                input.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-5 px-5 py-6 sm:px-7">
                                <ProfileField
                                    label={t('Ad Soyad', 'Full Name')}
                                    value={draft.name}
                                    onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                                    autoComplete="name"
                                    icon={UserRound}
                                    required
                                />
                                <ProfileField
                                    label={t('E-posta', 'Email')}
                                    value={draft.email}
                                    onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
                                    autoComplete="email"
                                    type="email"
                                    icon={Mail}
                                    required
                                />
                                <CountryPickerField
                                    t={t}
                                    locale={locale}
                                    value={selectedCountry}
                                    onChange={(country) =>
                                        setDraft((current) => ({
                                            ...current,
                                            country,
                                            phone: normalizeNationalPhone(current.phone, country),
                                        }))
                                    }
                                />
                                <ProfilePhoneField
                                    t={t}
                                    country={selectedCountry}
                                    value={draft.phone}
                                    onChange={(phone) => setDraft((current) => ({ ...current, phone }))}
                                />
                                <BirthDateField
                                    t={t}
                                    locale={locale}
                                    value={draft.birthDate}
                                    onChange={(birthDate) => setDraft((current) => ({ ...current, birthDate }))}
                                />
                                <ProfileSelect
                                    label={t('Meslek', 'Profession')}
                                    value={draft.profession}
                                    onChange={(value) => setDraft((current) => ({ ...current, profession: value }))}
                                    icon={BriefcaseBusiness}
                                    optionalLabel={t('İsteğe bağlı', 'Optional')}
                                    placeholder={t('Meslek seç', 'Choose a profession')}
                                    options={professionOptions(t)}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-4 border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                {saved && <span className="text-[13px] font-medium text-[#28a745]">{t('Kaydedildi', 'Saved')}</span>}
                                <button
                                    type="submit"
                                    disabled={!draft.name.trim() || !draft.email.trim() || !phoneIsValid || !draft.birthDate || !selectedCountry}
                                    className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition hover:bg-[#006ee6] active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                >
                                    {t('Değişiklikleri Kaydet', 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="demo-step-enter mt-6">
                            <ProfilePreferences t={t} settings={settings} onChange={onSettingsChange} />

                            <section className="mt-8">
                                <h2 className="mb-3 px-1 text-[13px] font-semibold text-[#6e6e73]">{t('Güvenlik', 'Security')}</h2>
                                <form
                                    onSubmit={updatePassword}
                                    className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                                >
                                    <div className="flex items-center gap-4 border-b border-black/[0.055] px-5 py-6 sm:px-7">
                                        <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-[#007aff]/10 text-[#007aff]">
                                            <LockKeyhole className="size-[21px]" />
                                        </span>
                                        <div>
                                            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
                                                {t('Şifreyi değiştir', 'Change password')}
                                            </h2>
                                            <p className="mt-1 text-[13px] text-[#8e8e93]">
                                                {t(
                                                    'Hesabın için güçlü ve benzersiz bir şifre kullan.',
                                                    'Use a strong, unique password for your account.',
                                                )}
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
                                            <span className="text-[13px] font-medium text-[#28a745]">
                                                {t('Şifre güncellendi', 'Password updated')}
                                            </span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={!currentPassword || newPassword.length < 8 || !passwordConfirmation}
                                            className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition hover:bg-[#006ee6] active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                        >
                                            {t('Şifreyi Güncelle', 'Update Password')}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 border-t border-black/[0.055] px-5 py-5 sm:px-7">
                                        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#ff9500]/10 text-[#ff9500]">
                                            <Mail className="size-[19px]" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-[15px] font-semibold">{t('Şifreni mi unuttun?', 'Forgot your password?')}</h3>
                                            <p className="mt-1 text-[12px] leading-5 text-[#8e8e93]">
                                                {t('E-postana güvenli bir sıfırlama bağlantısı gönder.', 'Send a secure reset link to your email.')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResetEmail(draft.email);
                                                setResetSent(false);
                                                setForgotPasswordOpen(true);
                                            }}
                                            className="shrink-0 rounded-full bg-[#007aff]/10 px-4 py-2 text-[13px] font-semibold text-[#007aff] transition active:scale-95"
                                        >
                                            {t('Sıfırla', 'Reset')}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}
                </main>
            </div>

            {cropSource && (
                <ProfilePhotoEditor
                    t={t}
                    source={cropSource}
                    onCancel={() => setCropSource(null)}
                    onConfirm={(avatar) => {
                        setDraft((current) => ({ ...current, avatar }));
                        setCropSource(null);
                    }}
                />
            )}

            {forgotPasswordOpen && (
                <ForgotPasswordDialog
                    t={t}
                    email={resetEmail}
                    sent={resetSent}
                    onEmailChange={setResetEmail}
                    onCancel={() => setForgotPasswordOpen(false)}
                    onSubmit={() => setResetSent(true)}
                />
            )}
        </>
    );
}

function ForgotPasswordDialog({
    t,
    email,
    sent,
    onEmailChange,
    onCancel,
    onSubmit,
}: {
    t: Translate;
    email: string;
    sent: boolean;
    onEmailChange: (email: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    return (
        <div
            className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="forgot-password-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] font-semibold text-[#007aff]">{t('Hesap kurtarma', 'Account recovery')}</p>
                        <h2 id="forgot-password-title" className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                            {sent ? t('E-postanı kontrol et', 'Check your email') : t('Şifremi Unuttum', 'Forgot Password')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                {sent ? (
                    <div className="py-7 text-center">
                        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#34c759]/10 text-[#28a745]">
                            <Mail className="size-7" />
                        </span>
                        <p className="mx-auto mt-5 max-w-sm text-[14px] leading-6 text-[#6e6e73]">
                            {t(
                                `${email.trim()} adresine şifre sıfırlama bağlantısı gönderildi.`,
                                `A password reset link was sent to ${email.trim()}.`,
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-6 h-12 w-full rounded-full bg-[#007aff] text-[14px] font-semibold text-white transition active:scale-[0.98]"
                        >
                            {t('Tamam', 'Done')}
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (validEmail) onSubmit();
                        }}
                        className="mt-6"
                    >
                        <p className="text-[13px] leading-5 text-[#6e6e73]">
                            {t(
                                'Hesabına bağlı e-posta adresini yaz. Sana güvenli bir sıfırlama bağlantısı gönderelim.',
                                'Enter the email linked to your account and we’ll send you a secure reset link.',
                            )}
                        </p>
                        <label className="mt-5 block">
                            <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">{t('E-posta', 'Email')}</span>
                            <span className="flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-white px-4 transition focus-within:border-[#007aff]/40 focus-within:ring-4 focus-within:ring-[#007aff]/8">
                                <Mail className="size-[17px] text-[#8e8e93]" />
                                <input
                                    autoFocus
                                    type="email"
                                    value={email}
                                    onChange={(event) => onEmailChange(event.target.value)}
                                    autoComplete="email"
                                    className="h-[52px] min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none"
                                />
                            </span>
                        </label>
                        <button
                            type="submit"
                            disabled={!validEmail}
                            className="mt-6 h-12 w-full rounded-full bg-[#007aff] text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:bg-[#d1d1d6]"
                        >
                            {t('Sıfırlama Bağlantısı Gönder', 'Send Reset Link')}
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
}

const PROFILE_CROP_SIZE = 252;

function ProfilePhotoEditor({
    t,
    source,
    onCancel,
    onConfirm,
}: {
    t: Translate;
    source: string;
    onCancel: () => void;
    onConfirm: (avatar: string) => void;
}) {
    const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);
    const dragOrigin = useRef<{
        pointerX: number;
        pointerY: number;
        positionX: number;
        positionY: number;
    } | null>(null);

    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        };
        image.src = source;
    }, [source]);

    const cropMetrics = useMemo(() => {
        if (!dimensions) return null;

        const baseScale = Math.max(PROFILE_CROP_SIZE / dimensions.width, PROFILE_CROP_SIZE / dimensions.height);
        const scale = baseScale * zoom;
        const renderedWidth = dimensions.width * scale;
        const renderedHeight = dimensions.height * scale;

        return {
            scale,
            renderedWidth,
            renderedHeight,
            maxX: Math.max(0, (renderedWidth - PROFILE_CROP_SIZE) / 2),
            maxY: Math.max(0, (renderedHeight - PROFILE_CROP_SIZE) / 2),
        };
    }, [dimensions, zoom]);

    const keepInsideCrop = (nextPosition: CropPosition): CropPosition => {
        if (!cropMetrics) return { x: 0, y: 0 };

        return {
            x: Math.min(cropMetrics.maxX, Math.max(-cropMetrics.maxX, nextPosition.x)),
            y: Math.min(cropMetrics.maxY, Math.max(-cropMetrics.maxY, nextPosition.y)),
        };
    };

    useEffect(() => {
        setPosition((current) => keepInsideCrop(current));
        // cropMetrics changes whenever zoom changes and constrains the current position.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropMetrics?.maxX, cropMetrics?.maxY]);

    const confirmCrop = async () => {
        if (!dimensions || !cropMetrics || processing) return;

        setProcessing(true);
        try {
            const avatar = await cropProfileImage(source, dimensions, cropMetrics.scale, position);
            onConfirm(avatar);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div
            className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 backdrop-blur-md sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-photo-editor-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-t-[30px] bg-[#f9f9fb] px-5 pt-5 pb-7 shadow-[0_30px_90px_rgba(0,0,0,0.3)] sm:rounded-[30px] sm:px-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 id="profile-photo-editor-title" className="text-[20px] font-semibold tracking-[-0.025em]">
                            {t('Fotoğrafı düzenle', 'Edit photo')}
                        </h2>
                        <p className="mt-1 text-[13px] text-[#8e8e93]">
                            {t('Sürükleyerek dairenin içine yerleştir.', 'Drag to position it inside the circle.')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                <div className="mt-7 flex justify-center">
                    <div
                        className="relative touch-none overflow-hidden rounded-full bg-[#1c1c1e] shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-4 ring-white/80 select-none"
                        style={{ width: PROFILE_CROP_SIZE, height: PROFILE_CROP_SIZE }}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            dragOrigin.current = {
                                pointerX: event.clientX,
                                pointerY: event.clientY,
                                positionX: position.x,
                                positionY: position.y,
                            };
                        }}
                        onPointerMove={(event) => {
                            if (!dragOrigin.current) return;

                            setPosition(
                                keepInsideCrop({
                                    x: dragOrigin.current.positionX + event.clientX - dragOrigin.current.pointerX,
                                    y: dragOrigin.current.positionY + event.clientY - dragOrigin.current.pointerY,
                                }),
                            );
                        }}
                        onPointerUp={() => {
                            dragOrigin.current = null;
                        }}
                        onPointerCancel={() => {
                            dragOrigin.current = null;
                        }}
                    >
                        {cropMetrics && (
                            <img
                                src={source}
                                alt=""
                                draggable={false}
                                className="pointer-events-none absolute max-w-none"
                                style={{
                                    width: cropMetrics.renderedWidth,
                                    height: cropMetrics.renderedHeight,
                                    left: `calc(50% + ${position.x}px)`,
                                    top: `calc(50% + ${position.y}px)`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        )}
                        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/60 ring-inset" />
                    </div>
                </div>

                <label className="mt-7 block">
                    <span className="mb-3 flex items-center justify-between text-[12px] font-semibold text-[#6e6e73]">
                        <span>{t('Yakınlaştır', 'Zoom')}</span>
                        <span className="tabular-nums">%{Math.round(zoom * 100)}</span>
                    </span>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.01"
                        value={zoom}
                        onChange={(event) => setZoom(Number(event.target.value))}
                        className="w-full accent-[#007aff]"
                    />
                </label>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-12 rounded-full border border-black/[0.07] bg-white text-[14px] font-semibold transition active:scale-[0.98]"
                    >
                        {t('Vazgeç', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={confirmCrop}
                        disabled={!dimensions || processing}
                        className="h-12 rounded-full bg-[#007aff] text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:bg-[#d1d1d6]"
                    >
                        {processing ? t('Hazırlanıyor…', 'Preparing…') : t('Fotoğrafı Kullan', 'Use Photo')}
                    </button>
                </div>
            </section>
        </div>
    );
}

function ProfileField({
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    autoComplete,
    placeholder,
    max,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: typeof UserRound;
    type?: string;
    autoComplete: string;
    placeholder?: string;
    max?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                {label}
                {required && <span className="ml-1 text-[#ff3b30]">*</span>}
            </span>
            <span className="flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8">
                <Icon className="size-[17px] shrink-0 text-[#8e8e93]" />
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    max={max}
                    required={required}
                    className="h-[52px] min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                />
            </span>
        </label>
    );
}

function CountryPickerField({
    t,
    locale,
    value,
    onChange,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    value: CountryCode | null;
    onChange: (country: CountryCode) => void;
}) {
    const [open, setOpen] = useState(false);
    const country = value ? getCountryOption(value, locale) : null;

    return (
        <>
            <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                    {t('Ülke', 'Country')}
                    <span className="ml-1 text-[#ff3b30]">*</span>
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex h-[54px] w-full items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-left transition hover:bg-white focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8 focus:outline-none"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    {country ? (
                        <span className="text-[22px] leading-none" aria-hidden="true">
                            {country.flag}
                        </span>
                    ) : (
                        <Globe2 className="size-[17px] shrink-0 text-[#8e8e93]" />
                    )}
                    <span className={`min-w-0 flex-1 truncate text-[15px] font-medium ${country ? '' : 'text-[#8e8e93]'}`}>
                        {country?.name ?? t('Ülke seç', 'Choose a country')}
                    </span>
                    {country && <span className="text-[13px] font-medium text-[#8e8e93]">+{country.callingCode}</span>}
                    <ChevronDown className="size-4 shrink-0 text-[#8e8e93]" />
                </button>
            </label>

            {open && <CountryPicker t={t} locale={locale} value={value} onCancel={() => setOpen(false)} onChange={onChange} />}
        </>
    );
}

function CountryPicker({
    t,
    locale,
    value,
    onCancel,
    onChange,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    value: CountryCode | null;
    onCancel: () => void;
    onChange: (country: CountryCode) => void;
}) {
    const [query, setQuery] = useState('');
    const countries = useMemo(() => getCountryOptions(locale), [locale]);
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    const results = useMemo(
        () =>
            normalizedQuery
                ? countries.filter((country) => {
                      const searchable = `${country.name} ${country.code} +${country.callingCode}`.toLocaleLowerCase(
                          locale === 'tr' ? 'tr-TR' : 'en-US',
                      );
                      return searchable.includes(normalizedQuery);
                  })
                : countries,
        [countries, locale, normalizedQuery],
    );

    return (
        <div
            className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="country-picker-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="flex max-h-[88svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px]"
            >
                <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
                    <div>
                        <p className="text-[12px] font-semibold text-[#007aff]">{t('Kişisel bilgiler', 'Personal information')}</p>
                        <h2 id="country-picker-title" className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                            {t('Ülke seç', 'Choose a country')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                <label className="mx-5 mt-5 flex h-12 items-center gap-3 rounded-[15px] bg-black/[0.045] px-4 sm:mx-6">
                    <Search className="size-[17px] shrink-0 text-[#8e8e93]" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('Ülke veya telefon kodu ara', 'Search country or calling code')}
                        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#8e8e93]"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="grid size-7 place-items-center rounded-full bg-black/[0.07] text-[#8e8e93]"
                            aria-label={t('Aramayı temizle', 'Clear search')}
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </label>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-black/[0.055] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    {results.length === 0 ? (
                        <p className="px-6 py-12 text-center text-[14px] text-[#8e8e93]">{t('Ülke bulunamadı.', 'No country found.')}</p>
                    ) : (
                        results.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                    onChange(country.code);
                                    onCancel();
                                }}
                                className="flex w-full items-center gap-3 border-b border-black/[0.045] px-5 py-3.5 text-left transition hover:bg-black/[0.025] sm:px-6"
                            >
                                <span className="w-8 shrink-0 text-[23px] leading-none" aria-hidden="true">
                                    {country.flag}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{country.name}</span>
                                <span className="text-[13px] text-[#8e8e93]">+{country.callingCode}</span>
                                <span
                                    className={`grid size-6 shrink-0 place-items-center rounded-full ${value === country.code ? 'bg-[#007aff] text-white' : 'text-transparent'}`}
                                >
                                    <Check className="size-3.5 stroke-[3]" />
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

function ProfilePhoneField({
    t,
    country,
    value,
    onChange,
}: {
    t: Translate;
    country: CountryCode | null;
    value: string;
    onChange: (phone: string) => void;
}) {
    const length = country ? getNationalPhoneLength(country) : null;
    const invalid = Boolean(value && country && !isNationalPhoneLengthValid(value, country));
    const formattedValue = country ? new AsYouType(country).input(value) : value;

    return (
        <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                {t('Telefon', 'Phone')}
                <span className="ml-1 text-[#ff3b30]">*</span>
            </span>
            <span
                className={`flex items-center rounded-[16px] border bg-[#f9f9fb] transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8 ${invalid ? 'border-[#ff3b30]/45' : 'border-black/[0.08]'}`}
            >
                <span className="flex h-[52px] shrink-0 items-center gap-2 border-r border-black/[0.07] px-4 text-[15px] font-semibold">
                    <Phone className="size-[17px] text-[#8e8e93]" />
                    {country ? `+${getCountryCallingCode(country)}` : '—'}
                </span>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={formattedValue}
                    disabled={!country}
                    onChange={(event) => onChange(normalizeNationalPhone(event.target.value, country))}
                    autoComplete="tel-national"
                    placeholder={country ? t('0 olmadan numaranı yaz', 'Enter number without leading 0') : t('Önce ülke seç', 'Choose country first')}
                    className="h-[52px] min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2] disabled:cursor-not-allowed"
                />
            </span>
            <span className={`mt-2 block text-[11px] ${invalid ? 'font-medium text-[#ff3b30]' : 'text-[#8e8e93]'}`}>
                {country && length
                    ? invalid
                        ? t(`Numara ${phoneLengthLabel(length, 'tr')} olmalı.`, `Number must be ${phoneLengthLabel(length, 'en')}.`)
                        : t(
                              `Ülke kodundan sonra 0 olmadan ${phoneLengthLabel(length, 'tr')} gir.`,
                              `Enter ${phoneLengthLabel(length, 'en')} without a leading 0.`,
                          )
                    : t('Telefon kodu ülke seçimine göre belirlenir.', 'Calling code is determined by your country.')}
            </span>
        </label>
    );
}

function BirthDateField({ t, locale, value, onChange }: { t: Translate; locale: 'tr' | 'en'; value: string; onChange: (date: string) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                    {t('Doğum Tarihi', 'Date of Birth')}
                    <span className="ml-1 text-[#ff3b30]">*</span>
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex h-[54px] w-full items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-left transition hover:bg-white focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8 focus:outline-none"
                >
                    <CakeSlice className="size-[17px] shrink-0 text-[#8e8e93]" />
                    <span className={`min-w-0 flex-1 text-[15px] font-medium ${value ? '' : 'text-[#8e8e93]'}`}>
                        {value ? formatBirthDate(value, locale) : t('Doğum tarihini seç', 'Choose your date of birth')}
                    </span>
                    <CalendarDays className="size-[17px] shrink-0 text-[#007aff]" />
                </button>
            </label>

            {open && (
                <BirthDateCalendar
                    t={t}
                    locale={locale}
                    selectedDate={value}
                    onCancel={() => setOpen(false)}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                />
            )}
        </>
    );
}

function BirthDateCalendar({
    t,
    locale,
    selectedDate,
    onCancel,
    onSelect,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    selectedDate: string;
    onCancel: () => void;
    onSelect: (date: string) => void;
}) {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const initialDate = selectedDate ? parseDateKey(selectedDate) : new Date(new Date().getFullYear() - 25, new Date().getMonth(), 1, 12);
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialDate));
    const today = formatDateKey(new Date());
    const days = useMemo(() => calendarMonthDays(visibleMonth), [visibleMonth]);
    const monthNames = useMemo(
        () => Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date(2026, month, 1, 12))),
        [language],
    );
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
    }, []);
    const weekdays = useMemo(() => calendarWeekdayLabels(language), [language]);

    return (
        <div
            className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="birth-calendar-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[12px] font-semibold text-[#007aff]">{t('Kişisel bilgiler', 'Personal information')}</p>
                        <h2 id="birth-calendar-title" className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                            {t('Doğum tarihini seç', 'Choose date of birth')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-[40px_1fr_1fr_40px] items-center gap-2 rounded-[17px] bg-black/[0.045] p-1.5">
                    <button
                        type="button"
                        onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}
                        disabled={visibleMonth.getFullYear() === 1900 && visibleMonth.getMonth() === 0}
                        className="grid size-10 place-items-center rounded-full text-[#6e6e73] transition hover:bg-white hover:text-[#007aff] disabled:opacity-25"
                        aria-label={t('Önceki ay', 'Previous month')}
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <div className="relative min-w-0">
                        <select
                            value={visibleMonth.getMonth()}
                            onChange={(event) => setVisibleMonth(new Date(visibleMonth.getFullYear(), Number(event.target.value), 1, 12))}
                            className="h-10 w-full min-w-0 appearance-none rounded-full bg-white px-8 text-center text-[13px] font-semibold capitalize outline-none"
                            aria-label={t('Ay', 'Month')}
                        >
                            {monthNames.map((month, index) => (
                                <option
                                    key={month}
                                    value={index}
                                    disabled={visibleMonth.getFullYear() === new Date().getFullYear() && index > new Date().getMonth()}
                                >
                                    {month}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#8e8e93]" />
                    </div>
                    <div className="relative min-w-0">
                        <select
                            value={visibleMonth.getFullYear()}
                            onChange={(event) => {
                                const year = Number(event.target.value);
                                const month =
                                    year === new Date().getFullYear()
                                        ? Math.min(visibleMonth.getMonth(), new Date().getMonth())
                                        : visibleMonth.getMonth();
                                setVisibleMonth(new Date(year, month, 1, 12));
                            }}
                            className="h-10 w-full min-w-0 appearance-none rounded-full bg-white px-8 text-center text-[13px] font-semibold outline-none"
                            aria-label={t('Yıl', 'Year')}
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#8e8e93]" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}
                        disabled={visibleMonth.getFullYear() === new Date().getFullYear() && visibleMonth.getMonth() === new Date().getMonth()}
                        className="grid size-10 place-items-center rounded-full text-[#6e6e73] transition hover:bg-white hover:text-[#007aff] disabled:opacity-25"
                        aria-label={t('Sonraki ay', 'Next month')}
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-7" aria-hidden="true">
                    {weekdays.map((weekday) => (
                        <span key={weekday} className="py-2 text-center text-[11px] font-semibold text-[#8e8e93]">
                            {weekday}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1" role="grid">
                    {days.map((day) => {
                        const dayKey = formatDateKey(day);
                        const selected = dayKey === selectedDate;
                        const future = dayKey > today;
                        const outsideMonth = day.getMonth() !== visibleMonth.getMonth();

                        return (
                            <button
                                key={dayKey}
                                type="button"
                                disabled={future}
                                onClick={() => onSelect(dayKey)}
                                className={`mx-auto grid size-10 place-items-center rounded-full text-[14px] font-medium transition active:scale-90 disabled:pointer-events-none disabled:opacity-20 ${
                                    selected
                                        ? 'bg-[#007aff] text-white shadow-[0_5px_16px_rgba(0,122,255,0.25)]'
                                        : outsideMonth
                                          ? 'text-[#c7c7cc] hover:bg-black/[0.045]'
                                          : 'text-[#1d1d1f] hover:bg-black/[0.045]'
                                }`}
                                aria-selected={selected}
                                role="gridcell"
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function ProfileSelect({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
    optionalLabel,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: typeof UserRound;
    placeholder: string;
    optionalLabel: string;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-medium text-[#6e6e73]">
                <span>{label}</span>
                <span className="text-[11px] font-normal text-[#8e8e93]">{optionalLabel}</span>
            </span>
            <span className="relative flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8">
                <Icon className="size-[17px] shrink-0 text-[#8e8e93]" />
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={`h-[52px] min-w-0 flex-1 appearance-none bg-transparent pr-7 text-[15px] font-medium outline-none ${value ? '' : 'text-[#8e8e93]'}`}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 size-4 text-[#8e8e93]" />
            </span>
        </label>
    );
}

function PlanDateNavigator({
    t,
    locale,
    range,
    date,
    onDateChange,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    range: PlanRange;
    date: string;
    onDateChange: (date: string) => void;
}) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const move = (direction: -1 | 1) => onDateChange(shiftPlanDate(date, range, direction));

    return (
        <div className="mt-3 flex items-center justify-center gap-2" aria-label={t('Tarih seçimi', 'Date selection')}>
            <button
                type="button"
                onClick={() => move(-1)}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-black/[0.07] bg-white text-[#6e6e73] shadow-[0_4px_16px_rgba(0,0,0,0.035)] transition hover:text-[#007aff] active:scale-95"
                aria-label={t('Önceki döneme git', 'Go to previous period')}
            >
                <ChevronLeft className="size-5" />
            </button>

            <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-black/[0.07] bg-white px-4 text-[13px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.035)] transition hover:border-[#007aff]/25 active:scale-[0.99] sm:max-w-sm sm:text-[14px]"
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
            >
                <CalendarDays className="size-[17px] shrink-0 text-[#007aff]" />
                <span className="truncate capitalize">{formatPlanPeriod(range, locale, date)}</span>
            </button>

            <button
                type="button"
                onClick={() => move(1)}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-black/[0.07] bg-white text-[#6e6e73] shadow-[0_4px_16px_rgba(0,0,0,0.035)] transition hover:text-[#007aff] active:scale-95"
                aria-label={t('Sonraki döneme git', 'Go to next period')}
            >
                <ChevronRight className="size-5" />
            </button>

            {calendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={date}
                    onCancel={() => setCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        onDateChange(selectedDate);
                        setCalendarOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function PlanCalendar({
    t,
    locale,
    selectedDate,
    onCancel,
    onSelect,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    selectedDate: string;
    onCancel: () => void;
    onSelect: (date: string) => void;
}) {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseDateKey(selectedDate)));
    const today = formatDateKey(new Date());
    const days = useMemo(() => calendarMonthDays(visibleMonth), [visibleMonth]);
    const weekdays = useMemo(() => {
        const monday = new Date(2026, 0, 5, 12);

        return Array.from({ length: 7 }, (_, index) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + index);
            return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(day);
        });
    }, [language]);

    const moveMonth = (direction: -1 | 1) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1, 12));
    };

    return (
        <div
            className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="plan-calendar-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[12px] font-semibold text-[#007aff]">{t('Tarih seç', 'Choose date')}</p>
                        <h2 id="plan-calendar-title" className="mt-1 text-[22px] font-semibold tracking-[-0.03em] capitalize">
                            {new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(visibleMonth)}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Takvimi kapat', 'Close calendar')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-full bg-black/[0.045] p-1">
                    <button
                        type="button"
                        onClick={() => moveMonth(-1)}
                        className="grid size-10 place-items-center rounded-full text-[#6e6e73] transition hover:bg-white hover:text-[#007aff]"
                        aria-label={t('Önceki ay', 'Previous month')}
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisibleMonth(startOfMonth(new Date()))}
                        className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#007aff] transition hover:bg-white"
                    >
                        {t('Bu ay', 'This month')}
                    </button>
                    <button
                        type="button"
                        onClick={() => moveMonth(1)}
                        className="grid size-10 place-items-center rounded-full text-[#6e6e73] transition hover:bg-white hover:text-[#007aff]"
                        aria-label={t('Sonraki ay', 'Next month')}
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-7" aria-hidden="true">
                    {weekdays.map((weekday) => (
                        <span key={weekday} className="py-2 text-center text-[11px] font-semibold text-[#8e8e93]">
                            {weekday}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1" role="grid">
                    {days.map((day) => {
                        const dayKey = formatDateKey(day);
                        const selected = dayKey === selectedDate;
                        const currentDay = dayKey === today;
                        const outsideMonth = day.getMonth() !== visibleMonth.getMonth();

                        return (
                            <button
                                key={dayKey}
                                type="button"
                                onClick={() => onSelect(dayKey)}
                                className={`mx-auto grid size-10 place-items-center rounded-full text-[14px] font-medium transition active:scale-90 ${
                                    selected
                                        ? 'bg-[#007aff] text-white shadow-[0_5px_16px_rgba(0,122,255,0.25)]'
                                        : currentDay
                                          ? 'text-[#007aff] ring-1 ring-[#007aff]'
                                          : outsideMonth
                                            ? 'text-[#c7c7cc] hover:bg-black/[0.045]'
                                            : 'text-[#1d1d1f] hover:bg-black/[0.045]'
                                }`}
                                aria-label={new Intl.DateTimeFormat(language, {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                }).format(day)}
                                aria-selected={selected}
                                role="gridcell"
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => onSelect(today)}
                    className="mt-5 h-11 w-full rounded-full border border-black/[0.07] bg-white text-[14px] font-semibold text-[#007aff] transition active:scale-[0.98]"
                >
                    {t('Bugüne Git', 'Go to Today')}
                </button>
            </section>
        </div>
    );
}

function PlanPanel({
    t,
    locale,
    goals,
    items,
    range,
    date,
    onNavigate,
    onAddItem,
    onRangeChange,
    onDateChange,
    onToggleItem,
    onRemoveItem,
}: {
    t: Translate;
    locale: 'tr' | 'en';
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    date: string;
    onNavigate: (section: PanelSection) => void;
    onAddItem: (item: Omit<PlanItem, 'id' | 'completed' | 'createdAt'>) => void;
    onRangeChange: (range: PlanRange) => void;
    onDateChange: (date: string) => void;
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
        () => items.filter((item) => isPlanItemInPeriod(item, range, date)).sort((first, second) => second.createdAt - first.createdAt),
        [date, items, range],
    );
    const completedCount = visibleItems.filter((item) => item.completed).length;
    const planProgress = visibleItems.length === 0 ? 0 : Math.round((completedCount / visibleItems.length) * 100);

    const addIndependentItem = (event: FormEvent) => {
        event.preventDefault();
        const title = independentTitle.trim();
        if (!title) return;

        onAddItem({ title, range, scheduledFor: date, source: 'independent' });
        setIndependentTitle('');
        setComposerOpen(false);
    };

    const addGoalBlock = (goalRecord: GoalRecord, block: BuildingBlock) => {
        onAddItem({
            title: block.title,
            range,
            scheduledFor: date,
            source: 'goal',
            goalId: goalRecord.id,
            buildingBlockId: block.id,
        });
    };

    const isBlockPlanned = (goalId: number, buildingBlockId: number) =>
        items.some((item) => item.goalId === goalId && item.buildingBlockId === buildingBlockId && isPlanItemInPeriod(item, range, date));

    return (
        <>
            <Head title={t('Planla', 'Plan')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="plan" onNavigate={onNavigate} />

                <main className="mx-auto max-w-5xl px-5 pt-24 pb-28 sm:px-8 sm:pt-36 sm:pb-16">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff]">{formatPlanPeriod(range, locale, date)}</p>
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

                    <div className="mt-9 pb-1">
                        <div className="grid w-full grid-cols-5 items-center rounded-full bg-black/[0.045] p-1">
                            {rangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onRangeChange(option.value)}
                                    className={`min-w-0 rounded-full px-1 py-2.5 text-[12px] font-medium transition sm:px-5 sm:text-[14px] ${isRangeOptionActive(option.value, range, date) ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PlanDateNavigator t={t} locale={locale} range={range} date={date} onDateChange={onDateChange} />

                    <section className="mt-6 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                        <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{planRangeLabel(range, t, date)}</h2>
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
                                <p className="mt-0.5 text-[12px] text-[#8e8e93]">{planRangeLabel(range, t, date)}</p>
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

function professionOptions(t: Translate): Array<{ value: string; label: string }> {
    return [
        { value: 'student', label: t('Öğrenci', 'Student') },
        { value: 'teacher', label: t('Öğretmen / Akademisyen', 'Teacher / Academic') },
        { value: 'software', label: t('Yazılım / Teknoloji', 'Software / Technology') },
        { value: 'engineer', label: t('Mühendis', 'Engineer') },
        { value: 'healthcare', label: t('Sağlık Çalışanı', 'Healthcare Professional') },
        { value: 'designer', label: t('Tasarımcı', 'Designer') },
        { value: 'finance', label: t('Finans / Muhasebe', 'Finance / Accounting') },
        { value: 'sales-marketing', label: t('Satış / Pazarlama', 'Sales / Marketing') },
        { value: 'entrepreneur', label: t('Girişimci / İşletme Sahibi', 'Entrepreneur / Business Owner') },
        { value: 'freelancer', label: t('Serbest Çalışan', 'Freelancer') },
        { value: 'public-sector', label: t('Kamu Çalışanı', 'Public Sector Employee') },
        { value: 'retired', label: t('Emekli', 'Retired') },
        { value: 'other', label: t('Diğer', 'Other') },
    ];
}

type CountryOption = {
    code: CountryCode;
    name: string;
    callingCode: string;
    flag: string;
};

function getCountryOptions(locale: 'tr' | 'en'): CountryOption[] {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const names = new Intl.DisplayNames([language], { type: 'region' });

    return COUNTRY_CODES.map((code) => ({
        code,
        name: names.of(code) ?? code,
        callingCode: getCountryCallingCode(code),
        flag: countryFlag(code),
    })).sort((first, second) => first.name.localeCompare(second.name, language));
}

function getCountryOption(country: CountryCode, locale: 'tr' | 'en'): CountryOption {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const names = new Intl.DisplayNames([language], { type: 'region' });

    return {
        code: country,
        name: names.of(country) ?? country,
        callingCode: getCountryCallingCode(country),
        flag: countryFlag(country),
    };
}

function countryFlag(country: CountryCode): string {
    return country
        .toUpperCase()
        .split('')
        .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
        .join('');
}

function isCountryCode(value: string): value is CountryCode {
    return COUNTRY_CODES.includes(value.toUpperCase() as CountryCode);
}

function normalizeStoredCountry(value: string): CountryCode | '' {
    const normalizedCode = value.trim().toUpperCase();
    if (isCountryCode(normalizedCode)) return normalizedCode;

    const normalizedName = value.trim().toLocaleLowerCase('tr-TR');
    for (const locale of ['tr', 'en'] as const) {
        const match = getCountryOptions(locale).find((country) => country.name.toLocaleLowerCase('tr-TR') === normalizedName);
        if (match) return match.code;
    }

    return '';
}

function getNationalPhoneLength(country: CountryCode): { min: number; max: number } {
    const mobileExample = getExampleNumber(country, mobilePhoneExamples);
    if (mobileExample) {
        const length = mobileExample.nationalNumber.length;
        return { min: length, max: length };
    }

    const validLengths: number[] = [];

    for (let length = 1; length <= 15; length += 1) {
        if (validatePhoneNumberLength(`1${'0'.repeat(length - 1)}`, country) === undefined) validLengths.push(length);
    }

    if (validLengths.length === 0) {
        return { min: 4, max: Math.max(4, 15 - getCountryCallingCode(country).length) };
    }

    return { min: Math.min(...validLengths), max: Math.max(...validLengths) };
}

function isNationalPhoneLengthValid(value: string, country: CountryCode): boolean {
    const length = getNationalPhoneLength(country);
    return value.length >= length.min && value.length <= length.max;
}

function normalizeNationalPhone(value: string, country: CountryCode | null): string {
    let digits = value.replace(/\D/g, '');

    if (country && value.trim().startsWith('+')) {
        const callingCode = getCountryCallingCode(country);
        if (digits.startsWith(callingCode)) digits = digits.slice(callingCode.length);
    }

    digits = digits.replace(/^0+/, '');
    if (!country) return digits.slice(0, 15);

    return digits.slice(0, getNationalPhoneLength(country).max);
}

function phoneLengthLabel(length: { min: number; max: number }, locale: 'tr' | 'en'): string {
    if (length.min === length.max) return locale === 'tr' ? `${length.max} rakam` : `${length.max} digits`;

    return locale === 'tr' ? `${length.min}–${length.max} rakam` : `${length.min}–${length.max} digits`;
}

function formatBirthDate(date: string, locale: 'tr' | 'en'): string {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(parseDateKey(date));
}

function calendarWeekdayLabels(language: string): string[] {
    const monday = new Date(2026, 0, 5, 12);

    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + index);
        return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(day);
    });
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

function planRangeLabel(range: PlanRange, t: Translate, date?: string): string {
    if ((range === 'today' || range === 'tomorrow') && date) {
        if (date === defaultDateForRange('today')) return t('Bugünün Planı', "Today's Plan");
        if (date === defaultDateForRange('tomorrow')) return t('Yarının Planı', "Tomorrow's Plan");

        return t('Günün Planı', 'Daily Plan');
    }

    return {
        today: t('Bugünün Planı', "Today's Plan"),
        tomorrow: t('Yarının Planı', "Tomorrow's Plan"),
        week: t('Haftalık Plan', 'Weekly Plan'),
        month: t('Aylık Plan', 'Monthly Plan'),
        year: t('Yıllık Plan', 'Yearly Plan'),
    }[range];
}

function formatPlanPeriod(range: PlanRange, locale: 'tr' | 'en', date: string): string {
    const language = locale === 'tr' ? 'tr-TR' : 'en-US';
    const selectedDate = parseDateKey(date);

    if (range === 'today' || range === 'tomorrow') {
        return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate);
    }

    if (range === 'week') {
        const firstDay = startOfWeek(selectedDate);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        const first = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(firstDay);
        const last = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' }).format(lastDay);

        return `${first} – ${last}`;
    }

    if (range === 'month') {
        return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(selectedDate);
    }

    return new Intl.DateTimeFormat(language, { year: 'numeric' }).format(selectedDate);
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function parseDateKey(date: string): Date {
    return new Date(`${date}T12:00:00`);
}

function isDateKey(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parseDateKey(date).getTime());
}

function defaultDateForRange(range: PlanRange): string {
    const date = new Date();
    if (range === 'tomorrow') date.setDate(date.getDate() + 1);

    return formatDateKey(date);
}

function startOfWeek(date: Date): Date {
    const firstDay = new Date(date);
    firstDay.setDate(date.getDate() - ((date.getDay() + 6) % 7));

    return firstDay;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function calendarMonthDays(month: Date): Date[] {
    const firstDay = startOfMonth(month);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
        const day = new Date(calendarStart);
        day.setDate(calendarStart.getDate() + index);
        return day;
    });
}

function shiftPlanDate(date: string, range: PlanRange, direction: -1 | 1): string {
    const shiftedDate = parseDateKey(date);

    if (range === 'week') shiftedDate.setDate(shiftedDate.getDate() + direction * 7);
    else if (range === 'month') shiftedDate.setMonth(shiftedDate.getMonth() + direction);
    else if (range === 'year') shiftedDate.setFullYear(shiftedDate.getFullYear() + direction);
    else shiftedDate.setDate(shiftedDate.getDate() + direction);

    return formatDateKey(shiftedDate);
}

function isRangeOptionActive(option: PlanRange, range: PlanRange, date: string): boolean {
    if (option === 'today') return (range === 'today' || range === 'tomorrow') && date === defaultDateForRange('today');
    if (option === 'tomorrow') return (range === 'today' || range === 'tomorrow') && date === defaultDateForRange('tomorrow');

    return option === range;
}

function isPlanItemInPeriod(item: PlanItem, range: PlanRange, date: string): boolean {
    if (range === 'today' || range === 'tomorrow') {
        return (item.range === 'today' || item.range === 'tomorrow') && item.scheduledFor === date;
    }

    if (item.range !== range) return false;

    const scheduledDate = parseDateKey(item.scheduledFor);
    const selectedDate = parseDateKey(date);

    if (range === 'week') {
        return formatDateKey(startOfWeek(scheduledDate)) === formatDateKey(startOfWeek(selectedDate));
    }

    if (range === 'month') {
        return scheduledDate.getFullYear() === selectedDate.getFullYear() && scheduledDate.getMonth() === selectedDate.getMonth();
    }

    return scheduledDate.getFullYear() === selectedDate.getFullYear();
}

function loadStoredGoals(): GoalRecord[] {
    return loadStoredArray<GoalRecord>(DEMO_GOALS_STORAGE_KEY);
}

function loadStoredPlanItems(): PlanItem[] {
    return loadStoredArray<PlanItem>(DEMO_PLAN_STORAGE_KEY).map((item) => {
        if (isDateKey(item.scheduledFor)) return item;

        const legacyDate = new Date(Number.isFinite(item.createdAt) ? item.createdAt : Date.now());
        if (item.range === 'tomorrow') legacyDate.setDate(legacyDate.getDate() + 1);

        return { ...item, scheduledFor: formatDateKey(legacyDate) };
    });
}

function loadStoredProfile(): ProfileData {
    const emptyProfile = { name: '', email: '', phone: '', birthDate: '', country: '', profession: '', avatar: '' };
    if (typeof window === 'undefined') return emptyProfile;

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(DEMO_PROFILE_STORAGE_KEY) ?? 'null');
        if (!value || typeof value !== 'object') return emptyProfile;

        const profile = value as Partial<ProfileData>;
        const country = normalizeStoredCountry(typeof profile.country === 'string' ? profile.country : '');
        return {
            name: typeof profile.name === 'string' ? profile.name : '',
            email: typeof profile.email === 'string' ? profile.email : '',
            phone: normalizeNationalPhone(typeof profile.phone === 'string' ? profile.phone : '', country || null),
            birthDate: typeof profile.birthDate === 'string' ? profile.birthDate : '',
            country,
            profession: typeof profile.profession === 'string' ? profile.profession : '',
            avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
        };
    } catch {
        return emptyProfile;
    }
}

function loadStoredSettings(defaultLanguage: 'tr' | 'en'): SettingsData {
    const defaultSettings: SettingsData = { appearance: 'light', language: defaultLanguage };
    if (typeof window === 'undefined') return defaultSettings;

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(DEMO_SETTINGS_STORAGE_KEY) ?? 'null');
        if (!value || typeof value !== 'object') return defaultSettings;

        const settings = value as Partial<SettingsData>;
        return {
            appearance: settings.appearance === 'dark' ? 'dark' : 'light',
            language: settings.language === 'en' || settings.language === 'tr' ? settings.language : defaultLanguage,
        };
    } catch {
        return defaultSettings;
    }
}

function readProfileImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('The profile image could not be read.'));
        reader.onload = () => {
            const source = String(reader.result);
            const image = new Image();
            image.onerror = () => reject(new Error('The selected file is not a valid image.'));
            image.onload = () => resolve(source);
            image.src = source;
        };
        reader.readAsDataURL(file);
    });
}

function cropProfileImage(source: string, dimensions: ImageDimensions, scale: number, position: CropPosition): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onerror = () => reject(new Error('The profile image could not be processed.'));
        image.onload = () => {
            const sourceSize = PROFILE_CROP_SIZE / scale;
            const sourceX = dimensions.width / 2 - position.x / scale - sourceSize / 2;
            const sourceY = dimensions.height / 2 - position.y / scale - sourceSize / 2;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
                reject(new Error('The profile image could not be processed.'));
                return;
            }

            canvas.width = 512;
            canvas.height = 512;
            context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        image.src = source;
    });
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
