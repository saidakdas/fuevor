import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
                <Field label="Hedef başlığı" error={form.errors.title} className="md:col-span-2">
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        placeholder="Örn. Yarı maratonu tamamla"
                        required
                    />
                </Field>
                <Field label="Açıklama" error={form.errors.description} className="md:col-span-2">
                    <Textarea
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Hedefin kapsamını netleştir..."
                    />
                </Field>
                <Field label="Başlangıç tarihi" error={form.errors.start_date}>
                    <Input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required />
                </Field>
                <Field label="Hedef tarihi" error={form.errors.target_date}>
                    <Input type="date" value={form.data.target_date} onChange={(e) => form.setData('target_date', e.target.value)} required />
                </Field>
                <Field label="Öncelik" error={form.errors.priority}>
                    <select
                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                        value={form.data.priority}
                        onChange={(e) => form.setData('priority', e.target.value as Priority)}
                    >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                    </select>
                </Field>
                {goal && (
                    <Field label="Durum" error={form.errors.status}>
                        <select
                            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                            value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value as GoalStatus)}
                        >
                            <option value="active">Aktif</option>
                            <option value="paused">Duraklatıldı</option>
                            <option value="completed">Tamamlandı</option>
                            <option value="archived">Arşivlendi</option>
                        </select>
                    </Field>
                )}
                <Field label="Bunu neden istiyorsun?" error={form.errors.motivation} className="md:col-span-2">
                    <Textarea
                        value={form.data.motivation}
                        onChange={(e) => form.setData('motivation', e.target.value)}
                        placeholder="Zor günlerde sana yön gösterecek nedeni yaz..."
                    />
                </Field>
                <Field label="Ulaştığında ne kazanacaksın?" error={form.errors.reward} className="md:col-span-2">
                    <Textarea
                        value={form.data.reward}
                        onChange={(e) => form.setData('reward', e.target.value)}
                        placeholder="Sonucun hayatına katacağı değeri yaz..."
                    />
                </Field>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" asChild>
                    <Link href={goal ? route('goals.show', goal.id) : route('goals.index')}>Vazgeç</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="animate-spin" />}
                    {goal ? 'Değişiklikleri kaydet' : 'Hedefi oluştur'}
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
