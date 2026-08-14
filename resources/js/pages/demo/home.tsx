import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { getIntlLocale, getLocaleDirection, isLocale, persistLocale, SUPPORTED_LOCALES, translate, type Locale, type Translate } from '@/i18n';
import { Head } from '@inertiajs/react';
import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, validatePhoneNumberLength, type CountryCode } from 'libphonenumber-js';
import mobilePhoneExamples from 'libphonenumber-js/examples.mobile.json';
import {
    ArrowLeft,
    ArrowRight,
    Bell,
    BellRing,
    BookOpen,
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
    Clock3,
    FileDown,
    Globe2,
    GraduationCap,
    GripVertical,
    HeartPulse,
    Languages,
    Layers3,
    ListTodo,
    LockKeyhole,
    Mail,
    MessageCircle,
    Moon,
    NotebookPen,
    Pencil,
    Phone,
    Plus,
    Rocket,
    Search,
    Settings2,
    Shapes,
    Sparkles,
    Star,
    Sun,
    Target,
    Trash2,
    TrendingUp,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type Priority = 'urgent' | 'very-important' | 'important' | 'has-time';
type GoalCategory = 'health' | 'work' | 'venture' | 'skill' | 'education' | 'other';
type EducationLevel = '' | 'high-school' | 'associate' | 'bachelor' | 'master' | 'doctorate';
type SavedEducationLevel = Exclude<EducationLevel, ''>;

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
    category: GoalCategory;
    createdAt: number;
};

type PanelSection = 'overview' | 'goals' | 'plan' | 'notes' | 'library' | 'profile';
type PlanRange = 'today' | 'tomorrow' | 'week' | 'month' | 'year';
type BookStatus = 'reading' | 'not-started' | 'finished';
type ReportPlanPeriod = 'day' | 'range' | 'week' | 'month' | 'year';
type ReportSection = 'goals' | 'plans' | 'library' | 'saved-notes';

type PlanItem = {
    id: number;
    title: string;
    range: PlanRange;
    source: 'goal' | 'independent' | 'reminder';
    goalId?: number;
    buildingBlockId?: number;
    completed: boolean;
    createdAt: number;
    scheduledFor: string;
    priority: Priority;
    sortOrder?: number;
    reminderAt?: string;
    reminderDeliveredAt?: number;
};

type NoteRecord = {
    id: number;
    title: string;
    content: string;
    goalId?: number;
    buildingBlockId?: number;
    createdAt: number;
};

type BookRecord = {
    id: number;
    title: string;
    author: string;
    status: BookStatus;
    comment: string;
    rating: number;
    sortOrder: number;
    createdAt: number;
    finishedAt?: number;
};

type ProfileData = {
    name: string;
    username: string;
    email: string;
    phone: string;
    birthDate: string;
    country: string;
    profession: string;
    about: string;
    educations: EducationRecord[];
    avatar: string;
};

type EducationRecord = {
    id: number;
    level: SavedEducationLevel;
    university: string;
    department: string;
};

type UniversityOption = {
    name: string;
    country: string;
    countryCode: string;
};

type SettingsData = {
    appearance: 'light' | 'dark';
    language: Locale;
    carryOverIncompletePlans: boolean;
    carryOverPreferenceSet: boolean;
};

type CropPosition = {
    x: number;
    y: number;
};

type ImageDimensions = {
    width: number;
    height: number;
};

const TOTAL_STEPS = 7;
const DEMO_GOALS_STORAGE_KEY = 'fuevor.demo.goals';
const DEMO_PLAN_STORAGE_KEY = 'fuevor.demo.plan-items';
const DEMO_NOTES_STORAGE_KEY = 'fuevor.demo.notes';
const DEMO_BOOKS_STORAGE_KEY = 'fuevor.demo.books';
const DEMO_PROFILE_STORAGE_KEY = 'fuevor.demo.profile';
const DEMO_SETTINGS_STORAGE_KEY = 'fuevor.demo.settings';
const COUNTRY_CODES = getCountries();

