[**OpenLivestock API Reference**](../../../../README.md)

---

[OpenLivestock API Reference](../../../../modules.md) / [features/customers/server](../README.md) / createCustomer

# Function: createCustomer()

> **createCustomer**(`input`): `Promise`\<`string`\>

Defined in: features/customers/server.ts:64

Register a new customer in the system.

## Parameters

### input

[`CreateCustomerInput`](../interfaces/CreateCustomerInput.md)

Customer details (name, phone, etc.)

## Returns

`Promise`\<`string`\>

Promise resolving to the new customer ID
