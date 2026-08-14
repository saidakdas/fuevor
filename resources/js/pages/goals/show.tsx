import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import { getIntlLocale, type Locale } from '@/i18n';
import AppLayout from '@/layouts/app-layout';
import { Goal, Milestone, Priority, Task } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CalendarDays,
    Check,
    Circle,
    Clock3,
    Edit3,
    Gift,
    MoreHorizontal,
    Plus,
    Sparkles,
    Target,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function GoalShow({ goal }: { goal: Goal }) {
    const { locale, t } = useLocale();
    const milestones = goal.milestones ?? [];
    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Hedeflerim', 'My Goals'), href: '/goals' },
                { title: goal.title, href: route('goals.show', goal.id) },
            ]}
        >
            <Head title={goal.title} />
            <main className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <Link
                            href={route('goals.index')}
                            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
                        >
                            <ArrowLeft className="size-4" />
                            {t('Hedeflerim', 'My Goals')}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={priorityColor(goal.priority)}>{priorityLabel(goal.priority, t)}</Badge>
                            <Badge variant="outline">{statusLabel(goal.status, t)}</Badge>
                        </div>
                        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">{goal.title}</h1>
                        <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6 md:text-base">
                            {goal.description || t('Bu hedef için henüz bir açıklama eklenmedi.', 'No description has been added for this goal yet.')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('goals.edit', goal.id)}>
                                <Edit3 />
                                {t('Düzenle', 'Edit')}
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => confirm(t('Bu hedef silinsin mi?', 'Delete this goal?')) && router.delete(route('goals.destroy', goal.id))}
                            aria-label={t('Hedefi sil', 'Delete goal')}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white shadow-xl">
                    <CardContent className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm text-slate-300">{t('Hedef ilerlemesi', 'Goal progress')}</span>
                                <strong className="text-3xl">%{goal.progress}</strong>
                            </div>
                            <ProgressBar value={goal.progress} />
                            <div className="mt-5 flex flex-wrap gap-5 text-xs text-slate-300">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="size-4" />
                                    {formatDate(goal.start_date, locale)} — {formatDate(goal.target_date, locale)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock3 className="size-4" />
                                    {remaining(goal.target_date, t)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-8">
                            <div className="rounded-2xl bg-white/10 p-4">
                                <Target className="size-7 text-violet-300" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{milestones.length}</p>
                                <p className="text-xs text-slate-400">{t('Kilometre taşı', 'Milestones')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid gap-5 lg:grid-cols-2">
                    <Insight
                        icon={Sparkles}
                        title={t('Neden bu hedef?', 'Why this goal?')}
                        text={goal.motivation}
                        empty={t(
                            'Motivasyonunu eklediğinde zor günlerde buradan güç alabilirsin.',
                            'Add your motivation here to draw strength from it on difficult days.',
                        )}
                    />
                    <Insight
                        icon={Gift}
                        title={t('Kazanım / ödül', 'Benefit / reward')}
                        text={goal.reward}
                        empty={t('Bu hedefe ulaştığında elde edeceğin kazanımı tanımla.', 'Describe what you will gain when you reach this goal.')}
                    />
                </div>
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">{t('Yol haritası', 'Roadmap')}</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {t('Kilometre taşlarını görevlerle ilerlet.', 'Advance your milestones with tasks.')}
                            </p>
                        </div>
                        <MilestoneModal goalId={goal.id} />
                    </div>
                    {milestones.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="text-muted-foreground p-10 text-center text-sm">
                                {t(
                                    'İlk kilometre taşını ekleyerek hedefini uygulanabilir adımlara böl.',
                                    'Add your first milestone to break your goal into actionable steps.',
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        milestones.map((milestone, index) => <MilestoneCard key={milestone.id} goal={goal} milestone={milestone} index={index} />)
                    )}
                </section>
            </main>
        </AppLayout>
    );
}

function Insight({ icon: Icon, title, text, empty }: { icon: typeof Gift; title: string; text: string | null; empty: string }) {
    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
            <CardContent className="flex gap-4 p-6">
                <div className="h-fit rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    <Icon className="size-5" />
                </div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-line">{text || empty}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function MilestoneCard({ goal, milestone, index }: { goal: Goal; milestone: Milestone; index: number }) {
    const { locale, t } = useLocale();
    const tasks = milestone.tasks ?? [];
    const move = (direction: -1 | 1) => {
        const ids = (goal.milestones ?? []).map((item) => item.id);
        const target = index + direction;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.put(route('milestones.reorder', goal.id), { ids }, { preserveScroll: true });
    };
    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-800">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-violet-600">{String(index + 1).padStart(2, '0')}</span>
                            <Badge variant="secondary">{milestoneStatus(milestone.status, t)}</Badge>
                            {milestone.target_date && (
                                <span className="text-muted-foreground text-xs">{formatDate(milestone.target_date, locale)}</span>
                            )}
                        </div>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        {milestone.description && <p className="text-muted-foreground mt-2 text-sm leading-5">{milestone.description}</p>}
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(-1)} title={t('Yukarı taşı', 'Move up')}>
                            <ArrowUp />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === (goal.milestones?.length ?? 1) - 1}
                            onClick={() => move(1)}
                            title={t('Aşağı taşı', 'Move down')}
                        >
                            <ArrowDown />
                        </Button>
                        <MilestoneModal goalId={goal.id} milestone={milestone} />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                confirm(t('Kilometre taşı ve görevleri silinsin mi?', 'Delete this milestone and its tasks?')) &&
                                router.delete(route('milestones.destroy', milestone.id), { preserveScroll: true })
                            }
                            aria-label={t('Kilometre taşını sil', 'Delete milestone')}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>
                <ProgressBar value={milestone.progress} showLabel />
            </CardHeader>
            <CardContent className="space-y-3 border-t bg-slate-50/60 p-4 dark:bg-slate-950/30">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {t('Görevler', 'Tasks')} · {tasks.filter((task) => task.is_completed).length}/{tasks.length}
                    </p>
                    <TaskModal milestoneId={milestone.id} />
                </div>
                {tasks.length === 0 ? (
                    <div className="bg-background text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
                        {t('Henüz görev yok.', 'No tasks yet.')}
                    </div>
                ) : (
                    tasks.map((task, taskIndex) => <TaskRow key={task.id} milestone={milestone} task={task} index={taskIndex} />)
                )}
            </CardContent>
        </Card>
    );
}

