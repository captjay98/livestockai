# Storage System Documentation

## Overview

OpenLivestock uses a multi-provider storage system supporting R2 (Cloudflare), S3 (AWS), and Local (development) storage with public/private access control.

## Storage Types

### Public Storage (CDN-cached)

- **Use cases**: Farm logos, structure photos, batch growth photos, marketplace images, breed reference photos
- **Access**: Direct CDN URLs with long cache times
- **Performance**: Fast, globally distributed

### Private Storage (Signed URLs)

- **Use cases**: User avatars, vaccination certificates, treatment prescriptions, expense receipts, invoice attachments
- **Access**: Time-limited signed URLs
- **Security**: Secure, auditable access

## Database Schema

### Tables with Storage Fields

| Table            | Field             | Type   | Storage | Purpose                              |
| ---------------- | ----------------- | ------ | ------- | ------------------------------------ |
| `users`          | `image`           | text   | Private | User avatar                          |
| `structures`     | `photos`          | text[] | Public  | Structure photos                     |
| `batches`        | `photos`          | jsonb  | Public  | Growth tracking photos with metadata |
| `breed_requests` | `photoUrl`        | text   | Public  | Reference photo                      |
| `vaccinations`   | `certificateUrl`  | text   | Private | Vaccination certificate PDF          |
| `treatments`     | `prescriptionUrl` | text   | Private | Prescription/vet report PDF          |
| `expenses`       | `receiptUrl`      | text   | Private | Receipt photo/PDF                    |
| `invoices`       | `attachments`     | text[] | Private | Payment proofs, receipts             |

### Batch Photos Structure

```typescript
{
  url: string          // Storage URL
  capturedAt: string   // ISO timestamp
  notes?: string       // Optional caption
}
```

## API Reference

### Upload File

```typescript
import { uploadFile } from '~/features/integrations'

const result = await uploadFile(
    'public/batches/batch-123/photo-1.jpg',
    fileBuffer,
    'image/jpeg',
    {
        access: 'public',
        maxAge: 31536000, // 1 year cache
    },
)
```

### Download File

```typescript
import { downloadFile } from '~/features/integrations'

const result = await downloadFile('private/receipts/receipt-456.pdf')
if (result.success) {
    const blob = new Blob([result.data], { type: result.contentType })
}
```

### Delete File

```typescript
import { deleteFile } from '~/features/integrations'

await deleteFile('public/photos/old-photo.jpg')
```

### Get Signed URL

```typescript
import { getSignedUrl } from '~/features/integrations'

const url = await getSignedUrl('private/certificate.pdf', 3600) // 1 hour
```

## React Components

### Image Upload

```typescript
import { ImageUpload } from '~/components/ui/image-upload'

<ImageUpload
  onUpload={(url) => console.log('Uploaded:', url)}
  maxSizeMB={2}
  access="private"
/>
```

### Multiple Images Hook

```typescript
import { useImageUpload } from '~/features/integrations/storage/use-image-upload'

const { upload, uploading, progress, error } = useImageUpload({
    access: 'public',
    onSuccess: (url) => console.log('Uploaded:', url),
})
```

## Validation

### Image Validation

```typescript
import {
    validateImage,
    MAX_IMAGE_SIZE,
    MAX_AVATAR_SIZE,
} from '~/features/integrations/storage/image-utils'

const result = validateImage(file, MAX_AVATAR_SIZE)
if (!result.valid) {
    console.error(result.error)
}
```

### PDF Validation

```typescript
import {
    validatePdf,
    MAX_PDF_SIZE,
} from '~/features/integrations/storage/image-utils'

const result = validatePdf(file, MAX_PDF_SIZE)
if (!result.valid) {
    console.error(result.error)
}
```

## Configuration

### Environment Variables

**R2 (Cloudflare):**

```env
STORAGE_PROVIDER=r2
R2_PUBLIC_CDN_URL=https://pub-xxx.r2.dev
R2_PRIVATE_URL=https://xxx.r2.cloudflarestorage.com
```

**S3 (AWS):**

```env
STORAGE_PROVIDER=s3
S3_PUBLIC_BUCKET=my-public-bucket
S3_PRIVATE_BUCKET=my-private-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

**Local (Development):**

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage
```

### Wrangler Bindings (R2)

