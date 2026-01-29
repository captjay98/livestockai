import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface ContactSellerDialogProps {
  listingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    message: string
    contactMethod: 'app' | 'phone' | 'email'
    phone?: string
    email?: string
  }) => void
}

export function ContactSellerDialog({
  open,
  onOpenChange,
  onSubmit,
}: ContactSellerDialogProps) {
  const { t } = useTranslation('marketplace')
  const [message, setMessage] = useState('')
  const [contactMethod, setContactMethod] = useState<'app' | 'phone' | 'email'>(
    'app',
  )
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.length < 10) return

    onSubmit({
      message,
      contactMethod,
      ...(contactMethod === 'phone' && { phone }),
      ...(contactMethod === 'email' && { email }),
    })

    // Reset form
    setMessage('')
    setPhone('')
    setEmail('')
    setContactMethod('app')
  }

  const isValid =
    message.length >= 10 &&
    (contactMethod === 'app' ||
      (contactMethod === 'phone' && phone) ||
      (contactMethod === 'email' && email))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('contactSeller', { defaultValue: 'Contact Seller' })}
          </DialogTitle>
          <DialogDescription>
            {t('contactDescription', {
              defaultValue: 'Send a message to the seller about this listing.',
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">
              {t('message', { defaultValue: 'Message' })} *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder', {
                defaultValue: "Hi, I'm interested in your livestock...",
              })}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/10 minimum characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactMethod">
              {t('contactMethod', {
                defaultValue: 'Contact Method',
              })}
            </Label>
            <Select
              value={contactMethod}
              onValueChange={(value: any) => setContactMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="app">
                  {t('throughApp', {
                    defaultValue: 'Through App',
                  })}
                </SelectItem>
                <SelectItem value="phone">
                  {t('phone', { defaultValue: 'Phone' })}
                </SelectItem>
                <SelectItem value="email">
                  {t('email', { defaultValue: 'Email' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contactMethod === 'phone' && (
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('phoneNumber', {
                  defaultValue: 'Phone Number',
                })}{' '}
                *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                required
              />
            </div>
          )}

          {contactMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('emailAddress', {
                  defaultValue: 'Email Address',
                })}{' '}
                *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={!isValid}>
              {t('sendMessage', { defaultValue: 'Send Message' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
