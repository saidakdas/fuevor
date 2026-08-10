import { GoalForm } from '@/components/goals/goal-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function CreateGoal() {
    const { t } = useLocale();

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Hedeflerim', 'My Goals'), href: '/goals' },
                { title: t('Yeni hedef', 'New goal'), href: '/goals/create' },
            ]}
        >
            <Head title={t('Yeni Hedef', 'New Goal')} />
            <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
                <div className="mb-6">
                    <p className="text-sm font-medium text-violet-600">{t('Yeni başlangıç', 'A new beginning')}</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('Hedefini tanımla', 'Define your goal')}</h1>
                </div>
                <Card className="border-0 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">{t('Temel bilgiler', 'Basic information')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GoalForm />
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
