import { useQuery } from '@tanstack/react-query'
import {
  getStructureFn,
  getStructuresFn,
  getStructuresWithCountsFn,
} from './server'
import { STRUCTURE_QUERY_KEYS } from './mutations'

export function useStructures(farmId: string | null) {
  return useQuery({
    queryKey: STRUCTURE_QUERY_KEYS.list(farmId || undefined),
    queryFn: () =>
      farmId ? getStructuresFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })
}

export function useStructuresWithCounts(farmId: string | null) {
  return useQuery({
    queryKey: STRUCTURE_QUERY_KEYS.withCounts(farmId || undefined),
    queryFn: () =>
      farmId
        ? getStructuresWithCountsFn({ data: { farmId } })
        : Promise.resolve([]),
    enabled: !!farmId,
  })
}

export function useStructure(structureId: string | null) {
  return useQuery({
    queryKey: STRUCTURE_QUERY_KEYS.detail(structureId || ''),
    queryFn: () =>
      structureId
        ? getStructureFn({ data: { structureId } })
        : Promise.resolve(null),
    enabled: !!structureId,
  })
}
