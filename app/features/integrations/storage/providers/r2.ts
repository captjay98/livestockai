import type {
  ProviderResult,
  StorageDownloadResult,
  StorageOptions,
  StorageProvider,
  StorageResult,
} from '../../contracts'

export class R2Provider implements StorageProvider {
  readonly name = 'r2'

  private async getBucket(access: 'public' | 'private' = 'private') {
    const { env } = await import('cloudflare:workers')

    if (access === 'public') {
      return (env as any).PUBLIC_STORAGE_BUCKET
    }
    return (env as any).PRIVATE_STORAGE_BUCKET
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
          ? `${process.env.R2_PUBLIC_CDN_URL}/${key}`
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
      const { env } = await import('cloudflare:workers')
      const bucket =
        (env as any).PRIVATE_STORAGE_BUCKET ||
        (env as any).PUBLIC_STORAGE_BUCKET

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
      const bucket =
        (env as any).PRIVATE_STORAGE_BUCKET ||
        (env as any).PUBLIC_STORAGE_BUCKET

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
    return Promise.resolve(`${process.env.R2_PRIVATE_URL}/${key}`)
  }
}
