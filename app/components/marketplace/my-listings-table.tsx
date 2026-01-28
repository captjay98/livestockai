import { useTranslation } from 'react-i18next'
import { useFormatCurrency } from '~/features/settings'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { ListingRecord } from '~/features/marketplace/repository'
import { ListingActions } from './listing-actions'

interface MyListingsTableProps {
  listings: ListingRecord[]
  onAction: (listingId: string, action: string) => void
}

const statusColors = {
  active: 'success',
  paused: 'warning',
  sold: 'default',
  expired: 'secondary',
} as const

export function MyListingsTable({ listings, onAction }: MyListingsTableProps) {
  const { t } = useTranslation('marketplace')
  const { format } = useFormatCurrency()
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.photo')}</TableHead>
          <TableHead>{t('table.species')}</TableHead>
          <TableHead>{t('table.quantity')}</TableHead>
          <TableHead>{t('table.priceRange')}</TableHead>
          <TableHead>{t('table.status')}</TableHead>
          <TableHead>{t('table.views')}</TableHead>
          <TableHead>{t('table.contacts')}</TableHead>
          <TableHead>{t('table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((listing) => (
          <TableRow key={listing.id}>
            <TableCell>
              {listing.photoUrls?.[0] ? (
                <img
                  src={listing.photoUrls[0]}
                  alt={listing.species}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs">
                  {t('table.noPhoto')}
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{listing.species}</TableCell>
            <TableCell>{listing.quantity}</TableCell>
            <TableCell>
              {format(listing.minPrice)} - {format(listing.maxPrice)}
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[listing.status]}>
                {listing.status}
              </Badge>
            </TableCell>
            <TableCell>{listing.viewCount}</TableCell>
            <TableCell>{listing.contactCount}</TableCell>
            <TableCell>
              <ListingActions
                listing={listing}
                onAction={(action) => onAction(listing.id, action)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}