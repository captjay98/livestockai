import { sign, verify } from '@noble/ed25519'

/**
 * Hash content using SHA-256
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)

  // Use Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Sign report hash with Ed25519 private key
 */
export async function signReport(
  hash: string,
  privateKey: Uint8Array,
): Promise<string> {
  const hashBytes = new Uint8Array(
    hash.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  )
  const signature = await sign(hashBytes, privateKey)
  return Array.from(signature)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify report signature
 */
export async function verifyReport(
  hash: string,
  signature: string,
  publicKey: string,
): Promise<boolean> {
  try {
    const hashBytes = new Uint8Array(
      hash.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
    )
    const sigBytes = new Uint8Array(
      signature.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
    )
    const pubKeyBytes = new Uint8Array(
      publicKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
    )

    return await verify(sigBytes, hashBytes, pubKeyBytes)
  } catch {
    return false
  }
}

/**
 * Calculate expiration date
 */
export function calculateExpirationDate(
  startDate: Date,
  validityDays: 30 | 60 | 90,
): Date {
  // Handle invalid start date
  if (isNaN(startDate.getTime())) {
    // Return max safe date for invalid input
    return new Date(8640000000000000) // Max JS date
  }

  const expiration = new Date(startDate)
  expiration.setDate(expiration.getDate() + validityDays)

  // Check for invalid date (overflow)
  if (isNaN(expiration.getTime())) {
    // Return max safe date
    return new Date(8640000000000000) // Max JS date
  }

  return expiration
}

/**
 * Check if report is expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
