# Feature: Interactive Examples Directory

## Feature Description

Create an `examples/` directory with working provider implementations that developers can copy, test, and learn from. Includes Africa's Talking SMS provider, AWS SES email provider, and a custom provider template with comprehensive comments.

## User Story

As a **developer integrating OpenLivestock with my preferred service**
I want to **see working code examples of custom provider implementations**
So that **I can quickly implement my own provider without reading extensive documentation**

## Problem Statement

Current INTEGRATIONS.md documentation explains the provider pattern conceptually, but lacks:
- Working code examples developers can copy and run
- Real-world provider implementations (Africa's Talking, AWS SES)
- Step-by-step commented templates for custom providers
- Test files showing how to validate providers

Developers learn best from working examples they can modify and test locally.

## Solution Statement

Create `examples/` directory with:
1. **Africa's Talking SMS provider** - Popular in East Africa (Kenya, Uganda, Tanzania)
2. **AWS SES email provider** - Enterprise-grade email service
3. **Custom provider template** - Heavily commented template for any provider
4. **Test examples** - Show how to test providers locally
5. **README** - Quick start guide for using examples

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Low-Medium
**Primary Systems Affected**: Documentation/Examples only (no core code changes)
**Dependencies**: None (examples are standalone)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/integrations/contracts.ts` - Why: Provider interfaces to implement
- `app/features/integrations/sms/providers/termii.ts` - Why: Pattern for SMS providers
- `app/features/integrations/sms/providers/twilio.ts` - Why: Alternative SMS pattern
- `app/features/integrations/sms/providers/console.ts` - Why: Simple provider example
- `app/features/integrations/email/providers/resend.ts` - Why: Pattern for email providers
- `app/features/integrations/email/providers/smtp.ts` - Why: Alternative email pattern
- `app/features/integrations/sms/index.ts` - Why: Provider registry pattern
- `app/features/integrations/email/index.ts` - Why: Provider registry pattern
- `app/features/integrations/config.ts` - Why: Configuration validation
- `docs/INTEGRATIONS.md` (lines 200-400) - Why: Custom provider documentation

### New Files to Create

- `examples/README.md` - Quick start guide
- `examples/sms/africas-talking.ts` - Africa's Talking SMS provider
- `examples/sms/africas-talking.test.ts` - Test file
- `examples/email/aws-ses.ts` - AWS SES email provider
- `examples/email/aws-ses.test.ts` - Test file
- `examples/templates/custom-sms-provider.ts` - Commented template
- `examples/templates/custom-email-provider.ts` - Commented template
- `examples/package.json` - Dependencies for examples
- `examples/tsconfig.json` - TypeScript config for examples
- `examples/.env.example` - Environment variables template

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Africa's Talking SMS API](https://developers.africastalking.com/docs/sms/overview)
  - Specific section: Sending SMS
  - Why: API structure for implementation
- [AWS SES SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/)
  - Specific section: SendEmail command
  - Why: AWS SDK v3 patterns
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
  - Why: Proper TypeScript setup for examples directory

### Patterns to Follow

**Provider Implementation Pattern:**
```typescript
import type { SMSProvider, ProviderResult } from '../../contracts'

export class MyProvider implements SMSProvider {
  readonly name = 'my-provider'
  
  async send(to: string, message: string): Promise<ProviderResult> {
    // 1. Validate environment variables
    // 2. Make API call
    // 3. Handle response
    // 4. Return ProviderResult
  }
}
```

**Error Handling Pattern:**
```typescript
try {
  const response = await fetch(url, options)
  const data = await response.json()
  
  if (data.success) {
    return { success: true, messageId: data.id }
  }
  
  return { success: false, error: data.error }
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  }
}
```

**Test Pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('MyProvider', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-key'
  })
  
  it('should send successfully', async () => {
    const provider = new MyProvider()
    const result = await provider.send('+1234567890', 'Test')
    expect(result.success).toBe(true)
  })
})
```

---

## IMPLEMENTATION PLAN

### Phase 1: Directory Setup

Create examples/ directory structure:
- README.md with quick start guide
- package.json with dependencies
- tsconfig.json for TypeScript
- .env.example for configuration

### Phase 2: SMS Provider Example (Africa's Talking)

Implement Africa's Talking SMS provider:
- Full implementation with error handling
- Comprehensive comments explaining each step
- Test file with mock API responses
- Configuration documentation

### Phase 3: Email Provider Example (AWS SES)

Implement AWS SES email provider:
- AWS SDK v3 integration
- Comprehensive comments
- Test file with mock SDK
- Configuration documentation

### Phase 4: Custom Provider Templates

Create heavily commented templates:
- SMS provider template with step-by-step comments
- Email provider template with step-by-step comments
- Explain each section (validation, API call, error handling)

