import { jsPDF } from 'jspdf'
import { formatNaira } from '~/lib/currency'

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
export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
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
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' })
  y += 6
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' })
    y += 6
  }
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, y, { align: 'right' })
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
    doc.text(formatNaira(item.unitPrice), 125, y)
    doc.text(formatNaira(item.total), pageWidth - 25, y, { align: 'right' })
    y += 7
  }

  // Total
  y += 5
  doc.line(20, y, pageWidth - 20, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total:', 125, y)
  doc.text(formatNaira(invoice.totalAmount), pageWidth - 25, y, { align: 'right' })

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
  doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' })

  return doc
}


interface ReportPDFOptions {
  title: string
  period?: { startDate: string; endDate: string }
  sections: Array<{
    title: string
    type: 'summary' | 'table'
    data: Array<{ label: string; value: string }> | Array<Record<string, string | number>>
    columns?: string[]
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
    doc.text(`Period: ${options.period.startDate} to ${options.period.endDate}`, pageWidth / 2, y, { align: 'center' })
    y += 5
  }

  // Generated date
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' })
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
      for (const item of section.data as Array<{ label: string; value: string }>) {
        doc.text(`${item.label}:`, 25, y)
        doc.text(item.value, 100, y)
        y += 6
      }
    } else if (section.type === 'table' && section.columns) {
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
      for (const row of section.data as Array<Record<string, string | number>>) {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        section.columns.forEach((col, i) => {
          const value = String(row[col.toLowerCase().replace(/ /g, '')] ?? row[col] ?? '')
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
