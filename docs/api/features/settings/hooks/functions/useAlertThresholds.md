[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/settings/hooks](../README.md) / useAlertThresholds

# Function: useAlertThresholds()

> **useAlertThresholds**(): `object`

Defined in: features/settings/hooks.ts:250

Hook for accessing monitoring and alert threshold settings

## Returns

`object`

Object containing stock and mortality thresholds, and notifications flag

### lowStockPercent

> **lowStockPercent**: `number` = `settings.lowStockThresholdPercent`

### mortalityPercent

> **mortalityPercent**: `number` = `settings.mortalityAlertPercent`

### mortalityQuantity

> **mortalityQuantity**: `number` = `settings.mortalityAlertQuantity`

### notifications

> **notifications**: `object` = `settings.notifications`

#### notifications.batchHarvest

> **batchHarvest**: `boolean`

#### notifications.batchPerformance

> **batchPerformance**: `boolean`

#### notifications.dailySales

> **dailySales**: `boolean`

#### notifications.highMortality

> **highMortality**: `boolean`

#### notifications.invoiceDue

> **invoiceDue**: `boolean`

#### notifications.lowStock

> **lowStock**: `boolean`

#### notifications.medicationExpiry

> **medicationExpiry**: `boolean`

#### notifications.paymentReceived

> **paymentReceived**: `boolean`

#### notifications.vaccinationDue

> **vaccinationDue**: `boolean`

#### notifications.waterQualityAlert

> **waterQualityAlert**: `boolean`

#### notifications.weeklySummary

> **weeklySummary**: `boolean`
