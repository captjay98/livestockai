import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PhotoGallery } from './photo-gallery'
import type { FuzzedListing } from '~/features/marketplace/privacy-fuzzer'
import { MapPin, Calendar, Eye, Shield } from 'lucide-react'

interface ListingDetailProps {
  listing: FuzzedListing
  isOwner: boolean
  onContactClick: () => void
}

export function ListingDetail({ listing, isOwner, onContactClick }: ListingDetailProps) {
  const { t } = useTranslation('marketplace')
  const isExpired = listing.status === 'expired'
  const listingAge = Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{listing.species}</CardTitle>
              <p className="text-muted-foreground">{listing.livestockType}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={isExpired ? 'destructive' : 'default'}>
                {listing.status}
              </Badge>
              {!isOwner && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {t('privacyProtected')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('quantity')}</p>
              <p className="font-medium">{listing.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('priceRange')}</p>
              <p className="font-medium">{listing.priceRange}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {listingAge} {t('daysAgo')}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewCount} {t('views')}
            </div>
          </div>

          {listing.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('description')}</p>
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {listing.photoUrls && listing.photoUrls.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('photos')}</p>
              <PhotoGallery photos={listing.photoUrls} alt={listing.species} />
            </div>
          )}

          {!isOwner && (
            <Button 
              onClick={onContactClick} 
              disabled={isExpired}
              className="w-full"
            >
              {isExpired ? t('listingExpired') : t('contactSeller')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}