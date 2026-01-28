import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { z } from 'zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FuzzedListing } from '~/features/marketplace/privacy-fuzzer'
import { getListingsFn } from '~/features/marketplace/server'
import { ListingFilters } from '~/components/marketplace/listing-filters'
import { ListingCard } from '~/components/marketplace/listing-card'
import { StalenessIndicator } from '~/components/marketplace/staleness-indicator'
import { Button } from '~/components/ui/button'

const marketplaceSearchSchema = z.object({
  page: z.number().int().positive().catch(1),
  pageSize: z.number().int().positive().max(50).catch(20),
  livestockType: z.enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees']).optional(),
  species: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  radiusKm: z.number().positive().max(500).catch(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'distance', 'newest']).catch('newest'),
})

type MarketplaceFilters = z.infer<typeof marketplaceSearchSchema>

export const Route = createFileRoute('/marketplace/' as const)({
  validateSearch: marketplaceSearchSchema,
  
  loaderDeps: ({ search }) => search,

  loader: async ({ deps }) => {
    return getListingsFn({ data: deps })
  },

  component: MarketplacePage,
})

function MarketplacePage() {
  const { t } = useTranslation('marketplace')
  const result = Route.useLoaderData()
  const search = Route.useSearch()
  const [filters, setFilters] = useState<MarketplaceFilters>(search)

  const listings = result.data
  const totalPages = result.totalPages
  const currentPage = result.currentPage

  // Transform search params to ListingFilters format
  const listingFilters = {
    livestockType: search.livestockType || '',
    species: search.species || '',
    minPrice: search.minPrice?.toString() || '',
    maxPrice: search.maxPrice?.toString() || '',
    distanceRadius: search.radiusKm.toString(),
  }

  const handleFiltersChange = (newFilters: typeof listingFilters) => {
    setFilters({
      ...filters,
      livestockType: newFilters.livestockType as any,
      species: newFilters.species,
      minPrice: newFilters.minPrice ? parseFloat(newFilters.minPrice) : undefined,
      maxPrice: newFilters.maxPrice ? parseFloat(newFilters.maxPrice) : undefined,
      radiusKm: newFilters.distanceRadius ? parseFloat(newFilters.distanceRadius) : filters.radiusKm,
    })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('browse.title')}</h1>
        <p className="text-muted-foreground">{t('browse.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ListingFilters filters={listingFilters} onFiltersChange={handleFiltersChange} />
        </div>

        <div className="lg:col-span-3">
          <StalenessIndicator lastSyncTime={new Date()} />
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('browse.noListings')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {listings.map((listing: FuzzedListing) => (
                  <Link
                    key={listing.id}
                    to="/marketplace/$listingId"
                    params={{ listingId: listing.id }}
                    className="block"
                  >
                    <ListingCard listing={listing} />
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => window.location.href = `/marketplace?page=${currentPage - 1}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('browse.previous')}
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {t('browse.pageInfo', { current: currentPage, total: totalPages })}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => window.location.href = `/marketplace?page=${currentPage + 1}`}
                  >
                    {t('browse.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
