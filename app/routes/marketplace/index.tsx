import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { getListingsFn } from '~/features/marketplace/server'
import { ListingCard } from '~/components/marketplace/listing-card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const marketplaceSearchSchema = z.object({
  page: z.number().int().positive().catch(1),
  pageSize: z.number().int().positive().max(50).catch(12),
  livestockType: z
    .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
    .optional(),
  species: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  radiusKm: z.number().positive().max(500).catch(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'distance', 'newest'])
    .catch('newest'),
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

  pendingComponent: () => (
    <LandingLayout>
      <div className="container mx-auto px-4 py-32">
        <DataTableSkeleton />
      </div>
    </LandingLayout>
  ),

  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),

  component: MarketplacePage,
})

const LIVESTOCK_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'fish', label: 'Fish' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'goats', label: 'Goats' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'bees', label: 'Bees' },
] as const

function MarketplacePage() {
  const { t } = useTranslation(['marketplace', 'common'])
  const loaderData = Route.useLoaderData()
  const listings = loaderData.data
  const total = loaderData.total
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [speciesInput, setSpeciesInput] = useState(search.species || '')

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const totalPages = Math.ceil(total / search.pageSize)
  const currentPage = search.page

  const updateSearch = (updates: Partial<typeof search>) => {
    navigate({
      to: '/marketplace',
      search: { ...search, ...updates, page: 1 },
    })
  }

  const clearFilters = () => {
    navigate({
      to: '/marketplace',
      search: { page: 1, pageSize: 12, radiusKm: 50, sortBy: 'newest' },
    })
    setSpeciesInput('')
  }

  const activeFilterCount = [
    search.livestockType,
    search.species,
    search.minPrice,
    search.maxPrice,
  ].filter(Boolean).length

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(var(--landing-grid-color) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage:
              'radial-gradient(circle at 50% 50%, black, transparent 70%)',
            opacity: 'var(--landing-grid-opacity)',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div
            className={`text-center max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                Marketplace
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold font-manrope tracking-tight mb-4"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Find Quality <span className="text-emerald-500">Livestock</span>
            </h1>

            <p
              className="text-lg mb-8 max-w-xl mx-auto"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Browse verified listings from trusted farmers. Privacy-protected
              locations and secure messaging.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm mb-10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                <span style={{ color: 'var(--text-landing-secondary)' }}>
                  <strong style={{ color: 'var(--text-landing-primary)' }}>
                    {total}
                  </strong>{' '}
                  listings
                </span>
              </div>
              <span style={{ color: 'var(--text-landing-secondary)' }}>•</span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span style={{ color: 'var(--text-landing-secondary)' }}>
                  Within{' '}
                  <strong style={{ color: 'var(--text-landing-primary)' }}>
                    {search.radiusKm}km
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={t('placeholders.searchSpecies', {
                    defaultValue: 'Search species (e.g., broiler, catfish)',
                  })}
                  className="pl-10 h-12 bg-card border-border"
                  value={speciesInput}
                  onChange={(e) => setSpeciesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateSearch({ species: speciesInput || undefined })
                    }
                  }}
                />
              </div>
              <Button
                variant="outline"
                className="h-12 px-4 gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('common:filter', { defaultValue: 'Filters' })}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() =>
                  updateSearch({ species: speciesInput || undefined })
                }
              >
                {t('common:search', { defaultValue: 'Search' })}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      {showFilters && (
        <div className="border-y border-border bg-card/50 backdrop-blur-sm sticky top-16 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select
                value={search.livestockType || ''}
                onValueChange={(value) =>
                  updateSearch({
                    livestockType: (value || undefined) as
                      | 'poultry'
                      | 'cattle'
                      | 'goats'
                      | 'sheep'
                      | 'bees'
                      | 'fish'
                      | undefined,
                  })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue
                    placeholder={t('placeholders.allTypes', {
                      defaultValue: 'All Types',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('placeholders.allTypes', { defaultValue: 'All Types' })}
                  </SelectItem>
                  {LIVESTOCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t('placeholders.minPrice', {
                    defaultValue: 'Min',
                  })}
                  className="w-24 h-9"
                  value={search.minPrice || ''}
                  onChange={(e) =>
                    updateSearch({
                      minPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder={t('placeholders.maxPrice', {
                    defaultValue: 'Max',
                  })}
                  className="w-24 h-9"
                  value={search.maxPrice || ''}
                  onChange={(e) =>
                    updateSearch({
                      maxPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              <Select
                value={search.sortBy}
                onValueChange={(value) =>
                  updateSearch({
                    sortBy: value as
                      | 'price_asc'
                      | 'price_desc'
                      | 'distance'
                      | 'newest'
                      | undefined,
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {t('marketplace:sortNewest', { defaultValue: 'Newest' })}
                  </SelectItem>
                  <SelectItem value="price_asc">
                    {t('marketplace:sortPriceAsc', {
                      defaultValue: 'Price: Low-High',
                    })}
                  </SelectItem>
                  <SelectItem value="price_desc">
                    {t('marketplace:sortPriceDesc', {
                      defaultValue: 'Price: High-Low',
                    })}
                  </SelectItem>
                  <SelectItem value="distance">
                    {t('marketplace:sortNearest', { defaultValue: 'Nearest' })}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(search.radiusKm)}
                onValueChange={(value) =>
                  updateSearch({ radiusKm: Number(value) })
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="200">200 km</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      <section className="container mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <div
            className={`text-center py-20 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              No listings found
            </h3>
            <p
              className="mb-6 max-w-md mx-auto"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {activeFilterCount > 0
                ? 'Try adjusting your filters'
                : 'Be the first to list your livestock'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
                <Link to="/marketplace/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p style={{ color: 'var(--text-landing-secondary)' }}>
                <strong style={{ color: 'var(--text-landing-primary)' }}>
                  {total}
                </strong>{' '}
                listings found
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/marketplace/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {listings.map((listing, i) => (
                <Link
                  key={listing.id}
                  to="/marketplace/$listingId"
                  params={{ listingId: listing.id }}
                  className={`block transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <ListingCard listing={listing} />
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8 border-t">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1}
                  asChild={currentPage > 1}
                >
                  {currentPage > 1 ? (
                    <Link
                      to="/marketplace"
                      search={{ ...search, page: currentPage - 1 }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </span>
                  )}
                </Button>
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  asChild={currentPage < totalPages}
                >
                  {currentPage < totalPages ? (
                    <Link
                      to="/marketplace"
                      search={{ ...search, page: currentPage + 1 }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </LandingLayout>
  )
}
