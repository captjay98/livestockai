import QRCode from 'qrcode'

/**
 * Generate QR code as data URL for report verification
 */
export async function generateVerificationQR(
    reportId: string,
    baseUrl: string,
): Promise<string> {
    const verificationUrl = buildVerificationUrl(reportId, baseUrl)
    return await QRCode.toDataURL(verificationUrl)
}

/**
 * Build verification URL for a report
 */
export function buildVerificationUrl(
    reportId: string,
    baseUrl: string,
): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    return `${cleanBaseUrl}/verify/${reportId}`
}
