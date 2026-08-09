import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import AppLayout from '@/layouts/app-layout';
import { DashboardSummary } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarClock, CheckCircle2, Plus, Target, TrendingUp } from 'lucide-react';

export default function Dashboard({ summary }: { summary: DashboardSummary }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Genel Bakış', href: '/dashboard' }]}>
            <Head title="Genel Bakış" />
            <main className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-sm font-medium text-violet-600">Bugünün odağı</p>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Hedeflerine doğru ilerle.</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Büyük sonuçlar, görünür küçük adımlarla başlar.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('goals.create')}>
                            <Plus />
                            Yeni hedef
                        </Link>
                    </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat icon={Target} label="Aktif hedef" value={summary.active_goals} tone="violet" />
                    <Stat icon={CheckCircle2} label="Tamamlanan" value={summary.completed_goals} tone="emerald" />
                    <Stat icon={TrendingUp} label="Genel ilerleme" value={`%${summary.average_progress}`} tone="blue" />
                    <Stat icon={CalendarClock} label="Yaklaşan görev" value={summary.upcoming_tasks.length} tone="amber" />
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-lg">Yaklaşan görevler</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={route('goals.index')}>
                                    Tüm hedefler <ArrowRight />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {summary.upcoming_tasks.length === 0 ? (
                                <Empty text="Takvimde yaklaşan açık görev yok." />
                            ) : (
                                summary.upcoming_tasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={task.milestone ? route('goals.show', task.milestone.goal_id) : route('goals.index')}
                                        className="flex items-center justify-between rounded-xl border p-4 transition hover:border-violet-200 hover:bg-violet-50/40 dark:hover:bg-violet-950/20"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{task.title}</p>
                                            <p className="text-muted-foreground mt-1 truncate text-xs">{task.milestone?.title}</p>
                                        </div>
                                        <span className="ml-4 text-xs font-medium whitespace-nowrap text-slate-500">{formatDate(task.due_date)}</span>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                    <Card className="border-0 bg-gradient-to-br from-slate-950 to-violet-950 text-white shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Genel ritmin</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-8 text-5xl font-bold tracking-tight">%{summary.average_progress}</div>
                            <ProgressBar value={summary.average_progress} />
                            <p className="mt-5 text-sm leading-6 text-slate-300">
                                Her tamamlanan görev, hedeflerinin ilerlemesini otomatik olarak günceller.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Target; label: string; value: number | string; tone: string }) {
    const colors: Record<string, string> = {
        violet: 'bg-violet-100 text-violet-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        blue: 'bg-blue-100 text-blue-700',
        amber: 'bg-amber-100 text-amber-700',
    };
    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl p-3 ${colors[tone]}`}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-muted-foreground text-xs">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
const Empty = ({ text }: { text: string }) => (
    <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">{text}</div>
);
const formatDate = (date: string | null) =>
    date ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`)) : '';
