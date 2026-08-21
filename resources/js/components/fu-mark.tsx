import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

type FuMarkProps = Omit<ComponentProps<'img'>, 'alt' | 'src'> & {
    label?: string;
};

export default function FuMark({ className, label = 'fu', ...props }: FuMarkProps) {
    return <img {...props} src="/fuevor-favicon.svg?v=4" alt={label} className={cn('shrink-0', className)} draggable={false} />;
}
