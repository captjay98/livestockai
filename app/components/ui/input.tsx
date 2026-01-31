import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '~/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 focus-visible:bg-white/60 dark:focus-visible:bg-black/60 shadow-sm aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-muted/50 dark:disabled:bg-muted/80 h-10 rounded-xl px-3 py-2 text-sm transition-all file:h-7 file:text-sm file:font-medium focus-visible:ring-2 aria-invalid:ring-1 file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
