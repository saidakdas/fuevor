import { DYNAMIC_SOURCE_TEMPLATES, GENERATED_DYNAMIC_TRANSLATIONS } from './generated-dynamic-translations';
import { GENERATED_TRANSLATIONS } from './generated-translations';

export const SUPPORTED_LOCALES = [
    { code: 'tr', intl: 'tr-TR', direction: 'ltr', label: 'Türkçe', description: 'Fuevor’u Türkçe kullan' },
    { code: 'en', intl: 'en-US', direction: 'ltr', label: 'English', description: 'Use Fuevor in English' },
    { code: 'ja', intl: 'ja-JP', direction: 'ltr', label: '日本語', description: 'Fuevorを日本語で使用' },
    { code: 'zh', intl: 'zh-CN', direction: 'ltr', label: '简体中文', description: '使用 Fuevor 简体中文版' },
    { code: 'es', intl: 'es-ES', direction: 'ltr', label: 'Español', description: 'Usar Fuevor en español' },
    { code: 'fr', intl: 'fr-FR', direction: 'ltr', label: 'Français', description: 'Utiliser Fuevor en français' },
    { code: 'it', intl: 'it-IT', direction: 'ltr', label: 'Italiano', description: 'Usa Fuevor in italiano' },
    { code: 'de', intl: 'de-DE', direction: 'ltr', label: 'Deutsch', description: 'Fuevor auf Deutsch verwenden' },
    { code: 'ar', intl: 'ar-SA-u-ca-gregory', direction: 'rtl', label: 'العربية', description: 'استخدام Fuevor باللغة العربية' },
    { code: 'fa', intl: 'fa-IR-u-ca-gregory', direction: 'rtl', label: 'فارسی', description: 'استفاده از Fuevor به زبان فارسی' },
    { code: 'el', intl: 'el-GR', direction: 'ltr', label: 'Ελληνικά', description: 'Χρήση του Fuevor στα Ελληνικά' },
    { code: 'ru', intl: 'ru-RU', direction: 'ltr', label: 'Русский', description: 'Использовать Fuevor на русском' },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]['code'];
export type Translate = (turkish: string, english: string) => string;

const LOCALE_STORAGE_KEY = 'fuevor.locale';
const LOCALE_CHANGE_EVENT = 'fuevor:locale-change';
const TRANSLATIONS = GENERATED_TRANSLATIONS as Record<string, Record<string, string>>;
const DYNAMIC_TRANSLATIONS = GENERATED_DYNAMIC_TRANSLATIONS as Record<string, readonly string[]>;

export function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && SUPPORTED_LOCALES.some((locale) => locale.code === value);
}

export function getIntlLocale(locale: Locale): string {
    return SUPPORTED_LOCALES.find((item) => item.code === locale)?.intl ?? 'en-US';
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
    return SUPPORTED_LOCALES.find((item) => item.code === locale)?.direction ?? 'ltr';
}

export function translate(locale: Locale, turkish: string, english: string): string {
    if (locale === 'tr') return turkish;
    if (locale === 'en') return english;

    return TRANSLATIONS[locale]?.[english] ?? translateDynamic(locale, english) ?? english;
}

function translateDynamic(locale: Locale, english: string): string | undefined {
    const localeTemplates = DYNAMIC_TRANSLATIONS[locale];
    if (!localeTemplates) return undefined;

    for (const [templateIndex, sourceTemplate] of DYNAMIC_SOURCE_TEMPLATES.entries()) {
        const placeholderOrder: number[] = [];
        let sourceOffset = 0;
        let pattern = '^';
        for (const match of sourceTemplate.matchAll(/__VALUE_(\d+)__/g)) {
            pattern += escapeRegularExpression(sourceTemplate.slice(sourceOffset, match.index));
            pattern += '(.+?)';
            placeholderOrder.push(Number(match[1]));
            sourceOffset = (match.index ?? 0) + match[0].length;
        }
        pattern += `${escapeRegularExpression(sourceTemplate.slice(sourceOffset))}$`;
        const values = english.match(new RegExp(pattern));
        if (!values) continue;

        const replacements = new Map<number, string>();
        placeholderOrder.forEach((placeholder, index) => replacements.set(placeholder, values[index + 1]));
        return localeTemplates[templateIndex].replace(/__VALUE_(\d+)__/g, (_, value: string) => replacements.get(Number(value)) ?? '');
    }

    return undefined;
}

function escapeRegularExpression(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function readStoredLocale(fallback: Locale = 'en'): Locale {
    if (typeof window === 'undefined') return fallback;

    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : fallback;
}

export function applyLocaleToDocument(locale: Locale): void {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = locale;
    document.documentElement.dir = getLocaleDirection(locale);
    document.documentElement.dataset.locale = locale;
}

export function persistLocale(locale: Locale): void {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        document.cookie = `fuevor_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
        window.dispatchEvent(new CustomEvent<Locale>(LOCALE_CHANGE_EVENT, { detail: locale }));
    }
    applyLocaleToDocument(locale);
}

export function subscribeToLocaleChanges(callback: (locale: Locale) => void): () => void {
    if (typeof window === 'undefined') return () => undefined;

    const handleLocaleChange = (event: Event) => {
        const locale = (event as CustomEvent<Locale>).detail;
        if (isLocale(locale)) callback(locale);
    };
    const handleStorage = (event: StorageEvent) => {
        if (event.key === LOCALE_STORAGE_KEY && isLocale(event.newValue)) callback(event.newValue);
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
        window.removeEventListener('storage', handleStorage);
    };
}
