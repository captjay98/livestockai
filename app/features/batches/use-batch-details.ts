import { useEffect, useState } from 'react'
import type {
  BatchMetrics,
  ExpenseRecord,
  FeedRecord,
  MortalityRecord,
  SaleRecord,
} from '~/features/batches/types'
import { getBatchDetailsFn } from '~/features/batches/server'
import { getFeedRecordsPaginatedServerFn } from '~/features/feed/server'
import { getMortalityRecordsPaginatedFn } from '~/features/mortality/server'
import { getExpensesPaginatedFn } from '~/features/expenses/server'
import { getSalesPaginatedFn } from '~/features/sales/server'

interface UseBatchDetailsResult {
  details: Awaited<ReturnType<typeof getBatchDetailsFn>> | null
  feedRecords: Array<FeedRecord>
  mortalityRecords: Array<MortalityRecord>
  expenses: Array<ExpenseRecord>
  sales: Array<SaleRecord>
  metrics: BatchMetrics | null
  isLoading: boolean
}

export function useBatchDetails(batchId: string): UseBatchDetailsResult {
  const [details, setDetails] = useState<Awaited<
    ReturnType<typeof getBatchDetailsFn>
  > | null>(null)
  const [feedRecords, setFeedRecords] = useState<Array<FeedRecord>>([])
  const [mortalityRecords, setMortalityRecords] = useState<
    Array<MortalityRecord>
  >([])
  const [expenses, setExpenses] = useState<Array<ExpenseRecord>>([])
  const [sales, setSales] = useState<Array<SaleRecord>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const result = await getBatchDetailsFn({ data: { batchId } })
        setDetails(result)

        // Load Tab Data (Parallel)
        const [feed, mortality, exp, sale] = await Promise.all([
          getFeedRecordsPaginatedServerFn({
            data: { batchId, page: 1, pageSize: 20 },
          }),
          getMortalityRecordsPaginatedFn({
            data: { batchId, page: 1, pageSize: 20 },
          }),
          getExpensesPaginatedFn({ data: { batchId, page: 1, pageSize: 20 } }),
          getSalesPaginatedFn({ data: { batchId, page: 1, pageSize: 20 } }),
        ])

        setFeedRecords(feed.data)
        setMortalityRecords(mortality.data)
        setExpenses(exp.data)
        setSales(sale.data)
      } catch (err) {
        console.error('Failed to load batch details:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (batchId) loadData()
  }, [batchId])

  const metrics: BatchMetrics | null = details
    ? (() => {
        const {
          batch,
          mortality,
          feed,
          sales: batchSales,
          expenses: batchExpenses,
        } = details

        const totalInvestment =
          Number(batch.totalCost) + feed.totalCost + (batchExpenses.total || 0)
        const netProfit = batchSales.totalRevenue - totalInvestment
        const costPerUnit =
          batch.currentQuantity > 0
            ? totalInvestment / batch.currentQuantity
            : 0
        const avgSalesPrice =
          batchSales.totalQuantity > 0
            ? batchSales.totalRevenue / batchSales.totalQuantity
            : 0
        const roi =
          totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0

        return {
          currentQuantity: batch.currentQuantity,
          initialQuantity: batch.initialQuantity,
          mortalityCount: mortality.totalDeaths,
          mortalityRate: mortality.rate,
          feedTotalKg: feed.totalKg,
          feedFcr: feed.fcr,
          totalInvestment,
          costPerUnit,
          totalRevenue: batchSales.totalRevenue,
          totalSold: batchSales.totalQuantity,
          avgSalesPrice,
          netProfit,
          roi,
        }
      })()
    : null

  return {
    details,
    feedRecords,
    mortalityRecords,
    expenses,
    sales,
    metrics,
    isLoading,
  }
}
