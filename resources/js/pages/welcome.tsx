import { Button } from '@/components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Layers3, Sparkles, Target } from 'lucide-react';

export default function Welcome() {
    const user = (usePage().props.auth as { user?: { id: number } } | undefined)?.user;
    return (
        <>
            <Head title="Hedeflerini gerçeğe dönüştür" />
            <div className="min-h-screen overflow-hidden bg-[#fafafa] text-slate-950">
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-violet-600 font-black text-white shadow-lg shadow-violet-200">
                            F
                        </span>
                        <span className="text-xl font-bold tracking-tight">Fuevor</span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        {user ? (
                            <Button asChild>
                                <Link href={route('dashboard')}>
                                    Panele git <ArrowRight />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href={route('login')}>Giriş yap</Link>
                                </Button>
                                <Button asChild>
                                    <Link href={route('register')}>Ücretsiz başla</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </header>
                <main>
                    <section className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
                        <div className="pointer-events-none absolute top-0 -left-64 size-[34rem] rounded-full bg-violet-200/40 blur-3xl" />
                        <div className="relative">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                                <Sparkles className="size-3.5" />
                                Fikrinden sonuca, tek bir odak alanı
                            </div>
                            <h1 className="max-w-3xl text-5xl leading-[1.05] font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                                Hedeflerini
                                <br />
                                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                                    görünür ilerlemeye
                                </span>{' '}
                                dönüştür.
                            </h1>
                            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                                Fuevor, büyük hedeflerini kilometre taşlarına ve tamamlanabilir görevlere ayırır. Ne kadar yol aldığını her an net
                                biçimde görürsün.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Button size="lg" className="h-12 px-6 shadow-lg shadow-violet-200" asChild>
                                    <Link href={user ? route('dashboard') : route('register')}>
                                        {user ? 'Panele dön' : 'İlk hedefini oluştur'} <ArrowRight />
                                    </Link>
                                </Button>
                                {!user && (
                                    <Button size="lg" variant="outline" className="h-12 bg-white" asChild>
                                        <Link href={route('login')}>Hesabım var</Link>
                                    </Button>
                                )}
                            </div>
                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    Sade ve odaklı
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    Her cihazda erişilebilir
                                </span>
                            </div>
                        </div>
                        <div className="relative mx-auto w-full max-w-xl">
                            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-200/60 to-indigo-100/30 blur-2xl" />
                            <div className="relative rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-300/50 backdrop-blur md:p-7">
                                <div className="mb-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-violet-600">AKTİF HEDEF</p>
                                        <h2 className="mt-1 text-xl font-bold">Yeni bir dil öğren</h2>
                                    </div>
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">%68</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" />
                                </div>
                                <div className="mt-7 space-y-3">
                                    <Preview done title="Temel seviyeyi tamamla" />
                                    <Preview done title="İlk 1000 kelime" />
                                    <Preview title="Haftalık konuşma pratiği" active />
                                    <Preview title="B2 sınavına hazırlan" />
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <Target className="mb-3 size-5 text-violet-600" />
                                        <p className="text-2xl font-bold">4</p>
                                        <p className="text-xs text-slate-500">Kilometre taşı</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <Layers3 className="mb-3 size-5 text-indigo-600" />
                                        <p className="text-2xl font-bold">17</p>
                                        <p className="text-xs text-slate-500">Tamamlanan görev</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <footer className="border-t bg-white px-5 py-8 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} Fuevor. Hedeflerine alan aç.
                </footer>
            </div>
        </>
    );
}
function Preview({ title, done = false, active = false }: { title: string; done?: boolean; active?: boolean }) {
    return (
        <div className={`flex items-center gap-3 rounded-xl border p-3.5 ${active ? 'border-violet-200 bg-violet-50' : 'border-slate-100'}`}>
            <span
                className={`grid size-6 place-items-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'border-2 border-violet-500' : 'border-2 border-slate-200'}`}
            >
                {done && <CheckCircle2 className="size-4" />}
            </span>
            <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{title}</span>
        </div>
    );
}
