import { en } from '../app/lib/i18n/locales/en'
import { fr } from '../app/lib/i18n/locales/fr'

function flattenObject(obj: any, prefix = ''): Map<string, string> {
  const result = new Map<string, string>()
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (typeof value === 'object' && value !== null) {
      const nested = flattenObject(value, fullKey)
      nested.forEach((v, k) => result.set(k, v))
    } else if (typeof value === 'string') {
      result.set(fullKey, value)
    }
  }
  return result
}

const enFlat = flattenObject(en)
const frFlat = flattenObject(fr)

const missing: Array<string> = []
for (const [key] of enFlat) {
  if (!frFlat.has(key)) {
    missing.push(key)
  }
}

console.log('Missing keys in FR:')
missing.forEach((k) => console.log(k))
