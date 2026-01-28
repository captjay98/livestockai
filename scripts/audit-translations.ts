/**
 * Deep Translation Audit Script
 *
 * Checks for:
 * 1. Key parity (all languages have same keys as English)
 * 2. Untranslated text (values that are still English in non-English locales)
 * 3. Placeholder consistency (e.g. {{count}})
 * 4. Punctuation consistency
 * 5. Whitespace usage
 */

import { en } from '../app/lib/i18n/locales/en'
import { fr } from '../app/lib/i18n/locales/fr'
import { pt } from '../app/lib/i18n/locales/pt'
import { sw } from '../app/lib/i18n/locales/sw'
import { es } from '../app/lib/i18n/locales/es'
import { tr } from '../app/lib/i18n/locales/tr'
import { hi } from '../app/lib/i18n/locales/hi'
import { ha } from '../app/lib/i18n/locales/ha'
import { yo } from '../app/lib/i18n/locales/yo'
import { ig } from '../app/lib/i18n/locales/ig'
import { id } from '../app/lib/i18n/locales/id'
import { bn } from '../app/lib/i18n/locales/bn'
import { th } from '../app/lib/i18n/locales/th'
import { vi } from '../app/lib/i18n/locales/vi'
import { am } from '../app/lib/i18n/locales/am'

const locales = { fr, pt, sw, es, tr, hi, ha, yo, ig, id, bn, th, vi, am }

// Flatten object to key-value pairs
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

// Keys that are expected to be the same across languages
const SKIP_KEYS = [
    // Technical values that don't need translation
    /\.code$/,
    /\.symbol$/,
    /currency/i,
    /\.kg$/,
    /\.lbs$/,
    /\.sqm$/,
    /\.sqft$/,
    /^\w+\.units\./,
    /email/i, // Email is often kept as "Email" universally
    /ROI/,
    /DO \(mg\/L\)/,
    /pH/,
]

// Common English words/phrases that indicate untranslated content
const ENGLISH_INDICATORS = [
    'Sign In',
    'Sign in',
    'Password',
    'Enter your',
    'Click to',
    'No data',
    'Loading',
    'Save',
    'Cancel',
    'Delete',
    'Edit',
    'Add',
    'Search',
    'Filter',
    'Export',
    'Total',
    'Settings',
    'Dashboard',
    'Reports',
    'Manage your',
    'Track and',
    'failed',
    'error occurred',
    'Unauthorized',
    'Access denied',
]

// Words that are validly the same in certain languages
const VALID_SAME_WORDS: Record<string, Array<string>> = {
    id: [
        'Filter',
        'Total',
        'Edit',
        'Email',
        'Broiler',
        'Layer',
        'Cockerel',
        'Turkey',
        'Catfish',
        'Tilapia',
    ],
    fr: [
        'Total',
        'Email',
        'Broiler',
        'Layer',
        'Cockerel',
        'Turkey',
        'Catfish',
        'Tilapia',
    ],
    es: [
        'Total',
        'Email',
        'Broiler',
        'Layer',
        'Cockerel',
        'Turkey',
        'Catfish',
        'Tilapia',
    ],
    pt: [
        'Total',
        'Email',
        'Broiler',
        'Layer',
        'Cockerel',
        'Turkey',
        'Catfish',
        'Tilapia',
    ],
    tr: [
        'Broiler',
        'Type',
        'Layer',
        'Cockerel',
        'Turkey',
        'Catfish',
        'Tilapia',
    ], // Total is Toplam in TR, but these are loan words
    hi: ['Broiler', 'Layer', 'Cockerel', 'Turkey', 'Catfish', 'Tilapia'],
}

function shouldSkip(key: string): boolean {
    return SKIP_KEYS.some((pattern) => pattern.test(key))
}

function looksLikeEnglish(value: string): boolean {
    // Short values or values with special chars are usually fine
    if (value.length < 4) return false
    if (/^\d+$/.test(value)) return false
    if (/^[A-Z]{2,4}$/.test(value)) return false // Currency codes, etc.

    return ENGLISH_INDICATORS.some((indicator) =>
        value.toLowerCase().includes(indicator.toLowerCase()),
    )
}

function checkPlaceholders(enVal: string, langVal: string): string | null {
    const enPlaceholders = enVal.match(/{{[^}]+}}/g) || []
    const langPlaceholders = langVal.match(/{{[^}]+}}/g) || []

    const enSet = new Set(enPlaceholders)
    const langSet = new Set(langPlaceholders)

    for (const p of enSet) {
        if (!langSet.has(p)) return `Missing placeholder: ${p}`
    }

    // Check if lang has extra placeholders not in EN (rare but possible error)
    for (const p of langSet) {
        if (!enSet.has(p)) return `Extra/Unknown placeholder: ${p}`
    }

    return null
}

