import { motion } from 'framer-motion'
import { Logo } from '~/components/logo'
import { cn } from '~/lib/utils'

interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'pulse' | 'rotate' | 'bounce'
}

export function LogoSpinner({
  size = 'md',
  className,
  variant = 'pulse',
}: LogoSpinnerProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-32 w-32',
  }

  const animations = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    rotate: {
      rotate: [0, 360],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Background glow effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={cn(
          'absolute inset-0 bg-primary/20 rounded-full blur-xl',
          sizeMap[size],
        )}
      />

      <motion.div animate={animations[variant]} className={sizeMap[size]}>
        <Logo variant="icon" className="h-full w-full" />
      </motion.div>
    </div>
  )
}
