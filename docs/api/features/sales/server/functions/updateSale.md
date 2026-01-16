[**OpenLivestock API Reference**](../../../../README.md)

***

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / updateSale

# Function: updateSale()

> **updateSale**(`userId`, `saleId`, `data`): `Promise`\<`boolean`\>

Defined in: features/sales/server.ts:290

Update an existing sales record

## Parameters

### userId

`string`

ID of the user performing the update

### saleId

`string`

ID of the sale record to update

### data

[`UpdateSaleInput`](../type-aliases/UpdateSaleInput.md)

Updated sales data

## Returns

`Promise`\<`boolean`\>

Promise resolving to true on success

## Throws

If sale is not found or access is denied

## Example

```typescript
await updateSale('user_1', 'sale_123', { quantity: 60 })
```
