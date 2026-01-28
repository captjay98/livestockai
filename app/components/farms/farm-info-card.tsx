import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatDate } from '~/features/settings'

interface FarmInfoCardProps {
    farm: {
        name: string
        type: any
        location: string
        createdAt: Date
    }
}

export function FarmInfoCard({ farm }: FarmInfoCardProps) {
    const { t } = useTranslation(['farms'])
    const { format: formatDate } = useFormatDate()

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle>{t('farms:detail.info')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('farms:detail.name')}
                        </p>
                        <p className="text-sm border-b pb-1">{farm.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('farms:detail.type')}
                        </p>
                        <p className="text-sm capitalize border-b pb-1">
                            {farm.type}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('farms:detail.location')}
                        </p>
                        <p className="text-sm border-b pb-1">{farm.location}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('farms:detail.created')}
                        </p>
                        <p className="text-sm border-b pb-1">
                            {formatDate(farm.createdAt)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
