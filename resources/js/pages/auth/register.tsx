import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import { getIntlLocale } from '@/i18n';
import AuthLayout from '@/layouts/auth-layout';
import { getCountries } from 'libphonenumber-js';

interface RegisterForm {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    profession: string;
    country: string;
    gender: string;
    terms_accepted: boolean;
    privacy_acknowledged: boolean;
}

export default function Register() {
    const { locale, t } = useLocale();
    const regionNames = new Intl.DisplayNames([getIntlLocale(locale)], { type: 'region' });
    const countries = getCountries()
        .map((code) => ({ code, name: regionNames.of(code) ?? code }))
        .sort((first, second) => first.name.localeCompare(second.name, getIntlLocale(locale)));
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        profession: '',
        country: '',
        gender: '',
        terms_accepted: false,
        privacy_acknowledged: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t('Canlı betaya katıl', 'Join the live beta')}
            description={t('Beta verilerin ana sürümde de seninle kalacak.', 'Your beta data will remain with you in the main release.')}
        >
            <Head title={t('Kayıt Ol', 'Sign up')} />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('Ad soyad', 'Full name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder={t('Adın ve soyadın', 'Your full name')}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('E-posta adresi', 'Email address')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="you@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">{t('Telefon', 'Phone')}</Label>
                        <Input
                            id="phone"
                            type="tel"
                            required
                            tabIndex={3}
                            autoComplete="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            disabled={processing}
                            placeholder="+90 5xx xxx xx xx"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('Şifre', 'Password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder={t('Güçlü bir şifre', 'A strong password')}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">{t('Şifre tekrarı', 'Confirm password')}</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder={t('Şifreni tekrar yaz', 'Enter your password again')}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profession">{t('Meslek', 'Profession')}</Label>
                        <Input
                            id="profession"
                            required
                            tabIndex={6}
                            autoComplete="organization-title"
                            value={data.profession}
                            onChange={(e) => setData('profession', e.target.value)}
                            disabled={processing}
                            placeholder={t('Mesleğin', 'Your profession')}
                        />
                        <InputError message={errors.profession} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="country">{t('Ülke', 'Country')}</Label>
                        <select
                            id="country"
                            required
                            tabIndex={7}
                            autoComplete="country-name"
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                            disabled={processing}
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">{t('Ülke seçiniz', 'Select country')}</option>
                            {countries.map((country) => (
                                <option key={country.code} value={country.code}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.country} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="gender">{t('Cinsiyet', 'Gender')}</Label>
                        <select
                            id="gender"
                            required
                            tabIndex={8}
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                            disabled={processing}
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">{t('Seçiniz', 'Select')}</option>
                            <option value="female">{t('Kadın', 'Female')}</option>
                            <option value="male">{t('Erkek', 'Male')}</option>
                            <option value="other">{t('Diğer', 'Other')}</option>
                            <option value="prefer-not-to-say">{t('Belirtmek istemiyorum', 'Prefer not to say')}</option>
                        </select>
                        <InputError message={errors.gender} />
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="grid gap-2">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="terms_accepted"
                                    checked={data.terms_accepted}
                                    onCheckedChange={(checked) => setData('terms_accepted', checked === true)}
                                    disabled={processing}
                                    tabIndex={9}
                                />
                                <Label htmlFor="terms_accepted" className="cursor-pointer text-sm leading-5 font-normal">
                                    <Link
                                        href={route('legal.terms')}
                                        target="_blank"
                                        className="font-semibold text-[#007aff] underline underline-offset-2"
                                    >
                                        {t('Kullanıcı Sözleşmesi ve Kullanım Koşulları’nı', 'User Agreement and Terms of Use')}
                                    </Link>{' '}
                                    {t('okudum ve kabul ediyorum.', 'I have read and accept them.')}
                                </Label>
                            </div>
                            <InputError message={errors.terms_accepted} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="privacy_acknowledged"
                                    checked={data.privacy_acknowledged}
                                    onCheckedChange={(checked) => setData('privacy_acknowledged', checked === true)}
                                    disabled={processing}
                                    tabIndex={10}
                                />
                                <Label htmlFor="privacy_acknowledged" className="cursor-pointer text-sm leading-5 font-normal">
                                    <Link
                                        href={route('legal.privacy')}
                                        target="_blank"
                                        className="font-semibold text-[#007aff] underline underline-offset-2"
                                    >
                                        {t('KVKK Aydınlatma Metni ve Gizlilik Politikası’nı', 'KVKK Notice and Privacy Policy')}
                                    </Link>{' '}
                                    {t('okudum ve bilgilendirildim.', 'I have read and understood them.')}
                                </Label>
                            </div>
                            <InputError message={errors.privacy_acknowledged} />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={11}
                        disabled={processing || !data.terms_accepted || !data.privacy_acknowledged}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {t('Hesabımı oluştur', 'Create my account')}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    {t('Zaten hesabın var mı?', 'Already have an account?')}{' '}
                    <TextLink href={route('login')} tabIndex={12}>
                        {t('Giriş yap', 'Log in')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
