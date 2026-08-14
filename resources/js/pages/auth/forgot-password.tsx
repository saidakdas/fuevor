// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useLocale();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout
            title={t('Şifremi unuttum', 'Forgot password')}
            description={t('Şifre sıfırlama bağlantısını almak için e-posta adresini gir.', 'Enter your email to receive a password reset link.')}
        >
            <Head title={t('Şifremi Unuttum', 'Forgot Password')} />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t('E-postana güvenli bir sıfırlama bağlantısı gönder.', 'Send a secure reset link to your email.')}
                </div>
            )}

            <div className="space-y-6">
                <form onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('E-posta adresi', 'Email address')}</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="my-6 flex items-center justify-start">
                        <Button className="w-full" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {t('Şifre sıfırlama bağlantısını gönder', 'Email password reset link')}
                        </Button>
                    </div>
                </form>

                <div className="text-muted-foreground space-x-1 text-center text-sm">
                    <span>{t('Ya da', 'Or, return to')}</span>
                    <TextLink href={route('login')}>{t('giriş yap', 'log in')}</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
