import { useQuery } from '@tanstack/react-query'
import { getUserDistrictsFn } from './server'

export interface District {
    districtId: string
    districtName: string | null
    districtSlug: string | null
    districtLevel: number | null
    isSupervisor: boolean
    assignedAt: Date
}

export interface ExtensionNavState {
    isExtensionWorker: boolean
    isSupervisor: boolean
    districts: Array<District>
}

export function useExtensionNav(): ExtensionNavState {
    const { data: districts = [] as Array<District> } = useQuery({
        queryKey: ['user-districts'],
        queryFn: () => getUserDistrictsFn(),
    })

    const isExtensionWorker = districts.length > 0
    const isSupervisor = districts.some((d: District) => d.isSupervisor)

    return {
        isExtensionWorker,
        isSupervisor,
        districts: districts,
    }
}
