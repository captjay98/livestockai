/**
 * Result returned by all provider operations
 */
export interface ProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * SMS Provider Contract
 * Implement this interface to add a new SMS provider
 */
export interface SMSProvider {
  readonly name: string
  send: (to: string, message: string) => Promise<ProviderResult>
}

/**
 * Email Provider Contract
 * Implement this interface to add a new Email provider
 */
export interface EmailProvider {
  readonly name: string
  send: (to: string, subject: string, html: string) => Promise<ProviderResult>
}

/**
 * Storage options for upload operations
 */
export interface StorageOptions {
  /** Access mode: public (CDN) or private (signed URLs) */
  access?: 'public' | 'private'
  /** Cache-Control max-age in seconds (public only) */
  maxAge?: number
  /** Custom metadata */
  metadata?: Record<string, string>
}

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
    options?: StorageOptions,
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
