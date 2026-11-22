import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({
    className,
    size = 'default',
    ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
    return (
        <div
            data-slot="card"
            data-size={size}
            className={cn(
                'ring-foreground/10 bg-card text-card-foreground group/card flex flex-col gap-4 overflow-hidden rounded-xl py-5 text-sm shadow-xs ring-1 data-[size=sm]:gap-3 data-[size=sm]:py-4',
                className,
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                'grid auto-rows-min items-start gap-1.5 px-5 group-data-[size=sm]/card:px-4',
                className,
            )}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-title"
            className={cn('text-base leading-snug font-semibold', className)}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-description"
            className={cn('text-muted-foreground text-sm', className)}
            {...props}
        />
    )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-content"
            className={cn('px-5 group-data-[size=sm]/card:px-4', className)}
            {...props}
        />
    )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn('flex items-center px-5 group-data-[size=sm]/card:px-4', className)}
            {...props}
        />
    )
}

export {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
}
