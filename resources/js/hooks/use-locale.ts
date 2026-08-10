import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function useLocale() {
    const locale = usePage<SharedData>().props.locale ?? 'en';

    return {
        locale,
        t: (turkish: string, english: string) => (locale === 'tr' ? turkish : english),
    };
}
