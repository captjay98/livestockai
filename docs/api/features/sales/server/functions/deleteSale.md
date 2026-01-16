[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / deleteSale

# Function: deleteSale()

> **deleteSale**(`userId`, `saleId`): `Promise`\<`void`\>

Defined in: features/sales/server.ts:204

Delete a sales record and revert its impact on batch quantity

## Parameters

### userId

`string`

ID of the user performing the deletion

### saleId

`string`

ID of the sale to delete

## Returns

`Promise`\<`void`\>

## Throws

If sale is not found or access is denied

## Example

```typescript
await deleteSale('user_1', 'sale_123')
```
