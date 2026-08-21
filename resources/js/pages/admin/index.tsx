import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useLocale } from '@/hooks/use-locale';
import { getIntlLocale, type Locale, type Translate } from '@/i18n';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CalendarDays, Mail, MessageCircle, Phone, Search, Send, ShieldCheck, Star, UserRound, Users } from 'lucide-react';

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

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type AdminSupportTicket = {
    id: number;
    status: 'open' | 'answered' | 'closed';
    created_at: string;
    updated_at: string;
    user: { id: number; name: string; email: string; phone: string | null };
    messages: Array<{ id: number; body: string; is_admin: boolean; created_at: string }>;
};

type AdminFeedback = {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    user: { id: number; name: string; email: string };
};

type AdminPageProps = {
    section: 'users' | 'support' | 'feedback';
    filters: { q: string };
    stats: {
        total_users: number;
        total_goals: number;
        active_goals: number;
        completed_goals: number;
        support_messages: number;
        open_support: number;
        feedback_count: number;
        average_rating: number;
    };
    users: Paginated<AdminUser>;
    supportTickets: Paginated<AdminSupportTicket>;
    feedbackEntries: Paginated<AdminFeedback>;
};

const statusStyles: Record<AdminGoal['status'], string> = {
    active: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300',
    paused: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    archived: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

export default function AdminIndex({ section, filters, stats, users, supportTickets, feedbackEntries }: AdminPageProps) {
    const { t } = useLocale();

    return (
        <AppLayout breadcrumbs={[{ title: t('Admin Paneli', 'Admin Panel'), href: '/admin' }]}>
            <Head title={t('Admin Paneli', 'Admin Panel')} />

            <main className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                            <ShieldCheck className="size-4" />
                            {t('Yetkili görünüm', 'Authorized view')}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('Fuevor Yönetim Merkezi', 'Fuevor Admin Center')}</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            {t(
                                'Kullanıcıları, destek görüşmelerini ve beta değerlendirmelerini tek yerden yönetin.',
                                'Manage users, support conversations, and beta feedback in one place.',
                            )}
                        </p>
                    </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Users} label={t('Kullanıcı', 'Users')} value={stats.total_users} tone="cyan" />
                    <StatCard icon={MessageCircle} label={t('Destek kaydı', 'Support tickets')} value={stats.support_messages} tone="violet" />
                    <StatCard icon={Send} label={t('Yanıt bekleyen', 'Awaiting reply')} value={stats.open_support} tone="amber" />
                    <StatCard icon={Star} label={t('Değerlendirme', 'Feedback')} value={stats.feedback_count} tone="emerald" />
                </section>

                <nav
                    className="grid gap-2 rounded-2xl bg-slate-100 p-2 sm:grid-cols-3 dark:bg-slate-900"
                    aria-label={t('Admin bölümleri', 'Admin sections')}
                >
                    {[
                        { id: 'users', label: t('Kullanıcılar', 'Users'), icon: UserRound, count: users.total },
                        { id: 'support', label: t('Destek Mesajları', 'Support Messages'), icon: MessageCircle, count: supportTickets.total },
                        { id: 'feedback', label: t('Değerlendirme ve Yorumlar', 'Ratings & Feedback'), icon: Star, count: feedbackEntries.total },
                    ].map((item) => (
                        <Link
                            key={item.id}
                            href={`/admin?section=${item.id}`}
                            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${section === item.id ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300' : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
                        >
                            <item.icon className="size-4" />
                            {item.label}
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] tabular-nums dark:bg-slate-700">{item.count}</span>
                        </Link>
                    ))}
                </nav>

                {section === 'users' && (
                    <>
                        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
                            <CardContent className="p-4 sm:p-5">
                                <form method="get" action="/admin" className="flex flex-col gap-3 sm:flex-row">
                                    <input type="hidden" name="section" value="users" />
                                    <div className="relative flex-1">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                        <Input
                                            name="q"
                                            defaultValue={filters.q}
                                            className="pl-9"
                                            placeholder={t('Ad, e-posta veya telefon ara', 'Search name, email, or phone')}
                                        />
                                    </div>
                                    <Button type="submit">{t('Ara', 'Search')}</Button>
                                    {filters.q && (
                                        <Button variant="outline" asChild>
                                            <Link href="/admin?section=users">{t('Temizle', 'Clear')}</Link>
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                        <section className="space-y-4">
                            {users.data.length === 0 ? (
                                <EmptyState text={t('Aramanızla eşleşen kullanıcı bulunamadı.', 'No users matched your search.')} />
                            ) : (
                                users.data.map((user) => <UserCard key={user.id} user={user} />)
                            )}
                        </section>
                        <Pagination page={users} t={t} />
                    </>
                )}

                {section === 'support' && (
                    <>
                        <section className="space-y-4">
                            {supportTickets.data.length === 0 ? (
                                <EmptyState text={t('Henüz destek mesajı bulunmuyor.', 'There are no support messages yet.')} />
                            ) : (
                                supportTickets.data.map((ticket) => <SupportTicketCard key={ticket.id} ticket={ticket} />)
                            )}
                        </section>
                        <Pagination page={supportTickets} t={t} />
                    </>
                )}

                {section === 'feedback' && (
                    <>
                        <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-950">
                            <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                <Star className="size-5 fill-current" />
                            </span>
                            <div>
                                <p className="text-2xl font-bold tabular-nums">{stats.average_rating || '—'}</p>
                                <p className="text-muted-foreground text-xs">{t('Ortalama beta puanı / 5', 'Average beta rating / 5')}</p>
                            </div>
                        </div>
                        <section className="grid gap-4 lg:grid-cols-2">
                            {feedbackEntries.data.length === 0 ? (
                                <div className="lg:col-span-2">
                                    <EmptyState text={t('Henüz değerlendirme bulunmuyor.', 'There is no feedback yet.')} />
                                </div>
                            ) : (
                                feedbackEntries.data.map((feedback) => <FeedbackCard key={feedback.id} feedback={feedback} />)
                            )}
                        </section>
                        <Pagination page={feedbackEntries} t={t} />
                    </>
                )}
            </main>
        </AppLayout>
    );
}

function UserCard({ user }: { user: AdminUser }) {
    const { locale, t } = useLocale();
    const statusLabels: Record<AdminGoal['status'], string> = {
        active: t('Aktif', 'Active'),
        paused: t('Duraklatıldı', 'Paused'),
        completed: t('Tamamlandı', 'Completed'),
        archived: t('Arşivlendi', 'Archived'),
    };

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
                                    {user.phone || t('Telefon eklenmemiş', 'No phone added')}
                                </span>
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="size-4 shrink-0" />
                                    {t(`${formatDate(user.created_at, locale)} tarihinde katıldı`, `Joined ${formatDate(user.created_at, locale)}`)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                        <p className="text-2xl font-bold">{user.goals_count}</p>
                        <p className="text-muted-foreground text-xs">{t('hedef', 'goals')}</p>
                    </div>
                </div>

                <div className="bg-slate-50/70 p-4 sm:p-5 dark:bg-slate-900/40">
                    {user.goals.length === 0 ? (
                        <p className="text-muted-foreground rounded-xl border border-dashed bg-white p-5 text-center text-sm dark:bg-slate-950">
                            {t('Bu kullanıcının henüz hedefi yok.', 'This user has no goals yet.')}
                        </p>
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {user.goals.map((goal) => (
                                <article key={goal.id} className="rounded-xl border bg-white p-4 dark:bg-slate-950">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold">{goal.title}</h3>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {t('Hedef tarihi', 'Target date')}: {formatGoalDate(goal.target_date, locale, t)}
                                            </p>
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

function SupportTicketCard({ ticket }: { ticket: AdminSupportTicket }) {
    const { locale, t } = useLocale();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    return (
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
            <CardContent className="p-0">
                <div className="flex flex-col gap-3 border-b bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-950">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-100 font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                            {getInitials(ticket.user.name)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate font-bold">{ticket.user.name}</h2>
                                <Badge
                                    variant="outline"
                                    className={
                                        ticket.status === 'answered'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }
                                >
                                    {ticket.status === 'answered' ? t('Yanıtlandı', 'Answered') : t('Yanıt bekliyor', 'Awaiting reply')}
                                </Badge>
                            </div>
                            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <a href={`mailto:${ticket.user.email}`} className="hover:text-cyan-700">
                                    {ticket.user.email}
                                </a>
                                {ticket.user.phone && <span>{ticket.user.phone}</span>}
                                <span>
                                    #{ticket.id} · {formatDateTime(ticket.created_at, locale)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 bg-slate-50/70 p-5 dark:bg-slate-900/40">
                    {ticket.messages.map((message) => (
                        <div key={message.id} className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.is_admin ? 'bg-cyan-700 text-white' : 'border bg-white dark:bg-slate-950'}`}
                            >
                                <p className="text-[11px] font-bold opacity-70">
                                    {message.is_admin ? t('Admin yanıtı', 'Admin reply') : ticket.user.name}
                                </p>
                                <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{message.body}</p>
                                <p className="mt-2 text-[10px] opacity-60">{formatDateTime(message.created_at, locale)}</p>
                            </div>
                        </div>
                    ))}

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            post(route('admin.support.reply', ticket.id), {
                                preserveScroll: true,
                                onSuccess: () => reset(),
                            });
                        }}
                        className="border-t pt-4"
                    >
                        <textarea
                            value={data.body}
                            onChange={(event) => setData('body', event.target.value)}
                            rows={3}
                            maxLength={3000}
                            placeholder={t('Kullanıcıya yanıt yaz…', 'Write a reply to the user…')}
                            className="border-input bg-background focus-visible:ring-ring w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                        />
                        {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                        <div className="mt-3 flex justify-end">
                            <Button type="submit" disabled={processing || data.body.trim().length < 2}>
                                <Send className="size-4" />
                                {processing ? t('Gönderiliyor…', 'Sending…') : t('Yanıtla', 'Reply')}
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}

function FeedbackCard({ feedback }: { feedback: AdminFeedback }) {
    const { locale, t } = useLocale();

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate font-bold">{feedback.user.name}</h2>
                        <a href={`mailto:${feedback.user.email}`} className="text-muted-foreground mt-1 block truncate text-xs hover:text-cyan-700">
                            {feedback.user.email}
                        </a>
                    </div>
                    <div className="flex shrink-0 gap-0.5 text-amber-500" aria-label={t(`${feedback.rating} puan`, `${feedback.rating} stars`)}>
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                                key={value}
                                className={`size-4 ${value <= feedback.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>
                <p className="mt-4 text-sm leading-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{feedback.comment}</p>
                <p className="text-muted-foreground mt-4 text-[11px]">{formatDateTime(feedback.created_at, locale)}</p>
            </CardContent>
        </Card>
    );
}

function EmptyState({ text }: { text: string }) {
    return <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">{text}</div>;
}

function Pagination<T>({ page, t }: { page: Paginated<T>; t: Translate }) {
    if (page.links.length <= 3) return null;

    return (
        <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label={t('Sayfalama', 'Pagination')}>
            <p className="text-muted-foreground text-sm">
                {t(`${page.total} kayıttan ${page.from}–${page.to} arası`, `Showing ${page.from}–${page.to} of ${page.total}`)}
            </p>
            <div className="flex flex-wrap justify-center gap-1">
                {page.links.map((link, index) =>
                    link.url ? (
                        <Button key={`${link.label}-${index}`} variant={link.active ? 'default' : 'outline'} size="sm" asChild>
                            <Link href={link.url} preserveScroll>
                                {formatPaginationLabel(link.label, t)}
                            </Link>
                        </Button>
                    ) : (
                        <Button key={`${link.label}-${index}`} variant="outline" size="sm" disabled>
                            {formatPaginationLabel(link.label, t)}
                        </Button>
                    ),
                )}
            </div>
        </nav>
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
        .toLocaleUpperCase();

const formatDate = (date: string, locale: Locale) =>
    new Intl.DateTimeFormat(getIntlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));

const formatDateTime = (date: string, locale: Locale) =>
    new Intl.DateTimeFormat(getIntlLocale(locale), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));

const formatGoalDate = (date: string | null, locale: Locale, t: Translate) =>
    date
        ? new Intl.DateTimeFormat(getIntlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
        : t('Belirtilmedi', 'Not specified');

const formatPaginationLabel = (label: string, t: (turkish: string, english: string) => string) => {
    if (label.includes('Previous')) return t('Önceki', 'Previous');
    if (label.includes('Next')) return t('Sonraki', 'Next');
    return label;
};
