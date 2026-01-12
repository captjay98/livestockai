# Requirements Document

## Introduction

The Feature Modules System enables farms to selectively enable or disable livestock management features based on their operational needs. This allows OpenLivestock to support diverse farm types (poultry, aquaculture, cattle, goats, sheep, bees) while keeping the interface clean and relevant for each user. Farms can enable only the modules they need, reducing clutter and improving usability.

## Glossary

- **Module**: A discrete set of features related to a specific livestock type or farm capability (e.g., poultry module, cattle module)
- **Farm_Modules**: Database table storing which modules are enabled for each farm
- **Livestock_Type**: Category of animals being managed (poultry, fish, cattle, goats, sheep, bees)
- **Module_Key**: Unique identifier for a module (e.g., 'poultry', 'aquaculture', 'cattle')
- **Module_Metadata**: Configuration data for a module including label, icon, species options, and related features

## Requirements

### Requirement 1: Module Data Storage

**User Story:** As a farm owner, I want my module preferences to be stored persistently, so that my enabled features are remembered across sessions.

#### Acceptance Criteria

1. THE Database SHALL store module enablement status in a farm_modules table with farmId, moduleKey, and enabled fields
2. WHEN a new farm is created, THE System SHALL create default module entries based on the farm type
3. WHEN a module is enabled or disabled, THE System SHALL persist the change immediately to the database
4. THE System SHALL support the following module keys: 'poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees'

### Requirement 2: Module Configuration Management

**User Story:** As a farm owner, I want to enable or disable modules for my farm, so that I only see features relevant to my operations.

#### Acceptance Criteria

1. WHEN a user navigates to farm settings, THE System SHALL display a list of available modules with toggle controls
2. WHEN a user enables a module, THE System SHALL immediately make related features accessible
3. WHEN a user disables a module, THE System SHALL hide related navigation items and features
4. THE System SHALL prevent disabling a module if active batches exist for that livestock type
5. WHEN displaying module options, THE System SHALL show module name, description, and icon

### Requirement 3: Dynamic Navigation

**User Story:** As a user, I want the navigation menu to show only features relevant to my enabled modules, so that I have a cleaner interface.

#### Acceptance Criteria

1. WHEN rendering navigation, THE System SHALL filter menu items based on enabled modules
2. WHEN a module is disabled, THE System SHALL hide navigation items specific to that module
3. THE System SHALL always show core navigation items (Dashboard, Farms, Settings, Reports) regardless of modules
4. WHEN all livestock modules are disabled, THE System SHALL show a prompt to enable at least one module

### Requirement 4: Expanded Livestock Type Support

**User Story:** As a farm owner with diverse livestock, I want to manage cattle, goats, sheep, and bees in addition to poultry and fish, so that I can use one system for all my animals.

#### Acceptance Criteria

1. THE System SHALL support livestock types: poultry, fish, cattle, goats, sheep, bees
2. WHEN creating a batch, THE System SHALL show only livestock types from enabled modules
3. THE System SHALL provide species options appropriate to each livestock type
4. THE System SHALL provide source size options appropriate to each livestock type
5. WHEN recording sales, THE System SHALL support product types: poultry, fish, eggs, cattle, goats, sheep, honey, milk, wool

### Requirement 5: Module-Specific Species and Options

**User Story:** As a user, I want species and configuration options that are appropriate for each livestock type, so that I can accurately record my farm data.

#### Acceptance Criteria

1. WHEN poultry module is enabled, THE System SHALL offer species: Broiler, Layer, Cockerel, Turkey, Duck, Goose, Guinea Fowl, Quail
2. WHEN aquaculture module is enabled, THE System SHALL offer species: Catfish, Tilapia, Carp, Salmon, Mackerel, Croaker, Snapper, Shrimp
3. WHEN cattle module is enabled, THE System SHALL offer species: Beef Cattle, Dairy Cattle, Dual-Purpose
4. WHEN goats module is enabled, THE System SHALL offer species: Boer, Kiko, Nubian, Alpine, Saanen, Nigerian Dwarf
5. WHEN sheep module is enabled, THE System SHALL offer species: Dorper, Merino, Suffolk, Hampshire, Katahdin
6. WHEN bees module is enabled, THE System SHALL offer species: Italian, Carniolan, Buckfast, Russian

### Requirement 6: Expanded Structure Types

**User Story:** As a farm owner, I want to define structures appropriate for my livestock type, so that I can accurately track where my animals are housed.

#### Acceptance Criteria

1. THE System SHALL support structure types: house, pond, pen, cage, barn, pasture, hive, milking_parlor, shearing_shed
2. WHEN creating a structure, THE System SHALL suggest appropriate types based on enabled modules
3. THE System SHALL allow any structure type regardless of module for flexibility

### Requirement 7: Expanded Feed Types

**User Story:** As a farm owner, I want feed type options appropriate for my livestock, so that I can accurately track feed consumption.

#### Acceptance Criteria

1. THE System SHALL support feed types: starter, grower, finisher, layer_mash, fish_feed, cattle_feed, goat_feed, sheep_feed, hay, silage, bee_feed
2. WHEN recording feed, THE System SHALL show feed types relevant to the batch's livestock type
3. THE System SHALL allow any feed type for flexibility in mixed operations

### Requirement 8: Dashboard Module Awareness

**User Story:** As a user, I want the dashboard to show inventory summaries only for my enabled modules, so that I see relevant information at a glance.

#### Acceptance Criteria

1. WHEN rendering dashboard inventory cards, THE System SHALL show only cards for enabled modules
2. WHEN all modules are disabled, THE System SHALL show a prompt to enable modules
3. THE System SHALL display appropriate icons for each livestock type on dashboard cards
4. WHEN calculating totals, THE System SHALL aggregate across all enabled livestock types

### Requirement 9: Module Metadata and Configuration

**User Story:** As a developer, I want centralized module configuration, so that adding new modules is straightforward.

#### Acceptance Criteria

1. THE System SHALL define module metadata in a central constants file
2. THE Module_Metadata SHALL include: key, label, description, icon, livestockTypes, speciesOptions, sourceSizeOptions, feedTypes, structureTypes
3. WHEN a new module is added, THE System SHALL only require updating the constants file and database constraints
4. THE System SHALL export helper functions to get options filtered by enabled modules
