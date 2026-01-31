import { useTranslation } from 'react-i18next'
import { Droplets, Thermometer } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function EnvironmentalCards() {
  const { t } = useTranslation(['dashboard', 'common'])

  // Simulated data for now
  const weatherData = {
    temperature: 28.5,
    humidity: 62,
    windSpeed: 12, // km/h
  }

  const cardClassName =
    'bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg hover:bg-white/50 dark:hover:bg-black/50 transition-all rounded-3xl overflow-hidden group'

  return (
    <>
      <Card className={cn(cardClassName, 'relative')}>
        <div className="absolute top-0 right-0 p-16 opacity-20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 pointer-events-none bg-orange-500/40" />
        <CardContent className="p-3 sm:p-4 shadow-none relative z-10">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('temperature', { defaultValue: 'Avg. Temp' })}
            </p>
            <div className="h-7 w-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <Thermometer className="h-3.5 w-3.5 text-orange-500" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight flex items-baseline gap-1">
            {weatherData.temperature}
            <span className="text-sm font-medium text-muted-foreground">
              °C
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">Optimal</span>{' '}
            range
          </p>
        </CardContent>
      </Card>

      <Card className={cn(cardClassName, 'relative')}>
        <div className="absolute top-0 right-0 p-16 opacity-20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 pointer-events-none bg-blue-500/40" />
        <CardContent className="p-3 sm:p-4 shadow-none relative z-10">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('humidity', { defaultValue: 'Humidity' })}
            </p>
            <div className="h-7 w-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Droplets className="h-3.5 w-3.5 text-blue-500" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight flex items-baseline gap-1">
            {weatherData.humidity}
            <span className="text-sm font-medium text-muted-foreground">%</span>
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">Good</span>{' '}
            condition
          </p>
        </CardContent>
      </Card>
    </>
  )
}
