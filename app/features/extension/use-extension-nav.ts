import { useQuery } from '@tanstack/react-query'
import { getUserDistrictsFn } from './server'

export const EXTENSION_QUERY_KEYS = {
  userDistricts: ['user-districts'] as const,
} as const

export interface District {
  districtId: string
  districtName: string
  isSupervisor: boolean
  assignedAt: string
}

export interface ExtensionNavState {
  isExtensionWorker: boolean
  isSupervisor: boolean
  districts: Array<District>
}

export function useExtensionNav(): ExtensionNavState {
  const { data: districts = [] } = useQuery({
    queryKey: EXTENSION_QUERY_KEYS.userDistricts,
    queryFn: () => getUserDistrictsFn(),
  })

  const isExtensionWorker = districts.length > 0
  const isSupervisor = districts.some((d) => d.isSupervisor)

  return {
    isExtensionWorker,
    isSupervisor,
    districts,
  }
}
