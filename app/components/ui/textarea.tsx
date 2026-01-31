import * as React from 'react'

import { cn } from '~/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 focus-visible:bg-white/60 dark:focus-visible:bg-black/60 shadow-sm aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-muted/50 dark:disabled:bg-muted/80 rounded-xl border px-3 py-2.5 text-sm transition-all focus-visible:ring-2 aria-invalid:ring-1 placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
