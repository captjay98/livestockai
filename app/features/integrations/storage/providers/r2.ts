import type {
  ProviderResult,
  StorageDownloadResult,
  StorageOptions,
  StorageProvider,
  StorageResult,
} from '../../contracts'

// Cloudflare R2 types
interface R2Object {
  arrayBuffer: () => Promise<ArrayBuffer>
  httpMetadata?: {
    contentType?: string
  }
}

interface R2Bucket {
  put: (key: string, content: ArrayBuffer | Uint8Array, options?: {
    httpMetadata?: Record<string, string>
    customMetadata?: Record<string, string>
  }) => Promise<void>
  get: (key: string) => Promise<R2Object | null>
  delete: (key: string) => Promise<void>
}

interface CloudflareEnv {
  PUBLIC_STORAGE_BUCKET?: R2Bucket
  PRIVATE_STORAGE_BUCKET?: R2Bucket
  R2_PUBLIC_CDN_URL?: string
  R2_PRIVATE_URL?: string
}

export class R2Provider implements StorageProvider {
  readonly name = 'r2'

  private async getBucket(access: 'public' | 'private' = 'private'): Promise<R2Bucket | undefined> {
    try {
      const { env } = await import('cloudflare:workers')
      const cloudflareEnv = env as CloudflareEnv

      if (access === 'public') {
        return cloudflareEnv.PUBLIC_STORAGE_BUCKET
      }
      return cloudflareEnv.PRIVATE_STORAGE_BUCKET
    } catch {
      return undefined
    }
  }

  private getPublicUrl(key: string): string {
    // Try to get from environment, fallback to placeholder
    try {
      return `${process.env.R2_PUBLIC_CDN_URL || 'https://cdn.example.com'}/${key}`
    } catch {
      return `https://cdn.example.com/${key}`
    }
  }

  private getPrivateUrl(key: string): string {
    try {
      return `${process.env.R2_PRIVATE_URL || 'https://private.example.com'}/${key}`
    } catch {
      return `https://private.example.com/${key}`
    }
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

      if (options.access === 'public' && options.maxAge) {
        httpMetadata.cacheControl = `public, max-age=${options.maxAge}`
      }

      await bucket.put(key, content, {
        httpMetadata,
        customMetadata: options.metadata,
      })

      const url =
        options.access === 'public'
          ? this.getPublicUrl(key)
          : await this.getSignedUrl(key, 3600)

      return { success: true, url, key }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'R2 upload failed',
      }
    }
  }

  async download(key: string): Promise<StorageDownloadResult> {
    try {
      const bucket = await this.getBucket('private') || await this.getBucket('public')

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
      const bucket = await this.getBucket('private') || await this.getBucket('public')

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

  getSignedUrl(key: string, _expiresIn: number): Promise<string> {
    return Promise.resolve(this.getPrivateUrl(key))
  }
}
