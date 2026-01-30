import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Tractor,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { registerFn } from '~/features/auth/server'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { AuthShell } from '~/features/auth/components/AuthShell'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const { t } = useTranslation('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'farmer' | 'buyer' | 'both'>(
    'farmer',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await registerFn({
        data: {
          name,
          email,
          password,
          userType,
        },
      })

      toast.success(t('register.success', 'Account created successfully!'))

      await router.invalidate()

      // Redirect based on user type
      if (userType === 'buyer') {
        window.location.href = '/marketplace'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      const message = err.message || 'register.errors.default'
      const errorMessage = message.includes('.') ? t(message) : message
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('register.title', 'Create Account')}
      subtitle={t('register.description', 'Join the future of farming')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 text-sm font-medium border-l-2 bg-red-500/5 text-red-500 border-red-500 rounded-r-md">
            <AlertCircle className="size-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-mono uppercase tracking-wider opacity-70"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('register.name', 'Full Name')}
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('register.placeholder.name', 'John Doe')}
              required
              disabled={isLoading}
              className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-mono uppercase tracking-wider opacity-70"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('login.email', 'Email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.placeholder.email', 'm@example.com')}
              required
              disabled={isLoading}
              className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-mono uppercase tracking-wider opacity-70"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('login.password', 'Password')}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.placeholder.password', '••••••••')}
              required
              disabled={isLoading}
              className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              className="text-xs font-mono uppercase tracking-wider opacity-70"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('register.userType', 'I am a')}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserType('farmer')}
                disabled={isLoading}
                className={`h-12 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'farmer'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={
                  userType !== 'farmer'
                    ? { color: 'var(--text-landing-primary)' }
                    : undefined
                }
              >
                <Tractor className="w-4 h-4" />
                {t('register.farmer', 'Farmer')}
              </button>
              <button
                type="button"
                onClick={() => setUserType('buyer')}
                disabled={isLoading}
                className={`h-12 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'buyer'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={
                  userType !== 'buyer'
                    ? { color: 'var(--text-landing-primary)' }
                    : undefined
                }
              >
                <ShoppingCart className="w-4 h-4" />
                {t('register.buyer', 'Buyer')}
              </button>
              <button
                type="button"
                onClick={() => setUserType('both')}
                disabled={isLoading}
                className={`h-12 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'both'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={
                  userType !== 'both'
                    ? { color: 'var(--text-landing-primary)' }
                    : undefined
                }
              >
                <Users className="w-4 h-4" />
                {t('register.both', 'Both')}
              </button>
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {userType === 'farmer' &&
                t('register.farmerDesc', 'Manage your farm and sell livestock')}
              {userType === 'buyer' &&
                t('register.buyerDesc', 'Browse and purchase livestock')}
              {userType === 'both' &&
                t('register.bothDesc', 'Full access to all features')}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />{' '}
              {t('register.submitting', 'Creating account...')}
            </>
          ) : (
            <>
              {t('register.submit', 'Create Account')}{' '}
              <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
            </>
          )}
        </Button>

        <div className="text-center pt-2">
          <p
            className="text-sm"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            {t('register.haveAccount', 'Already have an account?')}{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline underline-offset-4 transition-all"
            >
              {t('login.submit', 'Sign In')}
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
