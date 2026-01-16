[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/vaccinations/server](../README.md) / HealthRecord

# Interface: HealthRecord

Defined in: features/vaccinations/server.ts:9

Represents a historical or upcoming health intervention for a batch.

## Properties

### batchId

> **batchId**: `string`

Defined in: features/vaccinations/server.ts:13

ID of the livestock batch

***

### batchSpecies

> **batchSpecies**: `string` \| `null`

Defined in: features/vaccinations/server.ts:15

Species of the batch for display purposes

***

### date

> **date**: `Date`

Defined in: features/vaccinations/server.ts:21

Date the intervention was performed

***

### dosage

> **dosage**: `string`

Defined in: features/vaccinations/server.ts:23

Amount and unit of administration (e.g., "0.5ml")

***

### id

> **id**: `string`

Defined in: features/vaccinations/server.ts:11

Unique identifier for the record

***

### name

> **name**: `string`

Defined in: features/vaccinations/server.ts:19

Name of the vaccine or medication

***

### nextDueDate

> **nextDueDate**: `Date` \| `null`

Defined in: features/vaccinations/server.ts:25

Expected date for the next dose (primarily for vaccinations)

***

### notes

> **notes**: `string` \| `null`

Defined in: features/vaccinations/server.ts:29

Diagnostic or administrative details

***

### type

> **type**: `"vaccination"` \| `"treatment"`

Defined in: features/vaccinations/server.ts:17

Discriminator between preventative and curative care

***

### withdrawalDays

> **withdrawalDays**: `number` \| `null`

Defined in: features/vaccinations/server.ts:27

Mandatory wait time before slaughter/sale after medication
