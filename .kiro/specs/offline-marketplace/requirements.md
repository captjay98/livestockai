# Requirements Document

## Introduction

The Offline Marketplace is a classified-ads style feature that enables farmers to list livestock for sale and discover nearby sellers, all while working offline. Unlike a full e-commerce platform, this feature focuses on connecting buyers and sellers through simple listings with privacy-preserving location and quantity fuzzing. No payment processing is included - the platform simply connects buyers and sellers who then negotiate directly.

The system addresses the unique challenges of rural farming environments worldwide with unreliable internet connectivity by storing listings locally and syncing when online. Farmers maintain control over their privacy through configurable fuzzing levels for location, quantity, and pricing information. Credit Passport integration allows verified sellers to display trust badges, building trust without revealing sensitive financial data.

The marketplace is designed to be globally accessible, supporting multiple languages and regional configurations without hardcoding any country-specific logic.

## Glossary

- **Marketplace**: The overall system for listing and discovering livestock for sale
- **Listing**: A classified ad posted by a farmer advertising livestock for sale
- **Listing_Service**: The service responsible for creating, updating, and managing listings
- **Privacy_Fuzzer**: The service that applies configurable fuzzing to sensitive data (location, quantity, price)
- **Sync_Engine**: The service responsible for synchronizing local listings with the server
- **Contact_Request**: A message from a buyer expressing interest in a listing
- **Seller**: A farmer who creates listings to sell livestock
- **Buyer**: A user browsing listings to purchase livestock
- **Fuzzing_Level**: The degree of privacy protection applied (low, medium, high)
- **Verification_Badge**: A trust indicator showing the seller has a verified Credit Passport
- **Listing_Cache**: Local IndexedDB storage for offline listing browsing
- **Conflict_Resolver**: The service that handles sync conflicts for stale listings

## Requirements

### Requirement 1: Create Marketplace Listing

**User Story:** As a farmer, I want to create a listing for livestock I want to sell, so that potential buyers can discover my available stock.

#### Acceptance Criteria

1. WHEN a farmer creates a listing, THE Listing_Service SHALL require species, quantity range, price range, and location
2. WHEN a farmer creates a listing, THE Listing_Service SHALL allow optional fields for description, photos, and contact preferences
3. WHEN a farmer has active batches, THE Listing_Service SHALL offer to pre-fill listing details from batch data
4. WHEN a listing is created, THE Listing_Service SHALL set the default expiration to 30 days from creation
5. WHEN a listing is created, THE Listing_Service SHALL store it locally in IndexedDB for offline access
6. WHEN a listing is created while online, THE Listing_Service SHALL immediately sync to the server
7. WHEN a listing is created while offline, THE Listing_Service SHALL queue it for sync when connectivity returns

### Requirement 2: Privacy Fuzzing for Listings

**User Story:** As a farmer, I want my exact location and quantities hidden from strangers, so that I can protect my privacy and security.

#### Acceptance Criteria

1. WHEN displaying a listing to non-owners, THE Privacy_Fuzzer SHALL convert exact locations to general areas based on fuzzing level
2. WHEN fuzzing level is set to low, THE Privacy_Fuzzer SHALL display location as the local administrative area (district, county, LGA, or equivalent)
3. WHEN fuzzing level is set to medium, THE Privacy_Fuzzer SHALL display location as the state, province, or region
4. WHEN fuzzing level is set to high, THE Privacy_Fuzzer SHALL display location as distance range from a reference point (e.g., "Within 50km of [City]")
5. WHEN displaying quantities, THE Privacy_Fuzzer SHALL convert exact numbers to ranges (e.g., "50-100 birds" instead of "73 birds")
6. WHEN displaying prices, THE Privacy_Fuzzer SHALL show price ranges until a contact request is approved
7. THE Privacy_Fuzzer SHALL store exact values in the database and apply fuzzing only at display time
8. WHEN a farmer views their own listing, THE Privacy_Fuzzer SHALL display exact values without fuzzing

### Requirement 3: Browse and Search Listings

**User Story:** As a buyer, I want to browse and search livestock listings, so that I can find sellers near me with the stock I need.

#### Acceptance Criteria

