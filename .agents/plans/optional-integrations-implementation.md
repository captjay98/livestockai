# Feature: Optional Integrations System

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Build an optional integrations system that enhances the existing notification infrastructure with external delivery channels (Email, SMS). The core app remains 100% functional without any integrations - they are enhancements, not requirements.

## User Story

As a farm owner
I want to receive critical alerts via email or SMS
So that I can respond to emergencies even when not actively using the app

## Problem Statement

The app has a robust in-app notification system, but farmers aren't always looking at the app. Critical alerts (high mortality, low stock) need to reach them through external channels.

## Solution Statement

Create an optional integrations layer that:

1. Detects available integrations via environment variables
2. Gracefully enhances notifications when integrations are configured
3. Provides a settings UI to test and manage integrations
4. Never breaks core functionality if integrations fail

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Notifications, Settings, Monitoring
**Dependencies**: resend (email), africastalking (SMS) - both optional

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING

- `app/features/notifications/server.ts` - Existing notification CRUD
- `app/features/notifications/schedulers.ts` - Alert schedulers (low stock, invoice due, harvest)
- `app/features/notifications/types.ts` - Notification types
- `app/features/monitoring/alerts.ts` (lines 75-100) - Creates notifications for critical alerts
- `app/lib/db/types.ts` (lines 85-95) - UserSettingsTable.notifications field
- `app/routes/_auth/settings/index.tsx` - Settings page structure
- `.env.example` - Environment variable template

### New Files to Create

- `app/features/integrations/config.ts` - Integration detection and configuration
- `app/features/integrations/types.ts` - Integration interfaces
- `app/features/integrations/email/service.ts` - Resend email service
- `app/features/integrations/email/templates.ts` - Email templates
- `app/features/integrations/sms/service.ts` - Africa's Talking SMS service
- `app/features/integrations/index.ts` - Public exports
- `app/routes/_auth/settings/integrations.tsx` - Integration management UI

### Relevant Documentation

