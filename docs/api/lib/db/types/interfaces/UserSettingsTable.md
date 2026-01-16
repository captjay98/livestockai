[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [lib/db/types](../README.md) / UserSettingsTable

# Interface: UserSettingsTable

Defined in: lib/db/types.ts:74

## Properties

### areaUnit

> **areaUnit**: `"sqm"` \| `"sqft"`

Defined in: lib/db/types.ts:93

***

### createdAt

> **createdAt**: `Generated`\<`Date`\>

Defined in: lib/db/types.ts:137

***

### currencyCode

> **currencyCode**: `string`

Defined in: lib/db/types.ts:79

***

### currencyDecimals

> **currencyDecimals**: `number`

Defined in: lib/db/types.ts:81

***

### currencySymbol

> **currencySymbol**: `string`

Defined in: lib/db/types.ts:80

***

### currencySymbolPosition

> **currencySymbolPosition**: `"before"` \| `"after"`

Defined in: lib/db/types.ts:82

***

### dashboardCards

> **dashboardCards**: `object`

Defined in: lib/db/types.ts:124

#### expenses

> **expenses**: `boolean`

#### feed

> **feed**: `boolean`

#### inventory

> **inventory**: `boolean`

#### mortality

> **mortality**: `boolean`

#### profit

> **profit**: `boolean`

#### revenue

> **revenue**: `boolean`

***

### dateFormat

> **dateFormat**: `"MM/DD/YYYY"` \| `"DD/MM/YYYY"` \| `"YYYY-MM-DD"`

Defined in: lib/db/types.ts:87

***

### decimalSeparator

> **decimalSeparator**: `string`

Defined in: lib/db/types.ts:84

***

### defaultFarmId

> **defaultFarmId**: `string` \| `null`

Defined in: lib/db/types.ts:97

***

### defaultPaymentTermsDays

> **defaultPaymentTermsDays**: `number`

Defined in: lib/db/types.ts:120

***

### firstDayOfWeek

> **firstDayOfWeek**: `number`

Defined in: lib/db/types.ts:89

***

### fiscalYearStartMonth

> **fiscalYearStartMonth**: `number`

Defined in: lib/db/types.ts:121

***

### id

> **id**: `Generated`\<`string`\>

Defined in: lib/db/types.ts:75

***

### language

> **language**: `"en"` \| `"ha"` \| `"yo"` \| `"ig"` \| `"fr"` \| `"pt"` \| `"sw"`

Defined in: lib/db/types.ts:98

***

### lowStockThresholdPercent

> **lowStockThresholdPercent**: `number`

Defined in: lib/db/types.ts:102

***

### mortalityAlertPercent

> **mortalityAlertPercent**: `number`

Defined in: lib/db/types.ts:103

***

### mortalityAlertQuantity

> **mortalityAlertQuantity**: `number`

Defined in: lib/db/types.ts:104

***

### notifications

> **notifications**: `object`

Defined in: lib/db/types.ts:105

#### batchHarvest

> **batchHarvest**: `boolean`

#### batchPerformance?

> `optional` **batchPerformance**: `boolean`

#### dailySales?

> `optional` **dailySales**: `boolean`

#### highMortality

> **highMortality**: `boolean`

#### invoiceDue

> **invoiceDue**: `boolean`

#### lowStock

> **lowStock**: `boolean`

#### medicationExpiry?

> `optional` **medicationExpiry**: `boolean`

#### paymentReceived?

> `optional` **paymentReceived**: `boolean`

#### vaccinationDue?

> `optional` **vaccinationDue**: `boolean`

#### waterQualityAlert?

> `optional` **waterQualityAlert**: `boolean`

#### weeklySummary?

> `optional` **weeklySummary**: `boolean`

***

### onboardingCompleted

> **onboardingCompleted**: `Generated`\<`boolean`\>

Defined in: lib/db/types.ts:134

***

### onboardingStep

> **onboardingStep**: `Generated`\<`number`\>

Defined in: lib/db/types.ts:135

***

### temperatureUnit

> **temperatureUnit**: `"celsius"` \| `"fahrenheit"`

Defined in: lib/db/types.ts:94

***

### theme

> **theme**: `"dark"` \| `"light"` \| `"system"`

Defined in: lib/db/types.ts:99

***

### thousandSeparator

> **thousandSeparator**: `string`

Defined in: lib/db/types.ts:83

***

### timeFormat

> **timeFormat**: `"12h"` \| `"24h"`

Defined in: lib/db/types.ts:88

***

### updatedAt

> **updatedAt**: `Generated`\<`Date`\>

Defined in: lib/db/types.ts:138

***

### userId

> **userId**: `string`

Defined in: lib/db/types.ts:76

***

### weightUnit

> **weightUnit**: `"kg"` \| `"lbs"`

Defined in: lib/db/types.ts:92
