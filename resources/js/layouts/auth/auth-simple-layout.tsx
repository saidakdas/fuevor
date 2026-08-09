import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-slate-50 p-6 md:p-10 dark:bg-slate-950">
            <div className="absolute -top-40 -left-40 size-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" />
            <div className="relative w-full max-w-md rounded-3xl border border-white bg-white/90 p-7 shadow-2xl shadow-slate-200/60 backdrop-blur md:p-10 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 grid size-11 place-items-center rounded-xl bg-violet-600 shadow-lg shadow-violet-200 dark:shadow-none">
                                <AppLogoIcon className="size-7 fill-current text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">Fuevor</span>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
