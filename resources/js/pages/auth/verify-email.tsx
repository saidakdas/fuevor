// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useLocale();
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title={t('E-postanı doğrula', 'Verify email')}
            description={t(
                'E-postana gönderdiğimiz bağlantıya tıklayarak adresini doğrula.',
                'Please verify your email address by clicking the link we just emailed you.',
            )}
        >
            <Head title={t('E-posta Doğrulama', 'Email Verification')} />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t(
                        'Kayıt sırasında verdiğin e-posta adresine yeni bir doğrulama bağlantısı gönderildi.',
                        'A new verification link has been sent to the email address you provided during registration.',
                    )}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {t('Doğrulama e-postasını yeniden gönder', 'Resend verification email')}
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    {t('Çıkış yap', 'Log out')}
                </TextLink>
            </form>
        </AuthLayout>
    );
}
