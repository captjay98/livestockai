import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const buttonVariants = cva(
    "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-xs font-medium focus-visible:ring-1 aria-invalid:ring-1 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground depth-3d hover:depth-3d-hover active:depth-3d-active [a]:hover:bg-primary/80 dark:shadow-none',
                outline:
                    'glass dark:glass-dark hover:bg-muted hover:text-foreground dark:hover:bg-input/50 active:scale-[0.98] transition-all',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80 depth-3d hover:depth-3d-hover active:depth-3d-active',
                ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 depth-3d hover:depth-3d-hover active:depth-3d-active',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default:
                    'h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
                xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1.5 rounded-md px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
                lg: 'h-11 gap-2 px-8 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
                icon: 'size-10',
                'icon-xs':
                    "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
                'icon-sm': 'size-8 rounded-md',
                'icon-lg': 'size-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

interface ButtonProps
    extends
        Omit<ButtonPrimitive.Props, 'className'>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    className?: string
    children?: React.ReactNode
    type?: 'button' | 'submit' | 'reset'
}

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    children,
    ...props
}: ButtonProps) {
    // If asChild is true, render the child element with button styles
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            className: cn(
                buttonVariants({ variant, size }),
                (children as React.ReactElement<any>).props.className,
                className,
            ),
            ...props,
        })
    }

    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {children}
        </ButtonPrimitive>
    )
}

export { Button, buttonVariants }
