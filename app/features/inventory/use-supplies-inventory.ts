import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  addSuppliesStockFn,
  createSuppliesInventoryFn,
  deleteSuppliesInventoryFn,
  reduceSuppliesStockFn,
  updateSuppliesInventoryFn,
} from './supplies-server'
import { INVENTORY_QUERY_KEYS } from './mutations'
import type { CreateSupplyInput, UpdateSupplyInput } from './supplies-server'

export function useSuppliesInventory() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('inventory')

  const createSupply = useMutation({
    mutationFn: (input: CreateSupplyInput) =>
      createSuppliesInventoryFn({ data: { input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.supplies })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.lowStockSupplies,
      })
      toast.success(t('supplies.messages.created'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateSupply = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplyInput }) =>
      updateSuppliesInventoryFn({ data: { id, input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.supplies })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.lowStockSupplies,
      })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.expiringSupplies,
      })
      toast.success(t('supplies.messages.updated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteSupply = useMutation({
    mutationFn: (id: string) => deleteSuppliesInventoryFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.supplies })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.lowStockSupplies,
      })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.expiringSupplies,
      })
      toast.success(t('supplies.messages.deleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const addStock = useMutation({
    mutationFn: ({
      supplyId,
      quantity,
    }: {
      supplyId: string
      quantity: number
    }) => addSuppliesStockFn({ data: { supplyId, quantity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.supplies })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.lowStockSupplies,
      })
      toast.success(t('supplies.messages.stockAdded'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const reduceStock = useMutation({
    mutationFn: ({
      supplyId,
      quantity,
    }: {
      supplyId: string
      quantity: number
    }) => reduceSuppliesStockFn({ data: { supplyId, quantity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.supplies })
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.lowStockSupplies,
      })
      toast.success(t('supplies.messages.stockReduced'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const isSubmitting =
    createSupply.isPending ||
    updateSupply.isPending ||
    deleteSupply.isPending ||
    addStock.isPending ||
    reduceStock.isPending

  return {
    createSupply: createSupply.mutate,
    updateSupply: updateSupply.mutate,
    deleteSupply: deleteSupply.mutate,
    addStock: addStock.mutate,
    reduceStock: reduceStock.mutate,
    isSubmitting,
  }
}
