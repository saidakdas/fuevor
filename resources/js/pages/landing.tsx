import BrandLogo from '@/components/brand-logo';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Compass, LogIn, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
    { desktop: '/landing/mockups/desktop-1.webp', phones: ['/landing/mockups/phone-1.svg', '/landing/mockups/phone-2.svg'] },
    { desktop: '/landing/mockups/desktop-2.webp', phones: ['/landing/mockups/phone-3.svg', '/landing/mockups/phone-4.svg'] },
    { desktop: '/landing/mockups/desktop-3.webp', phones: ['/landing/mockups/phone-5.svg', '/landing/mockups/phone-1.svg'] },
    { desktop: '/landing/mockups/desktop-4.webp', phones: ['/landing/mockups/phone-2.svg', '/landing/mockups/phone-3.svg'] },
];

export default function Landing() {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5_000);
        return () => window.clearInterval(timer);
    }, []);

    const slide = slides[activeSlide];

    return (
        <>
            <Head title="Gelecekteki Kendini İnşa Et">
                <meta
                    name="description"
                    content="Fuevor ile hedeflerini yapı taşlarına ayır, 20/80 odağını bul ve gelecekteki kendini adım adım inşa et."
                />
            </Head>

            <main className="relative min-h-svh overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
                <div className="pointer-events-none absolute -top-48 -right-32 size-[34rem] rounded-full bg-[#7ed957]/15 blur-[110px]" />
                <div className="pointer-events-none absolute -bottom-56 -left-40 size-[38rem] rounded-full bg-[#007aff]/12 blur-[130px]" />

                <div className="relative mx-auto grid min-h-svh max-w-[1600px] grid-cols-[minmax(0,1fr)] items-center gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:px-12 lg:py-10 xl:px-16">
                    <section className="order-2 min-w-0 lg:order-1" aria-label="Fuevor uygulama önizlemeleri">
                        <div className="relative mx-auto hidden aspect-[1.2/1] w-full max-w-[920px] lg:block">
                            <div className="absolute inset-x-[3%] top-[14%] transition-all duration-700 ease-out">
                                <img
                                    key={slide.desktop}
                                    src={slide.desktop}
                                    alt="Fuevor bilgisayar görünümü"
                                    className="landing-device-enter w-full drop-shadow-[0_34px_42px_rgba(0,0,0,0.18)]"
                                />
                            </div>
                            <img
                                key={slide.phones[0]}
                                src={slide.phones[0]}
                                alt="Fuevor mobil görünümü"
                                className="landing-phone-enter absolute bottom-[1%] left-[1%] z-10 h-[70%] w-auto -rotate-[5deg] drop-shadow-[0_28px_35px_rgba(0,0,0,0.22)]"
                            />
                            <img
                                key={slide.phones[1]}
                                src={slide.phones[1]}
                                alt="Fuevor mobil görünümü"
                                className="landing-phone-enter absolute right-[1%] bottom-[1%] z-10 h-[66%] w-auto rotate-[5deg] drop-shadow-[0_28px_35px_rgba(0,0,0,0.22)]"
                            />
                        </div>

                        <div className="mx-auto w-full max-w-[370px] lg:hidden">
                            <div className="relative mx-auto h-[46svh] max-h-[610px] min-h-[390px]">
                                <img
                                    key={slide.phones[0]}
                                    src={slide.phones[0]}
                                    alt="Fuevor mobil uygulama görünümü"
                                    className="landing-phone-enter absolute inset-0 mx-auto h-full w-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.2)]"
                                />
                            </div>
                        </div>

                        <div className="mt-3 flex justify-center gap-2 lg:mt-0" aria-label="Önizleme seçimi">
                            {slides.map((item, index) => (
                                <button
                                    key={item.desktop}
                                    type="button"
                                    onClick={() => setActiveSlide(index)}
                                    className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-[#1d1d1f]' : 'w-1.5 bg-[#c7c7cc] hover:bg-[#8e8e93]'}`}
                                    aria-label={`${index + 1}. önizlemeyi göster`}
                                    aria-current={index === activeSlide ? 'true' : undefined}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="order-1 mx-auto w-full max-w-xl min-w-0 lg:order-2 lg:pr-4">
                        <div className="flex items-center justify-between gap-4">
                            <BrandLogo variant="black" className="h-12 w-36 sm:h-14 sm:w-44" />
                            <span className="rounded-full border border-[#7ed957]/35 bg-[#7ed957]/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#248a3d] uppercase">
                                Canlı Beta
                            </span>
                        </div>

                        <p className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[#007aff] uppercase sm:mt-10">
                            <Sparkles className="size-4" /> Build Your Future Self
                        </p>
                        <h1 className="mt-3 max-w-[12ch] text-[44px] leading-[0.98] font-semibold tracking-[-0.06em] sm:text-[58px] lg:text-[68px] xl:text-[76px]">
                            Gelecekteki kendini inşa et.
                        </h1>
                        <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#6e6e73] sm:text-[17px]">
                            Hedefini belirle, yapı taşlarına ayır, planla ve gerçekten fark yaratan %20’ye odaklan. Fuevor gelişimini tek bir yol
                            haritasında görünür kılar.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:mt-9">
                            <Link
                                href="/register"
                                className="group flex h-14 items-center justify-between rounded-full bg-[#007aff] px-6 text-[14px] font-semibold text-white shadow-[0_14px_32px_rgba(0,122,255,0.24)] transition hover:bg-[#006ee6] active:scale-[0.985] sm:col-span-2"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Sparkles className="size-4" /> Erken Erişime Katıl
                                </span>
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/login"
                                className="flex h-13 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.045)] transition hover:bg-[#fafafa] active:scale-[0.985]"
                            >
                                <LogIn className="size-4 text-[#007aff]" /> Giriş Yap
                            </Link>
                            <Link
                                href="/kesfet"
                                className="flex h-13 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.045)] transition hover:bg-[#fafafa] active:scale-[0.985]"
                            >
                                <Compass className="size-4 text-[#007aff]" /> Fuevor’u Keşfet
                            </Link>
                        </div>

                        <div className="mt-5 flex items-center gap-4 rounded-[22px] border border-[#d2aa3f]/20 bg-white/80 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-4">
                            <img src="/fuevor-first-builder.svg" alt="First Builder rozeti" className="size-14 shrink-0 sm:size-16" />
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-[12px] font-semibold sm:text-[13px]">
                                    <BadgeCheck className="size-4 text-[#ad8120]" /> İlk 100 kullanıcıya özel
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-[#6e6e73] sm:text-[11px]">
                                    Erken erişimin ilk 100 üyesi kalıcı First Builder rozetiyle Fuevor tarihindeki yerini alır.
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-center text-[10px] text-[#8e8e93] sm:text-left">Ücretsiz canlı beta · Verilerin ana sürüme taşınır</p>
                    </section>
                </div>

                <style>{`
                    @keyframes landing-device-enter {
                        from { opacity: 0; transform: translateY(12px) scale(.985); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes landing-phone-enter {
                        from { opacity: 0; transform: translateY(18px) scale(.96); }
                        to { opacity: 1; }
                    }
                    .landing-device-enter { animation: landing-device-enter .7s cubic-bezier(.22,.8,.3,1) both; }
                    .landing-phone-enter { animation: landing-phone-enter .65s cubic-bezier(.22,.8,.3,1) both; }
                    @media (prefers-reduced-motion: reduce) {
                        .landing-device-enter, .landing-phone-enter { animation: none; }
                    }
                `}</style>
            </main>
        </>
    );
}
