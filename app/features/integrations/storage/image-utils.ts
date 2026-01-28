/**
 * Image validation and compression utilities
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
export const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

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

/**
 * Validate PDF file
 */
export function validatePdf(
    file: File,
    maxSize = MAX_PDF_SIZE,
): ImageValidationResult {
    if (file.type !== 'application/pdf') {
        return {
            valid: false,
            error: 'Invalid file format. Use PDF only.',
        }
    }

    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1)
        return {
            valid: false,
            error: `PDF too large. Maximum ${maxMB}MB.`,
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
