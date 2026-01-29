[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/customers/server](../README.md) / getTopCustomers

# Function: getTopCustomers()

> **getTopCustomers**(`limit`): `Promise`\<`object`[]\>

Defined in: features/customers/server.ts:216

Retrieve a list of customers ranked by their lifetime spending.

## Parameters

### limit

`number` = `10`

Maximum number of customers to return (default: 10)

## Returns

`Promise`\<`object`[]\>

Promise resolving to the highest spending customers
