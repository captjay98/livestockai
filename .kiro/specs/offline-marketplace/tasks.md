# Implementation Plan: Offline Marketplace

## Overview

This implementation plan breaks down the Offline Marketplace feature into incremental coding tasks. The feature enables farmers to list livestock for sale and discover nearby sellers, with privacy fuzzing and offline-first architecture. Implementation follows the three-layer architecture (Server → Service → Repository) and prioritizes testable business logic in the service layer.

## Dependencies

**Required:** This feature depends on **offline-writes-v1** being implemented first for full offline support. Without it, the marketplace will work in online-only mode with degraded UX.

**New package:** Add `browser-image-compression` for client-side photo compression.

## Tasks

- [ ]   1. Database schema and types
    - [ ] 1.1 Create database migration for marketplace_listings table
        - Add all columns: id, seller_id, livestock_type, species, quantity, prices, currency, location fields, content, settings, status, analytics
        - Add indexes for seller_id, status, expires_at, livestock_type, latitude, longitude (separate for bounding box)
        - Add ON DELETE SET NULL for batch_id foreign key
        - _Requirements: 1.1, 1.4, 6.1_
    - [ ] 1.2 Create database migration for listing_contact_requests table
        - Add all columns: id, listing_id, buyer_id, message, contact_method, status, response fields
        - Add UNIQUE(listing_id, buyer_id) constraint to prevent duplicates
        - Add ON DELETE CASCADE for listing_id
        - Add indexes for listing_id, buyer_id, status
        - _Requirements: 5.1, 5.2_
    - [ ] 1.3 Create database migration for listing_views table
        - Add all columns: id, listing_id, viewer_id, viewer_ip, viewed_at
        - Add UNIQUE constraint for deduplication (one view per user/IP per day)
        - Add ON DELETE CASCADE for listing_id
        - Add indexes for listing_id, viewed_at
        - _Requirements: 12.1_
    - [ ] 1.4 Update app/lib/db/types.ts with TypeScript interfaces
        - Add MarketplaceListingTable (with currency field), ListingContactRequestTable, ListingViewTable interfaces
        - Add to Database interface
        - _Requirements: 1.1, 5.1, 12.1_
    - [ ] 1.5 Add marketplace namespace to i18n config
        - Update app/lib/i18n/config.ts to include 'marketplace' namespace
        - Create translation files with required keys
        - _Requirements: 14.1_

- [ ]   2. Privacy Fuzzer Service
    - [ ] 2.1 Create privacy-fuzzer.ts with quantity fuzzing
        - Implement fuzzQuantity function
        - Return ranges: 1-10, 10-25, 25-50, 50-100, 100-250, 250-500, 500+
        - _Requirements: 2.5_
    - [ ] 2.2 Write property tests for quantity fuzzing
        - **Property 3: Quantity Fuzzing Produces Valid Ranges**
        - **Validates: Requirements 2.5**
    - [ ] 2.3 Implement price fuzzing
        - Implement fuzzPrice function
        - Round to nearest significant figure and add buffer
        - Format with currency symbol
        - _Requirements: 2.6_
    - [ ] 2.4 Write property tests for price fuzzing
        - **Property 4: Price Fuzzing Produces Valid Ranges**
        - **Validates: Requirements 2.6**
    - [ ] 2.5 Implement location fuzzing
        - Implement fuzzLocation function for low/medium/high levels
        - Low: return locality, Medium: return region, High: return distance string
        - _Requirements: 2.2, 2.3, 2.4_
    - [ ] 2.6 Write property tests for location fuzzing
        - **Property 5: Location Fuzzing by Level**
        - **Validates: Requirements 2.2, 2.3, 2.4**
    - [ ] 2.7 Implement fuzzListing composite function
        - Apply all fuzzing based on viewer (owner vs non-owner)
        - Return FuzzedListing type
        - _Requirements: 2.1, 2.8_
    - [ ] 2.8 Write property tests for owner vs non-owner fuzzing
        - **Property 6: Owner Sees Exact Values**
        - **Property 7: Non-Owner Sees Fuzzed Values**
        - **Validates: Requirements 2.1, 2.8**