1. WHEN a user opens the marketplace, THE Marketplace SHALL display active listings sorted by proximity and recency
2. WHEN a user searches by species, THE Marketplace SHALL filter listings to show only matching species
3. WHEN a user filters by price range, THE Marketplace SHALL show listings with overlapping price ranges
4. WHEN a user filters by distance, THE Marketplace SHALL show listings within the specified radius
5. WHEN a user filters by livestock type, THE Marketplace SHALL show listings matching the selected type (poultry, fish, cattle, goats, sheep, bees)
6. WHEN browsing while offline, THE Marketplace SHALL display cached listings from IndexedDB
7. WHEN cached listings are stale (older than 24 hours), THE Marketplace SHALL display a staleness indicator
8. THE Marketplace SHALL support pagination with configurable page size (default 20 listings)

### Requirement 4: Listing Detail View

**User Story:** As a buyer, I want to view listing details, so that I can evaluate if the livestock meets my needs before contacting the seller.

#### Acceptance Criteria

1. WHEN viewing a listing detail, THE Marketplace SHALL display species, quantity range, price range, and fuzzed location
2. WHEN viewing a listing detail, THE Marketplace SHALL display the listing description and any photos
3. WHEN viewing a listing detail, THE Marketplace SHALL display the listing age and expiration date
4. WHEN the seller has a verified Credit Passport, THE Marketplace SHALL display a Verification_Badge
5. WHEN viewing a listing detail, THE Marketplace SHALL display a "Contact Seller" button
6. IF the listing has expired, THEN THE Marketplace SHALL display an expiration notice and disable contact

### Requirement 5: Contact Request System

**User Story:** As a buyer, I want to contact sellers about their listings, so that I can negotiate and arrange purchases.

#### Acceptance Criteria

1. WHEN a buyer submits a contact request, THE Marketplace SHALL require a message explaining their interest
2. WHEN a buyer submits a contact request, THE Marketplace SHALL include the buyer's name and preferred contact method
3. WHEN a contact request is submitted, THE Marketplace SHALL notify the seller via in-app notification
4. WHEN a contact request is submitted while offline, THE Marketplace SHALL queue it for sync
5. WHEN a seller approves a contact request, THE Marketplace SHALL reveal exact listing details to the buyer
6. WHEN a seller denies a contact request, THE Marketplace SHALL notify the buyer without revealing seller details
7. THE Marketplace SHALL allow sellers to view all pending and historical contact requests

### Requirement 6: Listing Management

**User Story:** As a seller, I want to manage my listings, so that I can update availability and remove sold items.

#### Acceptance Criteria

1. WHEN a seller views their listings, THE Marketplace SHALL display all active, expired, and sold listings
2. WHEN a seller updates a listing, THE Listing_Service SHALL sync changes when online
3. WHEN a seller marks a listing as sold, THE Listing_Service SHALL archive the listing and notify pending requesters
4. WHEN a seller extends a listing, THE Listing_Service SHALL update the expiration date
5. WHEN a seller deletes a listing, THE Listing_Service SHALL soft-delete and retain for audit purposes
6. THE Listing_Service SHALL allow sellers to pause listings temporarily without deletion

### Requirement 7: Offline Sync Engine

**User Story:** As a farmer in a rural area, I want the marketplace to work offline, so that I can browse and create listings without internet.

#### Acceptance Criteria

1. WHEN the device goes online, THE Sync_Engine SHALL automatically sync pending listings and contact requests
2. WHEN syncing listings, THE Sync_Engine SHALL use last-write-wins conflict resolution for non-critical fields
3. WHEN a listing has been modified both locally and remotely, THE Sync_Engine SHALL preserve the most recent update
4. WHEN a listing has been deleted on the server, THE Sync_Engine SHALL remove it from local cache
5. WHEN syncing fails, THE Sync_Engine SHALL retry with exponential backoff (max 3 retries)
6. THE Sync_Engine SHALL display sync status indicator (synced, syncing, pending, failed)
7. THE Sync_Engine SHALL store sync metadata including last sync timestamp and pending item count

### Requirement 8: Listing Expiration

**User Story:** As a marketplace user, I want listings to expire automatically, so that I only see current availability.

#### Acceptance Criteria

1. WHEN creating a listing, THE Listing_Service SHALL allow expiration periods of 7, 14, 30, or 60 days
2. WHEN a listing expires, THE Listing_Service SHALL mark it as expired and remove from active search results
3. WHEN a listing is about to expire (3 days before), THE Listing_Service SHALL notify the seller
4. WHEN a seller renews an expired listing, THE Listing_Service SHALL reset the expiration date
5. THE Listing_Service SHALL retain expired listings for 90 days before permanent deletion

