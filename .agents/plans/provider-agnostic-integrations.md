# Feature: Provider-Agnostic Integration System

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Refactor the integrations system to use a Laravel-style provider pattern. This allows users to swap SMS/Email providers by changing an environment variable, and technical users can add custom providers by implementing a simple interface - without modifying any core application code.

## User Story

As a farm owner deploying OpenLivestock
I want to choose my preferred SMS/Email provider
So that I can use services available in my region or that I already have accounts with

As a technical user
I want to add custom integration providers
So that I can integrate with any service without modifying core code

## Problem Statement

Current integrations are tightly coupled to specific providers (Termii for SMS, Resend for Email). Users in different regions may need different providers (Twilio in US, Africa's Talking in Kenya), and the current architecture requires code changes to switch providers.

## Solution Statement

Implement a provider pattern with:

1. **Contracts/Interfaces** - Define what any provider must implement
2. **Provider Registry** - Map provider names to implementations
3. **Facade Functions** - `sendSMS()` and `sendEmail()` that delegate to configured provider
4. **Built-in Providers** - Ship with 2 SMS (Termii, Twilio) and 2 Email (Resend, SMTP) providers
5. **Environment Config** - `SMS_PROVIDER=termii` and `EMAIL_PROVIDER=resend`

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Integrations module, Notifications, Monitoring alerts
**Dependencies**: None new (Twilio uses HTTP API, SMTP uses nodemailer)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING

- `app/features/integrations/types.ts` - Current type definitions (will extend)
- `app/features/integrations/sms/service.ts` - Current Termii implementation (will become provider)
- `app/features/integrations/email/service.ts` - Current Resend implementation (will become provider)
- `app/features/integrations/config.ts` - Integration detection (will update)
- `app/features/integrations/index.ts` - Public exports (will update)
- `app/features/integrations/server.ts` - Server functions (minimal changes)
- `app/features/notifications/schedulers.ts` (lines 1-60) - Uses sendEmail (no changes needed)
- `app/features/monitoring/alerts.ts` (lines 110-125) - Uses sendEmail (no changes needed)

### New Files to Create

```
app/features/integrations/
├── contracts.ts                    # Provider interfaces
├── sms/
│   ├── index.ts                    # SMS facade + provider registry
│   ├── providers/
│   │   ├── termii.ts               # Termii provider
│   │   └── twilio.ts               # Twilio provider
├── email/
│   ├── index.ts                    # Email facade + provider registry
│   ├── providers/
│   │   ├── resend.ts               # Resend provider
│   │   └── smtp.ts                 # SMTP provider (nodemailer)
```

### Relevant Documentation

- [Twilio SMS API](https://www.twilio.com/docs/sms/quickstart/node)
  - REST API for sending SMS
  - Why: Global SMS provider, widely available
- [Nodemailer SMTP](https://nodemailer.com/about/)
  - Universal email via SMTP
  - Why: Works with any email server (Gmail, Outlook, self-hosted)

### Patterns to Follow

**Dynamic Import Pattern (CRITICAL for Cloudflare):**

```typescript
// Always use dynamic imports inside functions
export async function sendSMS(to: string, message: string) {
  const provider = await getProvider()
  return provider.send(to, message)
}
```

**Error Handling Pattern:**

```typescript
// From current service.ts - always return result, never throw
return {
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
}
```

**Environment Detection Pattern:**

```typescript
// From config.ts
export const INTEGRATIONS = {
  email: !!process.env.RESEND_API_KEY,
  sms: !!process.env.TERMII_API_KEY,
} as const
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Contracts & Types

Create the provider interfaces that all implementations must follow.

**Tasks:**

- Define SMSProvider interface
- Define EmailProvider interface
- Define provider result types
- Update IntegrationStatus type

### Phase 2: SMS Providers

Refactor SMS to provider pattern with Termii and Twilio.

**Tasks:**

- Create Termii provider (extract from current service.ts)
- Create Twilio provider (new)
- Create SMS facade with provider registry
- Update config for SMS_PROVIDER detection

### Phase 3: Email Providers

Refactor Email to provider pattern with Resend and SMTP.

**Tasks:**

- Create Resend provider (extract from current service.ts)
- Create SMTP provider (new, using nodemailer)
- Create Email facade with provider registry
- Update config for EMAIL_PROVIDER detection

### Phase 4: Integration & Cleanup

Wire everything together and update exports.

**Tasks:**

- Update main index.ts exports
- Update vite.config.ts with new env vars
- Update .env.example with provider documentation
- Remove old service.ts files

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/features/integrations/contracts.ts`

- **IMPLEMENT**: Provider interfaces and result types

```typescript
/**
 * Result returned by all provider operations
 */
export interface ProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * SMS Provider Contract
 * Implement this interface to add a new SMS provider
 */
export interface SMSProvider {
  readonly name: string
  send(to: string, message: string): Promise<ProviderResult>
}

/**
 * Email Provider Contract
 * Implement this interface to add a new Email provider
 */
export interface EmailProvider {
  readonly name: string
  send(to: string, subject: string, html: string): Promise<ProviderResult>
}
```

- **VALIDATE**: `bun run check`

### Task 2: UPDATE `app/features/integrations/types.ts`

- **IMPLEMENT**: Add provider name to IntegrationStatus, keep existing types

```typescript
export type IntegrationType = 'email' | 'sms'

export interface IntegrationStatus {
  type: IntegrationType
  enabled: boolean
  configured: boolean
  provider?: string // ADD: which provider is active
}

// Keep existing types for backward compatibility
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface SendSMSOptions {
  to: string
  message: string
}

export interface IntegrationResult {
  success: boolean
  messageId?: string // ADD: for tracking
  error?: string
}
```

- **VALIDATE**: `bun run check`

### Task 3: CREATE `app/features/integrations/sms/providers/termii.ts`

- **IMPLEMENT**: Extract current Termii logic into provider class
- **PATTERN**: Current `sms/service.ts` implementation

```typescript
import type { SMSProvider, ProviderResult } from '../../contracts'

const TERMII_BASE_URL = 'https://v3.api.termii.com'

export class TermiiProvider implements SMSProvider {
  readonly name = 'termii'

  async send(to: string, message: string): Promise<ProviderResult> {
    const apiKey = process.env.TERMII_API_KEY
    if (!apiKey) {
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    try {
      const response = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          to,
          from: process.env.TERMII_SENDER_ID || 'OpenLvstck',
          sms: message,
          type: 'plain',
          channel: 'dnd',
        }),
      })

      const data = (await response.json()) as {
        code?: string
        message_id?: string
        message?: string
      }

      if (data.code === 'ok') {
        return { success: true, messageId: data.message_id }
      }

      return { success: false, error: data.message || 'SMS send failed' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 4: CREATE `app/features/integrations/sms/providers/twilio.ts`

- **IMPLEMENT**: Twilio provider using HTTP API (no SDK for smaller bundle)

```typescript
import type { SMSProvider, ProviderResult } from '../../contracts'

export class TwilioProvider implements SMSProvider {
  readonly name = 'twilio'

  async send(to: string, message: string): Promise<ProviderResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
      }
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message,
          }),
        },
      )

      const data = (await response.json()) as {
        sid?: string
        message?: string
        code?: number
      }

      if (response.ok && data.sid) {
        return { success: true, messageId: data.sid }
      }

      return { success: false, error: data.message || 'SMS send failed' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 5: CREATE `app/features/integrations/sms/index.ts`

- **IMPLEMENT**: SMS facade with provider registry

```typescript
import type { SMSProvider, ProviderResult } from '../contracts'
import type { SendSMSOptions, IntegrationResult } from '../types'

// Provider registry - add custom providers here
const providers: Record<string, () => Promise<SMSProvider>> = {
  termii: async () => new (await import('./providers/termii')).TermiiProvider(),
  twilio: async () => new (await import('./providers/twilio')).TwilioProvider(),
}

/**
 * Get the configured SMS provider
 */
async function getProvider(): Promise<SMSProvider | null> {
  const providerName = process.env.SMS_PROVIDER
  if (!providerName || !providers[providerName]) {
    return null
  }
  return providers[providerName]()
}

/**
 * Send SMS using the configured provider
 * This is the public API - consumers don't need to know which provider is used
 */
export async function sendSMS(
  options: SendSMSOptions,
): Promise<IntegrationResult> {
  const provider = await getProvider()
  if (!provider) {
    return {
      success: false,
      error: 'SMS provider not configured. Set SMS_PROVIDER in .env',
    }
  }
  return provider.send(options.to, options.message)
}

/**
 * Get the name of the configured SMS provider
 */
export function getSMSProviderName(): string | null {
  return process.env.SMS_PROVIDER || null
}

/**
 * Check if SMS is configured
 */
export function isSMSConfigured(): boolean {
  const providerName = process.env.SMS_PROVIDER
  return !!providerName && !!providers[providerName]
}
```

- **VALIDATE**: `bun run check`

### Task 6: CREATE `app/features/integrations/email/providers/resend.ts`

- **IMPLEMENT**: Extract current Resend logic into provider class
- **PATTERN**: Current `email/service.ts` implementation

```typescript
import type { EmailProvider, ProviderResult } from '../../contracts'

export class ResendProvider implements EmailProvider {
  readonly name = 'resend'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from:
          process.env.EMAIL_FROM || 'OpenLivestock <noreply@openlivestock.app>',
        to,
        subject,
        html,
      })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 7: CREATE `app/features/integrations/email/providers/smtp.ts`

- **IMPLEMENT**: SMTP provider using nodemailer
- **IMPORTS**: Will need to add nodemailer dependency

```typescript
import type { EmailProvider, ProviderResult } from '../../contracts'

export class SMTPProvider implements EmailProvider {
  readonly name = 'smtp'

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ProviderResult> {
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host) {
      return { success: false, error: 'SMTP_HOST not configured' }
    }

    try {
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port) : 587,
        secure: port === '465',
        auth: user && pass ? { user, pass } : undefined,
      })

      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'OpenLivestock <noreply@localhost>',
        to,
        subject,
        html,
      })

      return { success: true, messageId: result.messageId }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 8: CREATE `app/features/integrations/email/index.ts`

