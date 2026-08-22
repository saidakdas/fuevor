import BrandLogo from '@/components/brand-logo';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, BookOpen, CircleCheck, Compass, Lightbulb, LogIn, MessageCircle, Sparkles, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
    { desktop: '/landing/mockups/desktop-1.webp', phones: ['/landing/mockups/phone-1.svg', '/landing/mockups/phone-2.svg'] },
    { desktop: '/landing/mockups/desktop-2.webp', phones: ['/landing/mockups/phone-3.svg', '/landing/mockups/phone-4.svg'] },
    { desktop: '/landing/mockups/desktop-3.webp', phones: ['/landing/mockups/phone-5.svg', '/landing/mockups/phone-1.svg'] },
    { desktop: '/landing/mockups/desktop-4.webp', phones: ['/landing/mockups/phone-2.svg', '/landing/mockups/phone-3.svg'] },
];

const bookReviews = [
    {
        title: 'Atomik Alışkanlıklar',
        accent: '#ff9f0a',
        review: 'Büyük değişimlerin küçük ama düzenli adımlarla başladığını hatırlatıyor.',
    },
    {
        title: 'Derin Çalışma',
        accent: '#5856d6',
        review: 'Odaklanmayı bir yetenek değil, planlanabilir bir çalışma biçimi olarak ele alıyor.',
    },
    {
        title: 'İnsanın Anlam Arayışı',
        accent: '#34c759',
        review: 'Hedefin nedenini bulduğunda, ona giden yolun da değiştiğini hissettiriyor.',
    },
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

            <main className="relative overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
                <section className="relative min-h-svh overflow-hidden" aria-label="Fuevor'a giriş">
                    <div className="pointer-events-none absolute -top-48 -right-32 size-[34rem] rounded-full bg-[#7ed957]/15 blur-[110px]" />
                    <div className="pointer-events-none absolute -bottom-56 -left-40 size-[38rem] rounded-full bg-[#007aff]/12 blur-[130px]" />

                    <div className="relative mx-auto grid min-h-svh max-w-[1600px] grid-cols-[minmax(0,1fr)] items-center gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:px-12 lg:py-10 xl:px-16">
                        <section className="order-2 min-w-0 lg:order-1" aria-label="Fuevor uygulama önizlemeleri">
                            <div className="relative mx-auto hidden aspect-[1.2/1] w-full max-w-[920px] lg:block">
                                <div className="absolute inset-x-[20%] top-[29%] transition-all duration-700 ease-out">
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
                                    className="landing-phone-enter absolute top-[29%] left-0 h-[40%] w-auto -rotate-[2deg] drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]"
                                />
                                <img
                                    key={slide.phones[1]}
                                    src={slide.phones[1]}
                                    alt="Fuevor mobil görünümü"
                                    className="landing-phone-enter absolute top-[29%] right-0 h-[40%] w-auto rotate-[2deg] drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]"
                                />
                            </div>

                            <div className="mx-auto w-full max-w-[370px] lg:hidden">
                                <div className="relative mx-auto h-[46svh] max-h-[610px] min-h-[390px]">
                                    <img
                                        key={slide.phones[0]}
                                        src={slide.phones[0]}
                                        alt="Fuevor mobil uygulama görünümü"
                                        className="landing-phone-enter absolute inset-0 mx-auto h-full w-auto"
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

                            <p className="mt-4 text-center text-[10px] text-[#8e8e93] sm:text-left">
                                Ücretsiz canlı beta · Verilerin ana sürüme taşınır
                            </p>
                        </section>
                    </div>
                </section>

                <section className="relative bg-[#0b0d10] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12" aria-labelledby="pareto-title">
                    <div className="pointer-events-none absolute top-0 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#007aff]/15 blur-[140px]" />
                    <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
                        <div className="max-w-xl">
                            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#64a9ff] uppercase">
                                <Sparkles className="size-4" /> 01 · Fuevor felsefesi
                            </p>
                            <h2
                                id="pareto-title"
                                className="mt-5 text-[42px] leading-[0.98] font-semibold tracking-[-0.055em] sm:text-[58px] lg:text-[68px]"
                            >
                                Daha çok şey değil, doğru şeyi yap.
                            </h2>
                            <p className="mt-7 text-[17px] leading-8 text-white/60 sm:text-[19px]">
                                Fuevor’un merkezinde 20/80 yaklaşımı var. Sonuçlarının büyük bölümünü oluşturacak az sayıdaki yapı taşını bulur,
                                enerjini gerçekten fark yaratan adımlara yönlendirirsin.
                            </p>

                            <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                {['Etkini gör', 'Önceliğini seç', 'İlerlemeni koru'].map((label) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-[12px] font-medium text-white/80"
                                    >
                                        <CircleCheck className="size-4 shrink-0 text-[#34c759]" /> {label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[42px] sm:p-5">
                            <div className="absolute top-5 left-5 z-10 rounded-full border border-white/10 bg-[#0b0d10]/80 px-4 py-2 text-[11px] font-semibold backdrop-blur-xl sm:top-8 sm:left-8">
                                20/80 Odağın
                            </div>
                            <img
                                src="/landing/mockups/desktop-1.webp"
                                alt="Fuevor 20/80 odağı ve yol haritası ekranı"
                                className="w-full"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                <section className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-12" aria-labelledby="blocks-title">
                    <div className="mx-auto grid max-w-[1300px] items-center gap-14 lg:grid-cols-2 lg:gap-24">
                        <div className="relative order-2 min-h-[500px] overflow-hidden rounded-[36px] border border-black/[0.055] bg-[linear-gradient(145deg,#eef6ff_0%,#f7f7fa_54%,#eff9ec_100%)] sm:min-h-[650px] sm:rounded-[48px] lg:order-1">
                            <div className="absolute top-8 left-6 z-10 w-[180px] rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.09)] backdrop-blur-xl sm:top-12 sm:left-10 sm:w-[220px] sm:p-5">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#007aff] uppercase">Büyük hedef</p>
                                <p className="mt-2 text-[15px] font-semibold sm:text-[17px]">Kendi işimi kurmak</p>
                                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#6e6e73]">
                                    <Target className="size-4 text-[#007aff]" /> 6 yapı taşına ayrıldı
                                </div>
                            </div>
                            <div className="absolute right-6 bottom-10 z-10 space-y-2 sm:right-10 sm:bottom-14">
                                {['Araştır', 'Planla', 'İlk adımı at'].map((label, index) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-3 rounded-full border border-white/70 bg-white/88 py-2.5 pr-4 pl-2.5 text-[11px] font-medium shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:text-[12px]"
                                    >
                                        <span className="grid size-7 place-items-center rounded-full bg-[#007aff] text-[10px] font-semibold text-white">
                                            {index + 1}
                                        </span>
                                        {label}
                                    </div>
                                ))}
                            </div>
                            <img
                                src="/landing/mockups/phone-2.svg"
                                alt="Fuevor mobil yol haritası görünümü"
                                className="absolute top-[10%] left-1/2 h-[82%] w-auto -translate-x-1/2 drop-shadow-[0_28px_38px_rgba(0,0,0,0.18)]"
                                loading="lazy"
                            />
                        </div>

                        <div className="order-1 max-w-xl lg:order-2">
                            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#007aff] uppercase">
                                <Target className="size-4" /> 02 · Yapı taşları
                            </p>
                            <h2
                                id="blocks-title"
                                className="mt-5 text-[40px] leading-[1] font-semibold tracking-[-0.055em] sm:text-[56px] lg:text-[64px]"
                            >
                                Hedefin var ama nasıl başlayacağını bilmiyor musun?
                            </h2>
                            <p className="mt-7 text-[17px] leading-8 text-[#6e6e73] sm:text-[19px]">
                                Yapı taşlarına ayırma vakti. Büyük hedefler belirsizken ağır görünür; küçük, sıralı ve tamamlanabilir adımlara
                                dönüştüğünde ise yolun görünür hâle gelir.
                            </p>
                            <p className="mt-7 border-l-2 border-[#7ed957] pl-5 text-[14px] leading-7 font-medium text-[#3a3a3c] sm:text-[15px]">
                                Bir sonraki adımını bilmek, motivasyon beklemekten daha güçlüdür.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="relative bg-[#eaf3ff] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" aria-labelledby="community-title">
                    <div className="mx-auto max-w-[1400px]">
                        <div className="mx-auto max-w-3xl text-center">
                            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#007aff] uppercase">
                                <MessageCircle className="size-4" /> 03 · Topluluk
                            </p>
                            <h2
                                id="community-title"
                                className="mt-5 text-[42px] leading-[0.98] font-semibold tracking-[-0.055em] sm:text-[60px] lg:text-[70px]"
                            >
                                Hedefini paylaş. Destek ve fikir al.
                            </h2>
                            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-8 text-[#5f6670] sm:text-[19px]">
                                Bazen devam etmek için bir kişinin “yanındayım” demesi, bazen de doğru zamanda gelen tek bir fikir yeter. Fuevor
                                Topluluğu hedefini görünür kılar; yapı taşların sana özel kalır.
                            </p>
                        </div>

                        <div className="relative mt-14 overflow-hidden rounded-[30px] border border-white/80 bg-white/55 p-3 shadow-[0_35px_90px_rgba(44,104,176,0.16)] sm:mt-18 sm:rounded-[46px] sm:p-6">
                            <div className="absolute top-5 right-5 z-10 flex gap-2 sm:top-9 sm:right-9">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#d84363] shadow-sm backdrop-blur-xl sm:text-[11px]">
                                    <CircleCheck className="size-3.5" /> Destekle
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#7257d8] shadow-sm backdrop-blur-xl sm:text-[11px]">
                                    <Lightbulb className="size-3.5" /> Fikir Ver
                                </span>
                            </div>
                            <img src="/landing/mockups/desktop-4.webp" alt="Fuevor topluluk hedef paylaşımları" className="w-full" loading="lazy" />
                        </div>
                    </div>
                </section>

                <section className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-12" aria-labelledby="library-title">
                    <div className="mx-auto grid max-w-[1300px] items-center gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
                        <div className="max-w-xl">
                            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#5856d6] uppercase">
                                <BookOpen className="size-4" /> 04 · Global Kitaplık
                            </p>
                            <h2
                                id="library-title"
                                className="mt-5 text-[42px] leading-[0.98] font-semibold tracking-[-0.055em] sm:text-[58px] lg:text-[66px]"
                            >
                                Kitaplar hakkındaki yorumlara dikkat et!
                            </h2>
                            <p className="mt-7 text-[17px] leading-8 text-[#6e6e73] sm:text-[19px]">
                                Bir kitap bazen yeni bir yapı taşı, bazen hedefini değiştirecek tek bir cümledir. Okuduklarını kaydet, puanla ve
                                topluluğun deneyimlerinden yararlan.
                            </p>
                        </div>

                        <div className="relative rounded-[36px] bg-[#15161a] p-5 text-white shadow-[0_35px_90px_rgba(0,0,0,0.18)] sm:rounded-[48px] sm:p-9">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9f9dff] uppercase">Okuyanlardan</p>
                                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] sm:text-[24px]">Kitap yorumları</p>
                                </div>
                                <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] text-white/60">Örnek topluluk yorumları</span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {bookReviews.map((book, index) => (
                                    <article
                                        key={book.title}
                                        className="grid grid-cols-[auto_1fr] gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.055] p-4 sm:p-5"
                                    >
                                        <div
                                            className="grid h-20 w-14 shrink-0 place-items-end overflow-hidden rounded-[10px] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.2)] sm:h-24 sm:w-16"
                                            style={{ background: `linear-gradient(145deg, ${book.accent}, #1d1d1f)` }}
                                        >
                                            <span className="text-[20px] font-semibold text-white/90">0{index + 1}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-[14px] font-semibold sm:text-[16px]">{book.title}</h3>
                                                <span className="text-[10px] tracking-[0.12em] text-[#ffd60a]">★★★★★</span>
                                            </div>
                                            <p className="mt-2 text-[11px] leading-5 text-white/55 sm:text-[13px] sm:leading-6">“{book.review}”</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12" aria-label="Erken erişim çağrısı">
                    <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[38px] bg-[#007aff] px-6 py-16 text-center text-white shadow-[0_28px_80px_rgba(0,122,255,0.24)] sm:rounded-[52px] sm:px-12 sm:py-24">
                        <div className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-white/20 blur-[90px]" />
                        <div className="relative mx-auto max-w-3xl">
                            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/65 uppercase">Build Your Future Self</p>
                            <h2 className="mt-5 text-[42px] leading-[0.98] font-semibold tracking-[-0.055em] sm:text-[62px]">
                                İlk yapı taşını bugün koy.
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-white/70 sm:text-[17px]">
                                Fuevor canlı betaya katıl veya dolu demo hesabında bütün deneyimi keşfet.
                            </p>
                            <div className="mx-auto mt-9 grid max-w-xl gap-3 sm:grid-cols-2">
                                <Link
                                    href="/register"
                                    className="flex h-14 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-[#007aff] transition hover:bg-[#f5f5f7] active:scale-[0.985]"
                                >
                                    <Sparkles className="size-4" /> Erken Erişime Katıl
                                </Link>
                                <Link
                                    href="/kesfet"
                                    className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-[14px] font-semibold text-white backdrop-blur-xl transition hover:bg-white/15 active:scale-[0.985]"
                                >
                                    <Compass className="size-4" /> Fuevor’u Keşfet
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="flex flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:px-10 sm:text-left lg:px-16">
                    <BrandLogo variant="black" className="h-8 w-24" />
                    <p className="text-[11px] text-[#8e8e93]">Fuevor · Build Your Future Self</p>
                </footer>

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
