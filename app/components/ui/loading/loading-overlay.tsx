import { AnimatePresence, motion } from 'framer-motion'
import { LogoSpinner } from './logo-spinner'
import { cn } from '~/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  message?: string
}

export function LoadingOverlay({
  isLoading,
  children,
  className,
  message = 'Loading...',
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 rounded-[inherit]"
          >
            <div className="flex flex-col items-center gap-4">
              <LogoSpinner size="md" variant="pulse" />
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-medium bg-gradient-to-r from-foreground/80 to-foreground/60 bg-clip-text text-transparent"
              >
                {message}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
