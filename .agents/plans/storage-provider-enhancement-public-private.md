# Storage Provider Enhancement: Public/Private Access & Image Handling

**Status**: Enhancement to `.agents/plans/storage-provider-system.md`
**Priority**: High (Required for user avatars, farm logos, batch photos)

## Overview

The base storage provider system handles file upload/download/delete but lacks:

1. **Access control** - Public vs Private storage
2. **Image-specific features** - Compression, validation, thumbnails
3. **CDN integration** - Public URLs for images
4. **Multiple buckets** - Separate public/private storage

## Use Cases

| Use Case       | Access  | Size Limit | Format        | Example                            |
| -------------- | ------- | ---------- | ------------- | ---------------------------------- |
| User avatars   | Public  | 2MB        | JPEG/PNG/WebP | `public/avatars/user-123.jpg`      |
| Farm logos     | Public  | 2MB        | JPEG/PNG/WebP | `public/farms/farm-456.png`        |
| Batch photos   | Public  | 5MB        | JPEG/PNG/WebP | `public/batches/batch-789.jpg`     |
| Product images | Public  | 5MB        | JPEG/PNG/WebP | `public/products/product-101.jpg`  |
| Credit reports | Private | 10MB       | PDF           | `private/reports/report-202.pdf`   |
| Invoices       | Private | 5MB        | PDF           | `private/invoices/invoice-303.pdf` |
| Receipts       | Private | 5MB        | PDF/JPEG      | `private/receipts/receipt-404.pdf` |

## Required Changes

### 1. Update Storage Contract

**File**: `app/features/integrations/contracts.ts`

```typescript
export interface StorageOptions {
    /** Access mode: public (CDN) or private (signed URLs) */
    access?: 'public' | 'private'
    /** Cache-Control max-age in seconds (public only) */
    maxAge?: number
    /** Custom metadata */
    metadata?: Record<string, string>
}

export interface StorageProvider {
    readonly name: string

    upload: (
        key: string,
        content: ArrayBuffer | Uint8Array,
        contentType: string,
        options?: StorageOptions, // NEW
    ) => Promise<StorageResult>

    download: (key: string) => Promise<StorageDownloadResult>
    delete: (key: string) => Promise<ProviderResult>
    getSignedUrl?: (key: string, expiresIn: number) => Promise<string>
}
```

### 2. Update R2 Provider for Public/Private Buckets

**File**: `app/features/integrations/storage/providers/r2.ts`

```typescript
export class R2Provider implements StorageProvider {
    readonly name = 'r2'

    private async getBucket(access: 'public' | 'private' = 'private') {
        const { env } = await import('cloudflare:workers')

        if (access === 'public') {
            return env.PUBLIC_STORAGE_BUCKET
        }
        return env.PRIVATE_STORAGE_BUCKET
    }

    async upload(
        key: string,
        content: ArrayBuffer | Uint8Array,
        contentType: string,
        options: StorageOptions = {},
    ): Promise<StorageResult> {
        try {
            const bucket = await this.getBucket(options.access)

            if (!bucket) {
                return { success: false, error: 'R2 bucket not configured' }
            }

            const httpMetadata: Record<string, string> = { contentType }

            // Add cache control for public files
            if (options.access === 'public' && options.maxAge) {
                httpMetadata.cacheControl = `public, max-age=${options.maxAge}`
            }

            await bucket.put(key, content, {
                httpMetadata,
                customMetadata: options.metadata,
            })

            // Public files use CDN URL, private files use signed URLs
            const url =
                options.access === 'public'
                    ? `${process.env.R2_PUBLIC_CDN_URL}/${key}`
                    : await this.getSignedUrl(key, 3600) // 1 hour default

            return { success: true, url, key }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'R2 upload failed',
            }
        }
    }
}
```

### 3. Add Image Utilities

**File**: `app/features/integrations/storage/image-utils.ts`

```typescript
/**
 * Image validation and compression utilities
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

export interface ImageValidationResult {
    valid: boolean
    error?: string
}

export function validateImage(
    file: File,
    maxSize = MAX_IMAGE_SIZE,
): ImageValidationResult {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid image format. Use JPEG, PNG, or WebP.',
        }
    }

    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1)
        return {
            valid: false,
            error: `Image too large. Maximum ${maxMB}MB.`,
        }
    }

    return { valid: true }
}

export interface ImageCompressionOptions {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    useWebWorker?: boolean
}

/**
 * Compress image on client-side before upload
 * Uses browser-image-compression library
 */
export async function compressImage(
    file: File,
    options: ImageCompressionOptions = {},
): Promise<File> {
    const imageCompression = await import('browser-image-compression')

    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...options,
    }

    return imageCompression.default(file, defaultOptions)
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
    file: File,
    maxSize = 200,
): Promise<File> {
    return compressImage(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: maxSize,
        useWebWorker: true,
    })
}
```