function TaskRow({ milestone, task, index }: { milestone: Milestone; task: Task; index: number }) {
    const { locale, t } = useLocale();
    const tasks = milestone.tasks ?? [];
    const move = (direction: -1 | 1) => {
        const ids = tasks.map((item) => item.id);
        const target = index + direction;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.put(route('tasks.reorder', milestone.id), { ids }, { preserveScroll: true });
    };
    return (
        <div className="bg-background flex items-center gap-3 rounded-xl border p-3 shadow-xs">
            <button
                onClick={() => router.patch(route('tasks.toggle', task.id), {}, { preserveScroll: true })}
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${task.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-violet-500'}`}
            >
                {task.is_completed ? <Check className="size-4" /> : <Circle className="size-3 opacity-0" />}
            </button>
            <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${task.is_completed ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p>
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-[11px]">
                    {task.due_date && <span>{formatDate(task.due_date, locale)}</span>}
                    <span>{priorityLabel(task.priority, t)}</span>
                </div>
            </div>
            <div className="flex">
                <Button variant="ghost" size="icon" className="size-8" disabled={index === 0} onClick={() => move(-1)}>
                    <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" disabled={index === tasks.length - 1} onClick={() => move(1)}>
                    <ArrowDown />
                </Button>
                <TaskModal milestoneId={milestone.id} task={task} />
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                        confirm(t('Görev silinsin mi?', 'Delete this task?')) &&
                        router.delete(route('tasks.destroy', task.id), { preserveScroll: true })
                    }
                    aria-label={t('Görevi sil', 'Delete task')}
                >
                    <Trash2 />
                </Button>
            </div>
        </div>
    );
}

function MilestoneModal({ goalId, milestone }: { goalId: number; milestone?: Milestone }) {
    const { locale, t } = useLocale();
    const [open, setOpen] = useState(false);
    const form = useForm({ title: milestone?.title ?? '', description: milestone?.description ?? '', target_date: milestone?.target_date ?? '' });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };
        if (milestone) {
            form.put(route('milestones.update', milestone.id), options);
        } else {
            form.post(route('milestones.store', goalId), options);
        }
    };
    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title={milestone ? t('Kilometre taşını düzenle', 'Edit milestone') : t('Kilometre taşı ekle', 'Add milestone')}
            description={t('Hedef içindeki ölçülebilir ara aşamayı tanımla.', 'Define a measurable stage within your goal.')}
            trigger={
                <Button variant={milestone ? 'ghost' : 'default'} size={milestone ? 'icon' : 'default'}>
                    {milestone ? (
                        <Edit3 />
                    ) : (
                        <>
                            <Plus />
                            {t('Kilometre taşı', 'Milestone')}
                        </>
                    )}
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label={t('Başlık', 'Title')} error={form.errors.title}>
                    <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required />
                </Field>
                <Field label={t('Açıklama', 'Description')} error={form.errors.description}>
                    <Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                </Field>
                <Field label={t('Hedef tarihi', 'Target date')} error={form.errors.target_date}>
                    <Input
                        type="date"
                        lang={getIntlLocale(locale)}
                        value={form.data.target_date}
                        onChange={(e) => form.setData('target_date', e.target.value)}
                    />
                </Field>
                <Button className="w-full" disabled={form.processing}>
                    {milestone ? t('Kaydet', 'Save') : t('Ekle', 'Add')}
                </Button>
            </form>
        </Modal>
    );
}

