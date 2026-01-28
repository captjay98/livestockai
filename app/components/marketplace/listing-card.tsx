import { MapPin, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FuzzedListing } from '~/features/marketplace/privacy-fuzzer'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

interface ListingCardProps {
  listing: FuzzedListing
  isVerifiedSeller?: boolean
  distanceKm?: number
}

export function ListingCard({ 
  listing, 
  isVerifiedSeller = false, 
  distanceKm 
}: ListingCardProps) {
  const { t } = useTranslation('marketplace')
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg capitalize">
              {listing.species}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {listing.livestockType}
            </p>
          </div>
          {isVerifiedSeller && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t('listing.verified')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {listing.photoUrls?.[0] && (
          <div className="aspect-video rounded-md overflow-hidden bg-muted">
            <img
              src={listing.photoUrls[0]}
              alt={listing.species}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <span className="font-medium">{listing.quantity}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="font-medium">{listing.currency} {listing.minPrice} - {listing.maxPrice}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{listing.formattedAddress}</span>
            {distanceKm && (
              <span className="ml-1">({distanceKm}km away)</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}