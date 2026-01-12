import { Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Logo } from '~/components/logo'

interface ErrorPageProps {
  error?: Error
  reset?: () => void
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()

  const handleRetry = () => {
    if (reset) {
      reset()
    } else {
      router.invalidate()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-6">
      {/* Brand Header */}
      <div className="mb-8">
        <Logo className="h-20" />
      </div>

      {/* Error Visual */}
      <div className="relative mb-8">
        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
          <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 text-destructive" />
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-center">
        Something Went Wrong
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-4 leading-relaxed">
        We encountered an unexpected error. Don't worry, your data is safe.
        Please try again or return to the dashboard.
      </p>

      {/* Error Details (dev only) */}
      {error && process.env.NODE_ENV === 'development' && (
        <div className="mb-6 max-w-lg w-full">
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              Show error details
            </summary>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg border text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              {error.message}
            </div>
          </details>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleRetry}
          variant="default"
          size="lg"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-12">
        If this problem persists, please contact support.
      </p>
    </div>
  )
}
