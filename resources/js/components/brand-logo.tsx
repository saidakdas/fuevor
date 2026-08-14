import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

type BrandLogoVariant = 'adaptive' | 'black' | 'color' | 'white';

type BrandLogoProps = Omit<ComponentProps<'span'>, 'children'> & {
    alt?: string;
    variant?: BrandLogoVariant;
};

const logoSources: Record<Exclude<BrandLogoVariant, 'adaptive'>, string> = {
    black: '/fuevor-black-logo.svg?v=2',
    color: '/fuevor-color-logo.svg?v=2',
    white: '/fuevor-white-logo.svg?v=2',
};

export default function BrandLogo({ alt = 'Fuevor', className, variant = 'adaptive', ...props }: BrandLogoProps) {
    const accessibilityProps = alt ? { 'aria-label': alt, role: 'img' } : { 'aria-hidden': true };

    return (
        <span {...props} {...accessibilityProps} className={cn('inline-grid shrink-0 place-items-center overflow-hidden', className)}>
            {variant === 'adaptive' ? (
                <>
                    <img
                        src={logoSources.black}
                        alt=""
                        aria-hidden="true"
                        className="col-start-1 row-start-1 h-full w-full object-contain dark:hidden"
                        draggable={false}
                    />
                    <img
                        src={logoSources.white}
                        alt=""
                        aria-hidden="true"
                        className="col-start-1 row-start-1 hidden h-full w-full object-contain dark:block"
                        draggable={false}
                    />
                </>
            ) : (
                <img src={logoSources[variant]} alt="" aria-hidden="true" className="h-full w-full object-contain" draggable={false} />
            )}
        </span>
    );
}