- [Resend Node.js SDK](https://resend.com/nodejs)
  - Installation and basic usage
  - Why: Primary email integration
- [Africa's Talking Node.js SDK](https://www.npmjs.com/package/africastalking)
  - SMS sending for African markets
  - Why: SMS critical for rural farmers

### Patterns to Follow

**Server Function Pattern:**

```typescript
export const sendTestEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    // Implementation
  })
```

**Dynamic Import Pattern (CRITICAL for Cloudflare):**

```typescript
// Always use dynamic imports for external services
const { Resend } = await import('resend')
```

**Graceful Degradation Pattern:**

```typescript
// From monitoring/alerts.ts - always create in-app notification first
await createNotification({ ... })
// Then optionally send external
if (INTEGRATIONS.email) {
  await sendEmail({ ... })
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Integration Configuration (30 min)

Create the foundation for detecting and managing integrations.

**Tasks:**

- Create integration config with environment detection
- Define integration types and interfaces
- Export public API

### Phase 2: Email Integration (45 min)

Implement Resend email service with templates.

**Tasks:**

- Create email service with graceful error handling
- Build email templates for each notification type
- Add test email server function

### Phase 3: SMS Integration (45 min)

Implement Africa's Talking SMS service.

**Tasks:**

- Create SMS service with graceful error handling
- Add test SMS server function
- Handle Nigerian phone number formatting

### Phase 4: Wire to Notifications (30 min)

Connect integrations to existing notification system.

**Tasks:**

- Update notification schedulers to send external alerts
- Update monitoring/alerts.ts for critical alerts
- Ensure graceful degradation

### Phase 5: Settings UI (45 min)

Build integration management interface.

**Tasks:**

- Create integrations settings page
- Add test buttons for each integration
- Show integration status and instructions

### Phase 6: Documentation (15 min)

Update documentation for users.

**Tasks:**

- Update .env.example with optional variables
- Update README with integration setup guide

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/features/integrations/types.ts`

- **IMPLEMENT**: Integration type definitions
- **PATTERN**: Follow `app/features/notifications/types.ts` structure

```typescript
export type IntegrationType = 'email' | 'sms'

export interface IntegrationStatus {
  type: IntegrationType
  enabled: boolean
  configured: boolean
  lastError?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface SendSMSOptions {
  to: string
  message: string
}
```

- **VALIDATE**: `bun run check`

### Task 2: CREATE `app/features/integrations/config.ts`

- **IMPLEMENT**: Integration detection and configuration
- **PATTERN**: Environment variable detection like `app/lib/db/seeds/production.ts`

```typescript
export const INTEGRATIONS = {
  email: !!process.env.RESEND_API_KEY,
  sms: !!process.env.AFRICASTALKING_API_KEY,
} as const

export function getIntegrationStatus(): Array<IntegrationStatus> {
  return [
    {
      type: 'email',
      enabled: INTEGRATIONS.email,
      configured: INTEGRATIONS.email,
    },
    {
      type: 'sms',
      enabled: INTEGRATIONS.sms,
      configured: INTEGRATIONS.sms,
    },
  ]
}
```

- **VALIDATE**: `bun run check`

### Task 3: CREATE `app/features/integrations/email/templates.ts`

- **IMPLEMENT**: Email templates for each notification type
- **PATTERN**: Simple HTML strings (no React Email to keep deps minimal)

Templates needed:

- `highMortality` - Critical alert with farm/batch details
- `lowStock` - Warning with inventory item details
- `invoiceDue` - Reminder with invoice details
- `batchHarvest` - Info with batch details

- **VALIDATE**: `bun run check`

### Task 4: CREATE `app/features/integrations/email/service.ts`

- **IMPLEMENT**: Resend email service with error handling
- **IMPORTS**: `resend` (add to package.json)
- **GOTCHA**: Use dynamic import for Cloudflare compatibility
- **PATTERN**: Graceful error handling - never throw, return result

```typescript
export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'Email not configured' }
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM || 'OpenLivestock <noreply@openlivestock.app>',
      ...options,
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 5: CREATE `app/features/integrations/sms/service.ts`

- **IMPLEMENT**: Africa's Talking SMS service
- **IMPORTS**: `africastalking` (add to package.json)
- **GOTCHA**: Dynamic import, phone number formatting for Nigeria (+234)

```typescript
export async function sendSMS(
  options: SendSMSOptions,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.AFRICASTALKING_API_KEY) {
    return { success: false, error: 'SMS not configured' }
  }
  try {
    const AfricasTalking = (await import('africastalking')).default
    const at = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
    })
    await at.SMS.send({ to: [options.to], message: options.message })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

- **VALIDATE**: `bun run check`

### Task 6: CREATE `app/features/integrations/server.ts`

- **IMPLEMENT**: Server functions for testing integrations
- **PATTERN**: Follow `app/features/notifications/server.ts`

```typescript
export const testEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { sendEmail } = await import('./email/service')
    return sendEmail({
      to: data.to,
      subject: 'OpenLivestock Test Email',
      html: '<h1>Test Email</h1><p>Your email integration is working!</p>',
    })
  })

export const testSMSFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { sendSMS } = await import('./sms/service')
    return sendSMS({
      to: data.to,
      message: 'OpenLivestock: Your SMS integration is working!',
    })
  })

export const getIntegrationStatusFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    const { getIntegrationStatus } = await import('./config')
    return getIntegrationStatus()
  },
)
```

- **VALIDATE**: `bun run check`

### Task 7: CREATE `app/features/integrations/index.ts`

- **IMPLEMENT**: Public exports

```typescript
export * from './config'
export * from './types'
export { sendEmail } from './email/service'
export { sendSMS } from './sms/service'
export * from './server'
```

- **VALIDATE**: `bun run check`

### Task 8: UPDATE `app/features/notifications/schedulers.ts`

- **IMPLEMENT**: Add external notification delivery after in-app
- **PATTERN**: Graceful degradation - always create in-app first

After each `createNotification()` call, add:

```typescript
// Send external notification if configured
const { INTEGRATIONS, sendEmail, sendSMS } = await import('../integrations')
const user = await db
  .selectFrom('users')
  .select(['email'])
  .where('id', '=', userId)
  .executeTakeFirst()

if (INTEGRATIONS.email && user?.email) {
  const { emailTemplates } = await import('../integrations/email/templates')
  const template = emailTemplates.lowStock(
    item.feedType,
    Number(item.quantityKg),
  )
  await sendEmail({ to: user.email, ...template })
}
```

- **GOTCHA**: Don't block on external delivery - use fire-and-forget or catch errors
- **VALIDATE**: `bun run check`

### Task 9: UPDATE `app/features/monitoring/alerts.ts`

- **IMPLEMENT**: Add external delivery for critical mortality alerts (lines 75-100)
- **PATTERN**: Same as Task 8

After the `createNotification()` for highMortality:

```typescript
if (INTEGRATIONS.email && user?.email) {
  const { emailTemplates } = await import('../integrations/email/templates')
  const template = emailTemplates.highMortality(
    alert.message,
    batch?.species || 'Unknown',
  )
  await sendEmail({ to: user.email, ...template })
}
```

- **VALIDATE**: `bun run check`

### Task 10: CREATE `app/routes/_auth/settings/integrations.tsx`

- **IMPLEMENT**: Integration management UI
- **PATTERN**: Follow `app/routes/_auth/settings/index.tsx` structure

UI Components:

- Integration status cards (email, SMS)
- Test buttons with loading states
- Setup instructions for each integration
- Link back to main settings

- **VALIDATE**: `bun run check && bun run lint`

### Task 11: UPDATE `app/routes/_auth/settings/index.tsx`

- **IMPLEMENT**: Add link to integrations page in settings nav

Add to `settingsNav` array:

```typescript
{ name: 'Integrations', href: '/settings/integrations', icon: Plug, adminOnly: false },
```

- **IMPORTS**: Add `Plug` from lucide-react
- **VALIDATE**: `bun run check`

### Task 12: UPDATE `.env.example`

- **IMPLEMENT**: Add optional integration variables

```bash
# ===========================================
# OPTIONAL INTEGRATIONS
# ===========================================
# Leave blank to disable - app works without these

# Email (Resend) - https://resend.com
RESEND_API_KEY=
EMAIL_FROM=OpenLivestock <noreply@yourdomain.com>

# SMS (Africa's Talking) - https://africastalking.com
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=sandbox
```

- **VALIDATE**: File exists and is valid

### Task 13: UPDATE `vite.config.ts`

- **IMPLEMENT**: Add new env variables to define block

```typescript
'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || ''),
'process.env.EMAIL_FROM': JSON.stringify(env.EMAIL_FROM || ''),
'process.env.AFRICASTALKING_API_KEY': JSON.stringify(env.AFRICASTALKING_API_KEY || ''),
'process.env.AFRICASTALKING_USERNAME': JSON.stringify(env.AFRICASTALKING_USERNAME || ''),
```

- **VALIDATE**: `bun run check`

### Task 14: Install dependencies

- **IMPLEMENT**: Add optional dependencies

```bash
bun add resend africastalking
```

- **VALIDATE**: `bun run check`

---

## TESTING STRATEGY

### Unit Tests

Test integration services with mocked external APIs:

- `sendEmail` returns success when configured, error when not
- `sendSMS` returns success when configured, error when not
- `getIntegrationStatus` correctly detects environment variables

### Integration Tests

- Notification schedulers still work when integrations disabled
- External delivery doesn't block in-app notifications
- Errors in external delivery don't crash the app

### Manual Testing

1. Without any integration env vars:
   - App works normally
   - Settings shows integrations as "Not configured"
   - Notifications only appear in-app

2. With RESEND_API_KEY set:
   - Settings shows email as "Configured"
   - Test email button sends email
   - Critical alerts trigger email

3. With AFRICASTALKING_API_KEY set:
   - Settings shows SMS as "Configured"
   - Test SMS button sends SMS

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
2. Navigate to Settings → Integrations
3. Verify integrations show as "Not configured"
4. Set RESEND_API_KEY in .env
5. Restart dev server
6. Verify email shows as "Configured"
7. Test email button works

---

## ACCEPTANCE CRITERIA

- [ ] App works 100% without any integration env vars
- [ ] Integration status correctly detected from environment
- [ ] Email integration sends when configured
- [ ] SMS integration sends when configured
- [ ] Settings UI shows integration status
- [ ] Test buttons work for each integration
- [ ] External delivery doesn't block in-app notifications
- [ ] Errors in external delivery are caught and logged
- [ ] Documentation updated with setup instructions
- [ ] All validation commands pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands pass
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

1. **No React Email**: Keeping templates as simple HTML strings to minimize dependencies
2. **Africa's Talking over Twilio**: Better coverage and pricing for African markets
3. **Fire-and-forget external delivery**: Don't block core operations on external services
4. **Environment-based detection**: Simplest approach for open source users

### Trade-offs

- **Simplicity over features**: No email tracking, no delivery receipts
- **Minimal dependencies**: Only two optional packages
- **No queue system**: Direct delivery, may need queue for high volume later

### Future Enhancements

- WhatsApp Business API integration
- Email delivery tracking
- SMS delivery reports
- Scheduled digest emails
