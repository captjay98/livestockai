import type {
  ProviderResult,
  StorageDownloadResult,
  StorageOptions,
  StorageProvider,
  StorageResult,
} from '../contracts'

type ProviderFactory = () => Promise<StorageProvider>

const providers = new Map<string, ProviderFactory>([
  ['r2', async () => new (await import('./providers/r2')).R2Provider()],
  ['s3', async () => new (await import('./providers/s3')).S3Provider()],
  [
    'local',
    async () => new (await import('./providers/local')).LocalProvider(),
  ],
])

async function getProvider(): Promise<StorageProvider | null> {
  const name = process.env.STORAGE_PROVIDER
  if (!name) return null
  const factory = providers.get(name)
  if (!factory) return null
  return factory()
}

export async function uploadFile(
  key: string,
  content: ArrayBuffer | Uint8Array,
  contentType: string,
  options?: StorageOptions,
): Promise<StorageResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.upload(key, content, contentType, options)
}

export async function downloadFile(
  key: string,
): Promise<StorageDownloadResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.download(key)
}

export async function deleteFile(key: string): Promise<ProviderResult> {
  const provider = await getProvider()
  if (!provider) {
    return { success: false, error: 'Storage provider not configured' }
  }
  return provider.delete(key)
}

export async function getSignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  const provider = await getProvider()
  if (!provider?.getSignedUrl) return null
  return provider.getSignedUrl(key, expiresIn)
}

export function getStorageProviderName(): string | null {
  return process.env.STORAGE_PROVIDER || null
}

export function isStorageConfigured(): boolean {
  const name = process.env.STORAGE_PROVIDER
  return !!name && providers.has(name)
}
