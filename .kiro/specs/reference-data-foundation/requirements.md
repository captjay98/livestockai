# Requirements Document

## Introduction

The Reference Data Foundation feature moves hardcoded species and breed data from application constants to the database, enabling accurate breed-specific growth forecasting and laying the groundwork for future features like Dr. AI diagnostics and Feed Formulation Calculator. This foundational change transforms LivestockAI from a generic livestock tracker to a precision farming tool with breed-specific intelligence.

## Glossary

- **Breed**: A specific genetic line within a species (e.g., Cobb 500 is a breed of broiler chicken)
- **Species**: A type of livestock within a module (e.g., broiler, layer, catfish, tilapia)
- **Module**: A livestock category in LivestockAI (poultry, aquaculture, cattle, goats, sheep, bees)
- **Growth_Standard**: Expected weight at a specific day/age for a species or breed
- **FCR**: Feed Conversion Ratio - kg of feed required to produce 1kg of weight gain
- **Source_Size**: The age/size category when livestock is acquired (e.g., day-old, fingerling, weaner)
- **Breeds_Table**: Database table storing breed reference data
- **Batch**: A group of livestock acquired and managed together

## Requirements

### Requirement 1: Breeds Database Table

**User Story:** As a farm manager, I want breed information stored in the database, so that the system can provide breed-specific guidance and forecasting.

#### Acceptance Criteria

1. THE Breeds_Table SHALL store module_key, species_key, breed_name, and display_name for each breed
2. THE Breeds_Table SHALL store typical_market_weight_g, typical_days_to_market, and typical_fcr for each breed
3. THE Breeds_Table SHALL store source_sizes as a JSON array of valid acquisition sizes for each breed
4. THE Breeds_Table SHALL store regions as a JSON array indicating geographic availability
5. THE Breeds_Table SHALL include is_default and is_active boolean flags for each breed
6. WHEN a breed record is created, THE System SHALL generate a unique UUID identifier
7. THE Breeds_Table SHALL enforce a unique constraint on the combination of module_key, species_key, and breed_name

### Requirement 2: Breed-Specific Growth Standards

**User Story:** As a farm manager, I want growth curves specific to each breed, so that I can get accurate weight forecasts for my livestock.

#### Acceptance Criteria

1. THE Growth_Standards table SHALL include an optional breed_id column referencing the Breeds_Table
2. WHEN breed_id is null, THE Growth_Standard SHALL apply as a species-level fallback
3. WHEN breed_id is specified, THE Growth_Standard SHALL apply only to batches of that breed
4. THE System SHALL seed breed-specific growth curves for major commercial breeds
5. WHEN querying growth standards, THE System SHALL prioritize breed-specific curves over species-level fallbacks

### Requirement 3: Comprehensive Breed Seed Data

**User Story:** As a farm manager, I want pre-populated breed data for common livestock, so that I can start using breed-specific features immediately.

#### Acceptance Criteria

1. THE System SHALL seed poultry breeds including Cobb 500, Ross 308, Arbor Acres for broilers and Hy-Line Brown, Lohmann Brown for layers
2. THE System SHALL seed aquaculture breeds including Clarias gariepinus, Channel Catfish for catfish and Nile Tilapia, Red Tilapia for tilapia
3. THE System SHALL seed cattle breeds including Angus, Hereford, Holstein, Jersey, and White Fulani
4. THE System SHALL seed goat breeds including Boer, Kalahari Red, Saanen, and West African Dwarf
5. THE System SHALL seed sheep breeds including Dorper, Suffolk, Merino, and Yankasa
6. THE System SHALL seed bee breeds including Apis mellifera and African Honey Bee
7. WHEN seeding breeds, THE System SHALL mark one breed per species as is_default=true

### Requirement 4: Breed Server Functions

**User Story:** As a developer, I want API endpoints to fetch breed data, so that the UI can display breed options dynamically.

#### Acceptance Criteria

1. WHEN getBreedsForModule is called with a module_key, THE System SHALL return all active breeds for that module
2. WHEN getBreedsForSpecies is called with a species_key, THE System SHALL return all active breeds for that species
3. WHEN getBreedById is called with a breed_id, THE System SHALL return the complete breed record
4. IF no breeds are found for a query, THEN THE System SHALL return an empty array
5. THE Server_Functions SHALL use dynamic imports for database access to support Cloudflare Workers

### Requirement 5: Batch Creation with Breed Selection

**User Story:** As a farm manager, I want to select a specific breed when creating a batch, so that I get accurate forecasting for my livestock.

#### Acceptance Criteria

1. THE Batch_Dialog SHALL fetch breeds from the database instead of using hardcoded options
2. WHEN a species is selected, THE Batch_Dialog SHALL display available breeds for that species
3. WHEN a breed is selected, THE Batch_Dialog SHALL update source size options based on the breed's source_sizes
4. THE Batches_Table SHALL include a breed_id column to store the selected breed
5. WHEN no breed is selected, THE System SHALL allow batch creation with breed_id as null for backward compatibility
6. WHEN a breed with is_default=true exists, THE Batch_Dialog SHALL pre-select it after species selection

### Requirement 6: Breed-Aware Forecasting

**User Story:** As a farm manager, I want growth forecasts based on my specific breed, so that I can plan harvests accurately.

#### Acceptance Criteria

1. WHEN calculating projections for a batch with breed_id, THE Forecasting_System SHALL use breed-specific growth standards
2. WHEN calculating projections for a batch without breed_id, THE Forecasting_System SHALL fall back to species-level growth standards
3. WHEN no growth standards exist for a breed, THE Forecasting_System SHALL fall back to species-level standards
4. THE Forecasting_System SHALL use the breed's typical_fcr for feed cost projections when available

### Requirement 7: Data Migration Compatibility

**User Story:** As a system administrator, I want existing batches to continue working after the update, so that no data is lost.

#### Acceptance Criteria

1. THE Migration SHALL add breed_id as a nullable column to the batches table
2. THE Migration SHALL add breed_id as a nullable column to the growth_standards table
3. WHEN the migration runs, THE System SHALL preserve all existing batch and growth standard records
4. THE System SHALL continue to function correctly for batches without breed_id assigned
