import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Activity, CalendarDays, CheckCircle2, Mail, Phone, Search, ShieldCheck, Target, Users } from 'lucide-react';

type AdminGoal = {
    id: number;
    title: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    priority: 'low' | 'medium' | 'high';
    progress: number;
    target_date: string | null;
};

type AdminUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: 'admin' | 'user';
    email_verified_at: string | null;
    created_at: string;
    goals_count: number;
    goals: AdminGoal[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AdminPageProps = {
    filters: { q: string };
    stats: {
        total_users: number;
        total_goals: number;
        active_goals: number;
        completed_goals: number;
    };
    users: {
        data: AdminUser[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
};

const statusLabels: Record<AdminGoal['status'], string> = {
    active: 'Aktif',
    paused: 'Duraklatıldı',
    completed: 'Tamamlandı',
    archived: 'Arşivlendi',
};

const statusStyles: Record<AdminGoal['status'], string> = {
    active: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300',
    paused: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    archived: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

export default function AdminIndex({ filters, stats, users }: AdminPageProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Paneli', href: '/admin' }]}>
            <Head title="Admin Paneli" />

            <main className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                            <ShieldCheck className="size-4" />
                            Yetkili görünüm
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Kullanıcılar ve hedefler</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Kullanıcı iletişim bilgilerini ve hedef ilerlemelerini tek ekrandan izleyin.
                        </p>
                    </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Users} label="Kullanıcı" value={stats.total_users} tone="cyan" />
                    <StatCard icon={Target} label="Toplam hedef" value={stats.total_goals} tone="violet" />
                    <StatCard icon={Activity} label="Aktif hedef" value={stats.active_goals} tone="amber" />
                    <StatCard icon={CheckCircle2} label="Tamamlanan" value={stats.completed_goals} tone="emerald" />
                </section>

                <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
                    <CardContent className="p-4 sm:p-5">
                        <form method="get" action="/admin" className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input name="q" defaultValue={filters.q} className="pl-9" placeholder="Ad, e-posta veya telefon ara" />
                            </div>
                            <Button type="submit">Ara</Button>
                            {filters.q && (
                                <Button variant="outline" asChild>
                                    <Link href="/admin">Temizle</Link>
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <section className="space-y-4">
                    {users.data.length === 0 ? (
                        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
                            Aramanızla eşleşen kullanıcı bulunamadı.
                        </div>
                    ) : (
                        users.data.map((user) => <UserCard key={user.id} user={user} />)
                    )}
                </section>

                {users.links.length > 3 && (
                    <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Sayfalama">
                        <p className="text-muted-foreground text-sm">
                            {users.total} kayıttan {users.from}–{users.to} arası
                        </p>
                        <div className="flex flex-wrap justify-center gap-1">
                            {users.links.map((link, index) =>
                                link.url ? (
                                    <Button key={`${link.label}-${index}`} variant={link.active ? 'default' : 'outline'} size="sm" asChild>
                                        <Link href={link.url} preserveScroll>
                                            {formatPaginationLabel(link.label)}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button key={`${link.label}-${index}`} variant="outline" size="sm" disabled>
                                        {formatPaginationLabel(link.label)}
                                    </Button>
                                ),
                            )}
                        </div>
                    </nav>
                )}
            </main>
        </AppLayout>
    );
}

function UserCard({ user }: { user: AdminUser }) {
    return (
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
            <CardContent className="p-0">
                <div className="flex flex-col gap-5 border-b bg-white p-5 sm:flex-row sm:items-start sm:justify-between dark:bg-slate-950">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-100 font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                            {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-lg font-bold">{user.name}</h2>
                                {user.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
                            </div>
                            <div className="text-muted-foreground mt-2 grid gap-2 text-sm md:grid-cols-3 md:gap-x-6">
                                <a href={`mailto:${user.email}`} className="flex items-center gap-2 hover:text-cyan-700">
                                    <Mail className="size-4 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </a>
                                <span className="flex items-center gap-2">
                                    <Phone className="size-4 shrink-0" />
                                    {user.phone || 'Telefon eklenmemiş'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="size-4 shrink-0" />
                                    {formatDate(user.created_at)} tarihinde katıldı
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                        <p className="text-2xl font-bold">{user.goals_count}</p>
                        <p className="text-muted-foreground text-xs">hedef</p>
                    </div>
                </div>

                <div className="bg-slate-50/70 p-4 sm:p-5 dark:bg-slate-900/40">
                    {user.goals.length === 0 ? (
                        <p className="text-muted-foreground rounded-xl border border-dashed bg-white p-5 text-center text-sm dark:bg-slate-950">
                            Bu kullanıcının henüz hedefi yok.
                        </p>
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {user.goals.map((goal) => (
                                <article key={goal.id} className="rounded-xl border bg-white p-4 dark:bg-slate-950">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold">{goal.title}</h3>
                                            <p className="text-muted-foreground mt-1 text-xs">Hedef tarihi: {formatGoalDate(goal.target_date)}</p>
                                        </div>
                                        <Badge variant="outline" className={statusStyles[goal.status]}>
                                            {statusLabels[goal.status]}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-center gap-3">
                                        <ProgressBar value={goal.progress} />
                                        <span className="text-sm font-semibold tabular-nums">%{goal.progress}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: typeof Users;
    label: string;
    value: number;
    tone: 'amber' | 'cyan' | 'emerald' | 'violet';
}) {
    const colors = {
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
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

const getInitials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toLocaleUpperCase('tr-TR');

const formatDate = (date: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));

const formatGoalDate = (date: string | null) =>
    date
        ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
        : 'Belirtilmedi';

const formatPaginationLabel = (label: string) => {
    if (label.includes('Previous')) return 'Önceki';
    if (label.includes('Next')) return 'Sonraki';
    return label;
};
