import { z } from 'zod'
import { createSearchValidator } from '~/lib/validation/search-params'

export const validateCustomerSearch = createSearchValidator({
  sortBy: [
    'name',
    'phone',
    'email',
    'location',
    'customerType',
    'createdAt',
    'totalRevenue',
    'salesCount',
  ],
  custom: {
    customerType: z.string().optional(),
  },
})