### Phase 5: Documentation

Update examples/README.md:
- Quick start instructions
- How to test providers locally
- How to integrate into main app
- Troubleshooting common issues

---

## STEP-BY-STEP TASKS

### Task 1: CREATE examples/README.md

- **IMPLEMENT**: Quick start guide for using examples
- **SECTIONS**: Overview, Prerequisites, Quick Start, Testing, Integration, Troubleshooting
- **PATTERN**: Similar to main README.md structure
- **VALIDATE**: `cat examples/README.md | head -20`

### Task 2: CREATE examples/package.json

- **IMPLEMENT**: Package file with dependencies for examples
- **DEPENDENCIES**: @aws-sdk/client-ses, vitest, typescript, @types/node
- **SCRIPTS**: test, build, type-check
- **VALIDATE**: `cd examples && bun install`

### Task 3: CREATE examples/tsconfig.json

- **IMPLEMENT**: TypeScript configuration for examples
- **EXTENDS**: ../tsconfig.json (inherit from main project)
- **COMPILER OPTIONS**: paths for importing from main app
- **VALIDATE**: `cd examples && bun run type-check`

### Task 4: CREATE examples/.env.example

- **IMPLEMENT**: Environment variables template
- **VARIABLES**: AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME, AWS_SES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- **COMMENTS**: Explain where to get each credential
- **VALIDATE**: `cat examples/.env.example`

### Task 5: CREATE examples/sms/africas-talking.ts

- **IMPLEMENT**: Africa's Talking SMS provider implementation
- **INTERFACE**: Implement SMSProvider from contracts
- **API**: POST to https://api.africastalking.com/version1/messaging
- **HEADERS**: apiKey, Accept: application/json, Content-Type: application/json
- **BODY**: username, to, message
- **ERROR HANDLING**: Validate env vars, handle API errors, return ProviderResult
- **COMMENTS**: Explain each step (30+ comment lines)
- **PATTERN**: Mirror `app/features/integrations/sms/providers/termii.ts`
- **VALIDATE**: `bun run type-check examples/sms/africas-talking.ts`

### Task 6: CREATE examples/sms/africas-talking.test.ts

- **IMPLEMENT**: Test file for Africa's Talking provider
- **TESTS**: 
  - Should send SMS successfully
  - Should handle missing API key
  - Should handle API errors
  - Should validate phone number format
- **MOCKING**: Mock fetch API responses
- **PATTERN**: Similar to existing property tests
- **VALIDATE**: `cd examples && bun test sms/africas-talking.test.ts`

### Task 7: CREATE examples/email/aws-ses.ts

- **IMPLEMENT**: AWS SES email provider implementation
- **INTERFACE**: Implement EmailProvider from contracts
- **SDK**: Use @aws-sdk/client-ses (v3)
- **COMMAND**: SendEmailCommand with from, to, subject, html
- **CONFIGURATION**: Region from env, credentials from env
- **ERROR HANDLING**: Validate env vars, handle SDK errors, return ProviderResult
- **COMMENTS**: Explain AWS SDK v3 patterns (30+ comment lines)
- **PATTERN**: Mirror `app/features/integrations/email/providers/resend.ts`
- **VALIDATE**: `bun run type-check examples/email/aws-ses.ts`

### Task 8: CREATE examples/email/aws-ses.test.ts

- **IMPLEMENT**: Test file for AWS SES provider
- **TESTS**:
  - Should send email successfully
  - Should handle missing credentials
  - Should handle SDK errors
  - Should validate email format
- **MOCKING**: Mock AWS SDK client
- **PATTERN**: Similar to existing property tests
- **VALIDATE**: `cd examples && bun test email/aws-ses.test.ts`

### Task 9: CREATE examples/templates/custom-sms-provider.ts

- **IMPLEMENT**: Heavily commented SMS provider template
- **COMMENTS**: 
  - Step 1: Import types (explain ProviderResult)
  - Step 2: Define class (explain readonly name)
  - Step 3: Validate environment (explain why)
  - Step 4: Make API call (explain fetch pattern)
  - Step 5: Handle response (explain success/error)
  - Step 6: Error handling (explain try/catch)
- **PLACEHOLDERS**: YOUR_API_URL, YOUR_API_KEY_ENV_VAR, YOUR_RESPONSE_STRUCTURE
- **VALIDATE**: `bun run type-check examples/templates/custom-sms-provider.ts`

### Task 10: CREATE examples/templates/custom-email-provider.ts

- **IMPLEMENT**: Heavily commented email provider template
- **COMMENTS**: Same structure as SMS template but for email
- **PLACEHOLDERS**: YOUR_EMAIL_API_URL, YOUR_API_KEY_ENV_VAR, YOUR_EMAIL_STRUCTURE
- **VALIDATE**: `bun run type-check examples/templates/custom-email-provider.ts`