- [ ]   3. Checkpoint - Privacy Fuzzer Complete
    - Ensure all privacy fuzzer tests pass
    - Ask the user if questions arise

- [ ]   4. Distance Calculator
    - [ ] 4.1 Create distance-calculator.ts with Haversine formula
        - Implement calculateDistance function
        - Return distance in kilometers
        - _Requirements: 11.1_
    - [ ] 4.2 Write property tests for distance calculation
        - **Property 12: Distance Calculation (Haversine)**
        - Test symmetry and triangle inequality
        - **Validates: Requirements 11.1**

- [ ]   5. Listing Service
    - [ ] 5.1 Create listing-service.ts with validation
        - Implement validateListingInput function
        - Validate required fields, price range, coordinates
        - _Requirements: 1.1, 1.2_
    - [ ] 5.2 Write property tests for validation
        - **Property 1: Required Fields Validation**
        - **Validates: Requirements 1.1, 1.2**
    - [ ] 5.3 Implement expiration date calculation
        - Implement calculateExpirationDate function
        - Implement isListingExpired function
        - Implement shouldNotifyExpiration function (3 days before)
        - _Requirements: 1.4, 8.1, 8.2, 8.3_
    - [ ] 5.4 Write property tests for expiration
        - **Property 2: Expiration Date Calculation**
        - **Property 16: Expiration Status Transition**
        - **Property 17: Expiration Warning Detection**
        - **Validates: Requirements 1.4, 8.1, 8.2, 8.3**
    - [ ] 5.5 Implement batch pre-fill generation
        - Implement generateListingFromBatch function
        - Pre-fill species, quantity, estimated price from batch and market prices
        - _Requirements: 1.3, 10.2_
    - [ ] 5.6 Write property tests for batch pre-fill
        - **Property 18: Batch Pre-fill Generation**
        - **Validates: Requirements 1.3, 10.2**
    - [ ] 5.7 Implement listing status transitions
        - Implement validateStatusTransition function
        - Allow: active→paused, active→sold, active→expired, paused→active, paused→sold, expired→active
        - _Requirements: 6.2, 6.3, 6.4, 6.6_
    - [ ] 5.8 Write property tests for status transitions
        - **Property 23: Listing Status Transitions**
        - **Validates: Requirements 6.2, 6.3, 6.4, 6.6**

- [ ]   6. Checkpoint - Listing Service Complete
    - Ensure all listing service tests pass
    - Ask the user if questions arise

- [ ]   7. Repository Layer
    - [ ] 7.1 Create repository.ts with listing operations
        - Implement insertListing, getListingById, getListings, getListingsBySeller
        - Implement updateListing, softDeleteListing
        - _Requirements: 1.1, 6.1, 6.5_
    - [ ] 7.2 Implement bounding box pre-filter for distance queries
        - Implement getListingsInBoundingBox function
        - Calculate bounding box from center point and radius
        - Use separate lat/lon indexes for efficient queries
        - _Requirements: 3.4, 11.1_
    - [ ] 7.3 Implement listing search with filters
        - Filter by livestock type, species, price range overlap
        - Use bounding box pre-filter, then Haversine in JS for exact distance
        - Support pagination and sorting
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_
    - [ ] 7.4 Write property tests for filters
        - **Property 8: Species Filter Correctness**
        - **Property 9: Livestock Type Filter Correctness**
        - **Property 10: Price Range Overlap Filter**
        - **Property 11: Distance Filter Correctness**
        - **Property 14: Pagination Boundaries**
        - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.8**
    - [ ] 7.5 Implement lazy expiration
        - Implement markExpiredListings function
        - Call on getListings to mark expired listings on read
        - _Requirements: 8.2_
    - [ ] 7.6 Implement contact request operations
        - Implement insertContactRequest, getContactRequestById
        - Implement hasExistingContactRequest for duplicate check
        - Implement getContactRequestsForSeller, getContactRequestsForBuyer
        - Implement updateContactRequestStatus
        - Handle UNIQUE constraint violation gracefully
        - _Requirements: 5.1, 5.5, 5.6, 5.7_
    - [ ] 7.7 Implement contact request state transitions
        - Validate: pending→approved, pending→denied only
        - _Requirements: 5.5, 5.6_
    - [ ] 7.8 Write property tests for contact request transitions
        - **Property 22: Contact Request State Transitions**
        - **Property 24: Duplicate Contact Request Rejection**
        - **Validates: Requirements 5.5, 5.6**
    - [ ] 7.9 Implement view recording with deduplication
        - Implement recordListingView with UNIQUE constraint handling
        - Return false if duplicate view (already viewed today)
        - Increment view_count only on successful insert
        - _Requirements: 12.1_
    - [ ] 7.10 Write property tests for analytics
        - **Property 19: View Count Increment**
        - **Property 20: Contact Count Increment**
        - **Property 25: View Deduplication**
        - **Validates: Requirements 12.1, 12.2**
    - [ ] 7.11 Implement seller verification check
        - Implement getSellerVerificationStatus
        - Check for Credit Passport report within 90 days
        - _Requirements: 9.1, 9.2_

