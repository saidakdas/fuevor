import { GoalForm } from '@/components/goals/goal-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { Goal } from '@/types';
import { Head } from '@inertiajs/react';

export default function EditGoal({ goal }: { goal: Goal }) {
    const { t } = useLocale();

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Hedeflerim', 'My Goals'), href: '/goals' },
                { title: goal.title, href: route('goals.show', goal.id) },
                { title: t('Düzenle', 'Edit'), href: route('goals.edit', goal.id) },
            ]}
        >
            <Head title={`${goal.title} - ${t('Düzenle', 'Edit')}`} />
            <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
                <div className="mb-6">
                    <p className="text-sm font-medium text-violet-600">{t('Hedef ayarları', 'Goal settings')}</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('Hedefi düzenle', 'Edit goal')}</h1>
                </div>
                <Card className="border-0 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">{t('Hedef bilgileri', 'Goal information')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GoalForm goal={goal} />
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
