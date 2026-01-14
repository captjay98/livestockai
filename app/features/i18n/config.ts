import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// English translations (baseline)
const resources = {
  en: {
    common: {
      // Navigation
      dashboard: 'Dashboard',
      batches: 'Batches',
      inventory: 'Inventory',
      sales: 'Sales',
      expenses: 'Expenses',
      reports: 'Reports',
      settings: 'Settings',
      
      // Common actions
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      
      // Common labels
      date: 'Date',
      quantity: 'Quantity',
      price: 'Price',
      total: 'Total',
      status: 'Status',
      actions: 'Actions',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