- [ ]   8. Checkpoint - Repository Complete
    - Ensure all repository tests pass
    - Ask the user if questions arise

- [ ]   9. Photo Service
    - [ ] 9.1 Create photo-service.ts following existing pattern
        - Copy pattern from app/features/digital-foreman/photo-storage.ts
        - Use existing storage provider system (~/features/integrations/storage)
        - Use base64 encoding (NOT FormData - TanStack Start doesn't support it)
        - Store in PRIVATE_STORAGE_BUCKET with path: private/marketplace-photos/{listingId}/{index}.jpg
        - _Requirements: 15.3_
    - [ ] 9.2 Implement photo validation
        - Implement validatePhotoFile function
        - Accept JPEG, PNG, WebP under 5MB
        - _Requirements: 15.5_
    - [ ] 9.3 Write property tests for photo validation
        - **Property 21: Photo Validation**
        - **Validates: Requirements 15.5**
    - [ ] 9.4 Implement canvas-based photo compression
        - Implement compressImageForUpload function (client-side)
        - Resize to max dimensions, compress quality
        - No external library needed - use canvas API
        - _Requirements: 15.2_
    - [ ] 9.5 Implement photo upload/delete
        - Implement uploadListingPhoto function (base64 input)
        - Implement deleteListingPhotos function
        - Handle storage not configured fallback (return base64)
        - _Requirements: 15.3_

- [ ]   10. Sync Engine (Client-Side)
    - [ ] 10.1 Create sync-engine.ts with queue management
        - Implement queueForSync function
        - Implement getPendingItems function
        - Store in IndexedDB
        - _Requirements: 1.5, 1.7, 7.7_
    - [ ] 10.2 Implement conflict resolution
        - Implement resolveConflict function
        - Use last-write-wins based on updatedAt
        - _Requirements: 7.2, 7.3_
    - [ ] 10.3 Write property tests for conflict resolution
        - **Property 15: Last-Write-Wins Conflict Resolution**
        - **Validates: Requirements 7.2, 7.3**
    - [ ] 10.4 Implement staleness detection
        - Implement isCacheStale function
        - Stale if > 24 hours since last sync
        - _Requirements: 3.7_
    - [ ] 10.5 Write property tests for staleness
        - **Property 13: Staleness Detection**
        - **Validates: Requirements 3.7**
    - [ ] 10.6 Implement sync execution
        - Implement syncPendingItems function
        - Retry with exponential backoff (max 3)
        - Update sync status
        - _Requirements: 7.1, 7.5, 7.6_

- [ ]   11. Checkpoint - Services Complete
    - Ensure all service layer tests pass
    - Ask the user if questions arise

- [ ]   12. Server Functions
    - [ ] 12.1 Create server.ts with createListingFn
        - Validate input with Zod
        - Require authentication
        - Calculate expiration, insert listing
        - _Requirements: 1.1, 1.4, 1.6_
    - [ ] 12.2 Implement getListingsFn (public)
        - No authentication required
        - Apply filters, pagination, sorting
        - Apply privacy fuzzing to results
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.1_
    - [ ] 12.3 Implement getListingDetailFn (public)
        - No authentication required
        - Apply fuzzing based on viewer (owner vs non-owner)
        - Include verification badge status
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 13.2_
    - [ ] 12.4 Implement createContactRequestFn
        - Require authentication
        - Validate message, contact method
        - Create notification for seller
        - _Requirements: 5.1, 5.2, 5.3, 13.3_
    - [ ] 12.5 Implement respondToRequestFn
        - Require authentication, verify ownership
        - Update status, send notification to buyer
        - If approved, reveal exact details
        - _Requirements: 5.5, 5.6_
    - [ ] 12.6 Implement updateListingFn
        - Require authentication, verify ownership
        - Validate status transitions
        - _Requirements: 6.2, 6.3, 6.4, 6.6_
    - [ ] 12.7 Implement getMyListingsFn
        - Require authentication
        - Return all listings for current user
        - Include analytics
        - _Requirements: 6.1, 12.3_
    - [ ] 12.8 Implement getContactRequestsFn
        - Require authentication
        - Return requests for seller's listings
        - _Requirements: 5.7_
    - [ ] 12.9 Implement recordListingViewFn (public)
        - No authentication required
        - Increment view count
        - _Requirements: 12.1_
    - [ ] 12.10 Implement deleteListingFn
        - Require authentication, verify ownership
        - Soft delete listing
        - Notify pending requesters
        - _Requirements: 6.5_

- [ ]   13. Checkpoint - Server Functions Complete
    - Ensure all server functions work correctly
    - Ask the user if questions arise

- [ ]   14. UI Components - Browse Marketplace
    - [ ] 14.1 Create MarketplacePage component
        - Display listing grid with filters
        - Support public access (no auth required)
        - Follow "Rugged Utility" design (48px+ touch targets)
        - _Requirements: 3.1, 13.1_
    - [ ] 14.2 Implement filter sidebar/drawer
        - Livestock type filter
        - Species search
        - Price range slider
        - Distance radius selector
        - _Requirements: 3.2, 3.3, 3.4, 3.5, 11.2_
    - [ ] 14.3 Implement ListingCard component
        - Display fuzzed info (quantity range, price range, location)
        - Show verification badge if seller verified
        - Show photo thumbnail
        - _Requirements: 4.1, 4.4, 15.4_
    - [ ] 14.4 Implement staleness indicator
        - Show warning when cache > 24 hours old
        - _Requirements: 3.7_
    - [ ] 14.5 Implement pagination
        - Load more button or infinite scroll
        - _Requirements: 3.8_

- [ ]   15. UI Components - Listing Detail
    - [ ] 15.1 Create ListingDetailPage component
        - Display full listing info with fuzzing
        - Show photo gallery
        - Show verification badge with link to portal
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.3_
    - [ ] 15.2 Implement Contact Seller button
        - Show login prompt if unauthenticated
        - Open contact form if authenticated
        - Disable if listing expired
        - _Requirements: 4.5, 4.6, 13.3_
    - [ ] 15.3 Implement ContactSellerDialog
        - Message input (required)
        - Contact method selection
        - Phone/email input based on method
        - _Requirements: 5.1, 5.2_

- [ ]   16. UI Components - Create Listing
    - [ ] 16.1 Create CreateListingPage component
        - Multi-step form wizard
        - Require authentication
        - _Requirements: 1.1, 13.4_
    - [ ] 16.2 Implement Step 1: Livestock Selection
        - Livestock type selector
        - Species input with suggestions
        - Batch pre-fill option
        - _Requirements: 1.1, 1.3, 10.1_
    - [ ] 16.3 Implement Step 2: Quantity and Pricing
        - Quantity input
        - Min/max price inputs
        - Show preview of fuzzed values
        - _Requirements: 1.1, 2.5, 2.6_
    - [ ] 16.4 Implement Step 3: Location
        - Map picker or address input
        - Fuzzing level selector (low/medium/high)
        - Show preview of fuzzed location
        - _Requirements: 1.1, 2.2, 2.3, 2.4_
    - [ ] 16.5 Implement Step 4: Details and Photos
        - Description textarea
        - Photo upload (max 5)
        - Contact preference selector
        - Expiration period selector
        - _Requirements: 1.2, 8.1, 15.1_
    - [ ] 16.6 Implement offline queue indicator
        - Show "Queued for sync" when offline
        - _Requirements: 1.7_

- [ ]   17. UI Components - My Listings
    - [ ] 17.1 Create MyListingsPage component
        - List all user's listings
        - Filter by status (active, paused, sold, expired)
        - _Requirements: 6.1_
    - [ ] 17.2 Implement listing actions
        - Edit, Pause/Resume, Mark as Sold, Extend, Delete
        - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_
    - [ ] 17.3 Implement analytics display
        - Show views, contacts, conversion rate per listing
        - _Requirements: 12.3_

- [ ]   18. UI Components - Contact Inbox
    - [ ] 18.1 Create ContactInboxPage component
        - List pending contact requests
        - Show request details and buyer info
        - _Requirements: 5.7_
    - [ ] 18.2 Implement approve/deny actions
        - Approve reveals exact details to buyer
        - Deny sends notification without details
        - _Requirements: 5.5, 5.6_
    - [ ] 18.3 Implement request history
        - Show approved and denied requests
        - _Requirements: 5.7_

- [ ]   19. Notifications Integration
    - [ ] 19.1 Implement notification creation for marketplace events
        - Use existing notification types (contactRequest, contactApproved, contactDenied, listingExpiring, listingSold)
        - Create notifications in server functions when events occur
        - _Requirements: 5.3, 5.5, 5.6, 8.3_
    - [ ] 19.2 Implement expiration reminder
        - Check for listings expiring in 3 days during getListings
        - Send notification if not already sent
        - _Requirements: 8.3_

- [ ]   20. Routes and Navigation
    - [ ] 20.1 Create public marketplace routes (outside \_auth)
        - app/routes/marketplace/index.tsx - Public browse page (no auth)
        - app/routes/marketplace/$listingId.tsx - Public listing detail (no auth)
    - [ ] 20.2 Create authenticated marketplace routes (inside \_auth)
        - app/routes/\_auth/marketplace/create.tsx - Create listing (auth required)
        - app/routes/\_auth/marketplace/my-listings.tsx - My listings (auth required)
        - app/routes/\_auth/marketplace/inbox.tsx - Contact inbox (auth required)
    - [ ] 20.3 Add navigation links
        - Add to sidebar under main navigation
        - Add to dashboard quick actions

- [ ]   21. IndexedDB Cache Setup
    - [ ] 21.1 Create marketplace cache schema
        - Define listings cache store
        - Define pending items store
        - Define sync metadata store
        - _Requirements: 1.5, 3.6, 7.7_
    - [ ] 21.2 Implement cache operations
        - getCachedListings, updateListingCache
        - Clear stale cache on sync
        - _Requirements: 3.6_

- [ ]   22. Final Checkpoint
    - Ensure all tests pass
    - Verify end-to-end flow works
    - Test offline functionality
    - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the three-layer architecture (Server → Service → Repository)
- All server functions use dynamic imports for Cloudflare Workers compatibility
- Public routes (browse, detail, view tracking) do not require authentication
- Authenticated routes (create, update, contact, inbox) require login

## Codebase Integration Checklist

### Database Types (app/lib/db/types.ts)

- [ ] Add `marketplace_listings` to Database interface
- [ ] Add `listing_contact_requests` to Database interface
- [ ] Add `listing_views` to Database interface

### Error Codes (app/lib/errors/error-map.ts)

Add these new error codes (starting at 40432 to avoid conflicts with Digital Foreman/IoT Sensor):

- `LISTING_NOT_FOUND` (40432) - Marketplace listing not found
- `CONTACT_REQUEST_NOT_FOUND` (40433) - Contact request not found
- `LISTING_EXPIRED` (40009) - Listing has expired
- `INVALID_PRICE_RANGE` (40010) - Min price exceeds max price
- `CONTACT_OWN_LISTING` (40011) - Cannot contact yourself about your own listing
- `DUPLICATE_CONTACT_REQUEST` (40904) - Contact request already submitted
- `REQUEST_ALREADY_RESPONDED` (40905) - Contact request already responded to
- `NOT_LISTING_OWNER` (40304) - Only listing owner can perform this action

### Notification Types (app/features/notifications/types.ts)

**Already added!** These notification types are already in the codebase:

- `'contactRequest'` - New contact request received
- `'contactApproved'` - Contact request approved by seller
- `'contactDenied'` - Contact request denied by seller
- `'listingExpiring'` - Listing expiring in 3 days
- `'listingSold'` - Listing marked as sold (notify pending requesters)

No changes needed - just use them in the notification service.

### Required Imports Pattern

```typescript
// Server functions MUST use this pattern for Cloudflare Workers:
const { getDb } = await import('~/lib/db')
const db = await getDb()

// Auth middleware (for authenticated endpoints):
const { requireAuth } = await import('~/features/auth/server-middleware')
const session = await requireAuth()

// Error handling:
import { AppError } from '~/lib/errors'
```

### Public vs Authenticated Endpoints

```typescript
// PUBLIC endpoints (no auth required):
// - getListingsFn (browse marketplace)
// - getListingDetailFn (view listing)
// - recordListingViewFn (track views)

// AUTHENTICATED endpoints (require session):
// - createListingFn
// - updateListingFn
// - deleteListingFn
// - createContactRequestFn
// - respondToRequestFn
// - getMyListingsFn
// - getContactRequestsFn
```

### Currency Display Pattern

```typescript
// In all UI components displaying prices:
import { useFormatCurrency } from '~/features/settings'

const { format, symbol } = useFormatCurrency()
// Use format(amount) for display
// Use symbol for input field labels
```

### Livestock Types (Must Match Existing)

Use these livestock types to match existing codebase (from `batches.livestockType`):

- `poultry` - Chickens, turkeys, etc.
- `fish` - Catfish, tilapia, etc.
- `cattle` - Beef and dairy cattle
- `goats` - Meat and dairy goats (note: plural)
- `sheep` - Meat sheep
- `bees` - Bee colonies (note: plural)

### Species Names (Codebase Inconsistency Note)

**IMPORTANT:** The codebase has an inconsistency in species naming:

- `batches.species` uses **lowercase**: `'broiler'`, `'catfish'`, `'layer'`
- `growth_standards.species` uses **Title Case**: `'Broiler'`, `'Catfish'`, `'Layer'`
- `breeds.speciesKey` uses **Title Case** to match `growth_standards`

For marketplace listings, use **lowercase** to match `batches.species` since listings are created from batches:

- Poultry: `broiler`, `layer`, `turkey`, `cockerel`
- Aquaculture: `catfish`, `tilapia`
- Cattle: `beef_cattle`, `dairy_cattle`
- Goats: `boer`, `kiko`, `nubian`, `alpine`
- Sheep: `dorper`, `merino`, `suffolk`
- Bees: `apis_mellifera`, `african_honey_bee`

When linking to `growth_standards` or `breeds` tables, convert to Title Case as needed.

### Privacy Fuzzing Levels

Define these fuzzing levels in constants:

- `low` - Show locality (e.g., "Ikeja, Lagos")
- `medium` - Show region only (e.g., "Lagos State")
- `high` - Show distance only (e.g., "~15km away")

### Photo Storage (Existing Infrastructure)

**Use existing storage provider system** - no new R2 bucket needed:

- Provider: `~/features/integrations/storage` (R2/S3/Local)
- Bucket: `PRIVATE_STORAGE_BUCKET` (already configured in wrangler.jsonc)
- Path format: `private/marketplace-photos/{listingId}/{index}-{timestamp}.jpg`
- Max photos per listing: 5
- Max file size: 5MB (before compression)
- Accepted formats: JPEG, PNG, WebP
- Encoding: Base64 (NOT FormData - TanStack Start doesn't support it)
- Compression: Canvas-based (no external library)
- Fallback: Return base64 if storage not configured

**Pattern to follow:** `app/features/digital-foreman/photo-storage.ts`

### i18n Namespace

Add `marketplace` to `app/lib/i18n/config.ts`:

```typescript
ns: [
  // ... existing namespaces
  'marketplace',
],
```
