import { useState } from 'react'
import { compressImage, validateImage } from './image-utils'
import { uploadFile } from './index'

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
