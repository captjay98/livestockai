import type {
  ProviderResult,
  StorageDownloadResult,
  StorageOptions,
  StorageProvider,
  StorageResult,
} from '../../contracts'

export class S3Provider implements StorageProvider {
  readonly name = 's3'

  private getBucketName(access: 'public' | 'private' = 'private'): string {
    return access === 'public'
      ? process.env.S3_PUBLIC_BUCKET || ''
      : process.env.S3_PRIVATE_BUCKET || ''
  }

  async upload(
    key: string,
    content: ArrayBuffer | Uint8Array,
    contentType: string,
    options: StorageOptions = {},
  ): Promise<StorageResult> {
    const bucket = this.getBucketName(options.access)
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return { success: false, error: 'S3 bucket or region not configured' }
    }

    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })

      const cacheControl =
        options.access === 'public' && options.maxAge
          ? `public, max-age=${options.maxAge}`
          : undefined

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: new Uint8Array(content),
          ContentType: contentType,
          CacheControl: cacheControl,
          ACL: options.access === 'public' ? 'public-read' : 'private',
          Metadata: options.metadata,
        }),
      )

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

      return { success: true, url, key }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 upload failed',
      }
    }
  }

  async download(key: string): Promise<StorageDownloadResult> {
    const bucket = process.env.S3_PRIVATE_BUCKET || process.env.S3_PUBLIC_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return { success: false, error: 'S3 bucket or region not configured' }
    }

    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      )

      const content = await response.Body?.transformToByteArray()

      return {
        success: true,
        content: content?.buffer as ArrayBuffer | undefined,
        contentType: response.ContentType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 download failed',
      }
    }
  }

  async delete(key: string): Promise<ProviderResult> {
    const bucket = process.env.S3_PRIVATE_BUCKET || process.env.S3_PUBLIC_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      return { success: false, error: 'S3 bucket or region not configured' }
    }

    try {
      const { S3Client, DeleteObjectCommand } =
        await import('@aws-sdk/client-s3')

      const client = new S3Client({ region })
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 delete failed',
      }
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const bucket = process.env.S3_PRIVATE_BUCKET || process.env.S3_PUBLIC_BUCKET
    const region = process.env.AWS_REGION

    if (!bucket || !region) {
      throw new Error('S3 bucket or region not configured')
    }

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')

    const client = new S3Client({ region })
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })

    return getSignedUrl(client, command, { expiresIn })
  }
}
