import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteFile,
  downloadFile,
  getStorageProviderName,
  isStorageConfigured,
  uploadFile,
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
