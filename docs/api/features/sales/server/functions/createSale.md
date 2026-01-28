[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/sales/server](../README.md) / createSale

# Function: createSale()

> **createSale**(`userId`, `input`): `Promise`\<`string`\>

Defined in: features/sales/server.ts:102

Create a new sales record, update batch quantity if applicable, and log audit

## Parameters

### userId

`string`

ID of the user creating the sale

### input

[`CreateSaleInput`](../interfaces/CreateSaleInput.md)

Sales data input

## Returns

`Promise`\<`string`\>

Promise resolving to the created sale ID

## Throws

If user lacks access to the farm or batch

## Example

```typescript
const saleId = await createSale('user_1', {
    farmId: 'farm_A',
    livestockType: 'poultry',
    quantity: 50,
    unitPrice: 2500,
    date: new Date(),
})
```
