import { useNavigate } from '@tanstack/react-router'
import type { InvoiceSearchParams } from './types'

interface UseInvoicePageProps {
    routePath: string
}

export function useInvoicePage({ routePath }: UseInvoicePageProps) {
    const navigate = useNavigate({ from: routePath as any })

    const updateSearch = (updates: Partial<InvoiceSearchParams>) => {
        navigate({
            // @ts-ignore - Type limitation
            search: (prev: InvoiceSearchParams) => ({
                ...prev,
                ...updates,
            }),
        })
    }

    return {
        updateSearch,
    }
}
