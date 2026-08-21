import { Bell, Check, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Translate } from '@/i18n';

type DemoNotification = {
    id: number;
    type: 'team_invite' | 'team_member_invited' | 'team_member_removed';
    message: string;
    data: { teamName?: string };
    readAt?: string;
    actedAt?: string;
    createdAt?: string;
};

export default function DemoNotifications({ t, username, variant = 'card' }: { t: Translate; username: string; variant?: 'card' | 'icon' }) {
    const [notifications, setNotifications] = useState<DemoNotification[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const normalizedUsername = username.trim().replace(/^@+/, '').toLocaleLowerCase('tr-TR');

    useEffect(() => {
        if (!normalizedUsername) return;
        let cancelled = false;

        const load = async () => {
            try {
                const response = await fetch(`/demo/notifications?username=${encodeURIComponent(normalizedUsername)}`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) return;
                const result = (await response.json()) as { notifications?: DemoNotification[] };
                if (!cancelled) setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
            } catch {
                // Notifications remain empty while the local demo server is unavailable.
            }
        };

        void load();
        const timer = window.setInterval(() => void load(), 1500);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [normalizedUsername]);

    const act = async (notification: DemoNotification, action: 'accept' | 'reject' | 'read') => {
        setProcessingId(notification.id);
        try {
            const response = await fetch(`/demo/notifications/${notification.id}/${action}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: requestHeaders(),
                body: JSON.stringify({ username: normalizedUsername }),
            });
            if (!response.ok) return;
            const result = (await response.json()) as { notification?: DemoNotification };
            if (result.notification) {
                setNotifications((current) => current.map((item) => (item.id === result.notification?.id ? result.notification : item)));
            }
        } finally {
            setProcessingId(null);
        }
    };

    const unreadCount = notifications.filter((notification) => !notification.readAt).length;
    const notificationList =
        notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12px] leading-5 text-[#8e8e93]">
                {t('Yeni bildirimin yok.', 'You have no new notifications.')}
            </p>
        ) : (
            notifications.slice(0, 6).map((notification, index) => {
                const pendingInvitation = notification.type === 'team_invite' && !notification.actedAt;
                return (
                    <div key={notification.id} className={`px-5 py-4 ${index !== 0 ? 'border-t border-black/[0.045]' : ''}`}>
                        <div className="flex gap-3">
                            <span
                                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${pendingInvitation ? 'bg-[#5856d6]/10 text-[#5856d6]' : 'bg-[#f2f2f7] text-[#6e6e73]'}`}
                            >
                                <UserPlus className="size-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] leading-5 font-medium text-[#3a3a3c]">{notification.message}</p>
                                {pendingInvitation ? (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            disabled={processingId === notification.id}
                                            onClick={() => void act(notification, 'accept')}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#007aff] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
                                        >
                                            <Check className="size-3.5" /> {t('Kabul Et', 'Accept')}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processingId === notification.id}
                                            onClick={() => void act(notification, 'reject')}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f2f2f7] px-3 text-[10px] font-semibold text-[#6e6e73] disabled:opacity-50"
                                        >
                                            <X className="size-3.5" /> {t('Reddet', 'Reject')}
                                        </button>
                                    </div>
                                ) : notification.type === 'team_invite' ? (
                                    <p className="mt-2 text-[10px] font-semibold text-[#34c759]">{t('Yanıtlandı', 'Answered')}</p>
                                ) : !notification.readAt ? (
                                    <button
                                        type="button"
                                        onClick={() => void act(notification, 'read')}
                                        className="mt-2 text-[10px] font-semibold text-[#007aff]"
                                    >
                                        {t('Okundu olarak işaretle', 'Mark as read')}
                                    </button>
                                ) : null}
                            </div>
                            {!notification.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-[#007aff]" />}
                        </div>
                    </div>
                );
            })
        );

    if (variant === 'icon') {
        return (
            <div className="relative">
                {open && (
                    <button
                        type="button"
                        className="fixed inset-0 z-20 cursor-default"
                        onClick={() => setOpen(false)}
                        aria-label={t('Bildirimleri kapat', 'Close notifications')}
                    />
                )}
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') setOpen(false);
                    }}
                    className="relative z-30 grid size-12 place-items-center rounded-full border border-black/[0.07] bg-white text-[#1d1d1f] shadow-[0_5px_18px_rgba(0,0,0,0.06)] transition hover:bg-[#fbfbfd] active:scale-[0.96]"
                    aria-label={t('Bildirimler', 'Notifications')}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    <Bell className="size-[19px]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#f5f5f7] bg-[#ff3b30] px-1 text-[9px] leading-none font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {open && (
                    <section
                        role="dialog"
                        aria-label={t('Bildirimler', 'Notifications')}
                        className="demo-step-enter absolute top-[calc(100%+0.65rem)] -right-[3.625rem] z-30 max-h-[min(28rem,65svh)] w-[calc(100vw-2.5rem)] max-w-[22rem] overflow-y-auto rounded-[22px] border border-black/[0.07] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:right-0"
                    >
                        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-black/[0.055] bg-white/95 px-5 py-4 backdrop-blur-xl">
                            <h2 className="text-[16px] font-semibold tracking-[-0.02em]">{t('Bildirimler', 'Notifications')}</h2>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-[#ff3b30] px-2.5 py-1 text-[10px] font-semibold text-white">{unreadCount}</span>
                            )}
                        </div>
                        {notificationList}
                    </section>
                )}
            </div>
        );
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.045)]">
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.055] px-5 py-5">
                <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-[#007aff]/10 text-[#007aff]">
                        <Bell className="size-4" />
                    </span>
                    <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Bildirimler', 'Notifications')}</h2>
                </div>
                {unreadCount > 0 && <span className="rounded-full bg-[#ff3b30] px-2.5 py-1 text-[10px] font-semibold text-white">{unreadCount}</span>}
            </div>
            {notificationList}
        </section>
    );
}

function requestHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
    };
}
