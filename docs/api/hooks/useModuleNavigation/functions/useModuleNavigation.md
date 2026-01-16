[**OpenLivestock API Reference**](../../../README.md)

***

[OpenLivestock API Reference](../../../modules.md) / [hooks/useModuleNavigation](../README.md) / useModuleNavigation

# Function: useModuleNavigation()

> **useModuleNavigation**\<`T`\>(`navigation`): `T`[]

Defined in: hooks/useModuleNavigation.ts:59

React hook that filters a navigation array based on the user's enabled modules.
This ensures that menu items for inactive modules (e.g., eggs, management) are hidden.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### navigation

`T`[]

Array of navigation items to filter

## Returns

`T`[]

Memoized array of navigation items accessible to the user

## Example

```tsx
const items = useModuleNavigation(BASE_NAV_ITEMS)
```
