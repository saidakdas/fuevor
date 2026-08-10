import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import { Goal, GoalStatus, Priority } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface GoalFormData {
    title: string;
    description: string;
    start_date: string;
    target_date: string;
    status: GoalStatus;
    priority: Priority;
    motivation: string;
    reward: string;
}

export function GoalForm({ goal }: { goal?: Goal }) {
    const { t } = useLocale();
    const form = useForm<GoalFormData>({
        title: goal?.title ?? '',
        description: goal?.description ?? '',
        start_date: goal?.start_date ?? new Date().toISOString().slice(0, 10),
        target_date: goal?.target_date ?? '',
        status: goal?.status ?? 'active',
        priority: goal?.priority ?? 'medium',
        motivation: goal?.motivation ?? '',
        reward: goal?.reward ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (goal) {
            form.put(route('goals.update', goal.id));
        } else {
            form.post(route('goals.store'));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-7">
            <div className="grid gap-5 md:grid-cols-2">
                <Field label={t('Hedef başlığı', 'Goal title')} error={form.errors.title} className="md:col-span-2">
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        placeholder={t('Örn. Yarı maratonu tamamla', 'e.g. Complete a half marathon')}
                        required
                    />
                </Field>
                <Field label={t('Açıklama', 'Description')} error={form.errors.description} className="md:col-span-2">
                    <Textarea
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder={t('Hedefin kapsamını netleştir...', 'Clarify the scope of your goal...')}
                    />
                </Field>
                <Field label={t('Başlangıç tarihi', 'Start date')} error={form.errors.start_date}>
                    <Input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required />
                </Field>
                <Field label={t('Hedef tarihi', 'Target date')} error={form.errors.target_date}>
                    <Input type="date" value={form.data.target_date} onChange={(e) => form.setData('target_date', e.target.value)} required />
                </Field>
                <Field label={t('Öncelik', 'Priority')} error={form.errors.priority}>
                    <select
                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                        value={form.data.priority}
                        onChange={(e) => form.setData('priority', e.target.value as Priority)}
                    >
                        <option value="low">{t('Düşük', 'Low')}</option>
                        <option value="medium">{t('Orta', 'Medium')}</option>
                        <option value="high">{t('Yüksek', 'High')}</option>
                    </select>
                </Field>
                {goal && (
                    <Field label={t('Durum', 'Status')} error={form.errors.status}>
                        <select
                            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                            value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value as GoalStatus)}
                        >
                            <option value="active">{t('Aktif', 'Active')}</option>
                            <option value="paused">{t('Duraklatıldı', 'Paused')}</option>
                            <option value="completed">{t('Tamamlandı', 'Completed')}</option>
                            <option value="archived">{t('Arşivlendi', 'Archived')}</option>
                        </select>
                    </Field>
                )}
                <Field label={t('Bunu neden istiyorsun?', 'Why do you want this?')} error={form.errors.motivation} className="md:col-span-2">
                    <Textarea
                        value={form.data.motivation}
                        onChange={(e) => form.setData('motivation', e.target.value)}
                        placeholder={t(
                            'Zor günlerde sana yön gösterecek nedeni yaz...',
                            'Write the reason that will guide you through difficult days...',
                        )}
                    />
                </Field>
                <Field
                    label={t('Ulaştığında ne kazanacaksın?', 'What will you gain when you achieve it?')}
                    error={form.errors.reward}
                    className="md:col-span-2"
                >
                    <Textarea
                        value={form.data.reward}
                        onChange={(e) => form.setData('reward', e.target.value)}
                        placeholder={t('Sonucun hayatına katacağı değeri yaz...', 'Describe the value this result will add to your life...')}
                    />
                </Field>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" asChild>
                    <Link href={goal ? route('goals.show', goal.id) : route('goals.index')}>{t('Vazgeç', 'Cancel')}</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="animate-spin" />}
                    {goal ? t('Değişiklikleri kaydet', 'Save changes') : t('Hedefi oluştur', 'Create goal')}
                </Button>
            </div>
        </form>
    );
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`grid gap-2 ${className}`}>
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
