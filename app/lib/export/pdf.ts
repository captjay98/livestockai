/**
 * PDF Export Service
 * DISABLED - PDF export removed to reduce bundle size
 */

/**
 * Generate invoice PDF (disabled)
 */
export function generateInvoicePDF(_options: any): any {
  throw new Error('PDF export disabled to reduce bundle size')
}

/**
 * Generate report PDF (disabled)
 */
export function generateReportPDF(_options: any): any {
  throw new Error('PDF export disabled to reduce bundle size')
}

/**
 * Generate payment receipt PDF (disabled)
 */
export function generatePaymentReceiptPDF(_options: any): any {
  throw new Error('PDF export disabled to reduce bundle size')
}

/**
 * Download PDF (disabled)
 */
export function downloadPDF(
  _doc: any,
  _filename: string,
  _settings?: any,
): void {
  throw new Error('PDF export disabled to reduce bundle size')
}
