import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import AppLayout from '@/layouts/app-layout';
import { Goal } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Plus, Target } from 'lucide-react';

export default function GoalsIndex({ goals }: { goals: Goal[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Hedeflerim', href: '/goals' }]}>
            <Head title="Hedeflerim" />
            <main className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-violet-600">Yol haritan</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight">Hedeflerim</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Nereye gittiğini gör, sıradaki adımı seç.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('goals.create')}>
                            <Plus />
                            Yeni hedef
                        </Link>
                    </Button>
                </div>
                {goals.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                            <div className="mb-4 rounded-2xl bg-violet-100 p-4 text-violet-700">
                                <Target />
                            </div>
                            <h2 className="text-lg font-semibold">İlk hedefini oluştur</h2>
                            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                                Büyük hedefi kilometre taşlarına, onları da tamamlanabilir görevlere böl.
                            </p>
                            <Button className="mt-6" asChild>
                                <Link href={route('goals.create')}>Başla</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {goals.map((goal) => (
                            <Card
                                key={goal.id}
                                className="group border-0 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-lg dark:ring-slate-800"
                            >
                                <CardContent className="p-6">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <Badge variant="secondary" className={priorityColor(goal.priority)}>
                                                {label(goal.priority)}
                                            </Badge>
                                            <h2 className="mt-3 line-clamp-2 text-lg font-bold">{goal.title}</h2>
                                        </div>
                                        <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                                            <Target className="size-4" />
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mb-5 line-clamp-2 min-h-10 text-sm leading-5">
                                        {goal.description || 'Bu hedef için henüz bir açıklama eklenmedi.'}
                                    </p>
                                    <ProgressBar value={goal.progress} showLabel />
                                    <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="size-3.5" />
                                            {formatDate(goal.target_date)}
                                        </span>
                                        <span>{goal.milestones_count ?? 0} kilometre taşı</span>
                                    </div>
                                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                                        <Button variant="ghost" size="sm" className="-ml-3" asChild>
                                            <Link href={route('goals.show', goal.id)}>
                                                Detayı aç <ArrowRight />
                                            </Link>
                                        </Button>
                                        <button
                                            className="text-muted-foreground text-xs hover:text-red-600"
                                            onClick={() =>
                                                confirm('Bu hedef ve tüm alt kayıtları silinsin mi?') &&
                                                router.delete(route('goals.destroy', goal.id))
                                            }
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
const formatDate = (date: string) =>
    new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
const label = (value: string) => ({ low: 'Düşük', medium: 'Orta', high: 'Yüksek' })[value] ?? value;
const priorityColor = (value: string) =>
    value === 'high' ? 'bg-red-100 text-red-700' : value === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
