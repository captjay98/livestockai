import { describe, expect, it } from 'vitest'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_AVATAR_SIZE,
  MAX_IMAGE_SIZE,
  validateImage,
} from '~/features/integrations/storage/image-utils'

describe('Image Validation', () => {
  describe('validateImage', () => {
    it('should accept valid JPEG', () => {
      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PNG', () => {
      const file = new File(['test content'], 'test.png', {
        type: 'image/png',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid WebP', () => {
      const file = new File(['test content'], 'test.webp', {
        type: 'image/webp',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid format (GIF)', () => {
      const file = new File(['test content'], 'test.gif', {
        type: 'image/gif',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid image format')
    })

    it('should reject invalid format (SVG)', () => {
      const file = new File(['test content'], 'test.svg', {
        type: 'image/svg+xml',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid image format')
    })

    it('should reject oversized image with default limit', () => {
      const largeContent = new ArrayBuffer(6 * 1024 * 1024) // 6MB
      const file = new File([largeContent], 'large.jpg', {
        type: 'image/jpeg',
      })
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
      expect(result.error).toContain('5.0MB')
    })

    it('should reject oversized image with custom limit', () => {
      const content = new ArrayBuffer(3 * 1024 * 1024) // 3MB
      const file = new File([content], 'medium.jpg', { type: 'image/jpeg' })
      const result = validateImage(file, MAX_AVATAR_SIZE) // 2MB limit
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
      expect(result.error).toContain('2.0MB')
    })

    it('should accept image within custom size limit', () => {
      const content = new ArrayBuffer(1 * 1024 * 1024) // 1MB
      const file = new File([content], 'small.jpg', { type: 'image/jpeg' })
      const result = validateImage(file, MAX_AVATAR_SIZE) // 2MB limit
      expect(result.valid).toBe(true)
    })
  })

  describe('Constants', () => {
    it('should export correct allowed image types', () => {
      expect(ALLOWED_IMAGE_TYPES).toEqual([
        'image/jpeg',
        'image/png',
        'image/webp',
      ])
    })

    it('should export correct max image size', () => {
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024) // 5MB
    })

    it('should export correct max avatar size', () => {
      expect(MAX_AVATAR_SIZE).toBe(2 * 1024 * 1024) // 2MB
    })
  })
})
