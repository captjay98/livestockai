# Feature: Storage Provider System

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Implement a provider-agnostic storage abstraction layer that mirrors the existing SMS/Email integration pattern. This system enables switching between Cloudflare R2, AWS S3, and local filesystem storage via environment variables, providing flexibility for development, testing, and production deployments without vendor lock-in.

The storage system supports **two access modes**:

- **Private Storage**: Authenticated access only (credit reports, invoices, receipts)
- **Public Storage**: CDN-accessible URLs (user avatars, farm logos, batch photos, product images)

The system includes **image-specific features**:

- Client-side compression before upload
- Format validation (JPEG, PNG, WebP)
- Thumbnail generation (optional)
- Size limits (max 5MB for images, 10MB for documents)

**Primary Use Cases**:

1. Credit Passport PDFs (private)
2. User profile photos (public)
3. Farm logos (public)
4. Batch/livestock photos (public)
5. Product images for marketplace (public)
6. Invoices and receipts (private)

## User Story

As a developer
I want to abstract storage behind a provider interface
So that I can switch between R2, S3, and local storage without changing application code

As a system administrator
I want to configure storage via environment variables
So that I can deploy to different environments (dev/staging/prod) with appropriate storage backends

## Problem Statement

The Credit Passport feature requires PDF storage, but hardcoding to a specific storage provider (R2 or S3) creates:

- Vendor lock-in
- Difficult local development (requires cloud storage for testing)
- Complex environment-specific configuration
- Inconsistent patterns with existing SMS/Email integrations

## Solution Statement

Create a storage provider system following the established SMS/Email pattern:

1. Define `StorageProvider` interface contract
2. Implement providers: R2, S3, Local filesystem
3. Create facade functions: `uploadFile()`, `downloadFile()`, `deleteFile()`, `getSignedUrl()`
4. Use dynamic imports for Cloudflare Workers compatibility
5. Configure via `STORAGE_PROVIDER` environment variable

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**:

- Integrations system (`app/features/integrations/`)
- Credit Passport (future consumer)
- Cloudflare Workers deployment (R2 bindings)

**Dependencies**:

- `@aws-sdk/client-s3` (for S3 provider)
- `@aws-sdk/s3-request-presigner` (for S3 signed URLs)
- `browser-image-compression` (client-side image compression)
- Cloudflare R2 bucket bindings (for R2 provider - public and private buckets)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/integrations/contracts.ts` - Why: Existing provider contracts (SMSProvider, EmailProvider) to mirror
- `app/features/integrations/sms/index.ts` - Why: Facade pattern with provider registry to replicate
- `app/features/integrations/email/index.ts` - Why: Same facade pattern, shows consistency
- `app/features/integrations/sms/providers/console.ts` - Why: Simple provider implementation example
- `app/features/integrations/sms/providers/termii.ts` - Why: External API provider pattern
- `app/features/integrations/config.ts` - Why: Provider configuration detection logic
- `app/lib/errors/index.ts` - Why: Error handling with AppError
- `wrangler.jsonc` - Why: Cloudflare Workers configuration (will add R2 binding)
- `docs/INTEGRATIONS.md` - Why: Integration documentation pattern to follow

### New Files to Create

- `app/features/integrations/storage/index.ts` - Storage facade with provider registry
- `app/features/integrations/storage/providers/r2.ts` - Cloudflare R2 provider
- `app/features/integrations/storage/providers/s3.ts` - AWS S3 provider
- `app/features/integrations/storage/providers/local.ts` - Local filesystem provider (dev)
- `tests/features/integrations/storage.test.ts` - Unit tests for storage facade
- `tests/features/integrations/storage-providers.test.ts` - Provider implementation tests

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Cloudflare R2 API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
  - Specific section: Workers API Reference
  - Why: Required for R2 provider implementation (put, get, delete operations)
- [AWS SDK v3 S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)
  - Specific section: PutObjectCommand, GetObjectCommand, DeleteObjectCommand
  - Why: Required for S3 provider implementation
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/)
  - Specific section: getSignedUrl function
  - Why: Required for temporary access URLs in S3 provider
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api)
  - Specific section: writeFile, readFile, unlink, mkdir
  - Why: Required for local filesystem provider

### Patterns to Follow

**Provider Contract Pattern** (from `app/features/integrations/contracts.ts`):

```typescript
export interface ProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SMSProvider {
  readonly name: string
  send: (to: string, message: string) => Promise<ProviderResult>
}
```

**Facade Pattern** (from `app/features/integrations/sms/index.ts`):

```typescript
type ProviderFactory = () => Promise<SMSProvider>

