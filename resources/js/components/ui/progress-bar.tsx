import { cn } from '@/lib/utils';

export function ProgressBar({ value, className, showLabel = false }: { value: number; className?: string; showLabel?: boolean }) {
    const normalized = Math.max(0, Math.min(100, value));

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={normalized} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500" style={{ width: `${normalized}%` }} />
            </div>
            {showLabel && <span className="w-10 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">%{normalized}</span>}
        </div>
    );
}
