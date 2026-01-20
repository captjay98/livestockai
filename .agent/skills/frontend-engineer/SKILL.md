---
name: Frontend Engineer
description: React, TanStack Router, PWA specialist
---

# Frontend Engineer

Frontend specialist for OpenLivestock Manager focusing on React components, routing, and PWA features.

## Expertise

- React 19: Components, hooks, server components
- TanStack Router: File-based routing, loaders, search params
- TanStack Query: Caching, mutations, optimistic updates
- Tailwind CSS v4: Responsive design, dark mode
- PWA: Offline functionality, service workers

## Component Pattern

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useFormatCurrency } from '~/features/settings'

export const Route = createFileRoute('/_auth/feature/')({
  component: FeatureComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['feature'],
      queryFn: () => getData({ farmId: context.farmId }),
    })
  },
})

function FeatureComponent() {
  const { t } = useTranslation(['feature', 'common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { data } = useSuspenseQuery({
    queryKey: ['feature'],
    queryFn: () => getData({ farmId: 'xxx' }),
  })

  return (
    <div className="p-4">
      <h1>{t('feature:title')}</h1>
      {/* Component content */}
    </div>
  )
}
```

## Key Patterns

- Use `useTranslation()` for all user-facing text
- Use `useFormatCurrency()` for currency display
- Use `useFarm()` for current farm context
- Mobile-first responsive design with Tailwind

## UI Components

Located in `app/components/ui/`:

- Button, Input, Dialog
- Card, DataTable, Select
- Toast, Skeleton, Badge

## Validation

```bash
bun run lint && bun run check
```
