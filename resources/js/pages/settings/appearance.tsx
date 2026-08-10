import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('Görünüm ayarları', 'Appearance settings'), href: '/settings/appearance' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Görünüm ayarları', 'Appearance settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('Görünüm ayarları', 'Appearance settings')}
                        description={t('Hesabının görünüm tercihlerini güncelle.', "Update your account's appearance settings.")}
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
