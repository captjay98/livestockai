# Future Enhancement: Regional Market Data Packages

## Overview

This document outlines a future enhancement to allow community-contributed regional market data packages that users can opt into during onboarding.

## Current Implementation

**As of Day 8**: Users enter their own `targetPricePerUnit` when creating batches. This makes the app:

- ✅ International (not region-specific)
- ✅ Accurate (user's actual market prices)
- ✅ Simple (no package management)

## Future Enhancement

### Concept

Market data as optional, community-contributed packages that users can opt into during onboarding or in settings.

### Proposed Architecture

```
app/lib/db/seeds/market-data/
├── index.ts                    # Registry of available packages
├── nigeria.ts                  # Nigerian market data
├── kenya.ts                    # Kenyan market data (community)
├── ghana.ts                    # Ghanaian market data (community)
├── india.ts                    # Indian market data (community)
└── README.md                   # Contribution guide
```

### Package Interface

```typescript
export interface MarketDataPackage {
  id: string
  name: string
  country: string
  currency: string
  description: string
  author: string
  lastUpdated: Date
  data: {
    marketPrices: MarketPrice[]
    vaccinationSchedules?: VaccinationSchedule[]
    commonDiseases?: Disease[]
    localBreeds?: Breed[]
    feedBrands?: FeedBrand[]
  }
}
```

### What Could Be Included

| Data Type             | Priority | Reason                       |
| --------------------- | -------- | ---------------------------- |
| Market Prices         | Medium   | Reference pricing by region  |
| Vaccination Schedules | High     | Country-specific regulations |
| Common Diseases       | Medium   | Regional disease patterns    |
| Local Breeds          | Low      | Species vary by country      |
| Feed Brands           | Low      | Regional suppliers           |

### Onboarding Integration

```
Step 5: Regional Data (Optional)
  - [ ] Nigerian Market Data (NGN) - by LivestockAI Team
  - [ ] Kenyan Market Data (KES) - by Community
  - [ ] Skip for now
```

### User Settings

```typescript
interface UserSettings {
  // ... existing settings
  marketDataPackages: string[] // ['nigeria', 'kenya']
}
```

### Community Contribution

1. Fork repository
2. Create `app/lib/db/seeds/market-data/{country}.ts`
3. Follow template structure
4. Submit PR with:
   - Data sources cited
   - Last updated date
   - Author information
5. Review and merge

### Implementation Estimate

- Package registry: 2 hours
- Onboarding step: 2 hours
- Settings UI: 1 hour
- Documentation: 1 hour
- **Total**: ~6 hours

### When to Implement

Consider implementing when:

- Multiple users request regional data
- Community contributors offer to maintain packages
- App expands to multiple countries

### Why Not Now

- Market prices change frequently (weekly/monthly)
- Users enter actual prices when recording sales
- Adds complexity without clear demand
- Better to validate core features first

## Decision

**Deferred** - Document as future enhancement. Current `targetPricePerUnit` approach is simpler and more accurate.

## Related

- `app/features/batches/forecasting.ts` - Uses `batch.targetPricePerUnit`
- `app/lib/db/seeds/production.ts` - No longer seeds market prices
- `app/routes/_auth/batches/index.tsx` - Target price input field