export default function DemoHome() {
    const { locale: detectedLocale } = useLocale();
    const [settings, setSettings] = useState<SettingsData>(() => loadStoredSettings(detectedLocale));
    const locale = settings.language;
    const t: Translate = (turkish, english) => translate(locale, turkish, english);
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('');
    const [category, setCategory] = useState<GoalCategory | null>(null);
    const [gain, setGain] = useState('');
    const [buildingBlocks, setBuildingBlocks] = useState<BuildingBlock[]>([{ id: 1, title: '' }]);
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState<Priority | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [goals, setGoals] = useState<GoalRecord[]>(loadStoredGoals);
    const [showPanel, setShowPanel] = useState(() => loadStoredGoals().length > 0);
    const [panelSection, setPanelSection] = useState<PanelSection>('overview');
    const [profileOpen, setProfileOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [planItems, setPlanItems] = useState<PlanItem[]>(loadStoredPlanItems);
    const [notes, setNotes] = useState<NoteRecord[]>(loadStoredNotes);
    const [books, setBooks] = useState<BookRecord[]>(loadStoredBooks);
    const [planRange, setPlanRange] = useState<PlanRange>('today');
    const [planDate, setPlanDate] = useState(() => formatDateKey(new Date()));
    const [profile, setProfile] = useState<ProfileData>(loadStoredProfile);
    const [activeReminder, setActiveReminder] = useState<PlanItem | null>(null);
    const [standaloneReminderDate, setStandaloneReminderDate] = useState<string | null>(null);
    const [completedGoalId, setCompletedGoalId] = useState<number | null>(null);
    const nextBlockId = useRef(2);
    const nextPlanItemId = useRef(Math.max(0, ...planItems.map((item) => item.id)) + 1);
    const nextNoteId = useRef(Math.max(0, ...notes.map((note) => note.id)) + 1);
    const nextBookId = useRef(Math.max(0, ...books.map((book) => book.id)) + 1);

    useEffect(() => {
        storeDemoData(DEMO_GOALS_STORAGE_KEY, goals);
    }, [goals]);

    useEffect(() => {
        storeDemoData(DEMO_PLAN_STORAGE_KEY, planItems);
    }, [planItems]);

    useEffect(() => {
        if (activeReminder) return;

        const deliverDueReminder = () => {
            const now = Date.now();
            const dueReminder = planItems
                .filter(
                    (item) =>
                        !item.completed &&
                        !item.reminderDeliveredAt &&
                        typeof item.reminderAt === 'string' &&
                        !Number.isNaN(new Date(item.reminderAt).getTime()) &&
                        new Date(item.reminderAt).getTime() <= now,
                )
                .sort((first, second) => String(first.reminderAt).localeCompare(String(second.reminderAt)))[0];

            if (!dueReminder) return;

            setActiveReminder(dueReminder);
            setPlanItems((currentItems) => currentItems.map((item) => (item.id === dueReminder.id ? { ...item, reminderDeliveredAt: now } : item)));

            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                    new Notification(`Fuevor · ${translate(locale, 'Anımsatıcı', 'Reminder')}`, {
                        body: dueReminder.title,
                        icon: '/fuevor-favicon.svg?v=3',
                    });
                } catch {
                    // The in-app alert remains available when system notifications cannot be displayed.
                }
            }
        };

        deliverDueReminder();
        const timer = window.setInterval(deliverDueReminder, 30_000);

        return () => window.clearInterval(timer);
    }, [activeReminder, locale, planItems]);

    useEffect(() => {
        if (!settings.carryOverIncompletePlans) return;

        const today = formatDateKey(new Date());
        setPlanItems((currentItems) => {
            let changed = false;
            const nextItems = currentItems.map((item) => {
                const isDailyPlan = item.range === 'today' || item.range === 'tomorrow';
                if (!isDailyPlan || item.completed || item.scheduledFor >= today) return item;

                changed = true;
                return { ...item, range: 'today' as const, scheduledFor: today, sortOrder: undefined };
            });

            return changed ? nextItems : currentItems;
        });
    }, [settings.carryOverIncompletePlans]);

    useEffect(() => {
        setPlanItems((currentItems) => {
            let changed = false;
            const nextItems = currentItems.map((item) => {
                if (item.source !== 'goal' || item.goalId === undefined) return item;
                const goalPriority = goals.find((goalRecord) => goalRecord.id === item.goalId)?.priority;
                if (!goalPriority || item.priority === goalPriority) return item;

                changed = true;
                return { ...item, priority: goalPriority };
            });

            return changed ? nextItems : currentItems;
        });
    }, [goals]);

    useEffect(() => {
        storeDemoData(DEMO_NOTES_STORAGE_KEY, notes);
    }, [notes]);

    useEffect(() => {
        storeDemoData(DEMO_BOOKS_STORAGE_KEY, books);
    }, [books]);

    useEffect(() => {
        storeDemoData(DEMO_PROFILE_STORAGE_KEY, profile);
    }, [profile]);

    useEffect(() => {
        storeDemoData(DEMO_SETTINGS_STORAGE_KEY, settings);
        document.documentElement.dataset.demoTheme = settings.appearance;
        persistLocale(settings.language);
    }, [settings]);

    useEffect(() => {
        if (!showPanel) return;

        const resetHorizontalPosition = () => {
            document.documentElement.scrollLeft = 0;
            document.body.scrollLeft = 0;
        };
        resetHorizontalPosition();
        const frame = window.requestAnimationFrame(resetHorizontalPosition);

        return () => window.cancelAnimationFrame(frame);
    }, [panelSection, profileOpen, showPanel]);

    const completed = step > TOTAL_STEPS;
    const progress = completed ? 100 : ((step - 1) / TOTAL_STEPS) * 100;
    const validBlocks = useMemo(() => buildingBlocks.filter((block) => block.title.trim() !== ''), [buildingBlocks]);

    const canContinue = useMemo(() => {
        if (step === 1) return goal.trim() !== '';
        if (step === 2) return category !== null;
        if (step === 3) return gain.trim() !== '';
        if (step === 4 || step === 5) return validBlocks.length > 0 && validBlocks.length === buildingBlocks.length;
        if (step === 6) return deadline !== '';
        if (step === 7) return priority !== null;

        return false;
    }, [buildingBlocks.length, category, deadline, gain, goal, priority, step, validBlocks.length]);

    const continueFlow = () => {
        if (!canContinue) return;

        if (step === 4) {
            setBuildingBlocks(validBlocks);
        }

        if (step === TOTAL_STEPS && priority && category) {
            setGoals((currentGoals) => [
                ...currentGoals,
                {
                    id: Date.now(),
                    title: goal.trim(),
                    gain: gain.trim(),
                    buildingBlocks: buildingBlocks.map((block) => ({ ...block, completed: false })),
                    deadline,
                    priority,
                    category,
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
        setCategory(null);
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
        const linkedGoal = item.goalId === undefined ? undefined : goals.find((goalRecord) => goalRecord.id === item.goalId);
        const completesGoal =
            completed &&
            linkedGoal !== undefined &&
            item.buildingBlockId !== undefined &&
            linkedGoal.buildingBlocks.every((block) => block.id === item.buildingBlockId || block.completed);
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

        if (completesGoal) setCompletedGoalId(linkedGoal.id);
    };

    const toggleGoalBlock = (goalId: number, buildingBlockId: number) => {
        const selectedGoal = goals.find((goalRecord) => goalRecord.id === goalId);
        const block = selectedGoal?.buildingBlocks.find((item) => item.id === buildingBlockId);
        if (!selectedGoal || !block) return;

        const completed = !block.completed;
        const completesGoal = completed && selectedGoal.buildingBlocks.every((item) => item.id === buildingBlockId || item.completed);
        setGoals((currentGoals) =>
            currentGoals.map((goalRecord) =>
                goalRecord.id === goalId
                    ? {
                          ...goalRecord,
                          buildingBlocks: goalRecord.buildingBlocks.map((item) => (item.id === buildingBlockId ? { ...item, completed } : item)),
                      }
                    : goalRecord,
            ),
        );
        setPlanItems((currentItems) =>
            currentItems.map((item) => (item.goalId === goalId && item.buildingBlockId === buildingBlockId ? { ...item, completed } : item)),
        );
        if (completesGoal) setCompletedGoalId(goalId);
    };

    const updateGoal = (goalId: number, updates: Pick<GoalRecord, 'title' | 'gain' | 'deadline' | 'priority' | 'category'>) => {
        setGoals((currentGoals) => currentGoals.map((goalRecord) => (goalRecord.id === goalId ? { ...goalRecord, ...updates } : goalRecord)));
    };

    const addGoalBlockToGoal = (goalId: number, title: string) => {
        setGoals((currentGoals) =>
            currentGoals.map((goalRecord) => {
                if (goalRecord.id !== goalId) return goalRecord;

                const buildingBlock: BuildingBlock = {
                    id: Math.max(0, ...goalRecord.buildingBlocks.map((block) => block.id)) + 1,
                    title,
                    completed: false,
                };
                return { ...goalRecord, buildingBlocks: [...goalRecord.buildingBlocks, buildingBlock] };
            }),
        );
    };

    const removePlanItem = (itemId: number) => {
        setPlanItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    };

    const reorderPlanItems = (orderedIds: number[]) => {
        const orderById = new Map(orderedIds.map((id, index) => [id, index]));
        setPlanItems((currentItems) =>
            currentItems.map((item) => {
                const sortOrder = orderById.get(item.id);
                return sortOrder === undefined ? item : { ...item, sortOrder };
            }),
        );
    };

    const updatePlanReminder = (itemId: number, reminderAt?: string) => {
        setPlanItems((currentItems) =>
            currentItems.map((item) => {
                if (item.id !== itemId) return item;
                if (reminderAt) return { ...item, reminderAt, reminderDeliveredAt: undefined };
                return { ...item, reminderAt: undefined, reminderDeliveredAt: undefined };
            }),
        );
    };

    const addStandaloneReminder = (title: string, date: string, time: string) => {
        addPlanItem({
            title,
            range: date === defaultDateForRange('tomorrow') ? 'tomorrow' : 'today',
            scheduledFor: date,
            source: 'reminder',
            priority: 'important',
            reminderAt: `${date}T${time}`,
        });
        setPlanDate(date);
        setPlanRange(date === defaultDateForRange('tomorrow') ? 'tomorrow' : 'today');
        setStandaloneReminderDate(null);
    };

    const addNote = (note: Omit<NoteRecord, 'id' | 'createdAt'>) => {
        setNotes((currentNotes) => [
            {
                ...note,
                id: nextNoteId.current++,
                createdAt: Date.now(),
            },
            ...currentNotes,
        ]);
    };

    const removeNote = (noteId: number) => {
        setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    };

    const updateNote = (noteId: number, note: Omit<NoteRecord, 'id' | 'createdAt'>) => {
        setNotes((currentNotes) => currentNotes.map((currentNote) => (currentNote.id === noteId ? { ...currentNote, ...note } : currentNote)));
    };

    const addBook = (book: Pick<BookRecord, 'title' | 'author' | 'status' | 'comment' | 'rating'>) => {
        setBooks((currentBooks) => {
            const nextSortOrder = Math.max(-1, ...currentBooks.filter((item) => item.status === book.status).map((item) => item.sortOrder)) + 1;
            return [
                ...currentBooks,
                {
                    ...book,
                    id: nextBookId.current++,
                    sortOrder: nextSortOrder,
                    createdAt: Date.now(),
                    finishedAt: book.status === 'finished' ? Date.now() : undefined,
                },
            ];
        });
    };

    const updateBook = (bookId: number, updates: Pick<BookRecord, 'title' | 'author' | 'status' | 'comment' | 'rating'>) => {
        setBooks((currentBooks) => {
            const selectedBook = currentBooks.find((book) => book.id === bookId);
            if (!selectedBook) return currentBooks;

            const statusChanged = selectedBook.status !== updates.status;
            const nextSortOrder = statusChanged
                ? Math.max(-1, ...currentBooks.filter((book) => book.status === updates.status).map((book) => book.sortOrder)) + 1
                : selectedBook.sortOrder;

            return currentBooks.map((book) =>
                book.id === bookId
                    ? {
                          ...book,
                          ...updates,
                          sortOrder: nextSortOrder,
                          finishedAt: updates.status === 'finished' ? (book.finishedAt ?? Date.now()) : undefined,
                      }
                    : book,
            );
        });
    };

    const removeBook = (bookId: number) => {
        setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
    };

    const reorderBooks = (status: BookStatus, orderedIds: number[]) => {
        const orderById = new Map(orderedIds.map((id, index) => [id, index]));
        setBooks((currentBooks) =>
            currentBooks.map((book) => {
                if (book.status !== status) return book;
                const sortOrder = orderById.get(book.id);
                return sortOrder === undefined ? book : { ...book, sortOrder };
            }),
        );
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

    const navigatePanel = (section: PanelSection) => {
        if (section === 'profile') {
            setProfileOpen(true);
            return;
        }

        setProfileOpen(false);
        setPanelSection(section);
    };
    const overallProgress = calculateOverallProgress(goals);

    const profileSheet = profileOpen ? (
        <ProfilePanel
            t={t}
            locale={locale}
            profile={profile}
            settings={settings}
            overallProgress={overallProgress}
            onClose={() => setProfileOpen(false)}
            onExportReport={() => {
                setProfileOpen(false);
                setReportOpen(true);
            }}
            onSave={setProfile}
            onSettingsChange={setSettings}
        />
    ) : null;
    const reminderAlert = activeReminder ? (
        <ReminderAlert
            t={t}
            item={activeReminder}
            onDismiss={() => setActiveReminder(null)}
            onComplete={() => {
                togglePlanItem(activeReminder.id);
                setActiveReminder(null);
            }}
        />
    ) : null;
    const standaloneReminderDialog = standaloneReminderDate ? (
        <StandaloneReminderDialog
            key={standaloneReminderDate}
            t={t}
            locale={locale}
            initialDate={standaloneReminderDate}
            onCancel={() => setStandaloneReminderDate(null)}
            onSave={addStandaloneReminder}
        />
    ) : null;
    const completedGoal = completedGoalId === null ? undefined : goals.find((goalRecord) => goalRecord.id === completedGoalId);
    const goalCompletionDialog = completedGoal ? (
        <GoalCompletionDialog
            t={t}
            goals={goals}
            completedGoal={completedGoal}
            onClose={() => setCompletedGoalId(null)}
            onOpenGoals={() => {
                setCompletedGoalId(null);
                setProfileOpen(false);
                setPanelSection('goals');
            }}
        />
    ) : null;
    const reportDialog = reportOpen ? (
        <ReportExportDialog
            t={t}
            locale={locale}
            goals={goals}
            items={planItems}
            books={books}
            notes={notes}
            profile={profile}
            onClose={() => setReportOpen(false)}
        />
    ) : null;

    if (showPanel) {
        if (panelSection === 'overview') {
            return (
                <>
                    <OverviewPanel
                        t={t}
                        locale={locale}
                        goals={goals}
                        items={planItems}
                        range={planRange}
                        date={planDate}
                        onNavigate={navigatePanel}
                        onCreateGoal={startNewGoal}
                        onRangeChange={changePlanRange}
                        onDateChange={changePlanDate}
                        onToggleItem={togglePlanItem}
                        onCreateReminder={setStandaloneReminderDate}
                        onToggleGoalBlock={toggleGoalBlock}
                        onUpdateGoal={updateGoal}
                        onAddGoalBlock={addGoalBlockToGoal}
                    />
                    {profileSheet}
                    {reminderAlert}
                    {standaloneReminderDialog}
                    {goalCompletionDialog}
                    {reportDialog}
                </>
            );
        }

        if (panelSection === 'plan') {
            return (
                <>
                    <PlanPanel
                        t={t}
                        locale={locale}
                        goals={goals}
                        items={planItems}
                        range={planRange}
                        date={planDate}
                        onNavigate={navigatePanel}
                        onRangeChange={changePlanRange}
                        onDateChange={changePlanDate}
                        onAddItem={addPlanItem}
                        settings={settings}
                        onSettingsChange={setSettings}
                        onToggleItem={togglePlanItem}
                        onRemoveItem={removePlanItem}
                        onReorderItems={reorderPlanItems}
                        onUpdateReminder={updatePlanReminder}
                        onCreateReminder={setStandaloneReminderDate}
                    />
                    {profileSheet}
                    {reminderAlert}
                    {standaloneReminderDialog}
                    {goalCompletionDialog}
                    {reportDialog}
                </>
            );
        }

        if (panelSection === 'notes') {
            return (
                <>
                    <NotesPanel
                        t={t}
                        locale={locale}
                        goals={goals}
                        notes={notes}
                        onNavigate={navigatePanel}
                        onAddNote={addNote}
                        onUpdateNote={updateNote}
                        onRemoveNote={removeNote}
                    />
                    {profileSheet}
                    {reminderAlert}
                    {standaloneReminderDialog}
                    {goalCompletionDialog}
                    {reportDialog}
                </>
            );
        }

        if (panelSection === 'library') {
            return (
                <>
                    <LibraryPanel
                        t={t}
                        locale={locale}
                        goals={goals}
                        books={books}
                        onNavigate={navigatePanel}
                        onAddBook={addBook}
                        onUpdateBook={updateBook}
                        onRemoveBook={removeBook}
                        onReorderBooks={reorderBooks}
                    />
                    {profileSheet}
                    {reminderAlert}
                    {standaloneReminderDialog}
                    {goalCompletionDialog}
                    {reportDialog}
                </>
            );
        }

        return (
            <>
                <GoalsPanel
                    t={t}
                    locale={locale}
                    goals={goals}
                    onCreateGoal={startNewGoal}
                    onNavigate={navigatePanel}
                    onToggleBlock={toggleGoalBlock}
                    onUpdateGoal={updateGoal}
                    onAddBlock={addGoalBlockToGoal}
                />
                {profileSheet}
                {reminderAlert}
                {standaloneReminderDialog}
                {goalCompletionDialog}
                {reportDialog}
            </>
        );
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
                                    {step === 2 && <CategoryStep t={t} value={category} onChange={setCategory} />}
                                    {step === 3 && <GainStep t={t} value={gain} onChange={setGain} />}
                                    {step === 4 && (
                                        <BuildingBlocksStep
                                            t={t}
                                            blocks={buildingBlocks}
                                            onAdd={addBuildingBlock}
                                            onChange={updateBuildingBlock}
                                            onRemove={removeBuildingBlock}
                                        />
                                    )}
                                    {step === 5 && (
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
                                    {step === 6 && <DeadlineStep t={t} locale={locale} value={deadline} onChange={setDeadline} />}
                                    {step === 7 && <PriorityStep t={t} value={priority} onChange={setPriority} />}
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
    onCreateReminder,
    onToggleGoalBlock,
    onUpdateGoal,
    onAddGoalBlock,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    date: string;
    onNavigate: (section: PanelSection) => void;
    onCreateGoal: () => void;
    onRangeChange: (range: PlanRange) => void;
    onDateChange: (date: string) => void;
    onToggleItem: (id: number) => void;
    onCreateReminder: (date: string) => void;
    onToggleGoalBlock: (goalId: number, buildingBlockId: number) => void;
    onUpdateGoal: (goalId: number, updates: Pick<GoalRecord, 'title' | 'gain' | 'deadline' | 'priority' | 'category'>) => void;
    onAddGoalBlock: (goalId: number, title: string) => void;
}) {
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const periodItems = useMemo(() => sortPlanItems(items.filter((item) => isPlanItemInPeriod(item, range, date))), [date, items, range]);
    const priorityGoals = useMemo(
        () =>
            [...goals]
                .filter((goalRecord) => goalRecord.priority === 'urgent' || goalRecord.priority === 'very-important')
                .sort((first, second) => PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt)
                .slice(0, 3),
        [goals],
    );
    const upcomingGoals = useMemo(() => [...goals].sort((first, second) => first.deadline.localeCompare(second.deadline)).slice(0, 3), [goals]);
    const overallProgress = calculateOverallProgress(goals);
    const periodCompleted = periodItems.filter((item) => item.completed).length;
    const periodProgress = periodItems.length === 0 ? 0 : Math.round((periodCompleted / periodItems.length) * 100);
    const selectedGoal = selectedGoalId === null ? undefined : goals.find((goalRecord) => goalRecord.id === selectedGoalId);
    return (
        <>
            <Head title={t('Genel Bakış', 'Overview')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] w-full max-w-full min-w-0 overflow-x-clip bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="overview" goals={goals} onNavigate={onNavigate} />

                <main className="mx-auto w-full max-w-5xl min-w-0 px-5 pt-24 pb-28 sm:px-8 sm:pt-36 sm:pb-16">
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

                    <section className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3" aria-label={t('Özet bilgiler', 'Summary information')}>
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

                    <PlanPeriodControl
                        t={t}
                        locale={locale}
                        range={range}
                        date={date}
                        className="mt-4"
                        onRangeChange={onRangeChange}
                        onDateChange={onDateChange}
                        onAddReminder={onCreateReminder}
                    />

                    <GoalRoadmap t={t} goals={goals} onSelect={setSelectedGoalId} className="mt-5" />

                    <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <section className="min-w-0 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
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
                                                        {sourceGoal?.title ??
                                                            (item.source === 'reminder'
                                                                ? t('Harici anımsatıcı', 'Standalone reminder')
                                                                : t('Bağımsız plan', 'Independent plan'))}
                                                    </p>
                                                    {item.reminderAt && (
                                                        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] font-semibold text-[#007aff]">
                                                            <BellRing className="size-3.5 shrink-0" />
                                                            {formatReminderDateTime(item.reminderAt, locale)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <div className="min-w-0 space-y-5">
                            <section className="min-w-0 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.055] px-5 py-5">
                                    <h2 className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.02em]">
                                        {t('Öncelikli Hedefler', 'Priority Goals')}
                                    </h2>
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
                                                className={`flex min-w-0 items-center gap-3 overflow-hidden px-5 py-4 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
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

                            <section className="min-w-0 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                                <div className="border-b border-black/[0.055] px-5 py-5">
                                    <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Yaklaşan Tarihler', 'Upcoming Dates')}</h2>
                                </div>
                                {upcomingGoals.map((goalRecord, index) => (
                                    <div
                                        key={goalRecord.id}
                                        className={`flex min-w-0 items-center gap-3 overflow-hidden px-5 py-4 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                    >
                                        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#f2f2f7] text-[#6e6e73]">
                                            <CalendarDays className="size-4" />
                                        </span>
                                        <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{goalRecord.title}</p>
                                        <span className="shrink-0 text-[11px] font-medium whitespace-nowrap text-[#8e8e93]">
                                            {formatGoalDate(goalRecord.deadline, locale)}
                                        </span>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </div>
                </main>
            </div>

            {selectedGoal && (
                <GoalDetailPanel
                    t={t}
                    locale={locale}
                    goal={selectedGoal}
                    onClose={() => setSelectedGoalId(null)}
                    onToggleBlock={(buildingBlockId) => onToggleGoalBlock(selectedGoal.id, buildingBlockId)}
                    onUpdate={(updates) => onUpdateGoal(selectedGoal.id, updates)}
                    onAddBlock={(title) => onAddGoalBlock(selectedGoal.id, title)}
                />
            )}
        </>
    );
}

function ReportExportDialog({
    t,
    locale,
    goals,
    items,
    books,
    notes,
    profile,
    onClose,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    items: PlanItem[];
    books: BookRecord[];
    notes: NoteRecord[];
    profile: ProfileData;
    onClose: () => void;
}) {
    const today = formatDateKey(new Date());
    const [sections, setSections] = useState<Record<ReportSection, boolean>>({
        goals: true,
        plans: true,
        library: true,
        'saved-notes': false,
    });
    const [planPeriod, setPlanPeriod] = useState<ReportPlanPeriod>('day');
    const [selectedDate, setSelectedDate] = useState(today);
    const [rangeStart, setRangeStart] = useState(today);
    const [rangeEnd, setRangeEnd] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [includeWritingArea, setIncludeWritingArea] = useState(true);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    const sectionOptions: Array<{ value: ReportSection; label: string; icon: typeof Target; count: number }> = [
        { value: 'goals', label: t('Hedefler', 'Goals'), icon: Target, count: goals.length },
        { value: 'plans', label: t('Planlar', 'Plan'), icon: ListTodo, count: items.length },
        { value: 'library', label: t('Kitaplık', 'Library'), icon: BookOpen, count: books.length },
        { value: 'saved-notes', label: t('Kayıtlı Notlar', 'Saved Notes'), icon: NotebookPen, count: notes.length },
    ];
    const periodOptions: Array<{ value: ReportPlanPeriod; label: string }> = [
        { value: 'day', label: t('Günlük', 'Daily Plan') },
        { value: 'range', label: t('Tarih Aralığı', 'Date Range') },
        { value: 'week', label: t('Haftalık', 'Weekly Plan') },
        { value: 'month', label: t('Aylık', 'Monthly Plan') },
        { value: 'year', label: t('Yıllık', 'Yearly Plan') },
    ];
    const canExport = Object.values(sections).some(Boolean) || includeWritingArea;

    const exportReport = (event: FormEvent) => {
        event.preventDefault();
        if (!canExport) return;

        openFuevorReport({
            t,
            locale,
            goals,
            items,
            books,
            notes,
            profile,
            sections,
            planPeriod,
            selectedDate,
            rangeStart,
            rangeEnd,
            selectedMonth,
            selectedYear,
            includeWritingArea,
        });
    };

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-0 backdrop-blur-md sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <form
                onSubmit={exportReport}
                role="dialog"
                aria-modal="true"
                aria-labelledby="demo-report-title"
                className="demo-step-enter max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] border border-black/[0.08] bg-[#f9f9fb] shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:rounded-[30px]"
            >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/[0.06] bg-[#f9f9fb]/90 px-5 py-5 backdrop-blur-2xl sm:px-7">
                    <div>
                        <p className="text-[12px] font-semibold text-[#007aff]">Fuevor</p>
                        <h2 id="demo-report-title" className="mt-1 text-[24px] font-semibold tracking-[-0.035em]">
                            {t('PDF Raporu', 'PDF Report')}
                        </h2>
                        <p className="mt-1.5 text-[12px] leading-5 text-[#8e8e93]">
                            {t('Rapora eklenecek bölümleri ve plan dönemini seç.', 'Select the sections and plan period to include.')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.045] text-[#6e6e73] transition hover:bg-black/[0.08]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[18px]" />
                    </button>
                </div>

                <div className="space-y-7 px-5 py-6 sm:px-7">
                    <section>
                        <p className="mb-3 text-[12px] font-semibold text-[#6e6e73]">{t('Bölümler', 'Panel sections')}</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {sectionOptions.map((option) => {
                                const Icon = option.icon;
                                const selected = sections[option.value];
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSections((current) => ({ ...current, [option.value]: !current[option.value] }))}
                                        aria-pressed={selected}
                                        className={`relative min-w-0 rounded-[20px] border p-4 text-left transition active:scale-[0.98] ${selected ? 'border-[#007aff]/30 bg-[#007aff]/7 text-[#007aff] shadow-[0_8px_28px_rgba(0,122,255,0.08)]' : 'border-black/[0.07] bg-white text-[#6e6e73]'}`}
                                    >
                                        <span
                                            className={`grid size-9 place-items-center rounded-[12px] ${selected ? 'bg-[#007aff]/12' : 'bg-black/[0.045]'}`}
                                        >
                                            <Icon className="size-[17px]" />
                                        </span>
                                        <span className="mt-3 block truncate text-[12px] font-semibold">{option.label}</span>
                                        <span className="mt-1 block text-[11px] font-medium opacity-60">{option.count}</span>
                                        {selected && (
                                            <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-[#007aff] text-white">
                                                <Check className="size-3" strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {sections.plans && (
                        <section>
                            <p className="mb-3 text-[12px] font-semibold text-[#6e6e73]">{t('Plan Dönemi', 'Plan period')}</p>
                            <div className="grid grid-cols-3 gap-2 rounded-[18px] bg-black/[0.045] p-1.5 sm:grid-cols-5">
                                {periodOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPlanPeriod(option.value)}
                                        className={`min-w-0 rounded-[13px] px-2 py-2.5 text-[11px] font-semibold transition sm:text-[12px] ${planPeriod === option.value ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.09)]' : 'text-[#8e8e93]'}`}
                                    >
                                        <span className="block truncate">{option.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(planPeriod === 'day' || planPeriod === 'week') && (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(event) => setSelectedDate(event.target.value)}
                                        required
                                        className="h-[52px] rounded-[16px] border border-black/[0.08] bg-white px-4 text-[14px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8 sm:col-span-2"
                                    />
                                )}
                                {planPeriod === 'range' && (
                                    <>
                                        <input
                                            type="date"
                                            value={rangeStart}
                                            max={rangeEnd}
                                            onChange={(event) => setRangeStart(event.target.value)}
                                            required
                                            className="h-[52px] rounded-[16px] border border-black/[0.08] bg-white px-4 text-[14px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                        />
                                        <input
                                            type="date"
                                            value={rangeEnd}
                                            min={rangeStart}
                                            onChange={(event) => setRangeEnd(event.target.value)}
                                            required
                                            className="h-[52px] rounded-[16px] border border-black/[0.08] bg-white px-4 text-[14px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                        />
                                    </>
                                )}
                                {planPeriod === 'month' && (
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(event) => setSelectedMonth(event.target.value)}
                                        required
                                        className="h-[52px] rounded-[16px] border border-black/[0.08] bg-white px-4 text-[14px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8 sm:col-span-2"
                                    />
                                )}
                                {planPeriod === 'year' && (
                                    <input
                                        type="number"
                                        min="1970"
                                        max="2200"
                                        value={selectedYear}
                                        onChange={(event) => setSelectedYear(event.target.value.slice(0, 4))}
                                        required
                                        inputMode="numeric"
                                        className="h-[52px] rounded-[16px] border border-black/[0.08] bg-white px-4 text-[14px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8 sm:col-span-2"
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    <section>
                        <button
                            type="button"
                            onClick={() => setIncludeWritingArea((current) => !current)}
                            aria-pressed={includeWritingArea}
                            className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition ${includeWritingArea ? 'border-[#007aff]/25 bg-[#007aff]/6' : 'border-black/[0.07] bg-white'}`}
                        >
                            <span
                                className={`grid size-10 shrink-0 place-items-center rounded-[13px] ${includeWritingArea ? 'bg-[#007aff] text-white' : 'bg-black/[0.045] text-[#8e8e93]'}`}
                            >
                                {includeWritingArea ? <Check className="size-[18px]" strokeWidth={3} /> : <NotebookPen className="size-[18px]" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-semibold text-[#1d1d1f]">{t('Yazılabilir Not Alanı', 'Writing area')}</span>
                                <span className="mt-1 block text-[11px] leading-4 text-[#8e8e93]">
                                    {t('Raporun sonuna boş bir not alanı ekle.', 'Add a blank notes area to the end.')}
                                </span>
                            </span>
                        </button>
                    </section>
                </div>

                <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f9f9fb]/90 px-5 py-4 backdrop-blur-2xl sm:px-7">
                    <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-[13px] font-semibold text-[#6e6e73]">
                        {t('Vazgeç', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={!canExport}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#007aff] px-6 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.18)] transition active:scale-[0.98] disabled:bg-[#d1d1d6] disabled:shadow-none"
                    >
                        <FileDown className="size-[17px]" />
                        {t("PDF'i İndir", 'Download PDF')}
                    </button>
                </div>
            </form>
        </div>
    );
}

function OverviewStat({ icon: Icon, label, value, color }: { icon: typeof Target; label: string; value: string; color: string }) {
    return (
        <div className="flex min-w-0 items-center gap-4 overflow-hidden rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-5">
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
    onToggleBlock,
    onUpdateGoal,
    onAddBlock,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    onCreateGoal: () => void;
    onNavigate: (section: PanelSection) => void;
    onToggleBlock: (goalId: number, buildingBlockId: number) => void;
    onUpdateGoal: (goalId: number, updates: Pick<GoalRecord, 'title' | 'gain' | 'deadline' | 'priority' | 'category'>) => void;
    onAddBlock: (goalId: number, title: string) => void;
}) {
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [goalTab, setGoalTab] = useState<'active' | 'completed'>('active');
    const sortedGoals = useMemo(
        () =>
            [...goals].sort((first, second) => PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt),
        [goals],
    );
    const activeGoals = useMemo(() => sortedGoals.filter((goalRecord) => !isGoalCompleted(goalRecord)), [sortedGoals]);
    const completedGoals = useMemo(() => sortedGoals.filter(isGoalCompleted), [sortedGoals]);
    const visibleGoals = goalTab === 'active' ? activeGoals : completedGoals;
    const selectedGoal = selectedGoalId === null ? undefined : goals.find((goalRecord) => goalRecord.id === selectedGoalId);
    const toggleSelectedGoalBlock = (buildingBlockId: number) => {
        if (!selectedGoal) return;

        const selectedBlock = selectedGoal.buildingBlocks.find((block) => block.id === buildingBlockId);
        const completesGoal =
            selectedBlock !== undefined &&
            !selectedBlock.completed &&
            selectedGoal.buildingBlocks.every((block) => block.id === buildingBlockId || block.completed);

        onToggleBlock(selectedGoal.id, buildingBlockId);
        if (completesGoal) setSelectedGoalId(null);
    };

    return (
        <>
            <Head title={t('Hedeflerim', 'My Goals')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="goals" goals={goals} onNavigate={onNavigate} />

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

                    <GoalRoadmap t={t} goals={sortedGoals} onSelect={(goalId) => setSelectedGoalId(goalId)} className="mt-10" />

                    <div
                        className="mt-5 grid grid-cols-2 rounded-[18px] bg-black/[0.045] p-1"
                        role="tablist"
                        aria-label={t('Hedef durumu', 'Goal status')}
                    >
                        {[
                            { value: 'active' as const, label: t('Aktif', 'Active'), count: activeGoals.length },
                            { value: 'completed' as const, label: t('Tamamlanan', 'Completed'), count: completedGoals.length },
                        ].map((tab) => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={goalTab === tab.value}
                                key={tab.value}
                                onClick={() => setGoalTab(tab.value)}
                                className={`flex h-11 items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold transition ${
                                    goalTab === tab.value
                                        ? 'bg-white text-[#1d1d1f] shadow-[0_3px_12px_rgba(0,0,0,0.08)]'
                                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                                }`}
                            >
                                {tab.label}
                                <span
                                    className={`grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                                        goalTab === tab.value ? 'bg-[#007aff]/10 text-[#007aff]' : 'bg-black/[0.055] text-[#8e8e93]'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <section
                        className="mt-5 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]"
                        aria-label={goalTab === 'active' ? t('Aktif hedefler', 'Active goals') : t('Tamamlanan hedefler', 'Completed goals')}
                    >
                        {visibleGoals.length === 0 && (
                            <div className="px-6 py-14 text-center sm:py-16">
                                <span
                                    className={`mx-auto grid size-14 place-items-center rounded-[18px] ${
                                        goalTab === 'active' ? 'bg-[#007aff]/9 text-[#007aff]' : 'bg-[#34c759]/10 text-[#248a3d]'
                                    }`}
                                >
                                    {goalTab === 'active' ? <Target className="size-6" /> : <CircleCheck className="size-6" />}
                                </span>
                                <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.02em]">
                                    {goalTab === 'active'
                                        ? t('Aktif hedefin bulunmuyor', 'You have no active goals')
                                        : t('Henüz tamamlanan hedef yok', 'No completed goals yet')}
                                </h2>
                                <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#8e8e93]">
                                    {goalTab === 'active'
                                        ? t('Yeni bir hedef oluşturarak yolculuğuna başlayabilirsin.', 'Create a new goal to begin your journey.')
                                        : t(
                                              'Tüm yapı taşlarını bitirdiğinde hedefin burada görünecek.',
                                              'Your goal will appear here when every building block is done.',
                                          )}
                                </p>
                            </div>
                        )}

                        {visibleGoals.map((item, index) => {
                            const priorityStyle = PRIORITY_STYLES[item.priority];
                            const goalProgress = calculateGoalProgress(item);

                            return (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => setSelectedGoalId(item.id)}
                                    className={`group grid w-full gap-5 px-5 py-6 text-left transition hover:bg-black/[0.018] active:bg-black/[0.035] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 ${index !== 0 ? 'border-t border-black/[0.055]' : ''}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className={`size-2.5 shrink-0 rounded-full ${priorityStyle.dot}`} />
                                            <span className={`text-[12px] font-semibold ${priorityStyle.text}`}>
                                                {priorityLabel(item.priority, t)}
                                            </span>
                                            <span className="rounded-full bg-black/[0.045] px-2.5 py-1 text-[11px] font-semibold text-[#6e6e73]">
                                                {categoryLabel(item.category, t)}
                                            </span>
                                        </div>
                                        <h2
                                            className={`mt-3 truncate text-[21px] font-semibold tracking-[-0.025em] sm:text-[23px] ${isGoalCompleted(item) ? 'text-[#8e8e93] line-through' : ''}`}
                                        >
                                            {item.title}
                                        </h2>
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
                                            style={{
                                                background: `conic-gradient(${isGoalCompleted(item) ? '#34c759' : '#007aff'} ${goalProgress}%, #e5e5ea 0)`,
                                            }}
                                        >
                                            <span
                                                className={`relative text-[13px] font-semibold tabular-nums ${isGoalCompleted(item) ? 'text-[#248a3d]' : ''}`}
                                            >
                                                %{goalProgress}
                                            </span>
                                        </div>
                                        <ArrowRight className="hidden size-[18px] text-[#c7c7cc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8e8e93] sm:block" />
                                    </div>
                                </button>
                            );
                        })}
                    </section>
                </main>
            </div>

            {selectedGoal && (
                <GoalDetailPanel
                    t={t}
                    locale={locale}
                    goal={selectedGoal}
                    onClose={() => setSelectedGoalId(null)}
                    onToggleBlock={toggleSelectedGoalBlock}
                    onUpdate={(updates) => onUpdateGoal(selectedGoal.id, updates)}
                    onAddBlock={(title) => onAddBlock(selectedGoal.id, title)}
                />
            )}
        </>
    );
}

function GoalRoadmap({
    t,
    goals,
    onSelect,
    featuredGoalId,
    className = '',
}: {
    t: Translate;
    goals: GoalRecord[];
    onSelect?: (goalId: number) => void;
    featuredGoalId?: number;
    className?: string;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const mobileSheetRef = useRef<HTMLElement | null>(null);
    const roadmapGoals = useMemo(
        () => [...goals].sort((first, second) => first.deadline.localeCompare(second.deadline) || first.createdAt - second.createdAt),
        [goals],
    );
    const completedCount = roadmapGoals.filter(isGoalCompleted).length;
    const mobileGoals = [...roadmapGoals].reverse();

    useEffect(() => {
        if (!mobileOpen) return;

        window.requestAnimationFrame(() => {
            if (mobileSheetRef.current) mobileSheetRef.current.scrollTop = mobileSheetRef.current.scrollHeight;
        });
    }, [mobileOpen]);

    const roadmapNode = (goalRecord: GoalRecord, mobile: boolean) => {
        const roadmapNumber = roadmapGoals.findIndex((item) => item.id === goalRecord.id) + 1;
        const completed = isGoalCompleted(goalRecord);
        const featured = goalRecord.id === featuredGoalId;
        const progress = calculateGoalProgress(goalRecord);

        return (
            <button
                key={goalRecord.id}
                type="button"
                onClick={() => {
                    if (!onSelect) return;
                    setMobileOpen(false);
                    onSelect(goalRecord.id);
                }}
                disabled={!onSelect}
                className={
                    mobile
                        ? `group grid w-full grid-cols-[48px_minmax(0,1fr)] items-center gap-3 py-2 text-left ${onSelect ? 'cursor-pointer' : 'cursor-default'}`
                        : `group flex w-[170px] min-w-[170px] flex-col items-center px-2 text-center ${onSelect ? 'cursor-pointer' : 'cursor-default'}`
                }
            >
                <span
                    className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-[3px] bg-white text-[13px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition group-active:scale-95 ${
                        completed
                            ? 'border-[#34c759] text-[#248a3d]'
                            : featured
                              ? 'border-[#007aff] text-[#007aff] ring-4 ring-[#007aff]/10'
                              : 'border-[#d1d1d6] text-[#8e8e93]'
                    }`}
                >
                    {roadmapNumber}
                    {completed && (
                        <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-[#34c759] text-white">
                            <Check className="size-3" strokeWidth={3} />
                        </span>
                    )}
                </span>
                <span className={`${mobile ? 'min-w-0' : 'mt-2 w-full min-w-0'} overflow-hidden`}>
                    <span
                        title={goalRecord.title}
                        className={`block w-full text-[13px] leading-[1.3] font-semibold break-words ${mobile ? '' : 'min-h-[34px] overflow-hidden'} ${completed ? 'text-[#8e8e93] line-through' : 'text-[#1d1d1f]'}`}
                        style={mobile ? undefined : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                    >
                        {goalRecord.title}
                    </span>
                    <span className={`mt-1 block text-[10px] font-semibold ${completed ? 'text-[#34a853]' : 'text-[#8e8e93]'}`}>
                        {completed ? t('Tamamlandı', 'Completed') : `%${progress}`}
                    </span>
                </span>
            </button>
        );
    };

    return (
        <>
            <section
                className={`${className} w-full max-w-full min-w-0 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)] sm:p-6`}
                aria-label={t('Hedef yol haritası', 'Goal roadmap')}
            >
                <button type="button" onClick={() => setMobileOpen(true)} className="flex w-full items-center gap-4 p-5 text-left sm:hidden">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#007aff]/10 text-[#007aff]">
                        <Target className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold text-[#007aff]">{t('İLERLEYİŞİN', 'YOUR JOURNEY')}</span>
                        <span className="mt-0.5 block text-[18px] font-semibold tracking-[-0.025em]">{t('Yol Haritası', 'Roadmap')}</span>
                        <span className="mt-1 block text-[11px] font-medium text-[#8e8e93]">
                            {completedCount}/{roadmapGoals.length} {t('tamamlandı', 'completed')}
                        </span>
                    </span>
                    <ChevronUp className="size-5 shrink-0 text-[#8e8e93]" />
                </button>

                <div className="hidden sm:block">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold text-[#007aff]">{t('İLERLEYİŞİN', 'YOUR JOURNEY')}</p>
                            <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{t('Yol Haritası', 'Roadmap')}</h2>
                        </div>
                        <p className="text-[12px] font-semibold text-[#8e8e93]">
                            {completedCount}/{roadmapGoals.length} {t('tamamlandı', 'completed')}
                        </p>
                    </div>

                    <div className="relative mt-6 overflow-x-auto pb-2">
                        <span className="absolute top-6 right-6 left-6 h-px bg-[#d1d1d6]" />
                        <div className="relative flex min-w-max">{roadmapGoals.map((goalRecord) => roadmapNode(goalRecord, false))}</div>
                    </div>
                </div>
            </section>

            {mobileOpen && (
                <div
                    className="apple-interface fixed inset-0 z-[75] flex items-end bg-black/30 backdrop-blur-sm sm:hidden"
                    role="presentation"
                    onMouseDown={() => setMobileOpen(false)}
                >
                    <section
                        ref={mobileSheetRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mobile-roadmap-title"
                        onMouseDown={(event) => event.stopPropagation()}
                        className="max-h-[88svh] w-full overflow-y-auto rounded-t-[32px] bg-[#f5f5f7] px-5 pt-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(0,0,0,0.2)]"
                    >
                        <div className="sticky top-0 z-20 flex items-center justify-between bg-[#f5f5f7]/90 pb-4 backdrop-blur-xl">
                            <div>
                                <p className="text-[11px] font-semibold text-[#007aff]">{t('AŞAĞIDAN YUKARI', 'BOTTOM TO TOP')}</p>
                                <h2 id="mobile-roadmap-title" className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                                    {t('Yol Haritası', 'Roadmap')}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                                aria-label={t('Kapat', 'Close')}
                            >
                                <X className="size-[17px]" />
                            </button>
                        </div>

                        <div className="relative mt-2">
                            <span className="absolute top-6 bottom-6 left-[23px] w-px bg-[#d1d1d6]" />
                            <div className="relative flex flex-col">{mobileGoals.map((goalRecord) => roadmapNode(goalRecord, true))}</div>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#8e8e93]">
                            <ChevronUp className="size-4 text-[#007aff]" />
                            {t('Yol 1 numaralı hedeften yukarı doğru ilerler.', 'The journey moves upward from goal 1.')}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

function GoalCompletionDialog({
    t,
    goals,
    completedGoal,
    onClose,
    onOpenGoals,
}: {
    t: Translate;
    goals: GoalRecord[];
    completedGoal: GoalRecord;
    onClose: () => void;
    onOpenGoals: () => void;
}) {
    const roadmapGoals = [...goals].sort(
        (first, second) => PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt,
    );

    return (
        <div
            className="apple-interface fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-0 backdrop-blur-md sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="goal-complete-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="max-h-[94svh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-[#f5f5f7] px-5 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-[0_35px_100px_rgba(0,0,0,0.3)] sm:max-h-[90svh] sm:rounded-[32px] sm:px-7 sm:py-7"
            >
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>

                <div className="-mt-3 text-center">
                    <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#34c759] text-white shadow-[0_14px_36px_rgba(52,199,89,0.3)]">
                        <Sparkles className="size-9" strokeWidth={2.2} />
                    </span>
                    <p className="mt-6 text-[12px] font-semibold text-[#34a853]">{t('HEDEF TAMAMLANDI', 'GOAL COMPLETED')}</p>
                    <h2
                        id="goal-complete-title"
                        className="mx-auto mt-2 max-w-lg text-[clamp(2rem,7vw,3rem)] leading-[1.04] font-semibold tracking-[-0.05em]"
                    >
                        {t('Harika iş çıkardın!', 'You did an amazing job!')}
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-[#6e6e73]">
                        <span className="font-semibold text-[#1d1d1f]">“{completedGoal.title}”</span>{' '}
                        {t(
                            'hedefini tamamladın. Şimdi yolundaki diğer hedeflere devam edebilirsin.',
                            'is complete. Now you can continue with the other goals on your path.',
                        )}
                    </p>
                </div>

                <GoalRoadmap t={t} goals={roadmapGoals} featuredGoalId={completedGoal.id} className="mt-7" />

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 rounded-full bg-white text-[14px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    >
                        {t('Kapat', 'Close')}
                    </button>
                    <button
                        type="button"
                        onClick={onOpenGoals}
                        className="h-12 rounded-full bg-[#007aff] text-[14px] font-semibold text-white shadow-[0_8px_22px_rgba(0,122,255,0.22)]"
                    >
                        {t('Hedeflerime Git', 'View My Goals')}
                    </button>
                </div>
            </section>
        </div>
    );
}

function GoalDetailPanel({
    t,
    locale,
    goal,
    onClose,
    onToggleBlock,
    onUpdate,
    onAddBlock,
}: {
    t: Translate;
    locale: Locale;
    goal: GoalRecord;
    onClose: () => void;
    onToggleBlock: (buildingBlockId: number) => void;
    onUpdate: (updates: Pick<GoalRecord, 'title' | 'gain' | 'deadline' | 'priority' | 'category'>) => void;
    onAddBlock: (title: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal.title);
    const [editGain, setEditGain] = useState(goal.gain);
    const [editDeadline, setEditDeadline] = useState(goal.deadline);
    const [editPriority, setEditPriority] = useState(goal.priority);
    const [editCategory, setEditCategory] = useState(goal.category);
    const [editCalendarOpen, setEditCalendarOpen] = useState(false);
    const [newBlockTitle, setNewBlockTitle] = useState('');
    const progress = calculateGoalProgress(goal);
    const completedCount = goal.buildingBlocks.filter((block) => block.completed).length;
    const priorityStyle = PRIORITY_STYLES[goal.priority];
    const saveGoal = (event: FormEvent) => {
        event.preventDefault();
        if (!editTitle.trim() || !editGain.trim() || !isDateKey(editDeadline)) return;

        onUpdate({
            title: editTitle.trim(),
            gain: editGain.trim(),
            deadline: editDeadline,
            priority: editPriority,
            category: editCategory,
        });
        setEditing(false);
    };

    const addBlock = (event: FormEvent) => {
        event.preventDefault();
        const title = newBlockTitle.trim();
        if (!title) return;

        onAddBlock(title);
        setNewBlockTitle('');
    };

    return (
        <>
            <div
                className="apple-interface fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-6"
                role="presentation"
                onMouseDown={onClose}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="goal-detail-title"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] border border-black/[0.07] bg-[#f5f5f7] shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:max-h-[88svh] sm:rounded-[32px]"
                >
                    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.055] bg-[#f5f5f7]/90 px-5 py-4 backdrop-blur-2xl sm:px-7">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className={`size-2.5 shrink-0 rounded-full ${priorityStyle.dot}`} />
                            <p className="truncate text-[13px] font-semibold text-[#6e6e73]">{t('Hedef Detayı', 'Goal Details')}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing((current) => !current)}
                                className={`grid size-9 place-items-center rounded-full transition ${editing ? 'bg-[#007aff] text-white' : 'bg-black/[0.055] text-[#6e6e73] hover:bg-black/[0.09]'}`}
                                aria-label={editing ? t('Düzenlemeyi kapat', 'Close editing') : t('Hedefi düzenle', 'Edit goal')}
                            >
                                <Pencil className="size-[16px]" />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73] transition hover:bg-black/[0.09]"
                                aria-label={t('Kapat', 'Close')}
                            >
                                <X className="size-[17px]" />
                            </button>
                        </div>
                    </header>

                    <div className="overflow-y-auto px-5 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-8 sm:pb-8">
                        <div className="flex items-start gap-5">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[11px] font-semibold ${priorityStyle.text}`}>{priorityLabel(goal.priority, t)}</span>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6e6e73] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                        {categoryLabel(goal.category, t)}
                                    </span>
                                </div>
                                <h2
                                    id="goal-detail-title"
                                    className="mt-3 text-[clamp(1.8rem,6vw,2.8rem)] leading-[1.05] font-semibold tracking-[-0.045em]"
                                >
                                    {goal.title}
                                </h2>
                                <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8e8e93]">
                                    <CalendarDays className="size-4" />
                                    {formatGoalDate(goal.deadline, locale)}
                                </p>
                            </div>

                            <div
                                className="relative grid size-20 shrink-0 place-items-center rounded-full before:absolute before:inset-2 before:rounded-full before:bg-[#f5f5f7]"
                                style={{ background: `conic-gradient(#007aff ${progress}%, #e5e5ea 0)` }}
                                aria-label={t(`Yüzde ${progress} tamamlandı`, `${progress} percent complete`)}
                            >
                                <span className="relative text-[16px] font-semibold tabular-nums">%{progress}</span>
                            </div>
                        </div>

                        {editing ? (
                            <form
                                onSubmit={saveGoal}
                                className="mt-7 rounded-[24px] border border-[#007aff]/15 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-6"
                            >
                                <p className="text-[12px] font-semibold text-[#007aff]">{t('Hedefi Düzenle', 'Edit Goal')}</p>

                                <label className="mt-5 block">
                                    <span className="mb-2 block text-[11px] font-semibold text-[#8e8e93]">{t('Hedef', 'Goal')}</span>
                                    <input
                                        autoCapitalize="sentences"
                                        value={editTitle}
                                        onChange={(event) => setEditTitle(event.target.value)}
                                        className="h-12 w-full rounded-[16px] border border-black/[0.07] bg-[#f9f9fb] px-4 text-[15px] font-medium outline-none focus:border-[#007aff]/35 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>

                                <label className="mt-4 block">
                                    <span className="mb-2 block text-[11px] font-semibold text-[#8e8e93]">{t('Kazanım', 'Outcome')}</span>
                                    <textarea
                                        autoCapitalize="sentences"
                                        value={editGain}
                                        onChange={(event) => setEditGain(event.target.value)}
                                        rows={3}
                                        className="w-full resize-none rounded-[16px] border border-black/[0.07] bg-[#f9f9fb] px-4 py-3 text-[14px] leading-6 font-medium outline-none focus:border-[#007aff]/35 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>

                                <p className="mt-4 mb-2 text-[11px] font-semibold text-[#8e8e93]">{t('Kategori', 'Category')}</p>
                                <div className="grid grid-cols-3 gap-1 rounded-[16px] bg-black/[0.045] p-1">
                                    {(['health', 'work', 'venture', 'skill', 'education', 'other'] as GoalCategory[]).map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setEditCategory(category)}
                                            className={`rounded-[12px] px-1 py-2 text-[10px] font-semibold transition ${editCategory === category ? 'bg-white text-[#1d1d1f] shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'}`}
                                        >
                                            {categoryLabel(category, t)}
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-4 mb-2 text-[11px] font-semibold text-[#8e8e93]">{t('Öncelik', 'Priority')}</p>
                                <div className="grid grid-cols-4 gap-1 rounded-[16px] bg-black/[0.045] p-1">
                                    {(['urgent', 'very-important', 'important', 'has-time'] as Priority[]).map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setEditPriority(priority)}
                                            className={`min-w-0 rounded-[12px] px-1 py-2 text-[10px] font-semibold transition ${editPriority === priority ? 'bg-white shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'}`}
                                        >
                                            <span className={`mr-1 inline-block size-1.5 rounded-full ${PRIORITY_STYLES[priority].dot}`} />
                                            <span className="truncate">{priorityLabel(priority, t)}</span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEditCalendarOpen(true)}
                                    className="mt-4 flex h-12 w-full items-center gap-3 rounded-[16px] border border-black/[0.07] bg-[#f9f9fb] px-4 text-left"
                                >
                                    <CalendarDays className="size-[17px] text-[#007aff]" />
                                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{formatGoalDate(editDeadline, locale)}</span>
                                    <ChevronRight className="size-4 text-[#aeaeb2]" />
                                </button>

                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="h-11 rounded-full bg-black/[0.055] text-[13px] font-semibold"
                                    >
                                        {t('Vazgeç', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!editTitle.trim() || !editGain.trim() || !isDateKey(editDeadline)}
                                        className="h-11 rounded-full bg-[#007aff] text-[13px] font-semibold text-white disabled:bg-[#d1d1d6]"
                                    >
                                        {t('Kaydet', 'Save')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <section className="mt-7 rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-6">
                                <p className="text-[11px] font-semibold text-[#007aff]">{t('Kazanımın', 'Your Outcome')}</p>
                                <p className="mt-2 text-[16px] leading-7 font-medium tracking-[-0.01em] text-[#3a3a3c]">{goal.gain}</p>
                            </section>
                        )}

                        <section className="mt-5 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
                            <div className="flex items-end justify-between gap-4 border-b border-black/[0.055] px-5 py-5 sm:px-6">
                                <div>
                                    <h3 className="text-[18px] font-semibold tracking-[-0.025em]">{t('Yapı Taşları', 'Building Blocks')}</h3>
                                    <p className="mt-1 text-[12px] text-[#8e8e93]">
                                        {t(
                                            `${completedCount} / ${goal.buildingBlocks.length} tamamlandı`,
                                            `${completedCount} of ${goal.buildingBlocks.length} completed`,
                                        )}
                                    </p>
                                </div>
                                <span className="text-[12px] font-semibold text-[#007aff]">%{progress}</span>
                            </div>

                            {goal.buildingBlocks.map((block, index) => (
                                <button
                                    key={block.id}
                                    type="button"
                                    onClick={() => onToggleBlock(block.id)}
                                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.02] active:bg-black/[0.04] sm:px-6 ${index !== 0 ? 'border-t border-black/[0.05]' : ''}`}
                                >
                                    <span
                                        className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${block.completed ? 'border-[#34c759] bg-[#34c759] text-white' : 'border-[#c7c7cc] text-transparent'}`}
                                    >
                                        <Check className="size-4" strokeWidth={3} />
                                    </span>
                                    <span
                                        className={`min-w-0 flex-1 text-[15px] font-medium ${block.completed ? 'text-[#8e8e93] line-through' : ''}`}
                                    >
                                        {block.title}
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#aeaeb2] tabular-nums">{index + 1}</span>
                                </button>
                            ))}

                            <form onSubmit={addBlock} className="flex items-center gap-2 border-t border-black/[0.055] bg-[#f9f9fb] p-3 pl-5 sm:pl-6">
                                <Plus className="size-4 shrink-0 text-[#007aff]" />
                                <input
                                    autoCapitalize="sentences"
                                    value={newBlockTitle}
                                    onChange={(event) => setNewBlockTitle(event.target.value)}
                                    placeholder={t('Yeni yapı taşı ekle', 'Add a new building block')}
                                    className="h-10 min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-[#aeaeb2]"
                                />
                                <button
                                    type="submit"
                                    disabled={!newBlockTitle.trim()}
                                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#007aff] text-white disabled:bg-[#d1d1d6]"
                                    aria-label={t('Yapı taşını ekle', 'Add building block')}
                                >
                                    <ArrowRight className="size-4" />
                                </button>
                            </form>
                        </section>
                    </div>
                </section>
            </div>

            {editCalendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={editDeadline}
                    onCancel={() => setEditCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        setEditDeadline(selectedDate);
                        setEditCalendarOpen(false);
                    }}
                />
            )}
        </>
    );
}

function NotesPanel({
    t,
    locale,
    goals,
    notes,
    onNavigate,
    onAddNote,
    onUpdateNote,
    onRemoveNote,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    notes: NoteRecord[];
    onNavigate: (section: PanelSection) => void;
    onAddNote: (note: Omit<NoteRecord, 'id' | 'createdAt'>) => void;
    onUpdateNote: (id: number, note: Omit<NoteRecord, 'id' | 'createdAt'>) => void;
    onRemoveNote: (id: number) => void;
}) {
    const [composerOpen, setComposerOpen] = useState(notes.length === 0);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkedBlockKey, setLinkedBlockKey] = useState('');
    const linkedBlock = useMemo(() => {
        if (!linkedBlockKey) return null;

        const [goalId, blockId] = linkedBlockKey.split(':').map(Number);
        const linkedGoal = goals.find((goalRecord) => goalRecord.id === goalId);
        const block = linkedGoal?.buildingBlocks.find((buildingBlock) => buildingBlock.id === blockId);

        return linkedGoal && block ? { goal: linkedGoal, block } : null;
    }, [goals, linkedBlockKey]);

    const submitNote = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const noteDraft = {
            title: title.trim(),
            content: content.trim(),
            goalId: linkedBlock?.goal.id,
            buildingBlockId: linkedBlock?.block.id,
        };

        if (editingNoteId === null) onAddNote(noteDraft);
        else onUpdateNote(editingNoteId, noteDraft);

        closeComposer();
    };

    const closeComposer = () => {
        setTitle('');
        setContent('');
        setLinkedBlockKey('');
        setEditingNoteId(null);
        setComposerOpen(false);
    };

    const openNewNote = () => {
        if (composerOpen && editingNoteId === null) {
            closeComposer();
            return;
        }

        setTitle('');
        setContent('');
        setLinkedBlockKey('');
        setEditingNoteId(null);
        setComposerOpen(true);
    };

    const editNote = (note: NoteRecord) => {
        setTitle(note.title);
        setContent(note.content);
        setLinkedBlockKey(note.goalId !== undefined && note.buildingBlockId !== undefined ? `${note.goalId}:${note.buildingBlockId}` : '');
        setEditingNoteId(note.id);
        setComposerOpen(true);

        window.requestAnimationFrame(() => {
            document.getElementById('demo-note-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    return (
        <>
            <Head title={t('Notlar', 'Notes')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="notes" goals={goals} onNavigate={onNavigate} />

                <main className="demo-keyboard-aware-content mx-auto max-w-5xl px-5 pt-24 pb-32 sm:px-8 sm:pt-36 sm:pb-16">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff]">{t('Fikirlerini yakala', 'Capture your ideas')}</p>
                            <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                                {t('Notlar', 'Notes')}
                            </h1>
                            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#6e6e73]">
                                {t(
                                    'Serbest not al veya bir hedef maddesine bağlayarak düşüncelerini o adımda tut.',
                                    'Write a free note or attach it to a goal item to keep your thoughts with that step.',
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={composerOpen ? closeComposer : openNewNote}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition active:scale-[0.98] sm:w-auto"
                        >
                            {composerOpen ? <X className="size-[18px]" /> : <Plus className="size-[18px]" strokeWidth={2.5} />}
                            {composerOpen ? t('Vazgeç', 'Cancel') : t('Yeni Not', 'New Note')}
                        </button>
                    </div>

                    {composerOpen && (
                        <form
                            id="demo-note-composer"
                            onSubmit={submitNote}
                            onFocusCapture={(event) => {
                                if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                                    revealFocusedField(event.target);
                                }
                            }}
                            className="demo-step-enter mt-8 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_14px_48px_rgba(0,0,0,0.055)]"
                        >
                            <div className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
                                <label className="block">
                                    <span className="mb-2 block text-[13px] font-semibold text-[#6e6e73]">{t('Not başlığı', 'Note title')}</span>
                                    <input
                                        autoFocus
                                        autoCapitalize="sentences"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder={t('Başlık yaz', 'Write a title')}
                                        className="h-[54px] w-full rounded-[17px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[16px] font-medium transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-[13px] font-semibold text-[#6e6e73]">
                                        {t('Hedef maddesi', 'Goal item')}
                                        <span className="ml-1 font-normal text-[#aeaeb2]">{t('(isteğe bağlı)', '(optional)')}</span>
                                    </span>
                                    <span className="relative block">
                                        <select
                                            value={linkedBlockKey}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setLinkedBlockKey(value);

                                                if (!title.trim() && value) {
                                                    const [goalId, blockId] = value.split(':').map(Number);
                                                    const block = goals
                                                        .find((goalRecord) => goalRecord.id === goalId)
                                                        ?.buildingBlocks.find((buildingBlock) => buildingBlock.id === blockId);
                                                    if (block) setTitle(block.title);
                                                }
                                            }}
                                            className="h-[54px] w-full appearance-none rounded-[17px] border border-black/[0.08] bg-[#f9f9fb] px-4 pr-11 text-[15px] font-medium transition outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                        >
                                            <option value="">{t('Serbest not', 'Free note')}</option>
                                            {goals.map((goalRecord) => (
                                                <optgroup key={goalRecord.id} label={goalRecord.title}>
                                                    {goalRecord.buildingBlocks.map((block) => (
                                                        <option key={block.id} value={`${goalRecord.id}:${block.id}`}>
                                                            {block.title}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-[17px] -translate-y-1/2 text-[#8e8e93]" />
                                    </span>
                                </label>

                                {linkedBlock && (
                                    <div className="flex items-start gap-3 rounded-[17px] bg-[#007aff]/8 px-4 py-3.5 text-[#0066d6]">
                                        <Target className="mt-0.5 size-[17px] shrink-0" />
                                        <p className="min-w-0 text-[13px] leading-5">
                                            <span className="font-semibold">{linkedBlock.goal.title}</span>
                                            <span className="mx-1.5 text-[#007aff]/45">›</span>
                                            <span>{linkedBlock.block.title}</span>
                                        </p>
                                    </div>
                                )}

                                <label className="block">
                                    <span className="mb-2 block text-[13px] font-semibold text-[#6e6e73]">{t('Notun', 'Your note')}</span>
                                    <textarea
                                        autoCapitalize="sentences"
                                        value={content}
                                        onChange={(event) => setContent(event.target.value)}
                                        placeholder={t('Aklındakileri yaz…', 'Write what is on your mind…')}
                                        rows={5}
                                        className="w-full resize-none rounded-[19px] border border-black/[0.08] bg-[#f9f9fb] px-4 py-4 text-[15px] leading-6 transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                <button
                                    type="submit"
                                    disabled={!title.trim() || !content.trim()}
                                    className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                >
                                    {editingNoteId === null ? t('Notu Kaydet', 'Save Note') : t('Değişiklikleri Kaydet', 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    )}

                    {notes.length === 0 && !composerOpen ? (
                        <section className="mt-10 rounded-[28px] border border-dashed border-black/[0.12] px-6 py-16 text-center">
                            <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#007aff]/10 text-[#007aff]">
                                <NotebookPen className="size-6" />
                            </span>
                            <h2 className="mt-5 text-[19px] font-semibold">{t('Henüz notun yok', 'No notes yet')}</h2>
                            <p className="mt-2 text-[14px] text-[#8e8e93]">
                                {t('İlk notunu oluşturarak başla.', 'Start by creating your first note.')}
                            </p>
                        </section>
                    ) : (
                        <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label={t('Not listesi', 'Note list')}>
                            {[...notes]
                                .sort((first, second) => second.createdAt - first.createdAt)
                                .map((note) => {
                                    const linkedGoal = goals.find((goalRecord) => goalRecord.id === note.goalId);
                                    const linkedItem = linkedGoal?.buildingBlocks.find((block) => block.id === note.buildingBlockId);

                                    return (
                                        <article
                                            key={note.id}
                                            className="group flex min-h-52 flex-col rounded-[26px] border border-black/[0.07] bg-white p-5 shadow-[0_10px_38px_rgba(0,0,0,0.04)] sm:p-6"
                                        >
                                            {linkedGoal && linkedItem && (
                                                <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-[#007aff]">
                                                    <Target className="size-3.5 shrink-0" />
                                                    <span className="truncate">{linkedGoal.title}</span>
                                                    <span className="text-[#007aff]/40">›</span>
                                                    <span className="truncate">{linkedItem.title}</span>
                                                </div>
                                            )}
                                            <h2 className="text-[19px] font-semibold tracking-[-0.025em]">{note.title}</h2>
                                            <p className="mt-3 line-clamp-5 flex-1 text-[14px] leading-6 whitespace-pre-wrap text-[#6e6e73]">
                                                {note.content}
                                            </p>
                                            <div className="mt-5 flex items-center justify-between border-t border-black/[0.055] pt-4">
                                                <time className="text-[11px] font-medium text-[#8e8e93]">
                                                    {new Intl.DateTimeFormat(getIntlLocale(locale), {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }).format(new Date(note.createdAt))}
                                                </time>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => editNote(note)}
                                                        className="grid size-8 place-items-center rounded-full text-[#8e8e93] transition hover:bg-[#007aff]/8 hover:text-[#007aff]"
                                                        aria-label={t('Notu düzenle', 'Edit note')}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (editingNoteId === note.id) closeComposer();
                                                            onRemoveNote(note.id);
                                                        }}
                                                        className="grid size-8 place-items-center rounded-full text-[#aeaeb2] transition hover:bg-[#ff3b30]/8 hover:text-[#ff3b30]"
                                                        aria-label={t('Notu sil', 'Delete note')}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                        </section>
                    )}
                </main>
            </div>
        </>
    );
}

function LibraryPanel({
    t,
    locale,
    goals,
    books,
    onNavigate,
    onAddBook,
    onUpdateBook,
    onRemoveBook,
    onReorderBooks,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    books: BookRecord[];
    onNavigate: (section: PanelSection) => void;
    onAddBook: (book: Pick<BookRecord, 'title' | 'author' | 'status' | 'comment' | 'rating'>) => void;
    onUpdateBook: (bookId: number, book: Pick<BookRecord, 'title' | 'author' | 'status' | 'comment' | 'rating'>) => void;
    onRemoveBook: (bookId: number) => void;
    onReorderBooks: (status: BookStatus, orderedIds: number[]) => void;
}) {
    const [activeStatus, setActiveStatus] = useState<BookStatus>('reading');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingBookId, setEditingBookId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [status, setStatus] = useState<BookStatus>('not-started');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [draggedBookId, setDraggedBookId] = useState<number | null>(null);
    const statusTabs: Array<{ value: BookStatus; label: string; shortLabel: string; icon: typeof BookOpen }> = [
        { value: 'reading', label: t('Şu An Okunan', 'Reading Now'), shortLabel: t('Okunan', 'Reading'), icon: BookOpen },
        { value: 'not-started', label: t('Başlanmayan', 'Not Started'), shortLabel: t('Sırada', 'Queue'), icon: Clock3 },
        { value: 'finished', label: t('Biten', 'Finished'), shortLabel: t('Biten', 'Finished'), icon: CircleCheck },
    ];
    const visibleBooks = useMemo(
        () =>
            books
                .filter((book) => book.status === activeStatus)
                .sort((first, second) => first.sortOrder - second.sortOrder || first.createdAt - second.createdAt),
        [activeStatus, books],
    );

    const resetEditor = () => {
        setEditorOpen(false);
        setEditingBookId(null);
        setTitle('');
        setAuthor('');
        setComment('');
        setRating(0);
    };

    const openNewBook = () => {
        setEditingBookId(null);
        setTitle('');
        setAuthor('');
        setStatus(activeStatus);
        setComment('');
        setRating(0);
        setEditorOpen(true);
        window.requestAnimationFrame(() => document.getElementById('demo-book-title')?.focus());
    };

    const editBook = (book: BookRecord) => {
        setEditingBookId(book.id);
        setTitle(book.title);
        setAuthor(book.author);
        setStatus(book.status);
        setComment(book.comment);
        setRating(book.rating);
        setEditorOpen(true);
        window.requestAnimationFrame(() => document.getElementById('demo-book-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const submitBook = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return;

        const book = {
            title: title.trim(),
            author: author.trim(),
            status,
            comment: status === 'finished' ? comment.trim() : '',
            rating: status === 'finished' ? rating : 0,
        };

        if (editingBookId === null) onAddBook(book);
        else onUpdateBook(editingBookId, book);

        setActiveStatus(status);
        resetEditor();
    };

    const moveBook = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= visibleBooks.length || fromIndex === toIndex) return;
        const orderedIds = visibleBooks.map((book) => book.id);
        const [movedId] = orderedIds.splice(fromIndex, 1);
        orderedIds.splice(toIndex, 0, movedId);
        onReorderBooks(activeStatus, orderedIds);
    };

    const moveDraggedBookBefore = (targetId: number) => {
        if (draggedBookId === null || draggedBookId === targetId) return;
        moveBook(
            visibleBooks.findIndex((book) => book.id === draggedBookId),
            visibleBooks.findIndex((book) => book.id === targetId),
        );
    };

    return (
        <>
            <Head title={t('Kitaplık', 'Library')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="library" goals={goals} onNavigate={onNavigate} />

                <main className="demo-keyboard-aware-content mx-auto max-w-5xl px-5 pt-24 pb-32 sm:px-8 sm:pt-36 sm:pb-16">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-[#007aff]">{t('Okuma yolculuğun', 'Your reading journey')}</p>
                            <h1 className="mt-2 text-[clamp(2.35rem,6vw,4rem)] leading-none font-semibold tracking-[-0.05em]">
                                {t('Kitaplık', 'Library')}
                            </h1>
                            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#6e6e73]">
                                {t(
                                    'Kitaplarını sıraya koy, okuduklarını takip et ve bitirdiklerin hakkındaki düşüncelerini sakla.',
                                    'Order your books, track your reading, and keep your thoughts about the books you finish.',
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={editorOpen ? resetEditor : openNewBook}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007aff] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition active:scale-[0.98] sm:w-auto"
                        >
                            {editorOpen ? <X className="size-[18px]" /> : <Plus className="size-[18px]" strokeWidth={2.5} />}
                            {editorOpen ? t('Vazgeç', 'Cancel') : t('Kitap Ekle', 'Add Book')}
                        </button>
                    </div>

                    <section className="mt-8 grid grid-cols-3 gap-3" aria-label={t('Kitaplık özeti', 'Library summary')}>
                        {statusTabs.map((item) => {
                            const Icon = item.icon;
                            const count = books.filter((book) => book.status === item.value).length;
                            const selected = activeStatus === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setActiveStatus(item.value)}
                                    className={`rounded-[22px] border p-4 text-left transition active:scale-[0.98] sm:flex sm:items-center sm:gap-4 sm:p-5 ${selected ? 'border-[#007aff]/20 bg-white shadow-[0_10px_32px_rgba(0,122,255,0.09)]' : 'border-black/[0.055] bg-white/65'}`}
                                >
                                    <span className={`grid size-10 place-items-center rounded-[13px] ${bookStatusIconStyle(item.value)}`}>
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <span className="mt-3 block min-w-0 sm:mt-0">
                                        <span className="block text-[22px] font-semibold tracking-[-0.03em]">{count}</span>
                                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[#8e8e93] sm:text-[12px]">
                                            <span className="sm:hidden">{item.shortLabel}</span>
                                            <span className="hidden sm:inline">{item.label}</span>
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </section>

                    {editorOpen && (
                        <form
                            id="demo-book-editor"
                            onSubmit={submitBook}
                            onFocusCapture={(event) => {
                                if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
                                    revealFocusedField(event.target);
                            }}
                            className="demo-step-enter mt-7 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_14px_48px_rgba(0,0,0,0.055)]"
                        >
                            <div className="flex items-center gap-4 border-b border-black/[0.055] px-5 py-5 sm:px-7">
                                <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-[#007aff]/10 text-[#007aff]">
                                    <BookOpen className="size-[22px]" />
                                </span>
                                <div>
                                    <h2 className="text-[19px] font-semibold tracking-[-0.025em]">
                                        {editingBookId === null ? t('Yeni Kitap', 'New Book') : t('Kitabı Düzenle', 'Edit Book')}
                                    </h2>
                                    <p className="mt-1 text-[12px] text-[#8e8e93]">
                                        {t('Kitap bilgilerini ve okuma durumunu belirle.', 'Set the book details and reading status.')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
                                <label className="block sm:col-span-2">
                                    <span className="mb-2 block text-[13px] font-semibold text-[#6e6e73]">
                                        {t('Kitap Adı', 'Book Title')} <span className="text-[#ff3b30]">*</span>
                                    </span>
                                    <input
                                        id="demo-book-title"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        autoCapitalize="sentences"
                                        required
                                        placeholder={t('Kitabın adını yaz', 'Enter the book title')}
                                        className="h-[54px] w-full rounded-[17px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[15px] font-medium transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-semibold text-[#6e6e73]">
                                        <span>{t('Yazar', 'Author')}</span>
                                        <span className="text-[11px] font-normal text-[#aeaeb2]">{t('İsteğe bağlı', 'Optional')}</span>
                                    </span>
                                    <input
                                        value={author}
                                        onChange={(event) => setAuthor(event.target.value)}
                                        autoCapitalize="words"
                                        placeholder={t('Yazarın adı', 'Author name')}
                                        className="h-[54px] w-full rounded-[17px] border border-black/[0.08] bg-[#f9f9fb] px-4 text-[15px] font-medium transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-[13px] font-semibold text-[#6e6e73]">{t('Okuma Durumu', 'Reading Status')}</span>
                                    <span className="relative block">
                                        <select
                                            value={status}
                                            onChange={(event) => setStatus(event.target.value as BookStatus)}
                                            className="h-[54px] w-full appearance-none rounded-[17px] border border-black/[0.08] bg-[#f9f9fb] px-4 pr-11 text-[15px] font-medium outline-none focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                        >
                                            {statusTabs.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#8e8e93]" />
                                    </span>
                                </label>

                                {status === 'finished' && (
                                    <div className="grid gap-5 sm:col-span-2">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-3 text-[13px] font-semibold text-[#6e6e73]">
                                                <span>{t('Puan', 'Score')}</span>
                                                <span className="text-[11px] font-normal text-[#aeaeb2]">{t('İsteğe bağlı', 'Optional')}</span>
                                            </div>
                                            <div
                                                className="flex h-[58px] items-center justify-between gap-3 rounded-[19px] border border-black/[0.08] bg-[#f9f9fb] px-4"
                                                role="radiogroup"
                                                aria-label={t('Puan', 'Score')}
                                            >
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={rating === star}
                                                            aria-label={`${star} / 5 · ${t('Puan', 'Score')}`}
                                                            onClick={() => setRating(star)}
                                                            className="grid size-9 place-items-center rounded-full text-[#d1d1d6] transition hover:scale-110 hover:text-[#ffb800] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff] active:scale-95"
                                                        >
                                                            <Star
                                                                className={`size-6 transition ${star <= rating ? 'fill-[#ffb800] text-[#ffb800]' : ''}`}
                                                                strokeWidth={1.8}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="shrink-0 text-[14px] font-semibold text-[#6e6e73] tabular-nums">{rating}/5</span>
                                            </div>
                                        </div>
                                        <label className="block">
                                            <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-semibold text-[#6e6e73]">
                                                <span>{t('Kitap Hakkındaki Yorumun', 'Your Thoughts')}</span>
                                                <span className="text-[11px] font-normal text-[#aeaeb2]">{t('İsteğe bağlı', 'Optional')}</span>
                                            </span>
                                            <textarea
                                                value={comment}
                                                onChange={(event) => setComment(event.target.value.slice(0, 1200))}
                                                autoCapitalize="sentences"
                                                rows={5}
                                                maxLength={1200}
                                                placeholder={t('Kitap sende nasıl bir iz bıraktı?', 'What did this book leave you with?')}
                                                className="w-full resize-y rounded-[19px] border border-black/[0.08] bg-[#f9f9fb] px-4 py-4 text-[15px] leading-6 outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/40 focus:ring-4 focus:ring-[#007aff]/8"
                                            />
                                            <span className="mt-1.5 block text-right text-[11px] text-[#8e8e93]">{comment.length}/1200</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-end border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                <button
                                    type="submit"
                                    disabled={!title.trim()}
                                    className="h-11 rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:bg-[#d1d1d6]"
                                >
                                    {editingBookId === null ? t('Kitabı Ekle', 'Add Book') : t('Değişiklikleri Kaydet', 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold text-[#007aff]">{t('OKUMA SIRASI', 'READING ORDER')}</p>
                            <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.03em]">{bookStatusLabel(activeStatus, t)}</h2>
                        </div>
                        {visibleBooks.length > 1 && (
                            <p className="text-right text-[11px] leading-4 font-medium text-[#8e8e93]">
                                {t('Sürükle veya oklarla sırala', 'Drag or use arrows to reorder')}
                            </p>
                        )}
                    </div>

                    {visibleBooks.length === 0 ? (
                        <section className="mt-5 rounded-[28px] border border-dashed border-black/[0.12] px-6 py-14 text-center">
                            <span className={`mx-auto grid size-14 place-items-center rounded-[18px] ${bookStatusIconStyle(activeStatus)}`}>
                                <BookOpen className="size-6" />
                            </span>
                            <h2 className="mt-5 text-[19px] font-semibold">{t('Bu bölüm henüz boş', 'Nothing here yet')}</h2>
                            <p className="mt-2 text-[14px] text-[#8e8e93]">
                                {t('İlk kitabını ekleyerek kitaplığını oluşturmaya başla.', 'Add your first book to start building your library.')}
                            </p>
                        </section>
                    ) : (
                        <section className="mt-5 space-y-3" aria-label={bookStatusLabel(activeStatus, t)}>
                            {visibleBooks.map((book, index) => (
                                <article
                                    key={book.id}
                                    draggable
                                    onDragStart={() => setDraggedBookId(book.id)}
                                    onDragEnd={() => setDraggedBookId(null)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => moveDraggedBookBefore(book.id)}
                                    className={`group flex items-start gap-3 rounded-[24px] border border-black/[0.065] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)] transition sm:items-center sm:gap-4 sm:p-5 ${draggedBookId === book.id ? 'opacity-45' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="mt-4 hidden cursor-grab text-[#c7c7cc] active:cursor-grabbing sm:block"
                                        aria-label={t('Sürükleyerek sırala', 'Drag to reorder')}
                                    >
                                        <GripVertical className="size-5" />
                                    </button>
                                    <div
                                        className={`relative grid h-[82px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[8px_13px_13px_8px] px-2 text-center shadow-[0_8px_18px_rgba(0,0,0,0.12)] ${bookCoverStyle(book.status)}`}
                                    >
                                        <span className="absolute inset-y-0 left-1.5 w-px bg-white/25" />
                                        <BookOpen className="size-5 text-white/85" />
                                        <span className="absolute right-1.5 bottom-1.5 left-2.5 truncate text-[7px] font-bold tracking-wide text-white/85 uppercase">
                                            {book.title}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <div className="flex items-start gap-3">
                                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.045] text-[11px] font-bold text-[#8e8e93]">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1 overflow-hidden">
                                                <h3 className="line-clamp-2 text-[16px] leading-5 font-semibold tracking-[-0.015em] [overflow-wrap:anywhere] break-words sm:text-[17px]">
                                                    {book.title}
                                                </h3>
                                                <p className="mt-1 truncate text-[12px] text-[#8e8e93]">
                                                    {book.author || t('Yazar belirtilmedi', 'Author not specified')}
                                                </p>
                                            </div>
                                        </div>
                                        {book.status === 'finished' && book.comment && (
                                            <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-[#34c759]/7 px-3 py-2.5 text-[12px] leading-5 text-[#515154]">
                                                <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-[#34a853]" />
                                                <p className="line-clamp-3 whitespace-pre-wrap">{book.comment}</p>
                                            </div>
                                        )}
                                        {book.status === 'finished' && book.rating > 0 && (
                                            <div className="mt-2 flex items-center gap-1" aria-label={`${book.rating} / 5 · ${t('Puan', 'Score')}`}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`size-3.5 ${star <= book.rating ? 'fill-[#ffb800] text-[#ffb800]' : 'text-[#d1d1d6]'}`}
                                                        strokeWidth={1.8}
                                                        aria-hidden="true"
                                                    />
                                                ))}
                                                <span className="ml-1 text-[11px] font-semibold text-[#6e6e73] tabular-nums">{book.rating}/5</span>
                                            </div>
                                        )}
                                        {book.status === 'finished' && book.finishedAt && (
                                            <time className="mt-2 block text-[10px] font-medium text-[#8e8e93]">
                                                {t('Bitiş', 'Finished')} ·{' '}
                                                {new Intl.DateTimeFormat(getIntlLocale(locale), {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }).format(new Date(book.finishedAt))}
                                            </time>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-center gap-1 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => moveBook(index, index - 1)}
                                            disabled={index === 0}
                                            className="grid size-8 place-items-center rounded-full text-[#8e8e93] transition hover:bg-black/[0.045] disabled:opacity-20"
                                            aria-label={t('Yukarı taşı', 'Move up')}
                                        >
                                            <ChevronUp className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveBook(index, index + 1)}
                                            disabled={index === visibleBooks.length - 1}
                                            className="grid size-8 place-items-center rounded-full text-[#8e8e93] transition hover:bg-black/[0.045] disabled:opacity-20"
                                            aria-label={t('Aşağı taşı', 'Move down')}
                                        >
                                            <ChevronDown className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editBook(book)}
                                            className="grid size-8 place-items-center rounded-full text-[#8e8e93] transition hover:bg-[#007aff]/8 hover:text-[#007aff]"
                                            aria-label={
                                                book.status === 'finished' && !book.comment && book.rating === 0
                                                    ? t('Yorum ekle', 'Add comment')
                                                    : t('Kitabı düzenle', 'Edit book')
                                            }
                                        >
                                            {book.status === 'finished' && !book.comment && book.rating === 0 ? (
                                                <MessageCircle className="size-4" />
                                            ) : (
                                                <Pencil className="size-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (editingBookId === book.id) resetEditor();
                                                onRemoveBook(book.id);
                                            }}
                                            className="grid size-8 place-items-center rounded-full text-[#aeaeb2] transition hover:bg-[#ff3b30]/8 hover:text-[#ff3b30]"
                                            aria-label={t('Kitabı sil', 'Delete book')}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </main>
            </div>
        </>
    );
}

function PanelHeader({
    t,
    active,
    goals,
    onNavigate,
}: {
    t: Translate;
    active: PanelSection;
    goals: GoalRecord[];
    onNavigate: (section: PanelSection) => void;
}) {
    const navigationItems = [
        { section: 'overview' as const, label: t('Genel Bakış', 'Overview'), mobileLabel: t('Genel', 'Home'), icon: Layers3 },
        { section: 'goals' as const, label: t('Hedefler', 'Goals'), mobileLabel: t('Hedefler', 'Goals'), icon: Target },
        { section: 'plan' as const, label: t('Planla', 'Plan'), mobileLabel: t('Planla', 'Plan'), icon: ListTodo },
        { section: 'notes' as const, label: t('Notlar', 'Notes'), mobileLabel: t('Notlar', 'Notes'), icon: NotebookPen },
        { section: 'library' as const, label: t('Kitaplık', 'Library'), mobileLabel: t('Kitaplık', 'Library'), icon: BookOpen },
    ];
    const storedProfile = loadStoredProfile();
    const profileInitial = storedProfile.name.trim().charAt(0).toLocaleUpperCase() || 'K';
    const overallProgress = calculateOverallProgress(goals);

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
                        {navigationItems.map((item) => (
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
                        <button
                            type="button"
                            onClick={() => onNavigate('profile')}
                            className="grid size-11 place-items-center rounded-full p-[2.5px] text-[#6e6e73] shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition hover:scale-[1.03] hover:text-[#1d1d1f] active:scale-95"
                            style={{ background: `conic-gradient(#007aff ${overallProgress}%, rgba(142,142,147,0.2) 0)` }}
                            aria-label={t(
                                `Profili aç, genel ilerleme yüzde ${overallProgress}`,
                                `Open profile, overall progress ${overallProgress} percent`,
                            )}
                        >
                            <span className="grid size-full place-items-center overflow-hidden rounded-full border-2 border-[#f5f5f7] bg-white">
                                {storedProfile.avatar ? (
                                    <img src={storedProfile.avatar} alt="" className="size-full object-cover" />
                                ) : (
                                    <span className="grid size-full place-items-center bg-[#007aff] text-[15px] font-semibold text-white">
                                        {profileInitial}
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="demo-mobile-dock fixed inset-x-0 bottom-0 z-40 flex items-end gap-2.5 px-3 sm:hidden">
                <nav
                    className="demo-mobile-navigation grid min-w-0 flex-1 grid-cols-5 rounded-[29px] border border-white/48 bg-white/45 p-1.5 shadow-[0_12px_34px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.68)] backdrop-blur-[34px]"
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
                                className={`demo-mobile-nav-item relative flex h-[56px] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[23px] text-[10px] leading-none font-semibold whitespace-nowrap transition duration-300 ${selected ? 'is-active text-[#007aff]' : 'text-[#6e6e73]'}`}
                                aria-current={selected ? 'page' : undefined}
                            >
                                <Icon className="relative z-10 size-[21px]" strokeWidth={selected ? 2.5 : 2} />
                                <span className="relative z-10 max-w-full truncate px-1">{item.mobileLabel}</span>
                            </button>
                        );
                    })}
                </nav>

                <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="demo-mobile-profile-island grid size-[69px] shrink-0 place-items-center rounded-full border border-white/48 bg-white/45 p-[6px] text-[#1d1d1f] shadow-[0_12px_34px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.68)] backdrop-blur-[34px] transition active:scale-95"
                    aria-label={t(`Profili aç, genel ilerleme yüzde ${overallProgress}`, `Open profile, overall progress ${overallProgress} percent`)}
                >
                    <span
                        className="grid size-full place-items-center rounded-full p-[3px]"
                        style={{ background: `conic-gradient(#007aff ${overallProgress}%, rgba(142,142,147,0.2) 0)` }}
                    >
                        <span className="grid size-full place-items-center overflow-hidden rounded-full border-2 border-white/80 bg-[#f2f2f7]">
                            {storedProfile.avatar ? (
                                <img
                                    src={storedProfile.avatar}
                                    alt={t('Profil fotoğrafı', 'Profile photo')}
                                    className="size-full rounded-full object-cover shadow-[0_3px_12px_rgba(0,0,0,0.16)]"
                                />
                            ) : (
                                <UserRound className="size-[24px]" strokeWidth={2.15} />
                            )}
                        </span>
                    </span>
                </button>
            </div>
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
                    {SUPPORTED_LOCALES.map((language, index) => (
                        <SettingOption
                            key={language.code}
                            icon={Languages}
                            label={language.label}
                            description={language.description}
                            selected={settings.language === language.code}
                            onSelect={() => onChange({ ...settings, language: language.code })}
                            divided={index !== 0}
                        />
                    ))}
                </div>
            </section>

            <section className="mt-8">
                <h2 className="mb-3 px-1 text-[13px] font-semibold text-[#6e6e73]">{t('Planlar', 'Plans')}</h2>
                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            ...settings,
                            carryOverIncompletePlans: !settings.carryOverIncompletePlans,
                            carryOverPreferenceSet: true,
                        })
                    }
                    className="flex w-full items-center gap-4 rounded-[24px] border border-black/[0.07] bg-white px-5 py-4 text-left shadow-[0_12px_45px_rgba(0,0,0,0.04)] transition active:bg-black/[0.025] sm:px-6"
                    aria-pressed={settings.carryOverIncompletePlans}
                >
                    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#ff9500]/10 text-[#ff9500]">
                        <CalendarRange className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold tracking-[-0.01em]">
                            {t('Tamamlanmayanları ertesi güne aktar', 'Carry incomplete items to the next day')}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-[#8e8e93]">
                            {t(
                                'Günlük planda bitmeyen maddeler otomatik olarak bugüne taşınır.',
                                'Unfinished daily items automatically move to today.',
                            )}
                        </span>
                    </span>
                    <span
                        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition ${settings.carryOverIncompletePlans ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}
                    >
                        <span
                            className={`absolute top-0.5 size-[27px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.22)] transition-transform ${settings.carryOverIncompletePlans ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                        />
                    </span>
                </button>
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
    overallProgress,
    onClose,
    onExportReport,
    onSave,
    onSettingsChange,
}: {
    t: Translate;
    locale: Locale;
    profile: ProfileData;
    settings: SettingsData;
    overallProgress: number;
    onClose: () => void;
    onExportReport: () => void;
    onSave: (profile: ProfileData) => void;
    onSettingsChange: (settings: SettingsData) => void;
}) {
    const [tab, setTab] = useState<'public' | 'personal' | 'settings'>('public');
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
    const profileInitial = draft.name.trim().charAt(0).toLocaleUpperCase() || 'K';
    const selectedCountry = isCountryCode(draft.country) ? draft.country : null;
    const phoneIsValid = selectedCountry ? isNationalPhoneLengthValid(draft.phone, selectedCountry) : false;
    const usernameIsValid = /^[\p{L}\p{N}._]{3,30}$/u.test(draft.username.trim());

    const returnToPublicProfile = () => {
        setDraft(profile);
        setTab('public');
    };

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose]);

    const savePersonalInformation = (event: FormEvent) => {
        event.preventDefault();
        onSave({
            name: draft.name.trim(),
            username: normalizeUsernameInput(draft.username),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            birthDate: draft.birthDate,
            country: draft.country,
            profession: draft.profession,
            about: draft.about.trim(),
            educations: draft.educations,
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

            <div
                className="apple-interface fixed inset-0 z-50 bg-black/30 text-[#1d1d1f] backdrop-blur-[3px] selection:bg-[#007aff]/20"
                role="presentation"
                onMouseDown={onClose}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="profile-sheet-title"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="demo-profile-sheet absolute inset-x-0 top-[max(0.65rem,env(safe-area-inset-top))] bottom-0 overflow-y-auto rounded-t-[38px] border border-white/55 bg-[#f2f2f7] shadow-[0_-12px_70px_rgba(0,0,0,0.24)]"
                >
                    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.055] bg-[#f2f2f7]/82 px-5 py-4 backdrop-blur-2xl sm:px-8 sm:py-5">
                        <div className="flex min-w-0 items-center gap-3">
                            {tab !== 'public' && (
                                <button
                                    type="button"
                                    onClick={returnToPublicProfile}
                                    className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.055] text-[#3a3a3c] transition hover:bg-black/[0.09] active:scale-95"
                                    aria-label={t('Profile dön', 'Back to profile')}
                                >
                                    <ArrowLeft className="size-[18px]" />
                                </button>
                            )}
                            <div className="relative h-8 w-24 shrink-0">
                                <BrandLogo variant="color" className="demo-logo-light absolute inset-0 size-full" />
                                <BrandLogo variant="white" className="demo-logo-dark absolute inset-0 size-full opacity-0" />
                            </div>
                            <span className="h-5 w-px bg-black/[0.1]" aria-hidden="true" />
                            <h1 id="profile-sheet-title" className="truncate text-[17px] font-semibold tracking-[-0.025em]">
                                {tab === 'public' ? t('Profil', 'Profile') : t('Hesap', 'Account')}
                            </h1>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="grid size-11 shrink-0 place-items-center rounded-full bg-black/[0.065] text-[#3a3a3c] transition hover:bg-black/[0.1] active:scale-95"
                            aria-label={t('Profili kapat', 'Close profile')}
                        >
                            <X className="size-5" strokeWidth={2.3} />
                        </button>
                    </header>

                    <main className="mx-auto max-w-4xl px-4 pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 sm:pb-10">
                        {tab === 'public' ? (
                            <PublicProfileView
                                t={t}
                                locale={locale}
                                profile={draft}
                                overallProgress={overallProgress}
                                onEdit={() => setTab('personal')}
                                onExportReport={onExportReport}
                                onSettings={() => setTab('settings')}
                            />
                        ) : (
                            <>
                                <div className="flex w-full items-center gap-4 rounded-[26px] border border-black/[0.055] bg-white px-5 py-5 shadow-[0_10px_34px_rgba(0,0,0,0.045)] sm:px-6">
                                    <div className="relative shrink-0">
                                        <div
                                            className="grid size-[72px] place-items-center rounded-full p-[4px] shadow-[0_7px_20px_rgba(0,122,255,0.14)]"
                                            style={{ background: `conic-gradient(#007aff ${overallProgress}%, rgba(142,142,147,0.2) 0)` }}
                                            role="img"
                                            aria-label={t(`Genel ilerleme yüzde ${overallProgress}`, `Overall progress ${overallProgress} percent`)}
                                        >
                                            <span className="grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-white bg-white">
                                                {draft.avatar ? (
                                                    <img
                                                        src={draft.avatar}
                                                        alt={t('Profil fotoğrafı', 'Profile photo')}
                                                        className="size-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="grid size-full place-items-center rounded-full bg-[#007aff] text-[23px] font-semibold text-white">
                                                        {profileInitial}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <label
                                            htmlFor="demo-profile-photo"
                                            className="absolute -right-1 -bottom-1 grid size-7 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#1d1d1f] text-white shadow-md transition hover:scale-105"
                                            title={t('Profil fotoğrafını değiştir', 'Change profile photo')}
                                        >
                                            <Camera className="size-3.5" />
                                        </label>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em]">
                                            {draft.name || t('Ad Soyad', 'Full Name')}
                                        </h2>
                                        <p className="mt-1 truncate text-[13px] font-medium text-[#6e6e73]">
                                            {draft.username ? `@${draft.username}` : t('Kullanıcı adı', 'Username')}
                                        </p>
                                        <p className="mt-0.5 truncate text-[12px] text-[#8e8e93]">
                                            {draft.email || t('E-posta adresi', 'Email address')}
                                        </p>
                                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#007aff]">
                                            <TrendingUp className="size-3.5" />
                                            {t('Genel ilerleme', 'Overall progress')} · %{overallProgress}
                                        </p>
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
                                                    {t('Fotoğrafı Kaldır', 'Remove Photo')}
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

                                <div className="mt-5 flex w-full items-center rounded-full bg-black/[0.045] p-1 sm:w-fit">
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
                                        <div className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
                                            <ProfileField
                                                label={t('Ad Soyad', 'Full Name')}
                                                value={draft.name}
                                                onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                                                autoComplete="name"
                                                icon={UserRound}
                                                required
                                            />
                                            <ProfileUsernameField
                                                t={t}
                                                value={draft.username}
                                                valid={usernameIsValid}
                                                onChange={(username) => setDraft((current) => ({ ...current, username }))}
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
                                            <div className="border-t border-black/[0.055] pt-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#007aff]/10 text-[#007aff]">
                                                        <NotebookPen className="size-5" />
                                                    </span>
                                                    <div>
                                                        <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{t('Hakkımda', 'About Me')}</h3>
                                                        <p className="mt-0.5 text-[12px] text-[#8e8e93]">
                                                            {t(
                                                                'Kısa tanıtımın ve eklediğin eğitimler burada yer alır.',
                                                                'Your introduction and added education appear here.',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <ProfileAboutField
                                                t={t}
                                                value={draft.about}
                                                onChange={(about) => setDraft((current) => ({ ...current, about }))}
                                            />

                                            <ProfileEducationSection
                                                t={t}
                                                educations={draft.educations}
                                                onChange={(educations) => setDraft((current) => ({ ...current, educations }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-4 border-t border-black/[0.055] bg-[#fbfbfd] px-5 py-4 sm:px-7">
                                            {saved && <span className="text-[13px] font-medium text-[#28a745]">{t('Kaydedildi', 'Saved')}</span>}
                                            <button
                                                type="submit"
                                                disabled={
                                                    !draft.name.trim() ||
                                                    !usernameIsValid ||
                                                    !draft.email.trim() ||
                                                    !phoneIsValid ||
                                                    !draft.birthDate ||
                                                    !selectedCountry
                                                }
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
                                                        <h3 className="text-[15px] font-semibold">
                                                            {t('Şifreni mi unuttun?', 'Forgot your password?')}
                                                        </h3>
                                                        <p className="mt-1 text-[12px] leading-5 text-[#8e8e93]">
                                                            {t(
                                                                'E-postana güvenli bir sıfırlama bağlantısı gönder.',
                                                                'Send a secure reset link to your email.',
                                                            )}
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
                            </>
                        )}
                    </main>
                </section>
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

function PublicProfileView({
    t,
    locale,
    profile,
    overallProgress,
    onEdit,
    onExportReport,
    onSettings,
}: {
    t: Translate;
    locale: Locale;
    profile: ProfileData;
    overallProgress: number;
    onEdit: () => void;
    onExportReport: () => void;
    onSettings: () => void;
}) {
    const initial = profile.name.trim().charAt(0).toLocaleUpperCase(getIntlLocale(locale)) || 'K';
    const country = isCountryCode(profile.country) ? getCountryOption(profile.country, locale) : null;
    const profession = professionOptions(t).find((option) => option.value === profile.profession)?.label;
    const hasEducation = profile.educations.length > 0;

    return (
        <div className="demo-step-enter mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onSettings}
                    className="grid size-11 place-items-center rounded-full border border-black/[0.06] bg-white text-[#6e6e73] shadow-[0_5px_18px_rgba(0,0,0,0.045)] transition hover:bg-[#fafafa] active:scale-95"
                    aria-label={t('Ayarları aç', 'Open settings')}
                >
                    <Settings2 className="size-[19px]" />
                </button>
                <button
                    type="button"
                    onClick={onExportReport}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[13px] font-semibold text-[#3a3a3c] shadow-[0_5px_18px_rgba(0,0,0,0.045)] transition hover:bg-[#fafafa] active:scale-95"
                >
                    <FileDown className="size-[17px] text-[#007aff]" />
                    PDF
                </button>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#007aff] px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition hover:bg-[#006ee6] active:scale-[0.98]"
                >
                    <Pencil className="size-4" />
                    {t('Profili Düzenle', 'Edit Profile')}
                </button>
            </div>

            <article className="overflow-hidden rounded-[32px] border border-black/[0.055] bg-white shadow-[0_16px_55px_rgba(0,0,0,0.07)]">
                <div className="relative h-36 overflow-hidden bg-[linear-gradient(135deg,#001f26_0%,#005b67_48%,#37b9c5_100%)] sm:h-44">
                    <span className="absolute -top-16 -right-12 size-52 rounded-full bg-white/12 blur-2xl" />
                    <span className="absolute -bottom-24 -left-10 size-64 rounded-full bg-[#007aff]/30 blur-3xl" />
                    <span className="absolute top-8 left-[42%] size-20 rounded-full bg-white/8 blur-xl" />
                </div>

                <div className="px-5 pb-7 text-center sm:px-8 sm:pb-8">
                    <div
                        className="relative mx-auto -mt-16 grid size-32 place-items-center rounded-full p-[5px] shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
                        style={{ background: `conic-gradient(#007aff ${overallProgress}%, rgba(255,255,255,0.42) 0)` }}
                    >
                        <span className="grid size-full place-items-center overflow-hidden rounded-full border-4 border-white bg-white">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={t('Profil fotoğrafı', 'Profile photo')}
                                    className="size-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="grid size-full place-items-center rounded-full bg-[#007aff] text-[38px] font-semibold text-white">
                                    {initial}
                                </span>
                            )}
                        </span>
                    </div>

                    <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] sm:text-[32px]">{profile.name || t('Ad Soyad', 'Full Name')}</h2>
                    <p className="mt-1 text-[14px] font-medium text-[#8e8e93]">
                        {profile.username ? `@${profile.username}` : t('Kullanıcı adı eklenmedi', 'No username yet')}
                    </p>

                    {(profession || country) && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            {profession && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.045] px-3 py-1.5 text-[12px] font-medium text-[#6e6e73]">
                                    <BriefcaseBusiness className="size-3.5" />
                                    {profession}
                                </span>
                            )}
                            {country && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.045] px-3 py-1.5 text-[12px] font-medium text-[#6e6e73]">
                                    <span className="text-[15px] leading-none" aria-hidden="true">
                                        {country.flag}
                                    </span>
                                    {country.name}
                                </span>
                            )}
                        </div>
                    )}

                    {profile.about.trim() && <p className="mx-auto mt-5 max-w-xl text-[14px] leading-6 text-[#515154]">{profile.about.trim()}</p>}
                </div>
            </article>

            <div className={`mt-5 grid gap-5 ${hasEducation ? 'md:grid-cols-[0.82fr_1.18fr]' : ''}`}>
                <section className="rounded-[26px] border border-black/[0.055] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.045)] sm:p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#007aff]/10 text-[#007aff]">
                            <TrendingUp className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-[#8e8e93]">{t('Genel İlerleme', 'Overall Progress')}</p>
                            <p className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em]">%{overallProgress}</p>
                        </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.055]">
                        <div className="h-full rounded-full bg-[#007aff] transition-[width] duration-500" style={{ width: `${overallProgress}%` }} />
                    </div>
                </section>

                {hasEducation && (
                    <section className="overflow-hidden rounded-[26px] border border-black/[0.055] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.045)]">
                        <div className="flex items-center gap-3 border-b border-black/[0.055] px-5 py-4 sm:px-6">
                            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#5856d6]/10 text-[#5856d6]">
                                <GraduationCap className="size-[19px]" />
                            </span>
                            <h3 className="text-[16px] font-semibold">{t('Eğitim', 'Education')}</h3>
                        </div>
                        <div>
                            {profile.educations.map((education) => (
                                <div
                                    key={education.id}
                                    className="flex items-start gap-3 border-b border-black/[0.045] px-5 py-4 last:border-b-0 sm:px-6"
                                >
                                    <span className="mt-1 size-2 shrink-0 rounded-full bg-[#5856d6]" />
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold">{educationLevelLabel(education.level, t)}</p>
                                        {education.level !== 'high-school' && (
                                            <>
                                                <p className="mt-1 text-[12px] leading-5 text-[#6e6e73]">{education.university}</p>
                                                {education.department && <p className="mt-0.5 text-[11px] text-[#8e8e93]">{education.department}</p>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
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
                    autoCapitalize={type === 'text' ? 'words' : 'none'}
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

function ProfileUsernameField({ t, value, valid, onChange }: { t: Translate; value: string; valid: boolean; onChange: (value: string) => void }) {
    const showError = Boolean(value && !valid);

    return (
        <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                {t('Kullanıcı Adı', 'Username')}
                <span className="ml-1 text-[#ff3b30]">*</span>
            </span>
            <span
                className={`flex items-center rounded-[16px] border bg-[#f9f9fb] transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8 ${showError ? 'border-[#ff3b30]/45' : 'border-black/[0.08]'}`}
            >
                <span className="flex h-[52px] shrink-0 items-center border-r border-black/[0.07] px-4 text-[15px] font-semibold text-[#8e8e93]">
                    @
                </span>
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(normalizeUsernameInput(event.target.value))}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    minLength={3}
                    maxLength={30}
                    required
                    placeholder={t('kullaniciadi', 'username')}
                    className="h-[52px] min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                />
            </span>
            <span className={`mt-2 block text-[11px] ${showError ? 'font-medium text-[#ff3b30]' : 'text-[#8e8e93]'}`}>
                {t('3–30 karakter; harf, rakam, nokta ve alt çizgi kullanabilirsin.', 'Use 3–30 letters, numbers, periods, or underscores.')}
            </span>
        </label>
    );
}

function ProfileAboutField({ t, value, onChange }: { t: Translate; value: string; onChange: (value: string) => void }) {
    const limit = 500;

    return (
        <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-medium text-[#6e6e73]">
                <span>{t('Kısa Tanıtım', 'Introduction')}</span>
                <span className="text-[11px] font-normal text-[#8e8e93]">{t('İsteğe bağlı', 'Optional')}</span>
            </span>
            <span className="flex items-start gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 py-3 transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8">
                <NotebookPen className="mt-1 size-[17px] shrink-0 text-[#8e8e93]" />
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value.slice(0, limit))}
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    maxLength={limit}
                    rows={4}
                    placeholder={t('Kendinden kısaca bahset', 'Tell us a little about yourself')}
                    className="min-h-24 min-w-0 flex-1 resize-y bg-transparent text-[15px] leading-relaxed font-medium outline-none placeholder:text-[#aeaeb2]"
                />
            </span>
            <span className="mt-2 block text-right text-[11px] text-[#8e8e93]">
                {value.length}/{limit}
            </span>
        </label>
    );
}

function ProfileEducationSection({
    t,
    educations,
    onChange,
}: {
    t: Translate;
    educations: EducationRecord[];
    onChange: (educations: EducationRecord[]) => void;
}) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [level, setLevel] = useState<EducationLevel>('');
    const [university, setUniversity] = useState('');
    const [department, setDepartment] = useState('');
    const universityDetailsRequired = Boolean(level && level !== 'high-school');
    const entryIsValid = Boolean(level) && (!universityDetailsRequired || Boolean(university.trim() && department.trim()));

    const resetEditor = () => {
        setEditorOpen(false);
        setEditingId(null);
        setLevel('');
        setUniversity('');
        setDepartment('');
    };

    const openNewEducation = () => {
        setEditingId(null);
        setLevel('');
        setUniversity('');
        setDepartment('');
        setEditorOpen(true);
    };

    const editEducation = (education: EducationRecord) => {
        setEditingId(education.id);
        setLevel(education.level);
        setUniversity(education.university);
        setDepartment(education.department);
        setEditorOpen(true);
    };

    const addEducation = () => {
        if (!entryIsValid || !level) return;

        const education: EducationRecord = {
            id: editingId ?? Date.now(),
            level,
            university: level === 'high-school' ? '' : university.trim(),
            department: level === 'high-school' ? '' : department.trim(),
        };

        onChange(editingId === null ? [...educations, education] : educations.map((item) => (item.id === editingId ? education : item)));
        resetEditor();
    };

    return (
        <section className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f9f9fb]">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#5856d6]/10 text-[#5856d6]">
                        <GraduationCap className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h4 className="text-[15px] font-semibold">{t('Eğitim Bilgileri', 'Education')}</h4>
                        <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                            {t('İsteğe bağlı · Birden fazla eklenebilir', 'Optional · Add multiple entries')}
                        </p>
                    </div>
                </div>
                {!editorOpen && (
                    <button
                        type="button"
                        onClick={openNewEducation}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#007aff] px-3.5 text-[12px] font-semibold text-white transition active:scale-95"
                    >
                        <Plus className="size-3.5" />
                        {t('Ekle', 'Add')}
                    </button>
                )}
            </div>

            {educations.length > 0 && (
                <div className="border-t border-black/[0.055] bg-white">
                    {educations.map((education) => (
                        <div key={education.id} className="flex items-center gap-3 border-b border-black/[0.045] px-4 py-4 last:border-b-0 sm:px-5">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5856d6]/10 text-[#5856d6]">
                                <GraduationCap className="size-[18px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold">{educationLevelLabel(education.level, t)}</p>
                                {education.level !== 'high-school' && (
                                    <>
                                        <p className="mt-0.5 truncate text-[12px] text-[#6e6e73]">{education.university}</p>
                                        {education.department && <p className="mt-0.5 truncate text-[11px] text-[#8e8e93]">{education.department}</p>}
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => editEducation(education)}
                                className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.045] text-[#6e6e73] transition hover:bg-black/[0.075]"
                                aria-label={t('Eğitimi düzenle', 'Edit education')}
                            >
                                <Pencil className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(educations.filter((item) => item.id !== education.id));
                                    if (editingId === education.id) resetEditor();
                                }}
                                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ff3b30]/8 text-[#ff3b30] transition hover:bg-[#ff3b30]/12"
                                aria-label={t('Eğitimi kaldır', 'Remove education')}
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {editorOpen && (
                <div className="space-y-5 border-t border-black/[0.055] bg-white px-4 py-5 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                        <h5 className="text-[14px] font-semibold">
                            {editingId === null ? t('Yeni Eğitim', 'New Education') : t('Eğitimi Düzenle', 'Edit Education')}
                        </h5>
                        <button
                            type="button"
                            onClick={resetEditor}
                            className="grid size-8 place-items-center rounded-full bg-black/[0.05] text-[#6e6e73]"
                            aria-label={t('Vazgeç', 'Cancel')}
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <ProfileSelect
                        label={t('Mezuniyet', 'Graduation Level')}
                        value={level}
                        onChange={(educationLevel) => {
                            const nextLevel = educationLevel as EducationLevel;
                            setLevel(nextLevel);
                            if (!nextLevel || nextLevel === 'high-school') {
                                setUniversity('');
                                setDepartment('');
                            }
                        }}
                        icon={GraduationCap}
                        placeholder={t('Mezuniyet seviyesini seç', 'Choose graduation level')}
                        options={educationLevelOptions(t)}
                        required
                    />

                    {level === 'high-school' && (
                        <div className="rounded-[16px] bg-[#5856d6]/8 px-4 py-3 text-[12px] leading-relaxed text-[#6e6e73]">
                            {t(
                                'Lise mezuniyeti için okul veya bölüm adı girmen gerekmiyor.',
                                'You do not need to enter a school or department for high school graduation.',
                            )}
                        </div>
                    )}

                    {universityDetailsRequired && (
                        <>
                            <UniversitySearchField t={t} value={university} onChange={setUniversity} />
                            <ProfileField
                                label={t('Bölüm', 'Department / Major')}
                                value={department}
                                onChange={setDepartment}
                                autoComplete="off"
                                icon={GraduationCap}
                                placeholder={t('Bölümünü yaz', 'Enter your department or major')}
                                required
                            />
                        </>
                    )}

                    <button
                        type="button"
                        onClick={addEducation}
                        disabled={!entryIsValid}
                        className="h-11 w-full rounded-full bg-[#007aff] px-5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:bg-[#d1d1d6]"
                    >
                        {editingId === null ? t('Hakkımda Alanına Ekle', 'Add to About') : t('Eğitimi Güncelle', 'Update Education')}
                    </button>
                </div>
            )}
        </section>
    );
}

function UniversitySearchField({ t, value, onChange }: { t: Translate; value: string; onChange: (value: string) => void }) {
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<UniversityOption[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const query = value.trim();

    useEffect(() => {
        if (!focused || query.length < 2) {
            setResults([]);
            setStatus('idle');
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setStatus('loading');

            try {
                const response = await fetch(`/demo/universities?q=${encodeURIComponent(query)}`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) throw new Error('University search failed');

                const payload: unknown = await response.json();
                const nextResults = Array.isArray(payload)
                    ? payload
                          .filter(isUniversityApiRecord)
                          .map((university) => ({
                              name: university.name.trim(),
                              country: university.country.trim(),
                              countryCode: university.alpha_two_code.trim().toUpperCase(),
                          }))
                          .filter(
                              (university, index, universities) =>
                                  university.name &&
                                  universities.findIndex(
                                      (candidate) =>
                                          candidate.name.toLocaleLowerCase() === university.name.toLocaleLowerCase() &&
                                          candidate.countryCode === university.countryCode,
                                  ) === index,
                          )
                          .slice(0, 12)
                    : [];

                setResults(nextResults);
                setStatus('ready');
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setResults([]);
                setStatus('error');
            }
        }, 350);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [focused, query]);

    const exactMatch = results.some((university) => university.name.toLocaleLowerCase() === query.toLocaleLowerCase());
    const showOptions = focused && query.length >= 2;

    return (
        <div className="block">
            <label htmlFor="demo-profile-university" className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                {t('Üniversite', 'University')}
                <span className="ml-1 text-[#ff3b30]">*</span>
            </label>
            <div
                className={`overflow-hidden rounded-[16px] border bg-[#f9f9fb] transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8 ${showOptions ? 'border-[#007aff]/30 bg-white' : 'border-black/[0.08]'}`}
            >
                <div className="flex items-center gap-3 px-4">
                    <Search className="size-[17px] shrink-0 text-[#8e8e93]" />
                    <input
                        id="demo-profile-university"
                        type="text"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
                        autoComplete="off"
                        autoCapitalize="words"
                        autoCorrect="off"
                        required
                        placeholder={t('Üniversite adını aramaya başla', 'Start typing a university name')}
                        className="h-[52px] min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                    />
                    {status === 'loading' && <span className="size-4 animate-spin rounded-full border-2 border-[#007aff]/20 border-t-[#007aff]" />}
                </div>

                {showOptions && (
                    <div className="max-h-72 overflow-y-auto border-t border-black/[0.055] bg-white" role="listbox">
                        {results.map((university) => (
                            <button
                                key={`${university.name}-${university.countryCode}`}
                                type="button"
                                role="option"
                                aria-selected={university.name === value}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    onChange(university.name);
                                    setFocused(false);
                                }}
                                className="flex w-full items-center gap-3 border-b border-black/[0.045] px-4 py-3 text-left transition hover:bg-[#007aff]/5"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#5856d6]/10 text-[#5856d6]">
                                    <GraduationCap className="size-[17px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-semibold">{university.name}</span>
                                    <span className="mt-0.5 block truncate text-[11px] text-[#8e8e93]">
                                        {university.country} · {university.countryCode}
                                    </span>
                                </span>
                                <ChevronRight className="size-4 shrink-0 text-[#c7c7cc]" />
                            </button>
                        ))}

                        {!exactMatch && (
                            <button
                                type="button"
                                role="option"
                                aria-selected="false"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => setFocused(false)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#007aff]/5"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#007aff]/10 text-[#007aff]">
                                    <Plus className="size-[17px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-semibold">“{query}”</span>
                                    <span className="mt-0.5 block text-[11px] text-[#8e8e93]">
                                        {t('Listede yoksa yazdığın adla ekle', 'Not listed? Add the name you entered')}
                                    </span>
                                </span>
                            </button>
                        )}

                        {status === 'ready' && results.length === 0 && exactMatch && (
                            <p className="px-4 py-3 text-[12px] text-[#8e8e93]">
                                {t('Eşleşen üniversite bulunamadı.', 'No matching university found.')}
                            </p>
                        )}
                        {status === 'error' && (
                            <p className="px-4 py-3 text-[12px] text-[#8e8e93]">
                                {t(
                                    'Havuz şu an yüklenemedi; okul adını manuel ekleyebilirsin.',
                                    'The directory is unavailable; you can add the university manually.',
                                )}
                            </p>
                        )}
                    </div>
                )}
            </div>
            <span className="mt-2 block text-[11px] text-[#8e8e93]">
                {t(
                    'Dünya genelindeki üniversite havuzunda ara veya kendi okul adını yaz.',
                    'Search the worldwide university directory or enter your school manually.',
                )}
            </span>
        </div>
    );
}

function CountryPickerField({
    t,
    locale,
    value,
    onChange,
}: {
    t: Translate;
    locale: Locale;
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
    locale: Locale;
    value: CountryCode | null;
    onCancel: () => void;
    onChange: (country: CountryCode) => void;
}) {
    const [query, setQuery] = useState('');
    const countries = useMemo(() => getCountryOptions(locale), [locale]);
    const normalizedQuery = query.trim().toLocaleLowerCase(getIntlLocale(locale));
    const results = useMemo(
        () =>
            normalizedQuery
                ? countries.filter((country) => {
                      const searchable = `${country.name} ${country.code} +${country.callingCode}`.toLocaleLowerCase(getIntlLocale(locale));
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

function BirthDateField({ t, locale, value, onChange }: { t: Translate; locale: Locale; value: string; onChange: (date: string) => void }) {
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
    locale: Locale;
    selectedDate: string;
    onCancel: () => void;
    onSelect: (date: string) => void;
}) {
    const language = getIntlLocale(locale);
    const initialDate = selectedDate ? parseDateKey(selectedDate) : new Date(new Date().getFullYear() - 25, new Date().getMonth(), 1, 12);
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialDate));
    const today = formatDateKey(new Date());
    const days = useMemo(() => calendarMonthDays(visibleMonth), [visibleMonth]);
    const numberFormatter = useMemo(() => new Intl.NumberFormat(language, { useGrouping: false }), [language]);
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
                                    {numberFormatter.format(year)}
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
                                {numberFormatter.format(day.getDate())}
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
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: typeof UserRound;
    placeholder: string;
    optionalLabel?: string;
    options: Array<{ value: string; label: string }>;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-medium text-[#6e6e73]">
                <span>
                    {label}
                    {required && <span className="ml-1 text-[#ff3b30]">*</span>}
                </span>
                {optionalLabel && <span className="text-[11px] font-normal text-[#8e8e93]">{optionalLabel}</span>}
            </span>
            <span className="relative flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-[#f9f9fb] px-4 transition focus-within:border-[#007aff]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007aff]/8">
                <Icon className="size-[17px] shrink-0 text-[#8e8e93]" />
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
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

function PlanPeriodControl({
    t,
    locale,
    range,
    date,
    className = 'mt-9',
    onRangeChange,
    onDateChange,
    onAddReminder,
}: {
    t: Translate;
    locale: Locale;
    range: PlanRange;
    date: string;
    className?: string;
    onRangeChange: (range: PlanRange) => void;
    onDateChange: (date: string) => void;
    onAddReminder?: (date: string) => void;
}) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const move = (direction: -1 | 1) => onDateChange(shiftPlanDate(date, range, direction));
    const daySelected = range === 'today' || range === 'tomorrow';
    const openDay = () => {
        if (!daySelected) {
            onRangeChange('today');
            onDateChange(formatDateKey(new Date()));
            return;
        }

        setCalendarOpen(true);
    };
    const periodOptions: Array<{ value: 'week' | 'month' | 'year'; label: string }> = [
        { value: 'week', label: t('Hafta', 'Week') },
        { value: 'month', label: t('Ay', 'Month') },
        { value: 'year', label: t('Yıl', 'Year') },
    ];

    return (
        <div
            className={`${className} grid grid-cols-[minmax(0,1.75fr)_repeat(3,minmax(0,1fr))] items-center rounded-full bg-black/[0.045] p-1`}
            aria-label={t('Tarih ve dönem seçimi', 'Date and period selection')}
        >
            <div
                className={`flex h-11 min-w-0 items-center rounded-full transition ${
                    daySelected ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'
                }`}
            >
                <button
                    type="button"
                    onClick={() => move(-1)}
                    className="grid size-8 shrink-0 place-items-center rounded-full transition hover:text-[#007aff] active:scale-90 sm:size-9"
                    aria-label={t('Önceki döneme git', 'Go to previous period')}
                >
                    <ChevronLeft className="size-[17px]" />
                </button>

                <button
                    type="button"
                    onClick={openDay}
                    className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden text-[12px] font-semibold sm:text-[14px]"
                    aria-haspopup="dialog"
                    aria-expanded={calendarOpen}
                >
                    <CalendarDays className="hidden size-[16px] shrink-0 text-[#007aff] min-[430px]:block" />
                    <span className="truncate capitalize">{formatPlanDayLabel(date, locale, t)}</span>
                </button>

                <button
                    type="button"
                    onClick={() => move(1)}
                    className="grid size-8 shrink-0 place-items-center rounded-full transition hover:text-[#007aff] active:scale-90 sm:size-9"
                    aria-label={t('Sonraki döneme git', 'Go to next period')}
                >
                    <ChevronRight className="size-[17px]" />
                </button>
            </div>

            {periodOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onRangeChange(option.value)}
                    className={`h-11 min-w-0 rounded-full px-1 text-[12px] font-medium transition sm:px-5 sm:text-[14px] ${
                        range === option.value ? 'bg-white text-[#1d1d1f] shadow-[0_1px_6px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                >
                    {option.label}
                </button>
            ))}

            {calendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={date}
                    onCancel={() => setCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        onRangeChange('today');
                        onDateChange(selectedDate);
                        setCalendarOpen(false);
                    }}
                    onAddReminder={
                        onAddReminder
                            ? (selectedDate) => {
                                  setCalendarOpen(false);
                                  onAddReminder(selectedDate);
                              }
                            : undefined
                    }
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
    onAddReminder,
}: {
    t: Translate;
    locale: Locale;
    selectedDate: string;
    onCancel: () => void;
    onSelect: (date: string) => void;
    onAddReminder?: (date: string) => void;
}) {
    const language = getIntlLocale(locale);
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseDateKey(selectedDate)));
    const [focusedDate, setFocusedDate] = useState(selectedDate);
    const today = formatDateKey(new Date());
    const days = useMemo(() => calendarMonthDays(visibleMonth), [visibleMonth]);
    const numberFormatter = useMemo(() => new Intl.NumberFormat(language, { useGrouping: false }), [language]);
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
            className="apple-interface fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
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
                        const selected = dayKey === focusedDate;
                        const currentDay = dayKey === today;
                        const outsideMonth = day.getMonth() !== visibleMonth.getMonth();

                        return (
                            <button
                                key={dayKey}
                                type="button"
                                onClick={() => {
                                    if (onAddReminder) {
                                        setFocusedDate(dayKey);
                                        return;
                                    }

                                    onSelect(dayKey);
                                }}
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
                                {numberFormatter.format(day.getDate())}
                            </button>
                        );
                    })}
                </div>

                {onAddReminder ? (
                    <div className="mt-5 grid grid-cols-[0.85fr_1.15fr] gap-2">
                        <button
                            type="button"
                            onClick={() => onSelect(focusedDate)}
                            className="h-11 rounded-full border border-black/[0.07] bg-white px-3 text-[13px] font-semibold text-[#007aff] transition active:scale-[0.98]"
                        >
                            {t('Bu Güne Git', 'Go to This Day')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onAddReminder(focusedDate)}
                            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#ff9500] px-3 text-[13px] font-semibold text-white shadow-[0_7px_18px_rgba(255,149,0,0.22)] transition active:scale-[0.98]"
                        >
                            <BellRing className="size-4" />
                            {t('Anımsatıcı Ekle', 'Add Reminder')}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => onSelect(today)}
                        className="mt-5 h-11 w-full rounded-full border border-black/[0.07] bg-white text-[14px] font-semibold text-[#007aff] transition active:scale-[0.98]"
                    >
                        {t('Bugüne Git', 'Go to Today')}
                    </button>
                )}
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
    settings,
    onSettingsChange,
    onRangeChange,
    onDateChange,
    onToggleItem,
    onRemoveItem,
    onReorderItems,
    onUpdateReminder,
    onCreateReminder,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    items: PlanItem[];
    range: PlanRange;
    date: string;
    onNavigate: (section: PanelSection) => void;
    onAddItem: (item: Omit<PlanItem, 'id' | 'completed' | 'createdAt'>) => void;
    settings: SettingsData;
    onSettingsChange: (settings: SettingsData) => void;
    onRangeChange: (range: PlanRange) => void;
    onDateChange: (date: string) => void;
    onToggleItem: (id: number) => void;
    onRemoveItem: (id: number) => void;
    onReorderItems: (orderedIds: number[]) => void;
    onUpdateReminder: (id: number, reminderAt?: string) => void;
    onCreateReminder: (date: string) => void;
}) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [independentTitle, setIndependentTitle] = useState('');
    const [independentPriority, setIndependentPriority] = useState<Priority>('important');
    const [pendingFirstItem, setPendingFirstItem] = useState<Omit<PlanItem, 'id' | 'completed' | 'createdAt'> | null>(null);
    const [draggedPlanId, setDraggedPlanId] = useState<number | null>(null);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderDate, setReminderDate] = useState(() => suggestedReminderDate(date));
    const [reminderTime, setReminderTime] = useState(suggestedReminderTime);
    const [reminderCalendarOpen, setReminderCalendarOpen] = useState(false);
    const [editingReminderId, setEditingReminderId] = useState<number | null>(null);

    const visibleItems = useMemo(() => sortPlanItems(items.filter((item) => isPlanItemInPeriod(item, range, date))), [date, items, range]);
    const completedCount = visibleItems.filter((item) => item.completed).length;
    const planProgress = visibleItems.length === 0 ? 0 : Math.round((completedCount / visibleItems.length) * 100);
    const reminderAt = reminderEnabled ? `${reminderDate}T${reminderTime}` : undefined;
    const reminderIsValid =
        !reminderEnabled ||
        (typeof reminderAt === 'string' && Number.isFinite(new Date(reminderAt).getTime()) && new Date(reminderAt).getTime() > Date.now());
    const editingReminderItem = editingReminderId === null ? undefined : items.find((item) => item.id === editingReminderId);

    const requestAddItem = (item: Omit<PlanItem, 'id' | 'completed' | 'createdAt'>) => {
        if (items.length === 0 && !settings.carryOverPreferenceSet) {
            setPendingFirstItem(item);
            return;
        }

        onAddItem(item);
    };

    const addIndependentItem = (event: FormEvent) => {
        event.preventDefault();
        const title = independentTitle.trim();
        if (!title || !reminderIsValid) return;

        requestAddItem({ title, range, scheduledFor: date, source: 'independent', priority: independentPriority, reminderAt });
        setIndependentTitle('');
        setComposerOpen(false);
        setReminderEnabled(false);
    };

    const addGoalBlock = (goalRecord: GoalRecord, block: BuildingBlock) => {
        requestAddItem({
            title: block.title,
            range,
            scheduledFor: date,
            source: 'goal',
            goalId: goalRecord.id,
            buildingBlockId: block.id,
            priority: goalRecord.priority,
            reminderAt,
        });
    };

    const toggleComposerReminder = () => {
        if (!reminderEnabled) {
            setReminderDate(suggestedReminderDate(date));
            setReminderTime(suggestedReminderTime());
            requestBrowserNotificationPermission();
        }

        setReminderEnabled(!reminderEnabled);
    };

    const isBlockPlanned = (goalId: number, buildingBlockId: number) =>
        items.some((item) => item.goalId === goalId && item.buildingBlockId === buildingBlockId && isPlanItemInPeriod(item, range, date));

    const movePlanItem = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= visibleItems.length || fromIndex === toIndex) return;

        const reordered = [...visibleItems];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        onReorderItems(reordered.map((item) => item.id));
    };

    const moveDraggedPlanBefore = (targetId: number) => {
        if (draggedPlanId === null || draggedPlanId === targetId) return;
        movePlanItem(
            visibleItems.findIndex((item) => item.id === draggedPlanId),
            visibleItems.findIndex((item) => item.id === targetId),
        );
    };

    const confirmCarryoverPreference = (enabled: boolean) => {
        onSettingsChange({
            ...settings,
            carryOverIncompletePlans: enabled,
            carryOverPreferenceSet: true,
        });
        if (pendingFirstItem) onAddItem(pendingFirstItem);
        setPendingFirstItem(null);
    };

    return (
        <>
            <Head title={t('Planla', 'Plan')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="apple-interface min-h-[100svh] bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#007aff]/20">
                <PanelHeader t={t} active="plan" goals={goals} onNavigate={onNavigate} />

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

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <button
                                type="button"
                                onClick={() => onCreateReminder(date)}
                                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-black/[0.07] bg-white px-4 text-[13px] font-semibold text-[#1d1d1f] shadow-[0_5px_18px_rgba(0,0,0,0.04)] transition active:scale-[0.98] sm:px-5 sm:text-[14px]"
                            >
                                <BellRing className="size-[17px] shrink-0 text-[#ff9500]" />
                                <span className="truncate">{t('Anımsatıcı', 'Reminder')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setComposerOpen(true)}
                                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-[#007aff] px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.2)] transition hover:bg-[#006ee6] active:scale-[0.98] sm:px-6 sm:text-[15px]"
                            >
                                <Plus className="size-[18px] shrink-0" strokeWidth={2.5} />
                                <span className="truncate">{t('Plan Ekle', 'Add to Plan')}</span>
                            </button>
                        </div>
                    </div>

                    <PlanPeriodControl
                        t={t}
                        locale={locale}
                        range={range}
                        date={date}
                        onRangeChange={onRangeChange}
                        onDateChange={onDateChange}
                        onAddReminder={onCreateReminder}
                    />

                    <section className="mt-6 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
                        <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{planRangeLabel(range, t, date)}</h2>
                                <p className="mt-1 text-[12px] text-[#8e8e93]">
                                    {visibleItems.length === 0
                                        ? t('Henüz plan eklenmedi', 'No plans added yet')
                                        : t(
                                              `${completedCount} / ${visibleItems.length} tamamlandı · Sıralamayı değiştirebilirsin`,
                                              `${completedCount} of ${visibleItems.length} completed · You can reorder`,
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
                                            draggable
                                            onDragStart={() => setDraggedPlanId(item.id)}
                                            onDragEnter={() => moveDraggedPlanBefore(item.id)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDragEnd={() => setDraggedPlanId(null)}
                                            className={`group flex items-center gap-3 px-4 py-4 transition sm:px-6 ${index !== 0 ? 'border-t border-black/[0.055]' : ''} ${draggedPlanId === item.id ? 'bg-[#007aff]/5 opacity-45' : ''}`}
                                        >
                                            <GripVertical className="hidden size-[18px] shrink-0 cursor-grab text-[#c7c7cc] sm:block" />
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
                                                <p className="mt-1 truncate text-[11px] font-medium text-[#8e8e93]">
                                                    <span
                                                        className={`mr-1.5 inline-block size-1.5 rounded-full ${PRIORITY_STYLES[item.priority].dot}`}
                                                    />
                                                    {sourceGoal
                                                        ? sourceGoal.title
                                                        : item.source === 'reminder'
                                                          ? t('Harici anımsatıcı', 'Standalone reminder')
                                                          : t('Bağımsız plan', 'Independent plan')}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingReminderId(item.id)}
                                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold transition hover:text-[#007aff] ${item.reminderAt ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}
                                                >
                                                    {item.reminderAt ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
                                                    {item.reminderAt
                                                        ? formatReminderDateTime(item.reminderAt, locale)
                                                        : t('Anımsatıcı ekle', 'Add reminder')}
                                                </button>
                                            </div>
                                            <div className="flex shrink-0 flex-col sm:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => movePlanItem(index, index - 1)}
                                                    disabled={index === 0}
                                                    className="grid size-7 place-items-center text-[#6e6e73] disabled:opacity-20"
                                                    aria-label={t('Yukarı taşı', 'Move up')}
                                                >
                                                    <ChevronUp className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => movePlanItem(index, index + 1)}
                                                    disabled={index === visibleItems.length - 1}
                                                    className="grid size-7 place-items-center text-[#6e6e73] disabled:opacity-20"
                                                    aria-label={t('Aşağı taşı', 'Move down')}
                                                >
                                                    <ChevronDown className="size-4" />
                                                </button>
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
                                        autoCapitalize="sentences"
                                        value={independentTitle}
                                        onChange={(event) => setIndependentTitle(event.target.value)}
                                        placeholder={t('Yapmak istediğini yaz', 'Write what you want to do')}
                                        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#aeaeb2]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!independentTitle.trim() || !reminderIsValid}
                                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff] text-white transition disabled:bg-[#d1d1d6]"
                                        aria-label={t('Plana ekle', 'Add to plan')}
                                    >
                                        <ArrowRight className="size-[17px]" />
                                    </button>
                                </div>
                                <p className="mt-4 mb-2 text-[11px] font-semibold text-[#8e8e93]">{t('Öncelik', 'Priority')}</p>
                                <div className="grid grid-cols-4 gap-1 rounded-[16px] bg-black/[0.045] p-1">
                                    {(['urgent', 'very-important', 'important', 'has-time'] as Priority[]).map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setIndependentPriority(priority)}
                                            className={`min-w-0 rounded-[12px] px-1 py-2 text-[10px] font-semibold transition ${
                                                independentPriority === priority ? 'bg-white shadow-[0_1px_5px_rgba(0,0,0,0.1)]' : 'text-[#6e6e73]'
                                            }`}
                                        >
                                            <span className={`mr-1 inline-block size-1.5 rounded-full ${PRIORITY_STYLES[priority].dot}`} />
                                            <span className="hidden sm:inline">{priorityLabel(priority, t)}</span>
                                            <span className="sm:hidden">
                                                {priority === 'urgent'
                                                    ? t('Acil', 'Urgent')
                                                    : priority === 'very-important'
                                                      ? t('Çok', 'High')
                                                      : priority === 'important'
                                                        ? t('Önemli', 'Normal')
                                                        : t('Vakti var', 'Later')}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleComposerReminder}
                                    className="mt-5 flex w-full items-center gap-3 rounded-[18px] border border-black/[0.07] bg-white px-4 py-3.5 text-left transition active:scale-[0.99]"
                                    aria-pressed={reminderEnabled}
                                >
                                    <span
                                        className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${reminderEnabled ? 'bg-[#ff9500]/12 text-[#ff9500]' : 'bg-[#f2f2f7] text-[#8e8e93]'}`}
                                    >
                                        {reminderEnabled ? <BellRing className="size-[18px]" /> : <Bell className="size-[18px]" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[14px] font-semibold">{t('Anımsatıcı', 'Reminder')}</span>
                                        <span className="mt-0.5 block text-[11px] text-[#8e8e93]">
                                            {reminderEnabled
                                                ? t('Belirlediğin zamanda haber verilecek', 'You will be notified at the selected time')
                                                : t('Bu plan için tarih ve saat belirle', 'Choose a date and time for this plan')}
                                        </span>
                                    </span>
                                    <span
                                        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition ${reminderEnabled ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}
                                        aria-hidden="true"
                                    >
                                        <span
                                            className={`absolute top-0.5 size-[27px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.22)] transition-transform ${reminderEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                                        />
                                    </span>
                                </button>

                                {reminderEnabled && (
                                    <>
                                        <div className="mt-3 grid grid-cols-[1.25fr_0.75fr] gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setReminderCalendarOpen(true)}
                                                className="flex h-12 min-w-0 items-center gap-2 rounded-[16px] border border-black/[0.07] bg-white px-3.5 text-left text-[13px] font-semibold"
                                            >
                                                <CalendarDays className="size-4 shrink-0 text-[#007aff]" />
                                                <span className="truncate">{formatReminderDate(reminderDate, locale)}</span>
                                            </button>
                                            <label className="flex h-12 min-w-0 items-center gap-2 rounded-[16px] border border-black/[0.07] bg-white px-3.5">
                                                <Clock3 className="size-4 shrink-0 text-[#007aff]" />
                                                <span className="sr-only">{t('Anımsatıcı saati', 'Reminder time')}</span>
                                                <input
                                                    type="time"
                                                    value={reminderTime}
                                                    onChange={(event) => setReminderTime(event.target.value)}
                                                    className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
                                                    required
                                                />
                                            </label>
                                        </div>
                                        {!reminderIsValid && (
                                            <p className="mt-2 text-[11px] font-medium text-[#ff3b30]">
                                                {t('İleri bir tarih ve saat seçmelisin.', 'Choose a future date and time.')}
                                            </p>
                                        )}
                                    </>
                                )}
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
                                                <p className="truncate bg-[#f9f9fb] px-4 py-2.5 text-[11px] font-semibold text-[#8e8e93]">
                                                    <span
                                                        className={`mr-2 inline-block size-1.5 rounded-full ${PRIORITY_STYLES[goalRecord.priority].dot}`}
                                                    />
                                                    {goalRecord.title}
                                                </p>
                                                {goalRecord.buildingBlocks.map((block) => {
                                                    const planned = isBlockPlanned(goalRecord.id, block.id);

                                                    return (
                                                        <button
                                                            key={block.id}
                                                            type="button"
                                                            disabled={planned || !reminderIsValid}
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

            {pendingFirstItem && <PlanCarryoverDialog t={t} onCancel={() => setPendingFirstItem(null)} onChoose={confirmCarryoverPreference} />}

            {reminderCalendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={reminderDate}
                    onCancel={() => setReminderCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        setReminderDate(selectedDate);
                        setReminderCalendarOpen(false);
                    }}
                />
            )}

            {editingReminderItem && (
                <PlanReminderDialog
                    key={`${editingReminderItem.id}-${editingReminderItem.reminderAt ?? 'new'}`}
                    t={t}
                    locale={locale}
                    item={editingReminderItem}
                    onCancel={() => setEditingReminderId(null)}
                    onSave={(nextReminderAt) => {
                        onUpdateReminder(editingReminderItem.id, nextReminderAt);
                        setEditingReminderId(null);
                    }}
                    onRemove={() => {
                        onUpdateReminder(editingReminderItem.id);
                        setEditingReminderId(null);
                    }}
                />
            )}
        </>
    );
}

function PlanCarryoverDialog({ t, onCancel, onChoose }: { t: Translate; onCancel: () => void; onChoose: (enabled: boolean) => void }) {
    return (
        <div
            className="apple-interface fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={onCancel}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="carryover-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <span className="grid size-13 place-items-center rounded-[17px] bg-[#ff9500]/10 text-[#ff9500]">
                        <CalendarRange className="size-6" />
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                        aria-label={t('Kapat', 'Close')}
                    >
                        <X className="size-[17px]" />
                    </button>
                </div>
                <h2 id="carryover-dialog-title" className="mt-5 text-[24px] font-semibold tracking-[-0.035em]">
                    {t('Yarım kalan planların ne olsun?', 'What should happen to unfinished plans?')}
                </h2>
                <p className="mt-3 text-[14px] leading-6 text-[#6e6e73]">
                    {t(
                        'O gün tamamlayamadığın günlük plan maddelerini ertesi günün planına otomatik olarak aktarabiliriz.',
                        'We can automatically carry unfinished daily plan items into the next day.',
                    )}
                </p>
                <div className="mt-7 grid gap-3">
                    <button
                        type="button"
                        onClick={() => onChoose(true)}
                        className="h-12 rounded-full bg-[#007aff] text-[14px] font-semibold text-white shadow-[0_8px_22px_rgba(0,122,255,0.2)] transition active:scale-[0.98]"
                    >
                        {t('Evet, ertesi güne aktar', 'Yes, carry them over')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChoose(false)}
                        className="h-12 rounded-full border border-black/[0.07] bg-white text-[14px] font-semibold transition active:scale-[0.98]"
                    >
                        {t('Hayır, olduğu günde kalsın', 'No, keep them on that day')}
                    </button>
                </div>
                <p className="mt-4 text-center text-[11px] leading-5 text-[#8e8e93]">
                    {t('Bu tercihi daha sonra Profil › Ayarlar bölümünden değiştirebilirsin.', 'You can change this later under Profile › Settings.')}
                </p>
            </section>
        </div>
    );
}

function StandaloneReminderDialog({
    t,
    locale,
    initialDate,
    onCancel,
    onSave,
}: {
    t: Translate;
    locale: Locale;
    initialDate: string;
    onCancel: () => void;
    onSave: (title: string, date: string, time: string) => void;
}) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(suggestedReminderTime);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const reminderTime = new Date(`${date}T${time}`).getTime();
    const isValid = title.trim() !== '' && isDateKey(date) && /^\d{2}:\d{2}$/.test(time) && reminderTime > Date.now();

    return (
        <>
            <div
                className="apple-interface fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                role="presentation"
                onMouseDown={onCancel}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="standalone-reminder-title"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-7"
                >
                    <div className="flex items-start justify-between gap-4">
                        <span className="grid size-13 place-items-center rounded-[17px] bg-[#ff9500]/12 text-[#ff9500]">
                            <BellRing className="size-6" />
                        </span>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                            aria-label={t('Kapat', 'Close')}
                        >
                            <X className="size-[17px]" />
                        </button>
                    </div>

                    <h2 id="standalone-reminder-title" className="mt-5 text-[24px] font-semibold tracking-[-0.035em]">
                        {t('Harici anımsatıcı', 'Standalone reminder')}
                    </h2>
                    <p className="mt-2 text-[13px] leading-5 text-[#6e6e73]">
                        {t('Seçtiğin günün planına yalnızca anımsatıcı olarak eklenecek.', 'It will be added to the selected day as a reminder.')}
                    </p>

                    <label className="mt-6 block">
                        <span className="mb-2 block text-[12px] font-semibold text-[#6e6e73]">{t('Anımsatılacak konu', 'Reminder title')}</span>
                        <input
                            autoFocus
                            autoCapitalize="sentences"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder={t('Örneğin: İlacını al', 'For example: Take your medicine')}
                            className="h-13 w-full rounded-[17px] border border-black/[0.07] bg-white px-4 text-[15px] font-medium outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/35 focus:ring-4 focus:ring-[#007aff]/8"
                        />
                    </label>

                    <div className="mt-3 grid grid-cols-[1.25fr_0.75fr] gap-2">
                        <button
                            type="button"
                            onClick={() => setCalendarOpen(true)}
                            className="flex h-13 min-w-0 items-center gap-2 rounded-[17px] border border-black/[0.07] bg-white px-4 text-left text-[13px] font-semibold"
                        >
                            <CalendarDays className="size-[17px] shrink-0 text-[#007aff]" />
                            <span className="truncate">{formatReminderDate(date, locale)}</span>
                        </button>
                        <label className="flex h-13 min-w-0 items-center gap-2 rounded-[17px] border border-black/[0.07] bg-white px-3.5">
                            <Clock3 className="size-[17px] shrink-0 text-[#007aff]" />
                            <span className="sr-only">{t('Anımsatıcı saati', 'Reminder time')}</span>
                            <input
                                type="time"
                                value={time}
                                onChange={(event) => setTime(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
                            />
                        </label>
                    </div>

                    {title.trim() !== '' && !isValid && (
                        <p className="mt-3 text-[12px] font-medium text-[#ff3b30]">
                            {t('İleri bir tarih ve saat seçmelisin.', 'Choose a future date and time.')}
                        </p>
                    )}

                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={() => {
                            requestBrowserNotificationPermission();
                            onSave(title.trim(), date, time);
                        }}
                        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff9500] text-[14px] font-semibold text-white shadow-[0_8px_22px_rgba(255,149,0,0.22)] transition active:scale-[0.98] disabled:bg-[#d1d1d6] disabled:shadow-none"
                    >
                        <BellRing className="size-[17px]" />
                        {t('Anımsatıcıyı Ekle', 'Add Reminder')}
                    </button>
                </section>
            </div>

            {calendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={date}
                    onCancel={() => setCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setCalendarOpen(false);
                    }}
                />
            )}
        </>
    );
}

function PlanReminderDialog({
    t,
    locale,
    item,
    onCancel,
    onSave,
    onRemove,
}: {
    t: Translate;
    locale: Locale;
    item: PlanItem;
    onCancel: () => void;
    onSave: (reminderAt: string) => void;
    onRemove: () => void;
}) {
    const [date, setDate] = useState(() => item.reminderAt?.slice(0, 10) ?? suggestedReminderDate(item.scheduledFor));
    const [time, setTime] = useState(() => item.reminderAt?.slice(11, 16) ?? suggestedReminderTime());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const reminderAt = `${date}T${time}`;
    const reminderTime = new Date(reminderAt).getTime();
    const isValid = isDateKey(date) && /^\d{2}:\d{2}$/.test(time) && Number.isFinite(reminderTime) && reminderTime > Date.now();

    return (
        <>
            <div
                className="apple-interface fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                role="presentation"
                onMouseDown={onCancel}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reminder-dialog-title"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="w-full max-w-md rounded-t-[30px] border border-black/[0.07] bg-[#f9f9fb] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:px-7 sm:pb-7"
                >
                    <div className="flex items-start justify-between gap-4">
                        <span className="grid size-13 place-items-center rounded-[17px] bg-[#ff9500]/12 text-[#ff9500]">
                            <BellRing className="size-6" />
                        </span>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="grid size-9 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                            aria-label={t('Kapat', 'Close')}
                        >
                            <X className="size-[17px]" />
                        </button>
                    </div>

                    <h2 id="reminder-dialog-title" className="mt-5 text-[24px] font-semibold tracking-[-0.035em]">
                        {item.reminderAt ? t('Anımsatıcıyı düzenle', 'Edit reminder') : t('Anımsatıcı ekle', 'Add reminder')}
                    </h2>
                    <p className="mt-2 truncate text-[14px] text-[#6e6e73]">{item.title}</p>

                    <div className="mt-6 grid grid-cols-[1.25fr_0.75fr] gap-2">
                        <button
                            type="button"
                            onClick={() => setCalendarOpen(true)}
                            className="flex h-13 min-w-0 items-center gap-2 rounded-[17px] border border-black/[0.07] bg-white px-4 text-left text-[13px] font-semibold"
                        >
                            <CalendarDays className="size-[17px] shrink-0 text-[#007aff]" />
                            <span className="truncate">{formatReminderDate(date, locale)}</span>
                        </button>
                        <label className="flex h-13 min-w-0 items-center gap-2 rounded-[17px] border border-black/[0.07] bg-white px-3.5">
                            <Clock3 className="size-[17px] shrink-0 text-[#007aff]" />
                            <span className="sr-only">{t('Anımsatıcı saati', 'Reminder time')}</span>
                            <input
                                type="time"
                                value={time}
                                onChange={(event) => setTime(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
                            />
                        </label>
                    </div>

                    {!isValid && (
                        <p className="mt-3 text-[12px] font-medium text-[#ff3b30]">
                            {t('İleri bir tarih ve saat seçmelisin.', 'Choose a future date and time.')}
                        </p>
                    )}

                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={() => {
                            requestBrowserNotificationPermission();
                            onSave(reminderAt);
                        }}
                        className="mt-6 h-12 w-full rounded-full bg-[#007aff] text-[14px] font-semibold text-white shadow-[0_8px_22px_rgba(0,122,255,0.2)] transition active:scale-[0.98] disabled:bg-[#d1d1d6] disabled:shadow-none"
                    >
                        {item.reminderAt ? t('Değişiklikleri Kaydet', 'Save Changes') : t('Anımsatıcıyı Ayarla', 'Set Reminder')}
                    </button>

                    {item.reminderAt && (
                        <button type="button" onClick={onRemove} className="mt-3 h-11 w-full text-[13px] font-semibold text-[#ff3b30]">
                            {t('Anımsatıcıyı Kaldır', 'Remove Reminder')}
                        </button>
                    )}
                </section>
            </div>

            {calendarOpen && (
                <PlanCalendar
                    t={t}
                    locale={locale}
                    selectedDate={date}
                    onCancel={() => setCalendarOpen(false)}
                    onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setCalendarOpen(false);
                    }}
                />
            )}
        </>
    );
}

function ReminderAlert({ t, item, onDismiss, onComplete }: { t: Translate; item: PlanItem; onDismiss: () => void; onComplete: () => void }) {
    return (
        <aside
            role="alert"
            className="apple-interface fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.7rem)] left-4 z-[65] mx-auto max-w-md rounded-[24px] border border-white/50 bg-white/85 p-4 text-[#1d1d1f] shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:right-7 sm:bottom-7 sm:left-auto sm:w-[390px]"
        >
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#ff9500] text-white shadow-[0_7px_18px_rgba(255,149,0,0.25)]">
                    <BellRing className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#ff9500]">{t('Anımsatıcı', 'Reminder')}</p>
                    <p className="mt-0.5 truncate text-[16px] font-semibold">{item.title}</p>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73]"
                    aria-label={t('Kapat', 'Close')}
                >
                    <X className="size-4" />
                </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={onDismiss} className="h-10 rounded-full bg-black/[0.055] text-[13px] font-semibold">
                    {t('Kapat', 'Dismiss')}
                </button>
                <button type="button" onClick={onComplete} className="h-10 rounded-full bg-[#007aff] text-[13px] font-semibold text-white">
                    {t('Tamamlandı', 'Complete')}
                </button>
            </div>
        </aside>
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
                autoCapitalize="sentences"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('Hedefini yaz', 'Write your goal')}
                className="h-[68px] w-full rounded-[20px] border border-black/[0.08] bg-white px-5 text-center text-xl font-medium tracking-[-0.02em] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_38px_rgba(0,0,0,0.04)] transition outline-none placeholder:text-[#aeaeb2] focus:border-[#007aff]/45 focus:ring-4 focus:ring-[#007aff]/10 sm:h-[76px] sm:px-7 sm:text-2xl"
            />
        </section>
    );
}

function CategoryStep({ t, value, onChange }: { t: Translate; value: GoalCategory | null; onChange: (value: GoalCategory) => void }) {
    const categories: Array<{ value: GoalCategory; label: string; description: string; icon: typeof Target; color: string }> = [
        {
            value: 'health',
            label: t('Sağlık', 'Health'),
            description: t('Beden ve zihin', 'Body and mind'),
            icon: HeartPulse,
            color: 'bg-[#ff3b30]/10 text-[#ff3b30]',
        },
        {
            value: 'work',
            label: t('İş', 'Work'),
            description: t('Kariyer ve projeler', 'Career and projects'),
            icon: BriefcaseBusiness,
            color: 'bg-[#5856d6]/10 text-[#5856d6]',
        },
        {
            value: 'venture',
            label: t('Girişim', 'Venture'),
            description: t('Yeni fikir ve işler', 'New ideas and business'),
            icon: Rocket,
            color: 'bg-[#ff9500]/10 text-[#ff9500]',
        },
        {
            value: 'skill',
            label: t('Yetenek', 'Skill'),
            description: t('Kendini geliştir', 'Improve yourself'),
            icon: Sparkles,
            color: 'bg-[#af52de]/10 text-[#af52de]',
        },
        {
            value: 'education',
            label: t('Eğitim', 'Education'),
            description: t('Öğrenme ve akademi', 'Learning and academics'),
            icon: GraduationCap,
            color: 'bg-[#007aff]/10 text-[#007aff]',
        },
        {
            value: 'other',
            label: t('Diğer', 'Other'),
            description: t('Diğer hedeflerin', 'Your other goals'),
            icon: Shapes,
            color: 'bg-[#8e8e93]/12 text-[#6e6e73]',
        },
    ];

    return (
        <section>
            <StepHeading
                eyebrow={t('Kategori', 'Category')}
                title={t('Bu hedef hangi alana ait?', 'Which area does this goal belong to?')}
                description={t('Hedeflerini daha düzenli takip etmek için bir kategori seç.', 'Choose a category to keep your goals organized.')}
            />
            <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const selected = value === category.value;

                    return (
                        <button
                            key={category.value}
                            type="button"
                            onClick={() => onChange(category.value)}
                            className={`flex items-center gap-4 rounded-[21px] border bg-white p-4 text-left shadow-[0_7px_28px_rgba(0,0,0,0.035)] transition active:scale-[0.99] ${
                                selected ? 'border-[#007aff]/45 ring-4 ring-[#007aff]/8' : 'border-black/[0.07] hover:border-black/[0.14]'
                            }`}
                            aria-pressed={selected}
                        >
                            <span className={`grid size-12 shrink-0 place-items-center rounded-[15px] ${category.color}`}>
                                <Icon className="size-[21px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[16px] font-semibold">{category.label}</span>
                                <span className="mt-1 block text-[12px] text-[#8e8e93]">{category.description}</span>
                            </span>
                            <span
                                className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${
                                    selected ? 'border-[#007aff] bg-[#007aff] text-white' : 'border-black/[0.12] text-transparent'
                                }`}
                            >
                                <Check className="size-3.5" strokeWidth={3} />
                            </span>
                        </button>
                    );
                })}
            </div>
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
                autoCapitalize="sentences"
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
                            autoCapitalize="sentences"
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

function DeadlineStep({ t, locale, value, onChange }: { t: Translate; locale: Locale; value: string; onChange: (value: string) => void }) {
    const formattedDate = value
        ? new Intl.DateTimeFormat(getIntlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
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
                        lang={getIntlLocale(locale)}
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

function categoryLabel(category: GoalCategory, t: Translate): string {
    return {
        health: t('Sağlık', 'Health'),
        work: t('İş', 'Work'),
        venture: t('Girişim', 'Venture'),
        skill: t('Yetenek', 'Skill'),
        education: t('Eğitim', 'Education'),
        other: t('Diğer', 'Other'),
    }[category];
}

function bookStatusLabel(status: BookStatus, t: Translate): string {
    return {
        reading: t('Şu An Okunan', 'Reading Now'),
        'not-started': t('Başlanmayan', 'Not Started'),
        finished: t('Biten', 'Finished'),
    }[status];
}

function bookStatusIconStyle(status: BookStatus): string {
    return {
        reading: 'bg-[#007aff]/10 text-[#007aff]',
        'not-started': 'bg-[#ff9500]/10 text-[#d97706]',
        finished: 'bg-[#34c759]/10 text-[#28a745]',
    }[status];
}

function bookCoverStyle(status: BookStatus): string {
    return {
        reading: 'bg-[linear-gradient(145deg,#0066cc,#33a8ff)]',
        'not-started': 'bg-[linear-gradient(145deg,#b45309,#ffb340)]',
        finished: 'bg-[linear-gradient(145deg,#198038,#45c96b)]',
    }[status];
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

function educationLevelOptions(t: Translate): Array<{ value: EducationLevel; label: string }> {
    return [
        { value: 'high-school', label: t('Lise', 'High School') },
        { value: 'associate', label: t('Önlisans', 'Associate Degree') },
        { value: 'bachelor', label: t('Lisans', "Bachelor's Degree") },
        { value: 'master', label: t('Yüksek Lisans', "Master's Degree") },
        { value: 'doctorate', label: t('Doktora', 'Doctorate') },
    ];
}

function educationLevelLabel(level: SavedEducationLevel, t: Translate): string {
    return educationLevelOptions(t).find((option) => option.value === level)?.label ?? level;
}

function normalizeUsernameInput(value: string): string {
    return value
        .trimStart()
        .replace(/^@+/, '')
        .replace(/\s+/g, '')
        .replace(/[^\p{L}\p{N}._]/gu, '')
        .slice(0, 30);
}

function suggestedUsername(name: string, email: string): string {
    const emailName = email.split('@')[0] ?? '';
    const nameSuggestion = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('en-US')
        .replace(/\s+/g, '.');
    const suggestion = normalizeUsernameInput(emailName || nameSuggestion);

    return suggestion.length >= 3 ? suggestion : '';
}

function isEducationLevel(value: unknown): value is EducationLevel {
    return value === '' || value === 'high-school' || value === 'associate' || value === 'bachelor' || value === 'master' || value === 'doctorate';
}

function isSavedEducationLevel(value: unknown): value is SavedEducationLevel {
    return isEducationLevel(value) && value !== '';
}

function normalizeStoredEducations(value: unknown): EducationRecord[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((education, index) => {
        if (!education || typeof education !== 'object') return [];

        const record = education as Partial<EducationRecord>;
        if (!isSavedEducationLevel(record.level)) return [];

        const university = typeof record.university === 'string' ? record.university.trim() : '';
        const department = typeof record.department === 'string' ? record.department.trim() : '';
        if (record.level !== 'high-school' && !university) return [];

        return [
            {
                id: Number.isFinite(record.id) ? Number(record.id) : index + 1,
                level: record.level,
                university: record.level === 'high-school' ? '' : university,
                department: record.level === 'high-school' ? '' : department,
            },
        ];
    });
}

function isUniversityApiRecord(value: unknown): value is { name: string; country: string; alpha_two_code: string } {
    if (!value || typeof value !== 'object') return false;

    const record = value as Record<string, unknown>;
    return typeof record.name === 'string' && typeof record.country === 'string' && typeof record.alpha_two_code === 'string';
}

type CountryOption = {
    code: CountryCode;
    name: string;
    callingCode: string;
    flag: string;
};

function getCountryOptions(locale: Locale): CountryOption[] {
    const language = getIntlLocale(locale);
    const names = new Intl.DisplayNames([language], { type: 'region' });

    return COUNTRY_CODES.map((code) => ({
        code,
        name: names.of(code) ?? code,
        callingCode: getCountryCallingCode(code),
        flag: countryFlag(code),
    })).sort((first, second) => first.name.localeCompare(second.name, language));
}

function getCountryOption(country: CountryCode, locale: Locale): CountryOption {
    const language = getIntlLocale(locale);
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

    const normalizedName = value.trim().toLocaleLowerCase();
    for (const { code: locale } of SUPPORTED_LOCALES) {
        const match = getCountryOptions(locale).find((country) => country.name.toLocaleLowerCase(getIntlLocale(locale)) === normalizedName);
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

function phoneLengthLabel(length: { min: number; max: number }, locale: Locale): string {
    const digitUnit: Record<Locale, string> = {
        tr: 'rakam',
        en: 'digits',
        ja: '桁',
        zh: '位数字',
        es: 'dígitos',
        fr: 'chiffres',
        it: 'cifre',
        de: 'Ziffern',
        ar: 'أرقام',
        fa: 'رقم',
        el: 'ψηφία',
        ru: 'цифр',
    };
    if (length.min === length.max) return `${length.max} ${digitUnit[locale]}`;

    return `${length.min}–${length.max} ${digitUnit[locale]}`;
}

function formatBirthDate(date: string, locale: Locale): string {
    return new Intl.DateTimeFormat(getIntlLocale(locale), {
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

function formatGoalDate(date: string, locale: Locale): string {
    return new Intl.DateTimeFormat(getIntlLocale(locale), {
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

function calculateOverallProgress(goals: GoalRecord[]): number {
    if (goals.length === 0) return 1;

    const averageProgress = Math.round(goals.reduce((total, goalRecord) => total + calculateGoalProgress(goalRecord), 0) / goals.length);

    return Math.max(1, averageProgress);
}

function openFuevorReport({
    t,
    locale,
    goals,
    items,
    books,
    notes,
    profile,
    sections,
    planPeriod,
    selectedDate,
    rangeStart,
    rangeEnd,
    selectedMonth,
    selectedYear,
    includeWritingArea,
}: {
    t: Translate;
    locale: Locale;
    goals: GoalRecord[];
    items: PlanItem[];
    books: BookRecord[];
    notes: NoteRecord[];
    profile: ProfileData;
    sections: Record<ReportSection, boolean>;
    planPeriod: ReportPlanPeriod;
    selectedDate: string;
    rangeStart: string;
    rangeEnd: string;
    selectedMonth: string;
    selectedYear: string;
    includeWritingArea: boolean;
}): void {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    reportWindow.opener = null;

    const h = escapeReportHtml;
    const language = getIntlLocale(locale);
    const direction = getLocaleDirection(locale);
    const overallProgress = calculateOverallProgress(goals);
    const username = profile.username.trim() || profile.name.trim() || t('Kullanıcı', 'User');
    const period = getReportPlanPeriod(planPeriod, selectedDate, rangeStart, rangeEnd, selectedMonth, selectedYear, locale);
    const selectedPlanItems = sortPlanItems(
        items.filter((item) => isDateKey(item.scheduledFor) && item.scheduledFor >= period.start && item.scheduledFor <= period.end),
    );
    const logoUrl = new URL('/fuevor-color-logo.svg?v=2', window.location.origin).href;
    const reportDate = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const fileTitle = `Fuevor-${username.replace(/[^\p{L}\p{N}._-]+/gu, '-')}-${formatDateKey(new Date())}`;
    const emptyState = `<p class="empty">${h(t('Bu bölüm henüz boş', 'Nothing here yet'))}</p>`;

    const goalsMarkup = sections.goals
        ? `<section class="report-section">
            <div class="section-heading"><h2>${h(t('Hedefler', 'Goals'))}</h2><span>${goals.length}</span></div>
            <div class="stack">
                ${
                    goals.length === 0
                        ? emptyState
                        : [...goals]
                              .sort((first, second) => first.deadline.localeCompare(second.deadline) || first.createdAt - second.createdAt)
                              .map((goalRecord) => {
                                  const progress = calculateGoalProgress(goalRecord);
                                  return `<article class="card keep-together">
                                      <div class="card-title"><strong>${h(goalRecord.title)}</strong><b>%${progress}</b></div>
                                      <div class="meta-row">
                                          <span>${h(categoryLabel(goalRecord.category, t))}</span>
                                          <span>${h(priorityLabel(goalRecord.priority, t))}</span>
                                          <span>${h(formatGoalDate(goalRecord.deadline, locale))}</span>
                                      </div>
                                      ${goalRecord.gain ? `<p class="description">${h(goalRecord.gain)}</p>` : ''}
                                      <div class="progress"><i style="width:${progress}%"></i></div>
                                      <ul class="check-list">
                                          ${goalRecord.buildingBlocks
                                              .map(
                                                  (block) =>
                                                      `<li><span class="check ${block.completed ? 'done' : ''}">${block.completed ? '✓' : ''}</span><span>${h(block.title)}</span></li>`,
                                              )
                                              .join('')}
                                      </ul>
                                  </article>`;
                              })
                              .join('')
                }
            </div>
        </section>`
        : '';

    const plansMarkup = sections.plans
        ? `<section class="report-section">
            <div class="section-heading"><div><h2>${h(t('Planlar', 'Plan'))}</h2><p>${h(period.label)}</p></div><span>${selectedPlanItems.length}</span></div>
            <div class="stack">
                ${
                    selectedPlanItems.length === 0
                        ? emptyState
                        : selectedPlanItems
                              .sort((first, second) => first.scheduledFor.localeCompare(second.scheduledFor))
                              .map((item) => {
                                  const sourceGoal = goals.find((goalRecord) => goalRecord.id === item.goalId);
                                  const source =
                                      sourceGoal?.title ??
                                      (item.source === 'reminder'
                                          ? t('Harici anımsatıcı', 'Standalone reminder')
                                          : t('Bağımsız plan', 'Independent plan'));
                                  return `<article class="plan-row keep-together">
                                      <span class="check ${item.completed ? 'done' : ''}">${item.completed ? '✓' : ''}</span>
                                      <div><strong class="${item.completed ? 'completed' : ''}">${h(item.title)}</strong><p>${h(source)}</p></div>
                                      <time>${h(formatGoalDate(item.scheduledFor, locale))}</time>
                                  </article>`;
                              })
                              .join('')
                }
            </div>
        </section>`
        : '';

    const libraryMarkup = sections.library
        ? `<section class="report-section">
            <div class="section-heading"><h2>${h(t('Kitaplık', 'Library'))}</h2><span>${books.length}</span></div>
            ${
                books.length === 0
                    ? emptyState
                    : (['reading', 'not-started', 'finished'] as BookStatus[])
                          .map((status) => {
                              const statusBooks = books
                                  .filter((book) => book.status === status)
                                  .sort((first, second) => first.sortOrder - second.sortOrder);
                              if (statusBooks.length === 0) return '';
                              return `<div class="book-group">
                                  <h3>${h(bookStatusLabel(status, t))} <small>${statusBooks.length}</small></h3>
                                  ${statusBooks
                                      .map(
                                          (book, index) => `<article class="book-row keep-together">
                                              <b>${index + 1}</b>
                                              <div><strong>${h(book.title)}</strong><p>${h(book.author || t('Yazar belirtilmedi', 'Author not specified'))}</p>
                                              ${book.comment ? `<blockquote>${h(book.comment)}</blockquote>` : ''}</div>
                                              ${book.rating > 0 ? `<span class="rating">${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)} <small>${book.rating}/5</small></span>` : ''}
                                          </article>`,
                                      )
                                      .join('')}
                              </div>`;
                          })
                          .join('')
            }
        </section>`
        : '';

    const savedNotesMarkup = sections['saved-notes']
        ? `<section class="report-section">
            <div class="section-heading"><h2>${h(t('Kayıtlı Notlar', 'Saved Notes'))}</h2><span>${notes.length}</span></div>
            <div class="notes-grid">
                ${
                    notes.length === 0
                        ? emptyState
                        : notes
                              .map(
                                  (note) =>
                                      `<article class="note-card keep-together"><strong>${h(note.title)}</strong><p>${h(note.content)}</p></article>`,
                              )
                              .join('')
                }
            </div>
        </section>`
        : '';

    const writingAreaMarkup = includeWritingArea
        ? `<section class="writing-area">
            <h2>${h(t('Notlar', 'Notes'))}</h2>
            ${Array.from({ length: 9 }, () => '<div class="dot-line"></div>').join('')}
        </section>`
        : '';

    reportWindow.document.open();
    reportWindow.document.write(`<!doctype html>
<html lang="${h(locale)}" dir="${direction}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${h(fileTitle)}</title>
    <style>
        *{box-sizing:border-box} html{background:#eef0f3} body{margin:0;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page{width:min(900px,100%);min-height:100vh;margin:0 auto;background:#fff;padding:42px 46px 52px}.report-header{display:flex;align-items:center;justify-content:space-between;gap:28px;padding-bottom:26px;border-bottom:2px solid #eceef1}.brand{width:132px;height:52px;object-fit:contain}.identity{text-align:${direction === 'rtl' ? 'left' : 'right'}}.identity strong{display:block;font-size:17px}.identity p{margin:5px 0 0;color:#75757a;font-size:12px}.summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.summary-card{padding:16px 18px;border:1px solid #e5e7eb;border-radius:16px;background:#f8f9fb}.summary-card span{display:block;color:#7b7b80;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.summary-card b{display:block;margin-top:6px;font-size:21px}.report-section{margin-top:30px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:12px}.section-heading h2,.writing-area h2{margin:0;font-size:20px;letter-spacing:-.025em}.section-heading p{margin:4px 0 0;color:#77777c;font-size:11px}.section-heading>span{display:grid;min-width:30px;height:30px;padding:0 8px;place-items:center;border-radius:99px;background:#edf5ff;color:#007aff;font-size:12px;font-weight:700}.stack{display:grid;gap:10px}.card,.plan-row,.book-group,.note-card{border:1px solid #e6e7e9;border-radius:15px;background:#fff}.card{padding:16px}.card-title{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.card-title strong{font-size:14px}.card-title b{color:#007aff;font-size:13px}.meta-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.meta-row span{padding:4px 7px;border-radius:99px;background:#f1f2f4;color:#67676c;font-size:9px;font-weight:650}.description{margin:10px 0 0;color:#66666b;font-size:11px;line-height:1.5}.progress{height:5px;margin-top:12px;overflow:hidden;border-radius:99px;background:#e9eaed}.progress i{display:block;height:100%;border-radius:99px;background:#007aff}.check-list{display:grid;gap:7px;margin:12px 0 0;padding:0;list-style:none}.check-list li{display:flex;align-items:center;gap:8px;font-size:10px}.check{display:grid;width:17px;height:17px;flex:0 0 auto;place-items:center;border:1.3px solid #c9cbd0;border-radius:50%;font-size:10px;font-weight:800;color:white}.check.done{border-color:#34c759;background:#34c759}.plan-row{display:grid;grid-template-columns:18px minmax(0,1fr) auto;align-items:center;gap:11px;padding:12px 14px}.plan-row strong{display:block;font-size:11px}.plan-row strong.completed{text-decoration:line-through;color:#8d8d92}.plan-row p,.book-row p{margin:3px 0 0;color:#85858a;font-size:9px}.plan-row time{color:#737378;font-size:9px;white-space:nowrap}.book-group{overflow:hidden;margin-top:10px}.book-group h3{margin:0;padding:11px 14px;background:#f7f8fa;font-size:11px}.book-group h3 small{margin-inline-start:4px;color:#8b8b90}.book-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:11px;padding:12px 14px;border-top:1px solid #ececef}.book-row>b{display:grid;width:20px;height:20px;place-items:center;border-radius:50%;background:#f0f1f3;color:#77777b;font-size:9px}.book-row strong{font-size:11px}.book-row blockquote{margin:8px 0 0;padding:8px 10px;border-inline-start:3px solid #34c759;background:#f5fbf7;color:#5b5b60;font-size:9px;line-height:1.5;white-space:pre-wrap}.rating{color:#ffb000;font-size:12px;white-space:nowrap}.rating small{color:#77777c}.notes-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.note-card{padding:14px}.note-card strong{font-size:11px}.note-card p{margin:7px 0 0;color:#5e5e63;font-size:10px;line-height:1.55;white-space:pre-wrap}.writing-area{margin-top:34px;break-inside:avoid}.dot-line{height:25px;background-image:radial-gradient(circle,#c7c9cd 1px,transparent 1.2px);background-position:left bottom 6px;background-size:7px 2px;background-repeat:repeat-x;opacity:.65}.empty{margin:0;padding:24px;border:1px dashed #d8dade;border-radius:15px;color:#96969b;text-align:center;font-size:11px}.keep-together{break-inside:avoid}.report-footer{margin-top:30px;padding-top:12px;border-top:1px solid #ececef;color:#a0a0a5;font-size:9px;text-align:center}
        @media(max-width:620px){.page{padding:28px 20px 38px}.report-header{align-items:flex-start}.brand{width:108px;height:42px}.summary{grid-template-columns:1fr}.notes-grid{grid-template-columns:1fr}.book-row{grid-template-columns:22px minmax(0,1fr)}.rating{grid-column:2}}
        @media print{@page{size:A4;margin:13mm}html,body{background:#fff}.page{width:auto;min-height:auto;margin:0;padding:0}.report-section{break-before:auto}}
    </style>
</head>
<body>
    <main class="page">
        <header class="report-header">
            <img class="brand" src="${h(logoUrl)}" alt="Fuevor" />
            <div class="identity"><strong>${h(username.startsWith('@') ? username : `@${username}`)}</strong><p>${h(reportDate)}</p></div>
        </header>
        <div class="summary">
            <div class="summary-card"><span>${h(t('Kullanıcı Adı', 'Username'))}</span><b>${h(username)}</b></div>
            <div class="summary-card"><span>${h(t('Genel ilerleme', 'Overall progress'))}</span><b>%${overallProgress}</b></div>
        </div>
        ${goalsMarkup}${plansMarkup}${libraryMarkup}${savedNotesMarkup}
        <footer class="report-footer">Fuevor · ${h(reportDate)}</footer>
        ${writingAreaMarkup}
    </main>
</body>
</html>`);
    reportWindow.document.close();

    const printReport = () =>
        window.setTimeout(() => {
            reportWindow.focus();
            reportWindow.print();
        }, 300);
    if (reportWindow.document.readyState === 'complete') printReport();
    else reportWindow.addEventListener('load', printReport, { once: true });
}

function getReportPlanPeriod(
    period: ReportPlanPeriod,
    selectedDate: string,
    rangeStart: string,
    rangeEnd: string,
    selectedMonth: string,
    selectedYear: string,
    locale: Locale,
): { start: string; end: string; label: string } {
    const language = getIntlLocale(locale);
    const fallbackDate = formatDateKey(new Date());
    const format = (date: string) => new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(date));

    if (period === 'range') {
        const first = isDateKey(rangeStart) ? rangeStart : fallbackDate;
        const second = isDateKey(rangeEnd) ? rangeEnd : first;
        const [start, end] = first <= second ? [first, second] : [second, first];
        return { start, end, label: `${format(start)} – ${format(end)}` };
    }

    if (period === 'month' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
        const start = `${selectedMonth}-01`;
        const startDate = parseDateKey(start);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 12);
        return {
            start,
            end: formatDateKey(endDate),
            label: new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(startDate),
        };
    }

    if (period === 'year') {
        const year = /^\d{4}$/.test(selectedYear) ? selectedYear : String(new Date().getFullYear());
        return { start: `${year}-01-01`, end: `${year}-12-31`, label: year };
    }

    const date = isDateKey(selectedDate) ? selectedDate : fallbackDate;
    if (period === 'week') {
        const weekStart = startOfWeek(parseDateKey(date));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const start = formatDateKey(weekStart);
        const end = formatDateKey(weekEnd);
        return { start, end, label: `${format(start)} – ${format(end)}` };
    }

    return { start: date, end: date, label: format(date) };
}

function escapeReportHtml(value: string): string {
    return value.replace(
        /[&<>'"]/g,
        (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character,
    );
}

function isGoalCompleted(goal: GoalRecord): boolean {
    return goal.buildingBlocks.length > 0 && goal.buildingBlocks.every((block) => block.completed);
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

function formatPlanPeriod(range: PlanRange, locale: Locale, date: string): string {
    const language = getIntlLocale(locale);
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

function formatPlanDayLabel(date: string, locale: Locale, t: Translate): string {
    if (date === defaultDateForRange('today')) return t('Bugün', 'Today');
    if (date === defaultDateForRange('tomorrow')) return t('Yarın', 'Tomorrow');

    return new Intl.DateTimeFormat(getIntlLocale(locale), {
        day: 'numeric',
        month: 'short',
    }).format(parseDateKey(date));
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

function suggestedReminderDate(preferredDate: string): string {
    const earliestDate = formatDateKey(suggestedReminderMoment());
    return isDateKey(preferredDate) && preferredDate >= earliestDate ? preferredDate : earliestDate;
}

function suggestedReminderTime(): string {
    const suggestedTime = suggestedReminderMoment();

    return `${String(suggestedTime.getHours()).padStart(2, '0')}:${String(suggestedTime.getMinutes()).padStart(2, '0')}`;
}

function suggestedReminderMoment(): Date {
    const suggestedTime = new Date(Date.now() + 60 * 60 * 1000);
    suggestedTime.setMinutes(Math.ceil(suggestedTime.getMinutes() / 5) * 5, 0, 0);
    return suggestedTime;
}

function formatReminderDate(date: string, locale: Locale): string {
    if (!isDateKey(date)) return date;

    const today = formatDateKey(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = formatDateKey(tomorrowDate);

    if (date === today) return translate(locale, 'Bugün', 'Today');
    if (date === tomorrow) return translate(locale, 'Yarın', 'Tomorrow');

    return new Intl.DateTimeFormat(getIntlLocale(locale), {
        day: 'numeric',
        month: 'short',
        year: parseDateKey(date).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    }).format(parseDateKey(date));
}

function formatReminderDateTime(reminderAt: string, locale: Locale): string {
    const date = reminderAt.slice(0, 10);
    const time = reminderAt.slice(11, 16);
    if (!isDateKey(date) || !/^\d{2}:\d{2}$/.test(time)) return reminderAt;

    return `${formatReminderDate(date, locale)} · ${time}`;
}

function requestBrowserNotificationPermission(): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;

    void Notification.requestPermission();
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

function sortPlanItems(items: PlanItem[]): PlanItem[] {
    const hasManualOrder = items.some((item) => Number.isFinite(item.sortOrder));

    return [...items].sort((first, second) => {
        if (hasManualOrder) {
            const firstOrder = Number.isFinite(first.sortOrder) ? (first.sortOrder as number) : Number.MAX_SAFE_INTEGER;
            const secondOrder = Number.isFinite(second.sortOrder) ? (second.sortOrder as number) : Number.MAX_SAFE_INTEGER;
            if (firstOrder !== secondOrder) return firstOrder - secondOrder;
        }

        return PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] || first.createdAt - second.createdAt;
    });
}

function loadStoredGoals(): GoalRecord[] {
    return loadStoredArray<GoalRecord>(DEMO_GOALS_STORAGE_KEY).map((goalRecord) => ({
        ...goalRecord,
        category: isGoalCategory(goalRecord.category) ? goalRecord.category : 'other',
    }));
}

function loadStoredPlanItems(): PlanItem[] {
    return loadStoredArray<PlanItem>(DEMO_PLAN_STORAGE_KEY).map((item) => {
        const reminderAt =
            typeof item.reminderAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.reminderAt) ? item.reminderAt : undefined;
        const normalizedItem = {
            ...item,
            priority: isPriority(item.priority) ? item.priority : ('important' as const),
            reminderAt,
            reminderDeliveredAt: Number.isFinite(item.reminderDeliveredAt) ? item.reminderDeliveredAt : undefined,
        };
        if (isDateKey(item.scheduledFor)) return normalizedItem;

        const legacyDate = new Date(Number.isFinite(item.createdAt) ? item.createdAt : Date.now());
        if (item.range === 'tomorrow') legacyDate.setDate(legacyDate.getDate() + 1);

        return { ...normalizedItem, scheduledFor: formatDateKey(legacyDate) };
    });
}

function loadStoredNotes(): NoteRecord[] {
    return loadStoredArray<NoteRecord>(DEMO_NOTES_STORAGE_KEY).filter(
        (note) => typeof note.title === 'string' && typeof note.content === 'string' && Number.isFinite(note.id),
    );
}

function loadStoredBooks(): BookRecord[] {
    return loadStoredArray<Partial<BookRecord>>(DEMO_BOOKS_STORAGE_KEY).flatMap((book, index) => {
        if (!Number.isFinite(book.id) || typeof book.title !== 'string' || !book.title.trim() || !isBookStatus(book.status)) return [];

        return [
            {
                id: Number(book.id),
                title: book.title.trim(),
                author: typeof book.author === 'string' ? book.author.trim() : '',
                status: book.status,
                comment: book.status === 'finished' && typeof book.comment === 'string' ? book.comment.slice(0, 1200) : '',
                rating: book.status === 'finished' && Number.isFinite(book.rating) ? Math.min(5, Math.max(0, Math.round(Number(book.rating)))) : 0,
                sortOrder: Number.isFinite(book.sortOrder) ? Number(book.sortOrder) : index,
                createdAt: Number.isFinite(book.createdAt) ? Number(book.createdAt) : Date.now() + index,
                finishedAt: book.status === 'finished' && Number.isFinite(book.finishedAt) ? Number(book.finishedAt) : undefined,
            },
        ];
    });
}

function isGoalCategory(value: unknown): value is GoalCategory {
    return value === 'health' || value === 'work' || value === 'venture' || value === 'skill' || value === 'education' || value === 'other';
}

function isPriority(value: unknown): value is Priority {
    return value === 'urgent' || value === 'very-important' || value === 'important' || value === 'has-time';
}

function isBookStatus(value: unknown): value is BookStatus {
    return value === 'reading' || value === 'not-started' || value === 'finished';
}

function loadStoredProfile(): ProfileData {
    const emptyProfile: ProfileData = {
        name: '',
        username: '',
        email: '',
        phone: '',
        birthDate: '',
        country: '',
        profession: '',
        about: '',
        educations: [],
        avatar: '',
    };
    if (typeof window === 'undefined') return emptyProfile;

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(DEMO_PROFILE_STORAGE_KEY) ?? 'null');
        if (!value || typeof value !== 'object') return emptyProfile;

        const profile = value as Partial<ProfileData> & { educationLevel?: unknown; university?: unknown };
        const country = normalizeStoredCountry(typeof profile.country === 'string' ? profile.country : '');
        const name = typeof profile.name === 'string' ? profile.name : '';
        const email = typeof profile.email === 'string' ? profile.email : '';
        const educations = normalizeStoredEducations(profile.educations);
        const legacyEducationLevel = isSavedEducationLevel(profile.educationLevel) ? profile.educationLevel : null;
        if (educations.length === 0 && legacyEducationLevel) {
            educations.push({
                id: 1,
                level: legacyEducationLevel,
                university: legacyEducationLevel !== 'high-school' && typeof profile.university === 'string' ? profile.university.trim() : '',
                department: '',
            });
        }
        return {
            name,
            username:
                typeof profile.username === 'string' && normalizeUsernameInput(profile.username).length >= 3
                    ? normalizeUsernameInput(profile.username)
                    : suggestedUsername(name, email),
            email,
            phone: normalizeNationalPhone(typeof profile.phone === 'string' ? profile.phone : '', country || null),
            birthDate: typeof profile.birthDate === 'string' ? profile.birthDate : '',
            country,
            profession: typeof profile.profession === 'string' ? profile.profession : '',
            about: typeof profile.about === 'string' ? profile.about.slice(0, 500) : '',
            educations,
            avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
        };
    } catch {
        return emptyProfile;
    }
}

function loadStoredSettings(defaultLanguage: Locale): SettingsData {
    const defaultSettings: SettingsData = {
        appearance: 'light',
        language: defaultLanguage,
        carryOverIncompletePlans: false,
        carryOverPreferenceSet: false,
    };
    if (typeof window === 'undefined') return defaultSettings;

    try {
        const value: unknown = JSON.parse(window.localStorage.getItem(DEMO_SETTINGS_STORAGE_KEY) ?? 'null');
        if (!value || typeof value !== 'object') return defaultSettings;

        const settings = value as Partial<SettingsData>;
        return {
            appearance: settings.appearance === 'dark' ? 'dark' : 'light',
            language: isLocale(settings.language) ? settings.language : defaultLanguage,
            carryOverIncompletePlans: settings.carryOverIncompletePlans === true,
            carryOverPreferenceSet: settings.carryOverPreferenceSet === true,
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

function revealFocusedField(field: HTMLElement): void {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 639px)').matches) return;

    window.setTimeout(() => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 360);
}

function distributeProgress(count: number): number[] {
    if (count <= 0) return [];

    const base = Math.floor(100 / count);
    const remainder = 100 % count;

    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

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
