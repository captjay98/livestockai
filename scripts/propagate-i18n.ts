import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

const SRC_LANG = 'en'
const TARGET_LANGS = [
  'es',
  'fr',
  'pt',
  'sw',
  'hi',
  'tr',
  'ha',
  'yo',
  'ig',
  'am',
  'bn',
  'id',
  'th',
  'vi',
]
const BASE_PATH = join(process.cwd(), 'app/lib/i18n/locales')

// Since JS parsing is hard without a full parser, let's use a simpler strategy for this specific task:
// 1. Extension.ts -> add 10 keys
// 2. Settings.ts -> add 4 keys
// 3. New a11y keys in various files.

const NEW_KEYS: Record<string, Record<string, string>> = {
  'extension.ts': {
    accessApproved: 'Access Approved',
    accessApprovedDesc: 'The extension worker can now access your farm data.',
    accessDenied: 'Access Denied',
    accessDeniedDesc: 'The access request has been denied.',
    accessRevoked: 'Access Revoked',
    accessRevokedDesc:
      'The extension worker no longer has access to your farm.',
    approveAccessFailed: 'Failed to approve access request',
    denyAccessFailed: 'Failed to deny access request',
    revokeAccessFailed: 'Failed to revoke access',
    error: 'Error',
    toggleSupervisor: 'Toggle supervisor status',
    removeFromDistrict: 'Remove from district',
  },
  'settings.ts': {
    syncSuccess: 'Sync completed successfully',
    syncFailed: 'Sync failed. Please try again.',
    cacheCleared: 'Cache cleared successfully',
    cacheClearFailed: 'Failed to clear cache',
  },
  'notifications.ts': {
    markAsRead: 'Mark as read',
    ariaLabel: 'Notifications',
  },
  'batches.ts': {
    farmLocation: 'Farm Location',
    backToBatches: 'Back to batches',
  },
  'digitalForeman.ts': {
    downloadReceipt: 'Download Receipt',
  },
  'common.ts': {
    toggleMenu: 'Toggle menu',
  },
  'marketplace.ts': {
    closeGallery: 'Close photo gallery',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
  },
}

function runPropagation() {
  const enDir = join(BASE_PATH, SRC_LANG)
  const files = readdirSync(enDir).filter((f) => f.endsWith('.ts'))

  for (const lang of TARGET_LANGS) {
    const langDir = join(BASE_PATH, lang)
    if (!existsSync(langDir)) {
      mkdirSync(langDir, { recursive: true })
    }

    for (const file of files) {
      const srcPath = join(enDir, file)
      const targetPath = join(langDir, file)

      if (!existsSync(targetPath)) {
        console.log(`[${lang}] Creating missing file: ${file}`)
        writeFileSync(targetPath, readFileSync(srcPath, 'utf-8'))
        continue
      }

      let content = readFileSync(targetPath, 'utf-8')
      const missingKeys = NEW_KEYS[file]

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (missingKeys) {
        let updated = false
        for (const [key, val] of Object.entries(missingKeys)) {
          if (!content.includes(`${key}:`)) {
            // Find the last closing brace and insert before it
            // This is a bit risky if there are multiple objects, but usually ours have one main export
            const lastBraceIndex = content.lastIndexOf('}')
            if (lastBraceIndex !== -1) {
              content =
                content.substring(0, lastBraceIndex) +
                `  ${key}: '${val}',\n` +
                content.substring(lastBraceIndex)
              updated = true
            }
          }
        }
        if (updated) {
          console.log(`[${lang}] Updated ${file} with missing keys`)
          writeFileSync(targetPath, content)
        }
      }
    }

    // Also ensure index.ts exists and is correct (though usually it just exports everything)
    const indexSrc = readFileSync(join(enDir, 'index.ts'), 'utf-8')
    writeFileSync(join(langDir, 'index.ts'), indexSrc)
  }
}

runPropagation()
console.log('Propagation complete!')
