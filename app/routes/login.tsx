import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { LanguageSwitcher } from '~/components/ui/language-switcher'
import { Logo } from '~/components/logo'
import { loginFn } from '~/features/auth/server'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '~/components/ui/card'
import { Field, FieldContent } from '~/components/ui/field'

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

    try {
      const result = await loginFn({
        data: {
          email,
          password,
        },
      })

      if (!result.success) {
        // Ideally we map error codes, but for now we fallback to the translated default or display the server error
        // If the server error is "Login failed", we use the key.
        // Map error codes or use the key if it looks like a translation key
        const errorKey = result.error || 'login.errors.default'
        const errorMessage = errorKey.includes('.') ? t(errorKey) : errorKey

        setError(
          result.error === 'Login failed'
            ? t('login.errors.default')
            : errorMessage,
        )
      } else {
        // Redirect to dashboard
        await router.invalidate()
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(t('login.errors.unexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher showLabel />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-12" />
          </div>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}

            <Field>
              <FieldContent>
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.placeholder.email')}
                  required
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldContent>
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.placeholder.password')}
                  required
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('login.submitting') : t('login.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('login.contactAdmin')}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
