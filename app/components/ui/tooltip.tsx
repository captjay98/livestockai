import * as React from 'react'
import { cn } from '~/lib/utils'

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(
                        child as React.ReactElement<any>,
                        {
                            'data-state': open ? 'delayed-open' : 'closed',
                            open,
                        },
                    )
                }
                return child
            })}
        </div>
    )
}

const TooltipTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
    <button ref={ref} className={cn(className)} {...props} />
))
TooltipTrigger.displayName = 'TooltipTrigger'

const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        sideOffset?: number
        open?: boolean
    }
>(({ className, sideOffset = 4, open, ...props }, ref) => {
    if (!open) return null
    return (
        <div
            ref={ref}
            className={cn(
                'absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                'bottom-full left-1/2 -translate-x-1/2 mb-2', // Default to top
                className,
            )}
            {...props}
        />
    )
})
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