### Task 11: UPDATE examples/README.md - Add Integration Instructions

- **IMPLEMENT**: Section explaining how to integrate examples into main app
- **STEPS**:
  1. Copy provider file to app/features/integrations/sms/providers/
  2. Register in app/features/integrations/sms/index.ts
  3. Add to config.ts validation
  4. Set environment variables
  5. Test with console provider first
- **VALIDATE**: Follow instructions manually to verify

### Task 12: UPDATE docs/INTEGRATIONS.md - Link to Examples

- **IMPLEMENT**: Add section linking to examples/ directory
- **LOCATION**: After "For Developers: Creating Custom Providers" section
- **CONTENT**: "See working examples in the examples/ directory"
- **VALIDATE**: `grep "examples/" docs/INTEGRATIONS.md`

---

## TESTING STRATEGY

### Unit Tests

Each provider example includes test file:
- Success case (valid credentials, successful API call)
- Missing credentials case
- API error case
- Invalid input case

### Manual Testing

1. Copy .env.example to .env
2. Add real API credentials
3. Run provider locally
4. Verify SMS/email received

### Integration Testing

1. Copy provider to main app
2. Register in registry
3. Test with actual notification system
4. Verify end-to-end flow

---

## VALIDATION COMMANDS

### Level 1: TypeScript Validation

```bash
cd examples
bun install
bun run type-check
```

### Level 2: Unit Tests

```bash
cd examples
bun test
```

### Level 3: Build Validation

```bash
cd examples
bun run build
```

### Level 4: Manual Testing

```bash
# Test Africa's Talking provider
cd examples
cp .env.example .env
# Add real credentials to .env
bun run test:africas-talking

# Test AWS SES provider
bun run test:aws-ses
```

### Level 5: Integration Test

```bash
# Copy provider to main app
cp examples/sms/africas-talking.ts app/features/integrations/sms/providers/

# Register provider (manual step)
# Test in main app
cd ..
bun dev
```

---

## ACCEPTANCE CRITERIA

- [x] examples/ directory created with proper structure
- [x] Africa's Talking SMS provider implemented with 30+ comment lines
- [x] AWS SES email provider implemented with 30+ comment lines
- [x] Custom SMS provider template with step-by-step comments
- [x] Custom email provider template with step-by-step comments
- [x] All providers implement correct interfaces
- [x] All providers have test files
- [x] All tests pass
- [x] TypeScript compiles without errors
- [x] README.md has clear integration instructions
- [x] INTEGRATIONS.md links to examples/
- [x] .env.example documents all required variables

---

## COMPLETION CHECKLIST

- [ ] Task 1: examples/README.md created
- [ ] Task 2: examples/package.json created
- [ ] Task 3: examples/tsconfig.json created
- [ ] Task 4: examples/.env.example created
- [ ] Task 5: Africa's Talking SMS provider implemented
- [ ] Task 6: Africa's Talking tests created
- [ ] Task 7: AWS SES email provider implemented
- [ ] Task 8: AWS SES tests created
- [ ] Task 9: Custom SMS provider template created
- [ ] Task 10: Custom email provider template created
- [ ] Task 11: Integration instructions added to README
- [ ] Task 12: INTEGRATIONS.md updated with link
- [ ] All TypeScript compiles
- [ ] All tests pass
- [ ] Manual testing successful

---

## NOTES

### Provider Choices Rationale

**Africa's Talking** - Most popular SMS provider in East Africa (Kenya, Uganda, Tanzania, Rwanda). Competitive pricing, good API, strong regional presence.

**AWS SES** - Enterprise-grade email service. Many organizations already use AWS. Shows how to integrate AWS SDK v3 (modern pattern).

### Design Decisions

- **Standalone examples/** - Can be tested independently without affecting main app
- **Comprehensive comments** - Examples are teaching tools, not production code
- **Real providers** - Not toy examples, actual services developers will use
- **Test files included** - Show how to test providers properly

### Integration Strategy

Examples are designed to be:
1. **Testable** - Run locally without affecting main app
2. **Copyable** - Easy to copy into main app
3. **Modifiable** - Developers can adapt for their needs
4. **Educational** - Teach provider pattern through comments

### Estimated Time

- Directory setup: ~30 minutes
- Africa's Talking provider + tests: ~45 minutes
- AWS SES provider + tests: ~45 minutes
- Custom templates: ~30 minutes
- Documentation: ~30 minutes
- **Total**: ~3 hours

### Confidence Score

**8/10** - Straightforward implementation following existing patterns. Main risk is ensuring examples work with real APIs (requires testing with actual credentials).