const providers = new Map<string, ProviderFactory>([
  [
    'console',
    async () => new (await import('./providers/console')).ConsoleProvider(),
  ],
  [
    'termii',
    async () => new (await import('./providers/termii')).TermiiProvider(),
  ],
])

async function getProvider(): Promise<SMSProvider | null> {
  const name = process.env.SMS_PROVIDER
  if (!name) return null
  const factory = providers.get(name)
  if (!factory) return null
  return factory()
}

export async function sendSMS(
  options: SendSMSOptions,
): Promise<IntegrationResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'SMS provider not configured' }
  }
  return provider.send(options.to, options.message)
}
```

**Dynamic Import Pattern** (MANDATORY for Cloudflare Workers):

```typescript
// ✅ CORRECT
const { env } = await import('cloudflare:workers')
const bucket = env.CREDIT_REPORTS_BUCKET

// ❌ WRONG - breaks on Cloudflare Workers
import { env } from 'cloudflare:workers'
```

**Error Handling Pattern**:

```typescript
try {
  // API call
  const response = await fetch(url, options)
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  return { success: true, messageId: data.id }
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Contracts & Types)

Extend existing integration contracts with storage-specific interfaces. Follow the established pattern of `ProviderResult` base type with specialized extensions.

**Tasks:**

- Add `StorageProvider` interface to contracts
- Add `StorageResult` and `StorageDownloadResult` types
- Update integration types for storage options

### Phase 2: Provider Implementations

Implement three storage providers following the established provider pattern. Each provider must handle errors gracefully and return standardized results.

**Tasks:**

- Implement R2 provider (Cloudflare Workers binding)
- Implement S3 provider (AWS SDK v3)
- Implement Local provider (Node.js fs/promises)

### Phase 3: Facade & Registry

Create the storage facade following the exact pattern used by SMS/Email integrations. Use dynamic imports and provider registry pattern.

**Tasks:**

- Create storage facade with provider registry
- Implement `uploadFile()`, `downloadFile()`, `deleteFile()`, `getSignedUrl()` functions
- Add configuration detection logic

### Phase 4: Configuration & Documentation

Configure Cloudflare Workers for R2, add environment variables, and document the integration following the established INTEGRATIONS.md pattern.

**Tasks:**

- Update `wrangler.jsonc` with R2 bucket binding
- Add storage configuration to `.env.example`
- Update `docs/INTEGRATIONS.md` with storage provider section
- Add storage provider to integration config checks

### Phase 5: Testing & Validation

Implement comprehensive tests following OpenLivestock testing patterns. Test each provider independently and the facade integration.

**Tasks:**

- Unit tests for storage facade
- Provider implementation tests (mock external APIs)
- Integration tests with actual storage operations
- Edge case tests (missing config, network errors, large files)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### UPDATE app/features/integrations/contracts.ts

- **ADD**: Storage provider interfaces after existing EmailProvider
- **PATTERN**: Mirror SMSProvider/EmailProvider structure (file:14-26)
- **IMPORTS**: None (pure interfaces)
- **GOTCHA**: Extend ProviderResult, don't create new base type
- **VALIDATE**: `npx tsc --noEmit`

```typescript
/**
 * Storage Provider Contract
 * Implement this interface to add a new storage provider
 */
export interface StorageProvider {
  readonly name: string
  upload: (
    key: string,
    content: ArrayBuffer | Uint8Array,
    contentType: string,
  ) => Promise<StorageResult>
  download: (key: string) => Promise<StorageDownloadResult>
  delete: (key: string) => Promise<ProviderResult>
  getSignedUrl?: (key: string, expiresIn: number) => Promise<string>
}

export interface StorageResult extends ProviderResult {
  url?: string
  key?: string
}

export interface StorageDownloadResult extends ProviderResult {
  content?: ArrayBuffer
  contentType?: string
}
```

