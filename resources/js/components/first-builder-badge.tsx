import BrandLogo from '@/components/brand-logo';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Translate = (turkish: string, english: string) => string;

export default function FirstBuilderBadge({
    number,
    t,
    className = '',
    sizeClassName = 'size-11',
}: {
    number: number;
    t: Translate;
    className?: string;
    sizeClassName?: string;
}) {
    const [open, setOpen] = useState(false);
    const formattedNumber = String(number).padStart(3, '0');

    useEffect(() => {
        if (!open) return;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen(true);
                }}
                className={`${className} ${sizeClassName} grid shrink-0 place-items-center rounded-full transition hover:scale-105 active:scale-95`}
                aria-label={t(`First Builder rozeti #${formattedNumber}`, `First Builder badge #${formattedNumber}`)}
            >
                <img src="/fuevor-first-builder.svg" alt="" className="size-full rounded-full object-contain" draggable={false} />
            </button>

            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[140] grid place-items-center bg-black/35 p-5 backdrop-blur-[5px]"
                        role="presentation"
                        onMouseDown={() => setOpen(false)}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-label={t(`First Builder #${formattedNumber}`, `First Builder #${formattedNumber}`)}
                            onMouseDown={(event) => event.stopPropagation()}
                            className="relative w-full max-w-md rounded-[30px] border border-white/65 bg-white px-6 py-8 text-center text-[#1d1d1f] shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10"
                        >
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-black/[0.055] text-[#6e6e73] transition hover:bg-black/[0.09] active:scale-95"
                                aria-label={t('Rozet penceresini kapat', 'Close badge dialog')}
                            >
                                <X className="size-5" />
                            </button>

                            <img
                                src="/fuevor-first-builder.svg"
                                alt=""
                                className="mx-auto size-24 rounded-full object-contain shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
                                draggable={false}
                            />

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                                <span className="relative block h-9 w-28 shrink-0" aria-label="Fuevor">
                                    <BrandLogo variant="black" className="absolute inset-0 size-full" />
                                </span>
                                <span className="h-8 w-px bg-black/[0.12]" aria-hidden="true" />
                                <h2 className="text-[21px] font-semibold tracking-[-0.035em] sm:text-[23px]">
                                    First Builder <span className="tabular-nums">#{formattedNumber}</span>
                                </h2>
                            </div>

                            <p className="mt-5 text-[14px] leading-6 font-light text-[#7ed957]">
                                {t('Fuevor’un kurucu üyelerine teşekkür ederiz.', 'Thank you to Fuevor’s founding members.')}
                            </p>
                        </section>
                    </div>,
                    document.body,
                )}
        </>
    );
}
