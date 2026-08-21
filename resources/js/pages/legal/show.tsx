import BrandLogo from '@/components/brand-logo';
import LegalDocumentContent from '@/components/legal-document-content';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function LegalDocumentPage({ document }: { document: 'terms' | 'privacy' }) {
    const title = document === 'terms' ? 'Kullanıcı Sözleşmesi ve Kullanım Koşulları' : 'KVKK ve Gizlilik Politikası';

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 dark:bg-slate-950">
            <Head title={title} />
            <main className="mx-auto max-w-3xl">
                <nav className="mb-6 flex items-center justify-between gap-4">
                    <Link
                        href={route('home')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#007aff] dark:text-slate-300"
                    >
                        <ArrowLeft className="size-4" />
                        Fuevor’a dön
                    </Link>
                    <span className="relative h-9 w-28">
                        <BrandLogo className="absolute inset-0 size-full" />
                        <img
                            src="/fuevor-beta-text.svg"
                            alt="Beta"
                            className="pointer-events-none absolute top-0 right-1 h-2.5 w-auto select-none"
                            draggable={false}
                        />
                    </span>
                </nav>

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                    <LegalDocumentContent document={document} />
                </div>

                <footer className="py-6 text-center text-xs text-slate-500">© 2026 Fuevor · Said Enes Akdaş - AES Insight</footer>
            </main>
        </div>
    );
}