### CREATE app/features/integrations/storage/providers/r2.ts

- **IMPLEMENT**: Cloudflare R2 storage provider using Workers API
- **PATTERN**: Mirror `sms/providers/termii.ts` external API pattern
- **IMPORTS**: `import type { StorageProvider, StorageResult, StorageDownloadResult, ProviderResult } from '../../contracts'`
- **GOTCHA**: Must use dynamic import for `cloudflare:workers` - static imports break Workers
- **GOTCHA**: R2 bucket accessed via `env.CREDIT_REPORTS_BUCKET` binding (configured in wrangler.jsonc)
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

```typescript
import type {
  StorageProvider,
  StorageResult,
  StorageDownloadResult,
  ProviderResult,
} from '../../contracts'

export class R2Provider implements StorageProvider {
  readonly name = 'r2'

  async upload(
    key: string,
    content: ArrayBuffer | Uint8Array,
    contentType: string,
  ): Promise<StorageResult> {
    try {
      const { env } = await import('cloudflare:workers')
      const bucket = env.CREDIT_REPORTS_BUCKET

      if (!bucket) {
        return { success: false, error: 'R2 bucket not configured' }
      }

      await bucket.put(key, content, {
        httpMetadata: { contentType },
      })

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

      return {
        success: true,
        url: publicUrl,
        key,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'R2 upload failed',
      }
    }
  }

  async download(key: string): Promise<StorageDownloadResult> {
    try {
      const { env } = await import('cloudflare:workers')
      const bucket = env.CREDIT_REPORTS_BUCKET

      if (!bucket) {
        return { success: false, error: 'R2 bucket not configured' }
      }

      const object = await bucket.get(key)
      if (!object) {
        return { success: false, error: 'File not found' }
      }

      const content = await object.arrayBuffer()

      return {
        success: true,
        content,
        contentType: object.httpMetadata?.contentType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'R2 download failed',
      }
    }
  }

  async delete(key: string): Promise<ProviderResult> {
    try {
      const { env } = await import('cloudflare:workers')
      const bucket = env.CREDIT_REPORTS_BUCKET

      if (!bucket) {
        return { success: false, error: 'R2 bucket not configured' }
      }

      await bucket.delete(key)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'R2 delete failed',
      }
    }
  }

  async getSignedUrl(key: string, _expiresIn: number): Promise<string> {
    // R2 presigned URLs require additional setup
    // For now, return public URL (implement presigned URLs in future iteration)
    return `${process.env.R2_PUBLIC_URL}/${key}`
  }
}
```

### CREATE app/features/integrations/storage/providers/s3.ts

- **IMPLEMENT**: AWS S3 storage provider using AWS SDK v3
- **PATTERN**: Mirror `email/providers/resend.ts` external SDK pattern
- **IMPORTS**: Dynamic imports for `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- **GOTCHA**: AWS SDK v3 uses modular imports - import specific commands
- **GOTCHA**: S3 requires region, bucket, and credentials from env vars
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

```typescript
import type {
  StorageProvider,
  StorageResult,
  StorageDownloadResult,
  ProviderResult,
} from '../../contracts'

export class S3Provider implements StorageProvider {
  readonly name = 's3'

