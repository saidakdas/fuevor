import { applyLocaleToDocument, isLocale, readStoredLocale, subscribeToLocaleChanges, translate, type Locale } from '@/i18n';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function useLocale() {
    const serverLocale = usePage<SharedData>().props.locale;
    const fallback: Locale = isLocale(serverLocale) ? serverLocale : 'en';
    const [locale, setLocale] = useState<Locale>(() => readStoredLocale(fallback));

    useEffect(() => {
        applyLocaleToDocument(locale);
        return subscribeToLocaleChanges(setLocale);
    }, [locale]);

    return {
        locale,
        t: (turkish: string, english: string) => translate(locale, turkish, english),
    };
}
