/**
 * PDF generation service for feed formulations
 */

export interface FormulationPdfData {
  name: string
  species: string
  productionStage: string
  batchSizeKg: string
  totalCostPerKg: string
  ingredients: Array<{
    name: string
    percentage: number
    quantity: number
    cost: number
  }>
  nutritionalValues: {
    protein: number
    energy: number
    fat: number
    fiber: number
    calcium: number
    phosphorus: number
    lysine: number
    methionine: number
  }
  mixingInstructions?: string | null
}

/**
 * Generate PDF for a formulation
 */
export async function generateFormulationPdf(
  data: FormulationPdfData,
  currencySymbol: string = '$',
): Promise<Blob> {
  // Dynamic import for client-side only
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Header
  doc.setFontSize(20)
  doc.text(data.name, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(12)
  doc.text(
    `${data.species} • ${data.productionStage} • ${data.batchSizeKg}kg batch`,
    pageWidth / 2,
    yPos,
    { align: 'center' },
  )
  yPos += 15

  // Cost Summary
  doc.setFontSize(14)
  doc.text('Cost Summary', 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  const totalCost = (
    parseFloat(data.totalCostPerKg) * parseFloat(data.batchSizeKg)
  ).toFixed(2)
  doc.text(`Cost per kg: ${currencySymbol}${data.totalCostPerKg}`, 20, yPos)
  yPos += 6
  doc.text(`Total batch cost: ${currencySymbol}${totalCost}`, 20, yPos)
  yPos += 6
  doc.text(`Batch size: ${data.batchSizeKg}kg`, 20, yPos)
  yPos += 12

  // Ingredients Table
  doc.setFontSize(14)
  doc.text('Ingredients', 20, yPos)
  yPos += 8

  doc.setFontSize(9)
  const tableHeaders = ['Ingredient', '%', 'Quantity (kg)', 'Cost']
  const colWidths = [80, 20, 35, 35]
  let xPos = 20

  // Table header
  tableHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos)
    xPos += colWidths[i]
  })
  yPos += 6

  // Table rows
  data.ingredients.forEach((ing) => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    xPos = 20
    doc.text(ing.name, xPos, yPos)
    xPos += colWidths[0]
    doc.text(ing.percentage.toFixed(1), xPos, yPos)
    xPos += colWidths[1]
    doc.text(ing.quantity.toFixed(2), xPos, yPos)
    xPos += colWidths[2]
    doc.text(`${currencySymbol}${ing.cost.toFixed(2)}`, xPos, yPos)
    yPos += 6
  })
  yPos += 8

  // Nutritional Analysis
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.text('Nutritional Analysis', 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  const nutrients = [
    ['Protein', `${data.nutritionalValues.protein.toFixed(1)}%`],
    ['Energy', `${data.nutritionalValues.energy.toFixed(0)} kcal/kg`],
    ['Fat', `${data.nutritionalValues.fat.toFixed(1)}%`],
    ['Fiber', `${data.nutritionalValues.fiber.toFixed(1)}%`],
    ['Calcium', `${data.nutritionalValues.calcium.toFixed(2)}%`],
    ['Phosphorus', `${data.nutritionalValues.phosphorus.toFixed(2)}%`],
    ['Lysine', `${data.nutritionalValues.lysine.toFixed(2)}%`],
    ['Methionine', `${data.nutritionalValues.methionine.toFixed(2)}%`],
  ]

  nutrients.forEach(([name, value]) => {
    doc.text(`${name}: ${value}`, 20, yPos)
    yPos += 6
  })
  yPos += 8

  // Mixing Instructions
  if (data.mixingInstructions) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.text('Mixing Instructions', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    const lines = doc.splitTextToSize(data.mixingInstructions, pageWidth - 40)
    lines.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 20, yPos)
      yPos += 6
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    )
  }

  return doc.output('blob')
}
