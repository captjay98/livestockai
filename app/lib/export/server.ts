import {
    getEggReport,
    getFeedReport,
    getInventoryReport,
    getProfitLossReport,
    getSalesReport,
} from '~/features/reports/server'
import { AppError } from '~/lib/errors'

/**
 * @module Export
 *
 * Handles data export functionality for various system reports.
 * Converts report data into downloadable formats (CSV, etc.).
 */

/**
 * Parameters for generating a downloadable report.
 */
export interface ExportOptions {
    /** The logic/data source (e.g., 'profit-loss', 'inventory') */
    reportType: string
    /** Output file format */
    format: 'xlsx' | 'pdf'
    /** Optional specific farm filter */
    farmId?: string
    /** Lower bound for date-filtered data (ISO string) */
    startDate: string
    /** Upper bound for date-filtered data (ISO string) */
    endDate: string
}

/**
 * Orchestrates data retrieval and transformation into CSV format for export.
 *
 * @param options - Report type and filtering criteria
 * @returns Object contains raw CSV string and metadata for browser download
 */
export async function generateExportData(options: ExportOptions): Promise<{
    content: string
    filename: string
    mimeType: string
}> {
    try {
        let csvContent = ''
        let filename = ''

        switch (options.reportType) {
            case 'profit-loss': {
                const report = await getProfitLossReport({
                    data: {
                        farmId: options.farmId,
                        startDate: options.startDate,
                        endDate: options.endDate,
                        dateRangeType: 'custom',
                    },
                })
                filename = `profit-loss-report-${options.startDate}-to-${options.endDate}`

                csvContent = 'Profit & Loss Report\n'
                csvContent += `Period: ${options.startDate} to ${options.endDate}\n\n`

                csvContent += 'REVENUE\n'
                csvContent += 'Type,Amount\n'
                for (const item of report.revenue.byType) {
                    csvContent += `${item.type},${item.amount}\n`
                }
                csvContent += `Total Revenue,${report.revenue.total}\n\n`

                csvContent += 'EXPENSES\n'
                csvContent += 'Category,Amount\n'
                for (const item of report.expenses.byCategory) {
                    csvContent += `${item.category},${item.amount}\n`
                }
                csvContent += `Total Expenses,${report.expenses.total}\n\n`

                csvContent += 'SUMMARY\n'
                csvContent += `Net Profit,${report.profit}\n`
                csvContent += `Profit Margin,${report.profitMargin}%\n`
                break
            }

            case 'inventory': {
                const report = await getInventoryReport({
                    data: { farmId: options.farmId },
                })
                filename = `inventory-report-${new Date().toISOString().split('T')[0]}`

                csvContent = 'Inventory Report\n\n'
                csvContent += 'SUMMARY\n'
                csvContent += `Total Poultry,${report.summary.totalPoultry}\n`
                csvContent += `Total Fish,${report.summary.totalFish}\n`
                csvContent += `Total Mortality,${report.summary.totalMortality}\n`
                csvContent += `Overall Mortality Rate,${report.summary.overallMortalityRate}%\n\n`

                csvContent += 'BATCHES\n'
                csvContent +=
                    'Species,Type,Initial Qty,Current Qty,Mortality,Mortality Rate,Status\n'
                for (const batch of report.batches) {
                    csvContent += `${batch.species},${batch.livestockType},${batch.initialQuantity},${batch.currentQuantity},${batch.mortalityCount},${batch.mortalityRate}%,${batch.status}\n`
                }
                break
            }

            case 'sales': {
                const report = await getSalesReport({
                    data: {
                        farmId: options.farmId,
                        startDate: options.startDate,
                        endDate: options.endDate,
                        dateRangeType: 'custom',
                    },
                })
                filename = `sales-report-${options.startDate}-to-${options.endDate}`

                csvContent = 'Sales Report\n'
                csvContent += `Period: ${options.startDate} to ${options.endDate}\n\n`

                csvContent += 'SUMMARY\n'
                csvContent += `Total Sales,${report.summary.totalSales}\n`
                csvContent += `Total Revenue,${report.summary.totalRevenue}\n\n`

                csvContent += 'BY TYPE\n'
                csvContent += 'Type,Quantity,Revenue\n'
                for (const item of report.summary.byType) {
                    csvContent += `${item.type},${item.quantity},${item.revenue}\n`
                }
                csvContent += '\n'

                csvContent += 'TRANSACTIONS\n'
                csvContent += 'Date,Type,Quantity,Unit Price,Total,Customer\n'
                for (const sale of report.sales) {
                    csvContent += `${new Date(sale.date).toLocaleDateString()},${sale.livestockType},${sale.quantity},${sale.unitPrice},${sale.totalAmount},${sale.customerName || ''}\n`
                }
                break
            }

            case 'feed': {
                const report = await getFeedReport({
                    data: {
                        farmId: options.farmId,
                        startDate: options.startDate,
                        endDate: options.endDate,
                        dateRangeType: 'custom',
                    },
                })
                filename = `feed-report-${options.startDate}-to-${options.endDate}`

                csvContent = 'Feed Report\n'
                csvContent += `Period: ${options.startDate} to ${options.endDate}\n\n`

                csvContent += 'SUMMARY\n'
                csvContent += `Total Feed (kg),${report.summary.totalFeedKg}\n`
                csvContent += `Total Cost,${report.summary.totalCost}\n\n`

                csvContent += 'BY FEED TYPE\n'
                csvContent += 'Feed Type,Quantity (kg),Cost\n'
                for (const item of report.summary.byFeedType) {
                    csvContent += `${item.type},${item.quantityKg},${item.cost}\n`
                }
                csvContent += '\n'

                csvContent += 'RECORDS\n'
                csvContent += 'Species,Feed Type,Quantity (kg),Cost\n'
                for (const record of report.records) {
                    csvContent += `${record.species},${record.feedType},${record.totalQuantityKg},${record.totalCost}\n`
                }
                break
            }

            case 'eggs': {
                const report = await getEggReport({
                    data: {
                        farmId: options.farmId,
                        startDate: options.startDate,
                        endDate: options.endDate,
                        dateRangeType: 'custom',
                    },
                })
                filename = `egg-production-report-${options.startDate}-to-${options.endDate}`

                csvContent = 'Egg Production Report\n'
                csvContent += `Period: ${options.startDate} to ${options.endDate}\n\n`

                csvContent += 'SUMMARY\n'
                csvContent += `Total Collected,${report.summary.totalCollected}\n`
                csvContent += `Total Sold,${report.summary.totalSold}\n`
                csvContent += `Total Broken,${report.summary.totalBroken}\n`
                csvContent += `Current Inventory,${report.summary.currentInventory}\n`
                csvContent += `Average Laying %,${report.summary.averageLayingPercentage}%\n\n`

                csvContent += 'DAILY RECORDS\n'
                csvContent += 'Date,Collected,Broken,Sold,Inventory\n'
                for (const record of report.records) {
                    csvContent += `${new Date(record.date).toLocaleDateString()},${record.collected},${record.broken},${record.sold},${record.inventory}\n`
                }
                break
            }

            default:
                throw new AppError('VALIDATION_ERROR', {
                    message: `Unknown report type: ${options.reportType}`,
                })
        }

        return {
            content: csvContent,
            filename: `${filename}.csv`,
            mimeType: 'text/csv',
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('INTERNAL_ERROR', {
            message: 'Failed to generate export data',
            cause: error,
        })
    }
}
