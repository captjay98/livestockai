[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/batches/server](../README.md) / getSourceSizeOptions

# Function: getSourceSizeOptions()

> **getSourceSizeOptions**(`livestockType`): `object`[]

Defined in: features/batches/server.ts:21

Get source size options for a livestock type based on module metadata

## Parameters

### livestockType

[`LivestockType`](../../../modules/types/type-aliases/LivestockType.md)

The type of livestock (e.g., 'poultry', 'fish')

## Returns

`object`[]

Array of value/label pairs for source size options

## Example

```typescript
const options = getSourceSizeOptions('poultry')
// Returns: [{ value: 'day-old', label: 'Day Old' }, ...]
```
