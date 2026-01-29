import type {
    ProviderResult,
    StorageDownloadResult,
    StorageOptions,
    StorageProvider,
    StorageResult,
} from '../../contracts'

export class LocalProvider implements StorageProvider {
    readonly name = 'local'

    async upload(
        key: string,
        content: ArrayBuffer | Uint8Array,
        _contentType: string,
        _options: StorageOptions = {},
    ): Promise<StorageResult> {
        try {
            const fs = await import('node:fs/promises')
            const path = await import('node:path')

            const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
            const filePath = path.join(storageDir, key)

            await fs.mkdir(path.dirname(filePath), { recursive: true })
            await fs.writeFile(filePath, new Uint8Array(content))

            return {
                success: true,
                url: `/storage/${key}`,
                key,
            }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Local upload failed',
            }
        }
    }

    async download(key: string): Promise<StorageDownloadResult> {
        try {
            const fs = await import('node:fs/promises')
            const path = await import('node:path')

            const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
            const filePath = path.join(storageDir, key)

            const content = await fs.readFile(filePath)

            return {
                success: true,
                content: content.buffer,
                contentType: 'application/octet-stream',
            }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Local download failed',
            }
        }
    }

    async delete(key: string): Promise<ProviderResult> {
        try {
            const fs = await import('node:fs/promises')
            const path = await import('node:path')

            const storageDir = process.env.LOCAL_STORAGE_PATH || './storage'
            const filePath = path.join(storageDir, key)

            await fs.unlink(filePath)

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Local delete failed',
            }
        }
    }
}