- **IMPLEMENT**: Email facade with provider registry

```typescript
import type { EmailProvider, ProviderResult } from '../contracts'
import type { SendEmailOptions, IntegrationResult } from '../types'

// Provider registry - add custom providers here
const providers: Record<string, () => Promise<EmailProvider>> = {
  resend: async () => new (await import('./providers/resend')).ResendProvider(),
  smtp: async () => new (await import('./providers/smtp')).SMTPProvider(),
}

/**
 * Get the configured Email provider
 */
async function getProvider(): Promise<EmailProvider | null> {
  const providerName = process.env.EMAIL_PROVIDER
  if (!providerName || !providers[providerName]) {
    return null
  }
  return providers[providerName]()
}

/**
 * Send Email using the configured provider
 * This is the public API - consumers don't need to know which provider is used
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<IntegrationResult> {
  const provider = await getProvider()
  if (!provider) {
    return {
      success: false,
      error: 'Email provider not configured. Set EMAIL_PROVIDER in .env',
    }
  }
  return provider.send(options.to, options.subject, options.html)
}

/**
 * Get the name of the configured Email provider
 */
export function getEmailProviderName(): string | null {
  return process.env.EMAIL_PROVIDER || null
}

/**
 * Check if Email is configured
 */
export function isEmailConfigured(): boolean {
  const providerName = process.env.EMAIL_PROVIDER
  return !!providerName && !!providers[providerName]
}
```