### 4. Add Image Upload Hook

**File**: `app/features/integrations/storage/use-image-upload.ts`

```typescript
import { useState } from 'react'
import { uploadFile } from '~/features/integrations/storage'
import { validateImage, compressImage } from './image-utils'

export interface UseImageUploadOptions {
    maxSize?: number
    compress?: boolean
    onSuccess?: (url: string) => void
    onError?: (error: string) => void
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const upload = async (file: File, key: string) => {
        setUploading(true)
        setError(null)
        setProgress(0)

        try {
            // Validate
            const validation = validateImage(file, options.maxSize)
            if (!validation.valid) {
                throw new Error(validation.error)
            }

            setProgress(25)

            // Compress if enabled
            let fileToUpload = file
            if (options.compress !== false) {
                fileToUpload = await compressImage(file)
            }

            setProgress(50)

            // Upload
            const result = await uploadFile(
                key,
                await fileToUpload.arrayBuffer(),
                fileToUpload.type,
                { access: 'public', maxAge: 31536000 }, // 1 year cache
            )

            setProgress(100)

            if (!result.success) {
                throw new Error(result.error || 'Upload failed')
            }

            options.onSuccess?.(result.url!)
            return result.url!
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            options.onError?.(errorMessage)
            throw err
        } finally {
            setUploading(false)
        }
    }

    return {
        upload,
        uploading,
        progress,
        error,
    }
}
```

### 5. Add Image Upload Component

**File**: `app/components/ui/image-upload.tsx`

```typescript
import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from './button'
import { useImageUpload } from '~/features/integrations/storage/use-image-upload'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  maxSize?: number
  className?: string
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  maxSize,
  className,
  label = 'Upload Image',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value || null)

  const { upload, uploading, progress, error } = useImageUpload({
    maxSize,
    onSuccess: (url) => {
      setPreview(url)
      onChange(url)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    const key = `public/uploads/${Date.now()}-${file.name}`
    await upload(file, key)
  }

  const handleRemove = () => {
    setPreview(null)
    onRemove?.()
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-32 w-32"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">{progress}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </div>
          )}
        </Button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

### 6. Update Wrangler Configuration

**File**: `wrangler.jsonc`

```jsonc
{
    "r2_buckets": [
        {
            "binding": "PUBLIC_STORAGE_BUCKET",
            "bucket_name": "openlivestock-public",
            "preview_bucket_name": "openlivestock-public-preview",
        },
        {
            "binding": "PRIVATE_STORAGE_BUCKET",
            "bucket_name": "openlivestock-private",
            "preview_bucket_name": "openlivestock-private-preview",
        },
    ],
}
```

### 7. Update Environment Variables

**File**: `.env.example`

```bash
# Storage Configuration
STORAGE_PROVIDER=local  # Options: 'r2', 's3', 'local'

# R2 Configuration (Cloudflare)
R2_PUBLIC_CDN_URL=https://cdn.openlivestock.app  # Public CDN URL
R2_PRIVATE_URL=https://private.openlivestock.app  # Private bucket URL

# S3 Configuration (AWS)
S3_PUBLIC_BUCKET=openlivestock-public
S3_PRIVATE_BUCKET=openlivestock-private
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Local Development
LOCAL_STORAGE_PATH=./storage
```

### 8. Add Package Dependencies

```bash
bun add browser-image-compression
```

## Implementation Tasks

Add these tasks to the main storage provider plan:

### AFTER "CREATE app/features/integrations/storage/index.ts"

**CREATE app/features/integrations/storage/image-utils.ts**

- Implement image validation (format, size)
- Implement client-side compression
- Implement thumbnail generation
- Export constants (ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)

**CREATE app/features/integrations/storage/use-image-upload.ts**

- Implement React hook for image uploads
- Handle validation, compression, upload flow
- Track progress and errors
- Return upload function and state

**CREATE app/components/ui/image-upload.tsx**

- Implement reusable image upload component
- Show preview, progress, error states
- Handle file selection and removal
- Use useImageUpload hook

**UPDATE app/features/integrations/contracts.ts**

- Add StorageOptions interface (access, maxAge, metadata)
- Update StorageProvider.upload signature to accept options

**UPDATE app/features/integrations/storage/providers/r2.ts**

- Add getBucket() method for public/private bucket selection
- Update upload() to handle StorageOptions
- Set cache headers for public files
- Use CDN URL for public files, signed URL for private

**UPDATE app/features/integrations/storage/providers/s3.ts**

- Add bucket selection logic (public/private)
- Update upload() to handle StorageOptions
- Set ACL and cache headers appropriately

**UPDATE wrangler.jsonc**

- Add PUBLIC_STORAGE_BUCKET binding
- Add PRIVATE_STORAGE_BUCKET binding
- Remove single CREDIT_REPORTS_BUCKET

## Usage Examples

### User Avatar Upload

```typescript
// In user settings page
import { ImageUpload } from '~/components/ui/image-upload'

