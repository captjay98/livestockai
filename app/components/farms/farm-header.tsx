import { Link } from '@tanstack/react-router'
import { ArrowLeft, Edit, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface FarmHeaderProps {
    farm: {
        name: string
        type: any
        location: string
    }
    onEdit: () => void
}

export function FarmHeader({ farm, onEdit }: FarmHeaderProps) {
    const { t } = useTranslation(['farms'])

    return (
        <div className="flex items-center gap-4 mb-6">
            <Link to="/farms">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">{t('farms:detail.back')}</span>
                </Button>
            </Link>
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{farm.name}</h1>
                    <Badge
                        variant={
                            farm.type === 'poultry'
                                ? 'default'
                                : farm.type === 'aquaculture'
                                  ? 'secondary'
                                  : 'outline'
                        }
                    >
                        {farm.type}
                    </Badge>
                </div>
                <p className="text-muted-foreground mt-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {farm.location}
                </p>
            </div>
            <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('farms:detail.edit')}
            </Button>
        </div>
    )
}
