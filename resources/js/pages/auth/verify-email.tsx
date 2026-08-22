import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, MailCheck, RotateCw } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';

interface VerifyEmailProps {
    status?: string;
    email: string;
}

export default function VerifyEmail({ status, email }: VerifyEmailProps) {
    const { t } = useLocale();
    const verifyForm = useForm({ code: '' });
    const resendForm = useForm({});

    const verify: FormEventHandler = (event) => {
        event.preventDefault();
        verifyForm.post(route('verification.code.verify'));
    };

    const resend: FormEventHandler = (event) => {
        event.preventDefault();
        resendForm.post(route('verification.send'), { preserveScroll: true });
    };

    const statusMessage =
        status === 'verification-code-sent'
            ? t('Yeni doğrulama kodu e-postana gönderildi.', 'A new verification code has been sent to your email.')
            : status === 'verification-code-throttled'
              ? t('Yeni kod istemeden önce 60 saniye bekle.', 'Wait 60 seconds before requesting a new code.')
              : status === 'verification-code-failed'
                ? t(
                      'E-posta şu anda gönderilemedi. Biraz sonra yeniden deneyebilirsin.',
                      'The email could not be sent right now. You can try again shortly.',
                  )
                : null;

    return (
        <AuthLayout
            title={t('E-postanı doğrula', 'Verify your email')}
            description={t(
                `${email} adresine gönderdiğimiz 6 haneli kodu gir.`,
                `Enter the 6-digit code we sent to ${email}.`,
            )}
        >
            <Head title={t('E-posta Doğrulama', 'Email Verification')} />

            <div className="mb-6 flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-[#087bff] dark:bg-blue-950/40">
                    <MailCheck className="size-7" />
                </div>
            </div>

            {statusMessage && (
                <div
                    className={`mb-5 rounded-xl px-4 py-3 text-center text-sm font-medium ${
                        status === 'verification-code-failed'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    }`}
                >
                    {statusMessage}
                </div>
            )}

            <form onSubmit={verify} className="space-y-5">
                <div className="grid gap-2">
                    <Label htmlFor="code">{t('Doğrulama kodu', 'Verification code')}</Label>
                    <Input
                        id="code"
                        value={verifyForm.data.code}
                        onChange={(event) => verifyForm.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        required
                        disabled={verifyForm.processing}
                        className="h-14 text-center text-2xl font-bold tracking-[0.45em]"
                        placeholder="000000"
                    />
                    <InputError message={verifyForm.errors.code} />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={verifyForm.processing || verifyForm.data.code.length !== 6}>
                    {verifyForm.processing && <LoaderCircle className="size-4 animate-spin" />}
                    {t('Kodu doğrula', 'Verify code')}
                </Button>
            </form>

            <form onSubmit={resend} className="mt-4 text-center">
                <Button type="submit" disabled={resendForm.processing} variant="ghost" className="text-sm">
                    {resendForm.processing ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
                    {t('Kodu yeniden gönder', 'Resend code')}
                </Button>
            </form>

            <div className="mt-2 text-center">
                <TextLink href={route('logout')} method="post" className="text-sm">
                    {t('Farklı hesapla giriş yap', 'Use a different account')}
                </TextLink>
            </div>
        </AuthLayout>
    );
}