  async upload(
    key: string,
    content: ArrayBuffer | Uint8Array,
    contentType: string,
  ): Promise<StorageResult> {
    const bucket = process.env.S3_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return {
        success: false,
        error: 'S3 bucket or region not configured',
      }
    }

    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: content,
          ContentType: contentType,
        }),
      )

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

      return { success: true, url, key }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 upload failed',
      }
    }
  }

  async download(key: string): Promise<StorageDownloadResult> {
    const bucket = process.env.S3_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return {
        success: false,
        error: 'S3 bucket or region not configured',
      }
    }

    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      )

      const content = await response.Body?.transformToByteArray()

      return {
        success: true,
        content: content?.buffer,
        contentType: response.ContentType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 download failed',
      }
    }
  }

  async delete(key: string): Promise<ProviderResult> {
    const bucket = process.env.S3_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return {
        success: false,
        error: 'S3 bucket or region not configured',
      }
    }

    try {
      const { S3Client, DeleteObjectCommand } =
        await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 delete failed',
      }
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const bucket = process.env.S3_BUCKET
    const region = process.env.AWS_REGION

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')

    const client = new S3Client({ region })
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })

    return getSignedUrl(client, command, { expiresIn })
  }
}
```

### CREATE app/features/integrations/storage/providers/local.ts

- **IMPLEMENT**: Local filesystem storage provider for development
- **PATTERN**: Mirror `sms/providers/console.ts` local-only pattern
- **IMPORTS**: Dynamic imports for `node:fs/promises` and `node:path`
- **GOTCHA**: Only works in Node.js/Bun, not Cloudflare Workers
- **GOTCHA**: Must create directories recursively before writing files
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

```typescript
import type {
  StorageProvider,
  StorageResult,
  StorageDownloadResult,
  ProviderResult,
} from '../../contracts'

export class LocalProvider implements StorageProvider {
  readonly name = 'local'

  async upload(
    key: string,
    content: ArrayBuffer | Uint8Array,
    contentType: string,
  ): Promise<StorageResult> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')

      const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
      const filePath = path.join(storageDir, key)

      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, Buffer.from(content))

      return {
        success: true,
        url: `/storage/${key}`,
        key,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local upload failed',
      }
    }
  }

  async download(key: string): Promise<StorageDownloadResult> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')

      const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
      const filePath = path.join(storageDir, key)

      const content = await fs.readFile(filePath)

      return {
        success: true,
        content: content.buffer,
        contentType: 'application/octet-stream',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local download failed',
      }
    }
  }

  async delete(key: string): Promise<ProviderResult> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')

      const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
      const filePath = path.join(storageDir, key)

      await fs.unlink(filePath)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local delete failed',
      }
    }
  }
}
```

### CREATE app/features/integrations/storage/index.ts

- **IMPLEMENT**: Storage facade with provider registry
- **PATTERN**: Exact mirror of `sms/index.ts` (file:1-45)
- **IMPORTS**: `import type { StorageProvider, StorageResult, StorageDownloadResult, ProviderResult } from '../contracts'`
- **GOTCHA**: Provider registry uses dynamic imports - no static imports
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

```typescript
import type {
  StorageProvider,
  StorageResult,
  StorageDownloadResult,
  ProviderResult,
} from '../contracts'

type ProviderFactory = () => Promise<StorageProvider>

const providers = new Map<string, ProviderFactory>([
  ['r2', async () => new (await import('./providers/r2')).R2Provider()],
  ['s3', async () => new (await import('./providers/s3')).S3Provider()],
  [
    'local',
    async () => new (await import('./providers/local')).LocalProvider(),
  ],
])

async function getProvider(): Promise<StorageProvider | null> {
  const name = process.env.STORAGE_PROVIDER
  if (!name) return null
  const factory = providers.get(name)
  if (!factory) return null
  return factory()
}

export async function uploadFile(
  key: string,
  content: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<StorageResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.upload(key, content, contentType)
}

export async function downloadFile(
  key: string,
): Promise<StorageDownloadResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.download(key)
}

export async function deleteFile(key: string): Promise<ProviderResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.delete(key)
}

export async function getSignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  const provider = await getProvider()
  if (!provider?.getSignedUrl) return null
  return provider.getSignedUrl(key, expiresIn)
}

export function getStorageProviderName(): string | null {
  return process.env.STORAGE_PROVIDER || null
}

export function isStorageConfigured(): boolean {
  const name = process.env.STORAGE_PROVIDER
  return !!name && providers.has(name)
}
```

### UPDATE app/features/integrations/index.ts

- **ADD**: Export storage functions alongside SMS/Email
- **PATTERN**: Add to existing exports (file:1-10)
- **IMPORTS**: None (re-export only)
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add to existing exports
export {
  uploadFile,
  downloadFile,
  deleteFile,
  getSignedUrl,
  getStorageProviderName,
  isStorageConfigured,
} from './storage'
```

