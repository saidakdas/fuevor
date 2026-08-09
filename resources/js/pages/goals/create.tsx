import { GoalForm } from '@/components/goals/goal-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function CreateGoal() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Hedeflerim', href: '/goals' },
                { title: 'Yeni hedef', href: '/goals/create' },
            ]}
        >
            <Head title="Yeni Hedef" />
            <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
                <div className="mb-6">
                    <p className="text-sm font-medium text-violet-600">Yeni başlangıç</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">Hedefini tanımla</h1>
                </div>
                <Card className="border-0 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Temel bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GoalForm />
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
