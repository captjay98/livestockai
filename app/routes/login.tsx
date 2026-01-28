import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { loginFn } from '~/features/auth/server'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { AuthShell } from '~/features/auth/components/AuthShell'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const router = useRouter()
    const { t } = useTranslation('auth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        console.log('[LOGIN DEBUG] Attempting login for:', email)
        console.log('[LOGIN DEBUG] Password length:', password.length)

        try {
            const result = await loginFn({
                data: {
                    email,
                    password,
                },
            })

            console.log('[LOGIN DEBUG] Login result:', result)

            await router.invalidate()
            window.location.href = '/dashboard'
        } catch (err: any) {
            console.error('[LOGIN DEBUG] Login error:', err)
            console.error('[LOGIN DEBUG] Error type:', typeof err)
            console.error('[LOGIN DEBUG] Error keys:', Object.keys(err || {}))
            console.error(
                '[LOGIN DEBUG] Full error object:',
                JSON.stringify(err, null, 2),
            )

            // Attempt to extract meaningful error message
            const message = err.message || err.region || 'login.errors.default'
            const errorMessage = message.includes('.') ? t(message) : message

            console.error('[LOGIN DEBUG] Extracted message:', message)
            console.error('[LOGIN DEBUG] Final error message:', errorMessage)

            setError(
                message === 'Invalid email or password'
                    ? t('login.errors.invalid_credentials')
                    : errorMessage,
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthShell
            title={t('login.title', 'Welcome Back')}
            subtitle={t('login.description')}
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
                            htmlFor="email"
                            className="text-xs font-mono uppercase tracking-wider opacity-70"
                            style={{ color: 'var(--text-landing-secondary)' }}
                        >
                            {t('login.email')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.placeholder.email')}
                            required
                            disabled={isLoading}
                            className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium"
                            style={{ color: 'var(--text-landing-primary)' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="password"
                                className="text-xs font-mono uppercase tracking-wider opacity-70"
                                style={{
                                    color: 'var(--text-landing-secondary)',
                                }}
                            >
                                {t('login.password')}
                            </Label>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('login.placeholder.password')}
                            required
                            disabled={isLoading}
                            className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium"
                            style={{ color: 'var(--text-landing-primary)' }}
                        />
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
                            {t('login.submitting')}
                        </>
                    ) : (
                        <>
                            {t('login.submit')}{' '}
                            <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
                        </>
                    )}
                </Button>

                <div className="text-center pt-2">
                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-landing-secondary)' }}
                    >
                        {t('login.noAccount')}{' '}
                        <Link
                            to="/register"
                            className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline underline-offset-4 transition-all"
                        >
                            {t('login.createAccount')}
                        </Link>
                    </p>
                </div>
            </form>
        </AuthShell>
    )
}