### UPDATE app/features/integrations/config.ts

- **ADD**: Storage configuration check function
- **PATTERN**: Mirror `isSMSConfigured()` and `isEmailConfigured()` (file:10-40)
- **IMPORTS**: None (uses process.env)
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

```typescript
// Add after isEmailConfigured()
export function isStorageConfigured(): boolean {
  const provider = process.env.STORAGE_PROVIDER

  switch (provider) {
    case 'local':
      return true // No credentials needed
    case 'r2':
      return !!process.env.R2_PUBLIC_URL
    case 's3':
      return !!(
        process.env.S3_BUCKET &&
        process.env.AWS_REGION &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      )
    default:
      return false
  }
}
```

### UPDATE wrangler.jsonc

- **ADD**: R2 bucket binding for Cloudflare Workers
- **PATTERN**: Add to root configuration object
- **GOTCHA**: Bucket must be created in Cloudflare dashboard first
- **VALIDATE**: `npx wrangler deploy --dry-run`

```jsonc
{
  // ... existing config
  "r2_buckets": [
    {
      "binding": "CREDIT_REPORTS_BUCKET",
      "bucket_name": "openlivestock-credit-reports",
      "preview_bucket_name": "openlivestock-credit-reports-preview",
    },
  ],
}
```

### UPDATE .env.example

- **ADD**: Storage provider configuration examples
- **PATTERN**: Add after EMAIL_PROVIDER section
- **VALIDATE**: Manual review

```bash
# Storage Configuration
STORAGE_PROVIDER=local  # Options: 'r2', 's3', 'local'

# R2 Configuration (Cloudflare)
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# S3 Configuration (AWS)
S3_BUCKET=openlivestock-credit-reports
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Local Development
LOCAL_STORAGE_PATH=./storage
```

### UPDATE package.json

- **ADD**: AWS SDK dependencies for S3 provider
- **PATTERN**: Add to dependencies object
- **VALIDATE**: `bun install && bun run check`

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0"
  }
}
```

### CREATE tests/features/integrations/storage.test.ts

- **IMPLEMENT**: Unit tests for storage facade
- **PATTERN**: Mirror `tests/features/settings/currency.test.ts` structure
- **IMPORTS**: `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'`
- **GOTCHA**: Mock process.env for provider selection
- **VALIDATE**: `bun run test tests/features/integrations/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  uploadFile,
  downloadFile,
  deleteFile,
  getStorageProviderName,
  isStorageConfigured,
} from '~/features/integrations/storage'

describe('Storage Facade', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getStorageProviderName', () => {
    it('should return null when STORAGE_PROVIDER not set', () => {
      delete process.env.STORAGE_PROVIDER
      expect(getStorageProviderName()).toBeNull()
    })

    it('should return provider name when set', () => {
      process.env.STORAGE_PROVIDER = 'local'
      expect(getStorageProviderName()).toBe('local')
    })
  })

  describe('isStorageConfigured', () => {
    it('should return false when no provider set', () => {
      delete process.env.STORAGE_PROVIDER
      expect(isStorageConfigured()).toBe(false)
    })

    it('should return true for local provider', () => {
      process.env.STORAGE_PROVIDER = 'local'
      expect(isStorageConfigured()).toBe(true)
    })

    it('should return false for unknown provider', () => {
      process.env.STORAGE_PROVIDER = 'unknown'
      expect(isStorageConfigured()).toBe(false)
    })
  })

  describe('uploadFile', () => {
    it('should return error when provider not configured', async () => {
      delete process.env.STORAGE_PROVIDER

      const result = await uploadFile(
        'test.pdf',
        new Uint8Array([1, 2, 3]),
        'application/pdf',
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
    })
  })

  describe('downloadFile', () => {
    it('should return error when provider not configured', async () => {
      delete process.env.STORAGE_PROVIDER

      const result = await downloadFile('test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
    })
  })

  describe('deleteFile', () => {
    it('should return error when provider not configured', async () => {
      delete process.env.STORAGE_PROVIDER

      const result = await deleteFile('test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
    })
  })
})
```