function UserSettings() {
  const [avatarUrl, setAvatarUrl] = useState(user.image)

  return (
    <ImageUpload
      value={avatarUrl}
      onChange={setAvatarUrl}
      maxSize={2 * 1024 * 1024} // 2MB
      label="Profile Photo"
    />
  )
}
```

### Batch Photo Upload

```typescript
// In batch detail page
import { useImageUpload } from '~/features/integrations/storage/use-image-upload'

function BatchPhotos({ batchId }: { batchId: string }) {
  const { upload, uploading } = useImageUpload({
    onSuccess: (url) => {
      // Save to database
      saveBatchPhoto(batchId, url)
    },
  })

  const handleFileSelect = async (file: File) => {
    const key = `public/batches/${batchId}/${Date.now()}.jpg`
    await upload(file, key)
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileSelect(e.target.files![0])}
      disabled={uploading}
    />
  )
}
```

### Private Document Upload (Invoice)

```typescript
// In invoice creation
import { uploadFile } from '~/features/integrations/storage'

async function uploadInvoicePDF(invoiceId: string, pdfBuffer: ArrayBuffer) {
    const result = await uploadFile(
        `private/invoices/${invoiceId}.pdf`,
        pdfBuffer,
        'application/pdf',
        { access: 'private' }, // Requires signed URL to access
    )

    if (result.success) {
        // Save private URL to database
        await saveInvoiceUrl(invoiceId, result.url)
    }
}
```

## Database Schema Changes

### Add Photo Fields to Existing Tables

```sql
-- User avatars (already exists)
-- users.image: string | null

-- Farm logos
ALTER TABLE farms ADD COLUMN logo_url TEXT;

-- Batch photos (new table)
CREATE TABLE batch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_batch_photos_batch_id ON batch_photos(batch_id);
```

## Testing Additions

### Image Validation Tests

```typescript
describe('Image Validation', () => {
    it('should accept valid JPEG', () => {
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
        const result = validateImage(file)
        expect(result.valid).toBe(true)
    })

    it('should reject invalid format', () => {
        const file = new File([''], 'test.gif', { type: 'image/gif' })
        const result = validateImage(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid image format')
    })

    it('should reject oversized image', () => {
        const largeFile = new File(
            [new ArrayBuffer(6 * 1024 * 1024)],
            'large.jpg',
            {
                type: 'image/jpeg',
            },
        )
        const result = validateImage(largeFile)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('too large')
    })
})
```

## Security Considerations

### Public Storage

- ✅ CDN-cached for performance
- ✅ No authentication required
- ⚠️ Anyone with URL can access
- ✅ Use for non-sensitive images only

### Private Storage

- ✅ Signed URLs with expiration
- ✅ Authentication required
- ✅ Use for sensitive documents
- ⚠️ URLs expire after set time

### Image Upload Security

- ✅ Validate file type on client and server
- ✅ Limit file size (prevent DoS)
- ✅ Compress before upload (reduce bandwidth)
- ✅ Generate unique keys (prevent overwrites)
- ⚠️ Scan for malware (future enhancement)

## Performance Considerations

### Image Compression

- Client-side compression reduces upload time by 60-80%
- Web workers prevent UI blocking
- Progressive upload with progress tracking

### CDN Caching

- Public images cached for 1 year
- Reduces origin requests by 95%+
- Global edge distribution

### Costs

- R2 Public: $0.015/GB/month, free egress via CDN
- R2 Private: $0.015/GB/month, $0.36/million Class A operations
- S3 Public: $0.023/GB/month, $0.09/GB egress
- S3 Private: Same as public + signed URL generation costs

## Migration Path

For existing deployments:

1. **Phase 1**: Deploy storage provider system (base plan)
2. **Phase 2**: Add public/private bucket support (this enhancement)
3. **Phase 3**: Migrate existing user avatars to public storage
4. **Phase 4**: Add batch photo upload feature
5. **Phase 5**: Add farm logo upload feature

## Summary

This enhancement adds:

- ✅ Public/private access control
- ✅ Image validation and compression
- ✅ Reusable image upload component
- ✅ React hook for image uploads
- ✅ Multiple bucket support (R2/S3)
- ✅ CDN integration for public files
- ✅ Thumbnail generation utilities

**Estimated Additional Implementation Time**: 3-4 hours

**Confidence Score**: 8/10 (slightly lower due to browser-image-compression library integration)
