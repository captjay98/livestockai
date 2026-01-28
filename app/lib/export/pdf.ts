import { jsPDF } from 'jspdf'
import type { UserSettings } from '~/features/settings/currency-presets'
import { formatCurrency as formatWithSettings } from '~/features/settings/currency-formatter'

interface InvoiceData {
    invoiceNumber: string
    date: Date
    dueDate?: Date | null
    farmName: string
    farmLocation: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    customerLocation?: string | null
    items: Array<{
        description: string
        quantity: number
        unitPrice: number
        total: number
    }>
    totalAmount: number
    status: string
    notes?: string | null
}

/**
 * Generate PDF invoice
 */
export function generateInvoicePDF(
    invoice: InvoiceData,
    settings: UserSettings,
): jsPDF {
    const formatPdfCurrency = (amount: number): string =>
        formatWithSettings(amount, settings)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Invoice details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, y)
    doc.text(
        `Date: ${new Date(invoice.date).toLocaleDateString()}`,
        pageWidth - 20,
        y,
        { align: 'right' },
    )
    y += 6
    if (invoice.dueDate) {
        doc.text(
            `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
            pageWidth - 20,
            y,
            { align: 'right' },
        )
        y += 6
    }
    doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, y, {
        align: 'right',
    })
    y += 15

    // From section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('From:', 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(invoice.farmName, 20, y)
    y += 5
    doc.text(invoice.farmLocation, 20, y)
    y += 15

    // To section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(invoice.customerName, 20, y)
    y += 5
    if (invoice.customerPhone) {
        doc.text(invoice.customerPhone, 20, y)
        y += 5
    }
    if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, 20, y)
        y += 5
    }
    if (invoice.customerLocation) {
        doc.text(invoice.customerLocation, 20, y)
        y += 5
    }
    y += 10

    // Items table header
    doc.setFillColor(240, 240, 240)
    doc.rect(20, y, pageWidth - 40, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 25, y + 6)
    doc.text('Qty', 100, y + 6)
    doc.text('Unit Price', 125, y + 6)
    doc.text('Total', pageWidth - 25, y + 6, { align: 'right' })
    y += 12

    // Items
    doc.setFont('helvetica', 'normal')
    for (const item of invoice.items) {
        doc.text(item.description, 25, y)
        doc.text(item.quantity.toString(), 100, y)
        doc.text(formatPdfCurrency(item.unitPrice), 125, y)
        doc.text(formatPdfCurrency(item.total), pageWidth - 25, y, {
            align: 'right',
        })
        y += 7
    }

    // Total
    y += 5
    doc.line(20, y, pageWidth - 20, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total:', 125, y)
    doc.text(formatPdfCurrency(invoice.totalAmount), pageWidth - 25, y, {
        align: 'right',
    })

    // Notes
    if (invoice.notes) {
        y += 20
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 20, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.text(invoice.notes, 20, y)
    }

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Thank you for your business!', pageWidth / 2, 280, {
        align: 'center',
    })

    return doc
}

interface ReportPDFOptions {
    title: string
    period?: { startDate: string; endDate: string }
    sections: Array<{
        title: string
        type: 'summary' | 'table'
        data:
            | Array<{ label: string; value: string }>
            | Array<Record<string, string | number>>
        columns?: Array<string>
    }>
}

/**
 * Generate PDF report
 */
export function generateReportPDF(options: ReportPDFOptions): jsPDF {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(options.title, pageWidth / 2, y, { align: 'center' })
    y += 10

    // Period
    if (options.period) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(
            `Period: ${options.period.startDate} to ${options.period.endDate}`,
            pageWidth / 2,
            y,
            { align: 'center' },
        )
        y += 5
    }

    // Generated date
    doc.setFontSize(8)
    doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        y,
        {
            align: 'center',
        },
    )
    y += 15

    // Sections
    for (const section of options.sections) {
        // Check if we need a new page
        if (y > 250) {
            doc.addPage()
            y = 20
        }

        // Section title
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(section.title, 20, y)
        y += 8

        if (section.type === 'summary') {
            // Summary section (key-value pairs)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            for (const item of section.data as Array<{
                label: string
                value: string
            }>) {
                doc.text(`${item.label}:`, 25, y)
                doc.text(item.value, 100, y)
                y += 6
            }
        } else if (section.columns) {
            // Table section
            const colWidth = (pageWidth - 40) / section.columns.length

            // Header
            doc.setFillColor(240, 240, 240)
            doc.rect(20, y, pageWidth - 40, 7, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            section.columns.forEach((col, i) => {
                doc.text(col, 25 + i * colWidth, y + 5)
            })
            y += 10

            // Rows
            doc.setFont('helvetica', 'normal')
            for (const row of section.data as Array<
                Record<string, string | number>
            >) {
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }
                section.columns.forEach((col, i) => {
                    const key = col.toLowerCase().replace(/ /g, '')
                    const value = String(key in row ? row[key] : row[col])
                    doc.text(value.substring(0, 25), 25 + i * colWidth, y)
                })
                y += 6
            }
        }
        y += 10
    }

    return doc
}

/**
 * Download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(`${filename}.pdf`)
}

interface PaymentReceiptData {
    receiptNumber: string
    paymentDate: Date
    farmName: string
    workerName: string
    periodStart: Date
    periodEnd: Date
    totalHours: number
    wageRate: number
    wageRateType: 'hourly' | 'daily' | 'monthly'
    grossWages: number
    amountPaid: number
    paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money'
}

/**
 * Generate PDF payment receipt
 */
export function generatePaymentReceiptPDF(
    receipt: PaymentReceiptData,
    settings: UserSettings,
): jsPDF {
    const formatPdfCurrency = (amount: number): string =>
        formatWithSettings(amount, settings)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Receipt details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Receipt #: ${receipt.receiptNumber}`, 20, y)
    doc.text(
        `Date: ${new Date(receipt.paymentDate).toLocaleDateString()}`,
        pageWidth - 20,
        y,
        { align: 'right' },
    )
    y += 15

    // Farm
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('From:', 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(receipt.farmName, 20, y)
    y += 15

    // Worker
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Paid To:', 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(receipt.workerName, 20, y)
    y += 15

    // Pay period box
    doc.setFillColor(240, 240, 240)
    doc.rect(20, y, pageWidth - 40, 30, 'F')
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Pay Period', 25, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.text(
        `${new Date(receipt.periodStart).toLocaleDateString()} - ${new Date(receipt.periodEnd).toLocaleDateString()}`,
        25,
        y,
    )
    y += 7
    doc.text(`Total Hours: ${receipt.totalHours.toFixed(1)}`, 25, y)
    y += 18

    // Wage details
    doc.setFont('helvetica', 'bold')
    doc.text('Wage Details', 20, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    const rateLabel =
        receipt.wageRateType === 'hourly'
            ? '/hour'
            : receipt.wageRateType === 'daily'
              ? '/day'
              : '/month'
    doc.text(`Rate: ${formatPdfCurrency(receipt.wageRate)}${rateLabel}`, 25, y)
    y += 6
    doc.text(`Gross Wages: ${formatPdfCurrency(receipt.grossWages)}`, 25, y)
    y += 15

    // Payment info
    doc.line(20, y, pageWidth - 20, y)
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Amount Paid:', 25, y)
    doc.text(formatPdfCurrency(receipt.amountPaid), pageWidth - 25, y, {
        align: 'right',
    })
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const methodLabel =
        receipt.paymentMethod === 'bank_transfer'
            ? 'Bank Transfer'
            : receipt.paymentMethod === 'mobile_money'
              ? 'Mobile Money'
              : 'Cash'
    doc.text(`Payment Method: ${methodLabel}`, 25, y)
    y += 20

    // Signature lines
    doc.line(20, y + 15, 80, y + 15)
    doc.line(pageWidth - 80, y + 15, pageWidth - 20, y + 15)
    doc.setFontSize(8)
    doc.text('Worker Signature', 50, y + 20, { align: 'center' })
    doc.text('Authorized Signature', pageWidth - 50, y + 20, {
        align: 'center',
    })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
        'This receipt confirms payment for services rendered.',
        pageWidth / 2,
        280,
        { align: 'center' },
    )

    return doc
}