function TaskModal({ milestoneId, task }: { milestoneId: number; task?: Task }) {
    const { locale, t } = useLocale();
    const [open, setOpen] = useState(false);
    const form = useForm({
        title: task?.title ?? '',
        description: task?.description ?? '',
        due_date: task?.due_date ?? '',
        priority: task?.priority ?? ('medium' as Priority),
    });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };
        if (task) {
            form.put(route('tasks.update', task.id), options);
        } else {
            form.post(route('tasks.store', milestoneId), options);
        }
    };
    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title={task ? t('Görevi düzenle', 'Edit task') : t('Görev ekle', 'Add task')}
            description={t('Net, küçük ve tamamlanabilir bir sonraki adım yaz.', 'Write a clear, small, and achievable next step.')}
            trigger={
                <Button variant="ghost" size={task ? 'icon' : 'sm'} className={task ? 'size-8' : ''}>
                    {task ? (
                        <MoreHorizontal />
                    ) : (
                        <>
                            <Plus />
                            {t('Görev ekle', 'Add task')}
                        </>
                    )}
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label={t('Başlık', 'Title')} error={form.errors.title}>
                    <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required />
                </Field>
                <Field label={t('Açıklama', 'Description')} error={form.errors.description}>
                    <Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Son tarih', 'Due date')} error={form.errors.due_date}>
                        <Input
                            type="date"
                            lang={getIntlLocale(locale)}
                            value={form.data.due_date}
                            onChange={(e) => form.setData('due_date', e.target.value)}
                        />
                    </Field>
                    <Field label={t('Öncelik', 'Priority')} error={form.errors.priority}>
                        <select
                            className="bg-background h-10 rounded-md border px-3 text-sm"
                            value={form.data.priority}
                            onChange={(e) => form.setData('priority', e.target.value as Priority)}
                        >
                            <option value="low">{t('Düşük', 'Low')}</option>
                            <option value="medium">{t('Orta', 'Medium')}</option>
                            <option value="high">{t('Yüksek', 'High')}</option>
                        </select>
                    </Field>
                </div>
                <Button className="w-full" disabled={form.processing}>
                    {task ? t('Kaydet', 'Save') : t('Ekle', 'Add')}
                </Button>
            </form>
        </Modal>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
type Translate = (turkish: string, english: string) => string;

const formatDate = (date: string, locale: Locale) =>
    new Intl.DateTimeFormat(getIntlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
const remaining = (date: string, t: Translate) => {
    const days = Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000);
    return days < 0
        ? t(`${Math.abs(days)} gün gecikti`, `${Math.abs(days)} days overdue`)
        : days === 0
          ? t('Bugün sona eriyor', 'Ends today')
          : t(`${days} gün kaldı`, `${days} days remaining`);
};
const priorityLabel = (value: string, t: Translate) =>
    ({ low: t('Düşük öncelik', 'Low priority'), medium: t('Orta öncelik', 'Medium priority'), high: t('Yüksek öncelik', 'High priority') })[value] ??
    value;
const priorityColor = (value: string) =>
    value === 'high'
        ? 'border-0 bg-red-100 text-red-700'
        : value === 'medium'
          ? 'border-0 bg-amber-100 text-amber-700'
          : 'border-0 bg-slate-100 text-slate-700';
const statusLabel = (value: string, t: Translate) =>
    ({
        active: t('Aktif', 'Active'),
        paused: t('Duraklatıldı', 'Paused'),
        completed: t('Tamamlandı', 'Completed'),
        archived: t('Arşivlendi', 'Archived'),
    })[value] ?? value;
const milestoneStatus = (value: string, t: Translate) =>
    ({ pending: t('Bekliyor', 'Pending'), in_progress: t('Devam ediyor', 'In progress'), completed: t('Tamamlandı', 'Completed') })[value] ?? value;
