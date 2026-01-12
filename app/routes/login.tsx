import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Logo } from '~/components/logo'
import { loginFn } from '~/lib/auth/server'
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
        setError(result.error || 'Login failed')
      } else {
        // Redirect to dashboard
        await router.invalidate()
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-12" />
          </div>
          <CardDescription>Sign in to manage your farm</CardDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldContent>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Contact your administrator if you need an account
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