### CREATE tests/features/integrations/storage-providers.test.ts

- **IMPLEMENT**: Provider implementation tests
- **PATTERN**: Test each provider's success and error cases
- **IMPORTS**: `import { describe, it, expect, beforeEach, afterEach } from 'vitest'`
- **GOTCHA**: Mock external APIs (R2, S3) - don't make real network calls
- **VALIDATE**: `bun run test tests/features/integrations/storage-providers.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalProvider } from '~/features/integrations/storage/providers/local'

describe('LocalProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LOCAL_STORAGE_PATH: './test-storage',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should have correct name', () => {
    const provider = new LocalProvider()
    expect(provider.name).toBe('local')
  })

  it('should upload file successfully', async () => {
    const provider = new LocalProvider()
    const content = new Uint8Array([1, 2, 3, 4])

    const result = await provider.upload(
      'test/file.pdf',
      content,
      'application/pdf',
    )

    expect(result.success).toBe(true)
    expect(result.key).toBe('test/file.pdf')
    expect(result.url).toContain('/storage/test/file.pdf')
  })

  it('should download file successfully', async () => {
    const provider = new LocalProvider()
    const content = new Uint8Array([1, 2, 3, 4])

    // Upload first
    await provider.upload('test/file.pdf', content, 'application/pdf')

    // Then download
    const result = await provider.download('test/file.pdf')

    expect(result.success).toBe(true)
    expect(result.content).toBeDefined()
  })

  it('should delete file successfully', async () => {
    const provider = new LocalProvider()
    const content = new Uint8Array([1, 2, 3, 4])

    // Upload first
    await provider.upload('test/file.pdf', content, 'application/pdf')

    // Then delete
    const result = await provider.delete('test/file.pdf')

    expect(result.success).toBe(true)
  })

  it('should return error for non-existent file', async () => {
    const provider = new LocalProvider()

    const result = await provider.download('nonexistent.pdf')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// Note: R2Provider and S3Provider tests would mock the external APIs
// Example structure (not full implementation):
describe('R2Provider', () => {
  it('should return error when bucket not configured', async () => {
    // Mock cloudflare:workers to return undefined bucket
    // Test that provider returns appropriate error
  })
})

describe('S3Provider', () => {
  it('should return error when credentials missing', async () => {
    delete process.env.S3_BUCKET
    // Test that provider returns appropriate error
  })
})
```

---

## TESTING STRATEGY

### Unit Tests

**Location**: `tests/features/integrations/`
**Framework**: Vitest
**Coverage Target**: 80%+

**Test Files**:

- `storage.test.ts` - Facade functions (provider selection, error handling)
- `storage-providers.test.ts` - Provider implementations (upload, download, delete)

**Test Scenarios**:

- Provider selection based on STORAGE_PROVIDER env var
- Error handling when provider not configured
- Error handling when credentials missing
- Successful upload/download/delete operations
- Signed URL generation (where supported)

### Integration Tests

**Scope**: Local provider with actual filesystem operations
**Pattern**: Create temp directory, perform operations, cleanup

**Test Scenarios**:

- Upload file to local storage
- Download file from local storage
- Delete file from local storage
- Directory creation for nested paths
- Error handling for permission issues

### Edge Cases

**Storage-specific edge cases**:

- Large file uploads (>10MB)
- Binary content (PDFs, images)
- Special characters in file keys
- Nested directory paths
- Concurrent uploads to same key
- Network timeouts (S3/R2)
- Missing bucket/credentials
- Invalid content types

---

## VALIDATION COMMANDS

Execute in order, fail fast:

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
# Run storage tests
bun run test tests/features/integrations/storage.test.ts || exit 1
bun run test tests/features/integrations/storage-providers.test.ts || exit 1
```

### Level 3: Integration Tests

```bash
# Test local provider with actual filesystem
STORAGE_PROVIDER=local bun run test tests/features/integrations/storage-providers.test.ts || exit 1
```

### Level 4: Build Verification

```bash
# Verify production build works
bun run build || exit 1
```

### Level 5: Manual Validation

**Local Provider Test**:

```bash
# Set environment
export STORAGE_PROVIDER=local
export LOCAL_STORAGE_PATH=./test-storage

