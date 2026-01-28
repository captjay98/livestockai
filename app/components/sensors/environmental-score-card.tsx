import { useEffect, useState } from 'react'
import { Leaf } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { getEnvironmentalScoreFn } from '~/features/sensors/server'

interface EnvironmentalScoreCardProps {
  structureId: string
}

export function EnvironmentalScoreCard({ structureId }: EnvironmentalScoreCardProps) {
  const [data, setData] = useState<{
    score: number | null
    factors: Array<{ type: string; score: number; status: string }>
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEnvironmentalScoreFn({ data: { structureId, days: 7 } })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [structureId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.score === null) {
    return null
  }

  const scoreColor =
    data.score >= 80
      ? 'text-green-600'
      : data.score >= 60
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Leaf className="h-4 w-4" />
          Environmental Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${scoreColor}`}>{data.score}</div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{data.message}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.factors.map((f) => (
                <span
                  key={f.type}
                  className={`text-xs px-2 py-0.5 rounded ${
                    f.status === 'optimal'
                      ? 'bg-green-100 text-green-700'
                      : f.status === 'low'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {f.type}: {f.score}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