- **VALIDATE**: `bun run check`

### Task 9: UPDATE `app/features/integrations/config.ts`

- **IMPLEMENT**: Update to use new provider detection

```typescript
import type { IntegrationStatus } from './types'
import { isSMSConfigured, getSMSProviderName } from './sms'
import { isEmailConfigured, getEmailProviderName } from './email'

export const INTEGRATIONS = {
  email: isEmailConfigured(),
  sms: isSMSConfigured(),
} as const

export function getIntegrationStatus(): Array<IntegrationStatus> {
  return [
    {
      type: 'email',
      enabled: INTEGRATIONS.email,
      configured: INTEGRATIONS.email,
      provider: getEmailProviderName() || undefined,
    },
    {
      type: 'sms',
      enabled: INTEGRATIONS.sms,
      configured: INTEGRATIONS.sms,
      provider: getSMSProviderName() || undefined,
    },
  ]
}
```

- **GOTCHA**: This creates circular dependency. Need to inline the checks instead.
- **VALIDATE**: `bun run check`

### Task 10: UPDATE `app/features/integrations/index.ts`

- **IMPLEMENT**: Update exports to use new structure

```typescript
export * from './contracts'
export * from './types'
export * from './config'
export { sendEmail, isEmailConfigured, getEmailProviderName } from './email'
export { sendSMS, isSMSConfigured, getSMSProviderName } from './sms'
export { emailTemplates } from './email/templates'
export * from './server'
```

