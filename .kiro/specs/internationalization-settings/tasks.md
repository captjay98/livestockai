# Implementation Plan: Internationalization Settings

## Overview

This implementation plan breaks down the internationalization settings feature into discrete coding tasks. The approach is incremental: database schema first, then core utilities, then context/hooks, and finally the UI. Property-based tests are included alongside implementation tasks to catch errors early.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add user_settings table to existing migration
    - Update `app/lib/db/migrations/2025-01-08-001-initial-schema.ts`
    - Add `user_settings` table with all currency, date/time, and unit columns
    - Add foreign key constraint to users table
    - _Requirements: 4.1, 4.3_
  - [x] 1.2 Update database types
    - Add `UserSettingsTable` interface to `app/lib/db/types.ts`
    - Add `user_settings` to `Database` interface
    - _Requirements: 4.1_
  - [x] 1.3 Create seed data for existing users
    - Update seed script to create default settings (NGN for backward compatibility)
    - _Requirements: 6.1, 6.2_

- [x] 2. Currency presets and default settings
  - [x] 2.1 Create currency presets module
    - Create `app/lib/settings/currency-presets.ts`
    - Define `CurrencyPreset` interface
    - Add all 20 currency presets (USD, EUR, GBP, NGN, KES, ZAR, INR, CNY, JPY, BRL, MXN, CAD, AUD, CHF, SEK, NOK, DKK, PLN, TRY, AED)
    - Export `DEFAULT_SETTINGS` constant
    - _Requirements: 7.1, 7.3, 1.8, 2.6, 3.7_

- [x] 3. Core formatting utilities
  - [x] 3.1 Create currency formatter
    - Create `app/lib/settings/currency-formatter.ts`
    - Implement `formatCurrency(amount, settings)` function
    - Implement `formatCompactCurrency(amount, settings)` function
    - Handle symbol position, decimals, separators
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x]\* 3.2 Write property test for currency formatter
    - **Property 1: Currency Formatting Correctness**
    - Test symbol presence and position
    - Test decimal places
    - Test thousand and decimal separators
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**
  - [x] 3.3 Create date formatter
    - Create `app/lib/settings/date-formatter.ts`
    - Implement `formatDate(date, settings)` function
    - Implement `formatTime(date, settings)` function
    - Implement `formatDateTime(date, settings)` function
    - Support MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD formats
    - Support 12h and 24h time formats
    - _Requirements: 2.2, 2.3, 2.4_
  - [x]\* 3.4 Write property tests for date formatter
    - **Property 2: Date Formatting Correctness**
    - **Property 3: Time Formatting Correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  - [x] 3.5 Create unit converter
    - Create `app/lib/settings/unit-converter.ts`
    - Implement `formatWeight(valueKg, settings)` function
    - Implement `formatArea(valueSqm, settings)` function
    - Implement `formatTemperature(valueCelsius, settings)` function
    - Implement `toMetricWeight(value, unit)` function
    - Implement `toMetricArea(value, unit)` function
    - Implement `toCelsius(value, unit)` function
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x]\* 3.6 Write property tests for unit converter
    - **Property 4: Weight Conversion Round-Trip**
    - **Property 5: Area Conversion Round-Trip**
    - **Property 6: Temperature Conversion Round-Trip**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Server functions
  - [x] 5.1 Create settings server functions
    - Create `app/lib/settings/server.ts`
    - Implement `getUserSettings` server function
    - Implement `updateUserSettings` server function
    - Use dynamic imports for database
    - Add Zod validation schema
    - Handle errors gracefully
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 6. Settings context and hooks
  - [x] 6.1 Create settings context
    - Create `app/lib/settings/context.tsx`
    - Define `SettingsContext` with settings and update function
    - Create `SettingsProvider` component
    - Create `useSettings` hook
    - Load settings on mount
    - Handle optimistic updates
    - _Requirements: 4.4_
  - [x] 6.2 Create formatting hooks
    - Create `app/lib/settings/hooks.ts`
    - Implement `useFormatCurrency()` hook
    - Implement `useFormatDate()` hook
    - Implement `useFormatWeight()` hook
    - Implement `useFormatArea()` hook
    - Implement `useFormatTemperature()` hook
    - _Requirements: 1.3, 2.2, 3.2, 3.3, 3.4_

- [x] 7. Settings UI page
  - [x] 7.1 Create settings page route
    - Create `app/routes/_auth.settings.tsx`
    - Add route to navigation menu
    - Set up page layout with tabs (Currency, Date/Time, Units)
    - _Requirements: 5.1, 5.2_
  - [x] 7.2 Create currency settings section
    - Create currency preset dropdown
    - Create fields for symbol, decimals, separators
    - Add live preview of formatted amount
    - _Requirements: 1.1, 1.2, 5.3, 7.2, 7.4_
  - [x] 7.3 Create date/time settings section
    - Create date format dropdown (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
    - Create time format toggle (12h/24h)
    - Create first day of week dropdown
    - Add live preview of formatted date/time
    - _Requirements: 2.1, 2.5, 5.3_
  - [x] 7.4 Create units settings section
    - Create weight unit toggle (kg/lbs)
    - Create area unit toggle (sqm/sqft)
    - Create temperature unit toggle (°C/°F)
    - Add live preview of converted values
    - _Requirements: 3.1, 5.3_
  - [x] 7.5 Add save and reset functionality
    - Implement Save button with loading state
    - Implement Reset to Defaults button for each section
    - Show success/error notifications
    - _Requirements: 5.4, 5.5, 5.6, 4.5_

- [x] 8. Integrate settings throughout application
  - [x] 8.1 Wrap app with SettingsProvider
    - Update `app/routes/__root.tsx` to include SettingsProvider
    - Ensure settings load on authentication
    - _Requirements: 4.2, 4.4_
  - [x] 8.2 Update currency displays
    - Replace `formatNaira` calls with `useFormatCurrency` hook
    - Update dashboard, sales, expenses, invoices pages
    - _Requirements: 1.3_
  - [x] 8.3 Update date displays
    - Replace hardcoded date formats with `useFormatDate` hook
    - Update all date displays throughout the app
    - _Requirements: 2.2_
  - [x] 8.4 Update unit displays
    - Replace hardcoded weight/area displays with formatting hooks
    - Update batch details, weight samples, structures pages
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run full test suite
  - Verify build succeeds
  - Test settings persistence manually

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All database operations use dynamic imports for Cloudflare Workers compatibility
