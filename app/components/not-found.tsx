import { Link } from '@tanstack/react-router'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'

export function NotFoundPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-6">
            <div className="mb-8">
                <img src="/logo-wordmark.png" alt="JayFarms" className="h-20" />
            </div>

            {/* 404 Visual */}
            <div className="relative mb-8">
                <div className="text-[10rem] md:text-[14rem] font-black text-muted-foreground/10 leading-none select-none">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="h-20 w-20 md:h-28 md:w-28 text-muted-foreground/40" />
                </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-center">
                Page Not Found
            </h1>
            <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
                Oops! The page you're looking for doesn't exist or may have been moved.
                Let's get you back on track.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="default" size="lg">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Go to Dashboard
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link to="/" onClick={() => window.history.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Link>
                </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground mt-12">
                Need help? Contact your farm administrator.
            </p>
        </div>
    )
}
