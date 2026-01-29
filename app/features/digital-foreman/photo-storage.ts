/**
 * Photo storage utilities for Digital Foreman task photos.
 * Uses the existing storage provider system (R2/S3/Local).
 */

import {
  deleteFile,
  isStorageConfigured,
  uploadFile,
} from '~/features/integrations/storage'

/**
 * Upload a task photo to storage
 *
 * @param assignmentId - Task assignment ID
 * @param base64Data - Base64 encoded image data
 * @param farmId - Farm ID for organizing storage
 * @returns URL of uploaded photo or null if storage not configured
 */
export async function uploadTaskPhoto(
  assignmentId: string,
  base64Data: string,
  farmId: string,
): Promise<string | null> {
  if (!isStorageConfigured()) {
    // Return base64 data as fallback when storage not configured
    return base64Data
  }

  // Remove data URL prefix if present
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Detect content type from base64 prefix or default to jpeg
  let contentType = 'image/jpeg'
  if (base64Data.startsWith('data:image/png')) {
    contentType = 'image/png'
  } else if (base64Data.startsWith('data:image/webp')) {
    contentType = 'image/webp'
  }

  // Generate unique filename
  const timestamp = Date.now()
  const extension = contentType.split('/')[1]
  const key = `private/task-photos/${farmId}/${assignmentId}/${timestamp}.${extension}`

  const result = await uploadFile(key, bytes, contentType, {
    access: 'private',
  })

  if (result.success && result.url) {
    return result.url
  }

  // Fallback to base64 if upload fails
  console.error('Failed to upload task photo:', result.error)
  return base64Data
}

/**
 * Delete a task photo from storage
 *
 * @param photoUrl - URL of the photo to delete
 * @returns True if deleted successfully
 */
export async function deleteTaskPhoto(photoUrl: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    return true // Nothing to delete if storage not configured
  }

  // Skip if it's a base64 data URL
  if (photoUrl.startsWith('data:')) {
    return true
  }

  // Extract key from URL
  const key = extractKeyFromUrl(photoUrl)
  if (!key) {
    return false
  }

  const result = await deleteFile(key)
  return result.success
}

/**
 * Extract storage key from URL
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Remove leading slash
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    return null
  }
}

/**
 * Compress image on client side before upload
 * This should be called in the browser before sending to server
 *
 * @param file - File object from input
 * @param maxSizeMB - Maximum size in MB
 * @param maxWidthOrHeight - Maximum dimension
 * @returns Compressed base64 string
 */
export async function compressImageForUpload(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if needed
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight
            width = maxWidthOrHeight
          } else {
            width = (width / height) * maxWidthOrHeight
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Start with high quality and reduce if needed
        let quality = 0.9
        let result = canvas.toDataURL('image/jpeg', quality)

        // Reduce quality until under size limit
        while (
          result.length > maxSizeMB * 1024 * 1024 * 1.37 &&
          quality > 0.1
        ) {
          quality -= 0.1
          result = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(result)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