### Requirement 9: Credit Passport Integration

**User Story:** As a buyer, I want to see which sellers are verified, so that I can trust their listings.

#### Acceptance Criteria

1. WHEN a seller has generated a Credit Passport report within the last 90 days, THE Marketplace SHALL display a Verification_Badge on their listings
2. WHEN displaying the Verification_Badge, THE Marketplace SHALL show the verification date
3. WHEN a buyer clicks the Verification_Badge, THE Marketplace SHALL link to the public verification portal
4. THE Marketplace SHALL NOT reveal any Credit Passport financial details without seller consent

### Requirement 10: Batch Integration

**User Story:** As a farmer, I want to create listings from my existing batches, so that I can quickly list available stock.

#### Acceptance Criteria

1. WHEN creating a listing, THE Listing_Service SHALL display active batches as suggestions
2. WHEN a farmer selects a batch, THE Listing_Service SHALL pre-fill species, quantity, and estimated price
3. WHEN a batch is linked to a listing, THE Listing_Service SHALL update listing quantity when batch quantity changes
4. WHEN a linked batch is sold or depleted, THE Listing_Service SHALL prompt the seller to update or close the listing

### Requirement 11: Geographic Filtering

**User Story:** As a buyer, I want to find sellers near me, so that I can minimize transport costs.

#### Acceptance Criteria

1. WHEN a user enables location services, THE Marketplace SHALL calculate distances to listings
2. WHEN filtering by distance, THE Marketplace SHALL support radius options of 25km, 50km, 100km, and 200km
3. WHEN location services are unavailable, THE Marketplace SHALL allow manual location selection by state/LGA
4. THE Marketplace SHALL sort listings by distance when proximity sorting is selected

### Requirement 12: Listing Analytics

**User Story:** As a seller, I want to see how my listings perform, so that I can optimize my pricing and descriptions.

#### Acceptance Criteria

1. THE Marketplace SHALL track view count for each listing
2. THE Marketplace SHALL track contact request count for each listing
3. WHEN a seller views their listing analytics, THE Marketplace SHALL display views, contacts, and conversion rate
4. THE Marketplace SHALL store analytics data locally and sync when online

### Requirement 13: Public Marketplace Access

**User Story:** As a potential buyer, I want to browse the marketplace without creating an account, so that I can discover available livestock before committing to the platform.

#### Acceptance Criteria

1. THE Marketplace SHALL allow unauthenticated users to browse and search listings
2. THE Marketplace SHALL allow unauthenticated users to view listing details with fuzzed information
3. WHEN an unauthenticated user attempts to contact a seller, THE Marketplace SHALL prompt them to create an account or log in
4. WHEN an unauthenticated user attempts to create a listing, THE Marketplace SHALL prompt them to create an account or log in
5. THE Marketplace SHALL display the same fuzzed information to both authenticated and unauthenticated users (except listing owners)

### Requirement 14: Multi-Language Support

**User Story:** As a farmer in any country, I want to use the marketplace in my preferred language, so that I can easily understand and navigate the platform.

#### Acceptance Criteria

1. THE Marketplace SHALL display all UI elements in the user's selected language
2. THE Marketplace SHALL allow listing descriptions to be entered in any language
3. WHEN displaying listings, THE Marketplace SHALL show the original language with optional translation indicator
4. THE Marketplace SHALL support all languages available in LivestockAI (English, Hausa, Yoruba, Igbo, French, Portuguese, Swahili, Spanish, Hindi, Turkish, Indonesian, Bengali, Thai, Vietnamese, Amharic)

### Requirement 15: Listing Photos

**User Story:** As a seller, I want to add photos to my listings, so that buyers can see the quality of my livestock.

#### Acceptance Criteria

1. WHEN creating or editing a listing, THE Listing_Service SHALL allow up to 5 photos per listing
2. THE Listing_Service SHALL compress photos to reduce storage and bandwidth requirements
3. THE Listing_Service SHALL store photos locally when offline and sync when online
4. WHEN displaying photos, THE Marketplace SHALL show thumbnails in listing cards and full images in detail view
5. THE Listing_Service SHALL validate that uploaded files are images (JPEG, PNG, WebP)