# Test upload (in Node.js REPL or test script)
node -e "
const { uploadFile } = require('./app/features/integrations/storage');
const content = Buffer.from('test content');
uploadFile('test.txt', content, 'text/plain').then(console.log);
"

# Verify file exists
ls -la ./test-storage/test.txt
```

**R2 Provider Test** (requires Cloudflare Workers deployment):

```bash
# Deploy to Workers
bun run deploy

# Test via deployed endpoint
curl -X POST https://your-worker.workers.dev/api/test-upload
```

**S3 Provider Test** (requires AWS credentials):

```bash
# Set environment
export STORAGE_PROVIDER=s3
export S3_BUCKET=test-bucket
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Test upload
node -e "
const { uploadFile } = require('./app/features/integrations/storage');
const content = Buffer.from('test content');
uploadFile('test.txt', content, 'text/plain').then(console.log);
"
```

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] Feature implements all specified functionality:
  - [ ] StorageProvider interface defined in contracts
  - [ ] R2Provider implemented with Cloudflare Workers API
  - [ ] S3Provider implemented with AWS SDK v3
  - [ ] LocalProvider implemented with Node.js fs/promises
  - [ ] Storage facade with provider registry
  - [ ] uploadFile(), downloadFile(), deleteFile(), getSignedUrl() functions
- [ ] All validation commands pass: `bun run check && bun run test --run && bun run build`
- [ ] Test coverage meets requirements (80%+ overall)
- [ ] Integration tests verify local provider operations
- [ ] Code follows OpenLivestock patterns:
  - [ ] Dynamic imports in all providers (no static imports)
  - [ ] ProviderResult return type for all operations
  - [ ] Graceful error handling (no thrown exceptions)
  - [ ] Provider registry pattern matches SMS/Email
  - [ ] Configuration detection in config.ts
- [ ] No regressions in existing functionality (all tests pass)
- [ ] Wrangler configuration updated with R2 binding
- [ ] Environment variables documented in .env.example
- [ ] AWS SDK dependencies added to package.json
- [ ] Works in both Node.js/Bun (local) and Cloudflare Workers (R2)
- [ ] Provider selection via STORAGE_PROVIDER env var
- [ ] Configuration validation via isStorageConfigured()

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works:
  - [ ] Local provider uploads/downloads files
  - [ ] R2 provider works in Cloudflare Workers (if deployed)
  - [ ] S3 provider works with AWS credentials (if configured)
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] Documentation updated (INTEGRATIONS.md)

---

## NOTES

### Design Decisions

**Why Mirror SMS/Email Pattern?**

- Consistency across codebase - developers already understand the pattern
- Proven to work with Cloudflare Workers (dynamic imports)
- Easy to extend with new providers (Azure Blob, Google Cloud Storage)
- Configuration via environment variables (no code changes)

**Why Three Providers Initially?**

- **R2**: Primary production provider (Cloudflare Workers native)
- **S3**: Alternative for AWS-based deployments
- **Local**: Development/testing without cloud dependencies

**Why Optional getSignedUrl()?**

- Not all providers support presigned URLs easily
- R2 presigned URLs require additional setup
- Local provider doesn't need signed URLs
- Made optional to not block basic functionality

### Trade-offs

**R2 Presigned URLs**:

- Current implementation returns public URL
- Full presigned URL support requires R2 API tokens
- Deferred to future iteration to unblock Credit Passport

**Error Handling**:

- Providers return `{ success: false, error: string }` instead of throwing
- Consistent with SMS/Email pattern
- Easier to handle in calling code

**Local Provider Limitations**:

- Only works in Node.js/Bun (not Cloudflare Workers)
- No signed URL support
- Acceptable for development/testing only

### Future Enhancements

- Add Azure Blob Storage provider
- Add Google Cloud Storage provider
- Implement R2 presigned URLs
- Add file metadata (size, modified date)
- Add batch operations (upload multiple files)
- Add progress callbacks for large uploads
- Add retry logic with exponential backoff

### Dependencies

**Required npm packages**:

```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Cloudflare R2 Setup**:

1. Create R2 bucket in Cloudflare dashboard
2. Add bucket binding to wrangler.jsonc
3. Set R2_PUBLIC_URL environment variable

**AWS S3 Setup**:

1. Create S3 bucket in AWS console
2. Create IAM user with S3 permissions
3. Set AWS credentials in environment variables

### Integration with Credit Passport

The Credit Passport feature will use storage like this:

```typescript
// app/features/credit-passport/server.ts
import { uploadFile, downloadFile } from '~/features/integrations/storage'

export const generateReportFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    // Generate PDF
    const pdfBuffer = await generateReportPDF(metrics)

    // Upload to storage (R2/S3/local based on env)
    const result = await uploadFile(
      `reports/${reportId}.pdf`,
      pdfBuffer,
      'application/pdf',
    )

    if (!result.success) {
      throw new AppError('STORAGE_ERROR', {
        metadata: { error: result.error },
      })
    }

    // Store URL in database
    await db.insertInto('credit_reports').values({
      id: reportId,
      pdfUrl: result.url,
      // ...
    })
  },
)
```

### Security Considerations

**R2 Public URLs**:

- Current implementation uses public URLs
- Consider implementing presigned URLs for sensitive reports
- Add expiration to presigned URLs (default 1 hour)

**S3 Bucket Policies**:

- Ensure bucket is not publicly accessible
- Use IAM roles with minimal permissions
- Enable server-side encryption

**Local Storage**:

- Only for development - never use in production
- Files stored in plaintext on filesystem
- No access control

### Performance Considerations

**File Size Limits**:

- R2: 5GB per object (multipart upload for larger)
- S3: 5GB per PUT (multipart upload for larger)
- Local: Limited by filesystem

**Latency**:

- R2: ~50-100ms (same region as Workers)
- S3: ~100-200ms (depends on region)
- Local: <10ms (filesystem access)

**Costs**:

- R2: $0.015/GB/month storage, free egress
- S3: $0.023/GB/month storage, $0.09/GB egress
- Local: Free (development only)

---

## DOCUMENTATION UPDATE

After implementation, update `docs/INTEGRATIONS.md` with storage provider section following the existing SMS/Email pattern:

### Storage Providers

| Provider  | Region    | Use Case                    | Env Var                  |
| --------- | --------- | --------------------------- | ------------------------ |
| **Local** | Universal | Development/Testing         | `STORAGE_PROVIDER=local` |
| **R2**    | Global    | Cloudflare Workers (native) | `STORAGE_PROVIDER=r2`    |
| **S3**    | Global    | AWS deployments             | `STORAGE_PROVIDER=s3`    |

### Configuration Examples

**Local Development**:

```bash
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage
```

**Cloudflare R2**:

```bash
STORAGE_PROVIDER=r2
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**AWS S3**:

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=openlivestock-credit-reports
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Usage Example

```typescript
import {
  uploadFile,
  downloadFile,
  deleteFile,
} from '~/features/integrations/storage'

// Upload a file
const result = await uploadFile(
  'reports/report-123.pdf',
  pdfBuffer,
  'application/pdf',
)

if (result.success) {
  console.log('Uploaded to:', result.url)
}

// Download a file
const download = await downloadFile('reports/report-123.pdf')
if (download.success) {
  const pdfContent = download.content
}

// Delete a file
await deleteFile('reports/report-123.pdf')
```

---

**Plan Complete!**

This plan provides everything needed for one-pass implementation of the storage provider system. The pattern exactly mirrors the existing SMS/Email integrations, ensuring consistency and maintainability.

**Confidence Score**: 9/10 for one-pass success

**Key Success Factors**:

- Exact pattern replication from proven SMS/Email system
- Comprehensive validation commands at each step
- Clear provider implementation examples
- Detailed error handling patterns
- Integration tests for verification

**Potential Risks**:

- R2 presigned URLs deferred (acceptable for MVP)
- AWS SDK v3 API changes (mitigated by version pinning)
- Cloudflare Workers environment differences (mitigated by dynamic imports)