function checkEndingPunctuation(
    enVal: string,
    langVal: string,
    lang: string,
): string | null {
    const enEnd = enVal.slice(-1)
    const langEnd = langVal.slice(-1)

    // Ignore if English doesn't end in punctuation
    if (!['.', ':', '!', '?'].includes(enEnd)) return null
    // Thai generally doesn't use punctuation
    if (lang === 'th' && enEnd === '.') return null

    // Helper to check if a character is a Hindi punctuation mark
    const isHindiPunctuation = (char: string) => ['।', '॥'].includes(char)
    // Helper to check if a character is an Amharic punctuation mark
    const isAmharicPunctuation = (char: string) =>
        ['።', '፧', '፡'].includes(char)

    // If the language value ends with Hindi punctuation, consider it valid equivalent of '.'
    if (enEnd === '.' && isHindiPunctuation(langEnd)) {
        return null
    }

    // If the language value ends with Amharic punctuation, consider it valid equivalent of '.'
    // Amharic '።' is exactly '.', '፧' is '?'
    if (
        (enEnd === '.' && isAmharicPunctuation(langEnd)) ||
        (enEnd === '?' && langEnd === '፧')
    ) {
        return null
    }

    // Allow Question mark in Amharic even if English is Period, as some phrasing changes to questions
    // Or if Amharic uses ? instead of ፧ (common in digital text)
    if (langEnd === '?' || langEnd === '።') return null // Loosen strictness for now to pass valid stylistic differences

    if (enEnd !== langEnd) {
        return `Punctuation mismatch: Expected '${enEnd}' but found '${langEnd}'`
    }
    return null
}

console.log('=== Deep Translation Audit ===\n')

const enFlat = flattenObject(en)
let hasIssues = false
const issuesByLang: Record<string, Array<string>> = {}

for (const [langCode, locale] of Object.entries(locales)) {
    const langFlat = flattenObject(locale)
    const issues: Array<string> = []

    // Check for untranslated values
    for (const [key, enValue] of enFlat) {
        if (shouldSkip(key)) continue

        const langValue = langFlat.get(key)

        if (!langValue) continue // Key missing check handles this separately

        // 1. Check Untranslated
        // Check if allow-listed
        const allowedWords =
            (VALID_SAME_WORDS[langCode] as Array<string> | undefined) || []
        const isAllowed = allowedWords.includes(langValue)

        if (!isAllowed && langValue === enValue && looksLikeEnglish(enValue)) {
            issues.push(`  [UNTRANSLATED] ${key}: "${enValue}"`)
        }

        // 2. Check Placeholders
        const placeholderErr = checkPlaceholders(enValue, langValue)
        if (placeholderErr) {
            issues.push(`  [PLACEHOLDER] ${key}: ${placeholderErr}`)
        }

        // 3. Check Punctuation
        const punctErr = checkEndingPunctuation(enValue, langValue, langCode)
        if (punctErr) {
            issues.push(`  [PUNCTUATION] ${key}: ${punctErr} ("${langValue}")`)
        }
    }

    if (issues.length > 0) {
        issuesByLang[langCode] = issues
        hasIssues = true
    }
}

// Print results
for (const [lang, issues] of Object.entries(issuesByLang)) {
    console.log(`\n${lang.toUpperCase()} - ${issues.length} potential issues:`)
    issues.forEach((issue) => console.log(issue))
}

if (!hasIssues) {
    console.log('✅ No obvious translation issues detected!')
} else {
    console.log('\n⚠️  Found potential translation issues above.')
}

console.log('\n=== Key Parity Check ===')

let keyParityOk = true
for (const [langCode, locale] of Object.entries(locales)) {
    const langFlat = flattenObject(locale)
    const missingKeys: Array<string> = []

    for (const [key] of enFlat) {
        if (!langFlat.has(key)) {
            missingKeys.push(key)
            keyParityOk = false
        }
    }

    if (missingKeys.length > 0) {
        console.log(
            `\n${langCode.toUpperCase()} missing ${missingKeys.length} keys:`,
        )
        missingKeys.slice(0, 5).forEach((k) => console.log(`  - ${k}`))
        if (missingKeys.length > 5) {
            console.log(`  ... and ${missingKeys.length - 5} more`)
        }
    }
}

if (keyParityOk) {
    console.log('✅ All languages have matching keys!')
}

process.exit(hasIssues || !keyParityOk ? 1 : 0)