```jsonc
{
    "r2_buckets": [
        {
            "binding": "PUBLIC_STORAGE_BUCKET",
            "bucket_name": "openlivestock-public",
        },
        {
            "binding": "PRIVATE_STORAGE_BUCKET",
            "bucket_name": "openlivestock-private",
        },
    ],
}
```

## Best Practices

### 1. Always Validate Files

```typescript
// Images
const validation = validateImage(file, MAX_IMAGE_SIZE)
if (!validation.valid) {
    throw new Error(validation.error)
}

// PDFs
const pdfValidation = validatePdf(file, MAX_PDF_SIZE)
if (!pdfValidation.valid) {
    throw new Error(pdfValidation.error)
}
```

### 2. Compress Images Client-Side

```typescript
import { compressImage } from '~/features/integrations/storage/image-utils'

const compressed = await compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
})
```

### 3. Use Appropriate Access Levels

- **Public**: Non-sensitive data that benefits from CDN caching
- **Private**: Personal data, financial documents, medical records

### 4. Clean Up Unused Files

```typescript
// When deleting a batch, delete associated photos
if (batch.photos) {
    for (const photo of batch.photos) {
        await deleteFile(extractKeyFromUrl(photo.url))
    }
}
```

### 5. Handle Errors Gracefully

```typescript
const result = await uploadFile(key, buffer, contentType)
if (!result.success) {
    console.error('Upload failed:', result.error)
    // Show user-friendly error message
    // Retry with exponential backoff
}
```

## File Size Limits

| Type    | Limit | Constant          |
| ------- | ----- | ----------------- |
| Images  | 5MB   | `MAX_IMAGE_SIZE`  |
| Avatars | 2MB   | `MAX_AVATAR_SIZE` |
| PDFs    | 10MB  | `MAX_PDF_SIZE`    |

## Supported Formats

### Images

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)

### Documents

- PDF (`.pdf`)

## Security Considerations

1. **Private URLs expire** - Signed URLs have time limits (default 1 hour)
2. **User avatars are private** - Sensitive personal data
3. **Financial documents are private** - Receipts, invoices, certificates
4. **Validate file types** - Prevent malicious uploads
5. **Limit file sizes** - Prevent storage abuse

### ⚠️ R2 Signed URL Limitation

**Current Status**: R2 provider returns direct URLs instead of time-limited signed URLs.

**Impact**: Private files in R2 are accessible via direct URL without expiration. This is acceptable for:

- Internal documents with obscure URLs
- Files behind authentication layers
- Development/testing environments

**Not recommended for**:

- Highly sensitive documents (use S3 instead)
- Compliance-required access controls
- Public-facing production without additional auth

**Workaround**: Use S3 provider for production if signed URLs are required.

**Future**: Will be implemented when Cloudflare adds R2 presigned URL support.

## Performance Tips

1. **Compress images** before upload (reduces bandwidth)
2. **Use CDN for public files** (faster global access)
3. **Set appropriate cache headers** (reduce repeated downloads)
4. **Lazy load images** (improve page load times)
5. **Generate thumbnails** for large images

## Migration Notes

All storage-related columns have been added to the initial migration (`2025-01-08-001-initial-schema.ts`). No separate migrations needed.

To apply:

```bash
bun run db:migrate
```

## Future Enhancements

### Planned Features

1. **R2 Presigned URLs** - Implement when Cloudflare adds support
    - Time-limited access to private files
    - Enhanced security for sensitive documents

2. **Multiple File Upload** - Batch upload component

    ```typescript
    <MultipleImageUpload
      maxFiles={5}
      onUpload={(urls) => console.log(urls)}
    />
    ```

3. **CSV File Validation** - Support for data imports

    ```typescript
    import { validateCsv } from '~/features/integrations/storage/file-utils'

    const result = validateCsv(file, { maxSizeMB: 5 })
    ```

4. **Automatic Thumbnail Generation** - Server-side image processing
    - Generate thumbnails on upload
    - Multiple sizes (small, medium, large)
    - WebP conversion for better compression

5. **Storage Usage Analytics** - Track storage consumption
    - Per-farm storage usage
    - Cost estimation
    - Cleanup recommendations

### Implementation Priority

**High Priority** (Next Sprint):

- Multiple file upload component
- CSV validation

**Medium Priority** (Q2 2026):

- R2 presigned URLs (when available)
- Automatic thumbnails

**Low Priority** (Future):

- Storage analytics
- Video support
