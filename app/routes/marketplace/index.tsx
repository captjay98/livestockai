import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getListingsFn } from '~/features/marketplace/server'
import { ListingFilters } from '~/components/marketplace/listing-filters'
import { ListingCard } from '~/components/marketplace/listing-card'
import { Button } from '~/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

export const Route = createFileRoute('/marketplace/')({
  validateSearch: marketplaceSearchSchema,
  
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    livestockType: search.livestockType,
    species: search.species,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    radiusKm: search.radiusKm,
    latitude: search.latitude,
    longitude: search.longitude,
    sortBy: search.sortBy,
  }),

  loader: async ({ deps }) => {
    return getListingsFn({ data: deps })
  },

  component: MarketplacePage,
})

function MarketplacePage() {
  const { t } = useTranslation('marketplace')
  const { data: listings, totalPages, currentPage } = Route.useLoaderData()
  const search = Route.useSearch()

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ListingFilters />
        </div>

        <div className="lg:col-span-3">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('noListingsFound')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {listings.map((listing) => (
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
                    asChild
                  >
                    <Link
                      to="/marketplace"
                      search={{ ...search, page: currentPage - 1 }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('previous')}
                    </Link>
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {t('pageInfo', { current: currentPage, total: totalPages })}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    asChild
                  >
                    <Link
                      to="/marketplace"
                      search={{ ...search, page: currentPage + 1 }}
                    >
                      {t('next')}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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