- **VALIDATE**: `bun run check`

### Task 11: DELETE old service files

- **REMOVE**: `app/features/integrations/sms/service.ts`
- **REMOVE**: `app/features/integrations/email/service.ts`
- **VALIDATE**: `bun run check`

### Task 12: UPDATE `vite.config.ts`

- **IMPLEMENT**: Add new provider env vars

```typescript
// In define block, replace old vars with:
// SMS Providers
'process.env.SMS_PROVIDER': JSON.stringify(env.SMS_PROVIDER || ''),
'process.env.TERMII_API_KEY': JSON.stringify(env.TERMII_API_KEY || ''),
'process.env.TERMII_SENDER_ID': JSON.stringify(env.TERMII_SENDER_ID || ''),
'process.env.TWILIO_ACCOUNT_SID': JSON.stringify(env.TWILIO_ACCOUNT_SID || ''),
'process.env.TWILIO_AUTH_TOKEN': JSON.stringify(env.TWILIO_AUTH_TOKEN || ''),
'process.env.TWILIO_PHONE_NUMBER': JSON.stringify(env.TWILIO_PHONE_NUMBER || ''),
// Email Providers
'process.env.EMAIL_PROVIDER': JSON.stringify(env.EMAIL_PROVIDER || ''),
'process.env.EMAIL_FROM': JSON.stringify(env.EMAIL_FROM || ''),
'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || ''),
'process.env.SMTP_HOST': JSON.stringify(env.SMTP_HOST || ''),
'process.env.SMTP_PORT': JSON.stringify(env.SMTP_PORT || ''),
'process.env.SMTP_USER': JSON.stringify(env.SMTP_USER || ''),
'process.env.SMTP_PASS': JSON.stringify(env.SMTP_PASS || ''),
```

- **VALIDATE**: `bun run check`

### Task 13: UPDATE `.env.example`

- **IMPLEMENT**: Document all provider options

