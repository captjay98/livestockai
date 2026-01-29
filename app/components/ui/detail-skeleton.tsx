import { Skeleton } from '~/components/ui/skeleton'

interface SkeletonSection {
  type: 'header' | 'actions' | 'cards' | 'tabs' | 'table' | 'custom'
  props?: {
    count?: number
    height?: string
    width?: string
    className?: string
  }
}

interface DetailSkeletonProps {
  sections: Array<SkeletonSection>
}

export function DetailSkeleton({ sections }: DetailSkeletonProps) {
  const renderSection = (section: SkeletonSection, index: number) => {
    const { type, props = {} } = section
    const { count = 1, height = 'h-10', width, className } = props

    switch (type) {
      case 'header':
        return (
          <div key={index} className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
        )

      case 'actions':
        return (
          <div key={index} className="flex gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className={`${height} w-24`} />
            ))}
          </div>
        )

      case 'cards':
        return (
          <div
            key={index}
            className={`grid gap-4 ${count === 2 ? 'md:grid-cols-2' : count === 3 ? 'md:grid-cols-3' : count === 4 ? 'md:grid-cols-4' : 'grid-cols-1'}`}
          >
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )

      case 'tabs':
        return (
          <div key={index} className="space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        )

      case 'table':
        return (
          <div key={index} className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        )

      case 'custom':
        return (
          <div key={index} className={className}>
            <Skeleton className={`${height} ${width || 'w-full'}`} />
          </div>
        )

      default:
        return null
    }
  }

  return <div className="space-y-6">{sections.map(renderSection)}</div>
}
