import { Settings } from 'lucide-react'
import { Skeleton } from '~/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export function SettingsSkeleton() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <Tabs defaultValue="regional" className="space-y-4">
        <TabsList className="flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <TabsTrigger key={i} value={`tab-${i}`} className="gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-5 w-24" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    </div>
  )
}
