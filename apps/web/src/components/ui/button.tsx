'use client'

import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/85',
                outline:
                    'border-border bg-card shadow-xs hover:bg-muted hover:text-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-accent',
                ghost:
                    'hover:bg-muted hover:text-foreground',
                destructive:
                    'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 gap-1.5 px-3',
                xs: 'h-6 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*=\'size-\'])]:size-3',
                sm: 'h-8 gap-1.5 rounded-md px-2.5 text-xs',
                lg: 'h-10 gap-2 px-4',
                icon: 'size-9',
                'icon-sm': 'size-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

function Button({
    className,
    variant = 'default',
    size = 'default',
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
