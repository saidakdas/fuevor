import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';

export function FlashMessage() {
    const { flash } = usePage<SharedData & { flash?: { success?: string; error?: string } }>().props;
    const message = flash?.success ?? flash?.error;
    if (!message) return null;
    const success = Boolean(flash?.success);

    return (
        <div
            className={`mx-4 mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm md:mx-6 ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-800'}`}
        >
            {success ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
            {message}
        </div>
    );
}
