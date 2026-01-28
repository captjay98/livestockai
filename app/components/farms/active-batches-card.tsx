import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatDate } from '~/features/settings'

export interface ActiveBatch {
    id: string
    species: string
    acquisitionDate: Date
    currentQuantity: number
    livestockType: string
}

interface ActiveBatchesCardProps {
    batches: Array<ActiveBatch>
}

export function ActiveBatchesCard({ batches }: ActiveBatchesCardProps) {
    const { t } = useTranslation(['farms', 'common'])
    const { format: formatDate } = useFormatDate()

    return (
        <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{t('farms:activeBatches.title')}</CardTitle>
                <Link to="/batches" preload="intent">
                    <Button variant="link" size="sm" className="h-8">
                        View All
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {batches.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        {t('farms:activeBatches.noBatches')}
                        <div className="mt-2">
                            <Link to="/batches" preload="intent">
                                <Button variant="outline" size="sm">
                                    {t('farms:activeBatches.create')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {batches.map((batch) => (
                            <div
                                key={batch.id}
                                className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                            >
                                <div>
                                    <div className="font-medium capitalize">
                                        {batch.species}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDate(batch.acquisitionDate)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">
                                        {batch.currentQuantity.toLocaleString()}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs uppercase"
                                    >
                                        {t(
                                            `common:livestock.${batch.livestockType}`,
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