```bash
# ===========================================
# OPTIONAL INTEGRATIONS
# ===========================================
# Leave blank to disable - app works without these

# -----------------------------
# SMS Provider (choose one)
# -----------------------------
# Options: termii, twilio
SMS_PROVIDER=

# Termii (Nigeria/Africa) - https://termii.com
TERMII_API_KEY=
TERMII_SENDER_ID=OpenLvstck

# Twilio (Global) - https://twilio.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# -----------------------------
# Email Provider (choose one)
# -----------------------------
# Options: resend, smtp
EMAIL_PROVIDER=

# Shared
EMAIL_FROM=OpenLivestock <noreply@yourdomain.com>

# Resend - https://resend.com
RESEND_API_KEY=

# SMTP (Gmail, Outlook, self-hosted, etc.)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

- **VALIDATE**: File syntax is valid

### Task 14: Install nodemailer

- **IMPLEMENT**: Add nodemailer for SMTP provider

```bash
bun add nodemailer
bun add -d @types/nodemailer
```

- **VALIDATE**: `bun run check`

### Task 15: UPDATE Settings UI to show provider name

- **IMPLEMENT**: Update IntegrationsTabContent in `app/routes/_auth/settings/index.tsx`
- Show which provider is active (e.g., "Email (Resend)" instead of just "Email")

- **VALIDATE**: `bun run check && bun run lint`

---

## TESTING STRATEGY

### Unit Tests

Create `tests/features/integrations/providers.test.ts`:

- Test each provider returns correct result structure
- Test provider registry returns correct provider
- Test facade functions delegate correctly
- Test unconfigured provider returns appropriate error

### Manual Testing

1. Set `SMS_PROVIDER=termii` + Termii credentials → Test SMS works
2. Set `SMS_PROVIDER=twilio` + Twilio credentials → Test SMS works
3. Set `EMAIL_PROVIDER=resend` + Resend credentials → Test email works
4. Set `EMAIL_PROVIDER=smtp` + SMTP credentials → Test email works
5. Set no provider → Verify graceful "not configured" message

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run check
bun run lint
```

### Level 2: Type Safety

```bash
npx tsc --noEmit
```

### Level 3: Build

```bash
bun run build
```

### Level 4: Manual Validation

1. Start dev server: `bun dev`
2. Go to Settings → Integrations tab
3. Verify provider names shown
4. Test send buttons work with configured providers

---

## ACCEPTANCE CRITERIA

- [ ] SMS works with Termii provider when `SMS_PROVIDER=termii`
- [ ] SMS works with Twilio provider when `SMS_PROVIDER=twilio`
- [ ] Email works with Resend provider when `EMAIL_PROVIDER=resend`
- [ ] Email works with SMTP provider when `EMAIL_PROVIDER=smtp`
- [ ] Graceful error when no provider configured
- [ ] Settings UI shows which provider is active
- [ ] Existing notification code works without changes
- [ ] All validation commands pass
- [ ] Documentation updated in .env.example

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands pass
- [ ] Manual testing confirms providers work
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

1. **HTTP APIs over SDKs**: Using fetch for Twilio instead of SDK keeps bundle smaller and avoids Node.js compatibility issues on Cloudflare Workers.

2. **Dynamic imports for providers**: Providers are loaded dynamically to avoid bundling unused code and maintain Cloudflare Workers compatibility.

3. **Provider registry pattern**: Simple object map allows easy addition of new providers without modifying core logic.

4. **Backward compatible types**: Kept `SendEmailOptions`, `SendSMSOptions`, `IntegrationResult` for existing code compatibility.

### Adding a Custom Provider

Technical users can add a custom provider by:

1. Create `app/features/integrations/sms/providers/my-provider.ts`:

```typescript
import type { SMSProvider, ProviderResult } from '../../contracts'

export class MyProvider implements SMSProvider {
  readonly name = 'my-provider'

  async send(to: string, message: string): Promise<ProviderResult> {
    // Implementation
  }
}
```

2. Register in `app/features/integrations/sms/index.ts`:

```typescript
const providers: Record<string, () => Promise<SMSProvider>> = {
  // ... existing providers
  'my-provider': async () =>
    new (await import('./providers/my-provider')).MyProvider(),
}
```

3. Set `SMS_PROVIDER=my-provider` in `.env`

**Zero changes to notification code, alerts, or any other part of the app.**

### Future Providers to Consider

- **SMS**: Africa's Talking, Vonage, MessageBird
- **Email**: SendGrid, Mailgun, Postmark, AWS SES
