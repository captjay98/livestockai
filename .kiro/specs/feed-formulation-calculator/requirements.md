# Requirements Document

## Introduction

The Feed Formulation Calculator is an advanced optimization tool that uses linear programming (HiGHS solver via WebAssembly) to create optimal feed mixes meeting nutritional requirements at minimum cost. This feature empowers farmers to formulate custom feed recipes tailored to their specific livestock species, production stages, and locally available ingredients, potentially reducing feed costs by 15-30% compared to commercial feeds while maintaining optimal nutrition.

## Glossary

- **Feed_Ingredient**: A raw material used in feed formulation (e.g., maize, soybean meal, fish meal)
- **Nutritional_Profile**: The nutrient composition of an ingredient (protein, energy, fat, fiber, minerals, amino acids)
- **Nutritional_Requirement**: The minimum/maximum nutrient levels needed for a species at a specific production stage
- **Production_Stage**: A phase in livestock development (starter, grower, finisher, layer, maintenance, lactating)
- **Linear_Programming**: Mathematical optimization technique to minimize cost while satisfying constraints
- **HiGHS_Solver**: High-performance open-source linear programming solver compiled to WebAssembly
- **Max_Inclusion**: Maximum percentage of an ingredient allowed in a formulation for safety/palatability
- **Formulation**: A calculated feed recipe specifying ingredient quantities and resulting nutritional values
- **FCR**: Feed Conversion Ratio - kg of feed required to produce 1kg of weight gain
- **Infeasible_Solution**: When no combination of ingredients can satisfy all nutritional constraints
- **Safety_Margin**: Additional percentage added to minimum nutritional requirements as a buffer
- **Batch_Size**: The total weight of feed to be produced in a single mixing session
- **Price_History**: Historical record of ingredient prices for trend analysis
- **Formulation_Usage**: Link between a saved formulation and the batches that used it
- **Mixing_Order**: Recommended sequence for adding ingredients during feed preparation

## Requirements

### Requirement 1: Feed Ingredients Database

**User Story:** As a farm manager, I want a comprehensive database of feed ingredients with nutritional profiles, so that I can select from common ingredients when formulating feed.

#### Acceptance Criteria

1. THE Feed_Ingredients_Table SHALL store ingredient name, category, and nutritional profile for each ingredient
2. THE Nutritional_Profile SHALL include protein_percent, energy_kcal_kg, fat_percent, fiber_percent, calcium_percent, phosphorus_percent, lysine_percent, and methionine_percent
3. THE Feed_Ingredients_Table SHALL store max_inclusion_percent as a safety limit for each ingredient
4. THE Feed_Ingredients_Table SHALL categorize ingredients as grain, protein, mineral, vitamin, or additive
5. THE System SHALL seed 30-40 common feed ingredients covering all categories
6. THE Feed_Ingredients_Table SHALL include is_active boolean flag to enable/disable ingredients
7. WHEN an ingredient record is created, THE System SHALL generate a unique UUID identifier

### Requirement 2: Nutritional Requirements Database

**User Story:** As a farm manager, I want species-specific nutritional requirements for each production stage, so that the calculator can formulate appropriate feed for my livestock.

#### Acceptance Criteria

1. THE Nutritional_Requirements_Table SHALL store requirements by species and production_stage
2. THE System SHALL support species: Broiler, Layer, Turkey, Catfish, Tilapia, Beef_Cattle, Dairy_Cattle, Meat_Goat, Dairy_Goat, Meat_Sheep
3. THE System SHALL support production stages: starter, grower, finisher, layer, maintenance, lactating, dry
4. THE Nutritional_Requirements_Table SHALL store min_protein_percent, min_energy_kcal_kg, max_fiber_percent, min_calcium_percent, min_phosphorus_percent, min_lysine_percent, and min_methionine_percent
5. THE System SHALL seed nutritional requirements for all supported species and applicable production stages
6. WHEN a species-stage combination is queried, THE System SHALL return the complete nutritional requirements

### Requirement 3: User Ingredient Prices

**User Story:** As a farm manager, I want to enter local prices for available ingredients, so that the calculator can optimize for my actual costs.

#### Acceptance Criteria

1. THE User_Ingredient_Prices_Table SHALL store user_id, ingredient_id, price_per_kg, and last_updated
2. WHEN a user enters a price for an ingredient, THE System SHALL store or update the price record
3. THE System SHALL track last_updated timestamp for each price entry
4. WHEN displaying ingredients, THE System SHALL show the user's stored prices if available
5. THE System SHALL allow users to mark ingredients as unavailable (price = null) to exclude from formulation
6. WHEN a user has no price for an ingredient, THE System SHALL exclude it from optimization by default

### Requirement 4: Linear Programming Solver

**User Story:** As a farm manager, I want the system to calculate the optimal feed mix automatically, so that I get the lowest cost formulation meeting all nutritional requirements.

#### Acceptance Criteria

1. THE Solver SHALL use HiGHS linear programming solver compiled to WebAssembly
2. THE Solver SHALL minimize total cost while satisfying all nutritional constraints
3. THE Solver SHALL respect max_inclusion_percent limits for each ingredient
4. THE Solver SHALL ensure total ingredient percentages sum to 100%
5. WHEN a feasible solution exists, THE Solver SHALL return ingredient quantities in kg per 100kg batch
6. IF no feasible solution exists, THEN THE Solver SHALL return an infeasibility report indicating which constraints cannot be satisfied
7. THE Solver SHALL complete optimization within 5 seconds for typical formulations
8. THE Solver SHALL run in server functions to support Cloudflare Workers deployment

### Requirement 5: Formulation User Interface

**User Story:** As a farm manager, I want an intuitive interface to create feed formulations, so that I can easily optimize feed for my livestock.

#### Acceptance Criteria

1. THE Formulation_UI SHALL allow selection of species and production_stage
2. THE Formulation_UI SHALL display available ingredients with user prices
3. THE Formulation_UI SHALL allow users to enter or update ingredient prices inline
4. THE Formulation_UI SHALL provide a "Run Optimization" button to trigger the solver
5. WHEN optimization completes successfully, THE Formulation_UI SHALL display ingredient quantities (kg per 100kg), total cost per kg, and nutritional breakdown
6. WHEN optimization fails, THE Formulation_UI SHALL display which constraints could not be satisfied and suggest relaxations
7. THE Formulation_UI SHALL allow comparison of formulation cost to typical commercial feed prices
8. THE Formulation_UI SHALL follow the "Rugged Utility" design with 48px+ touch targets

### Requirement 6: Feed Inventory Integration

**User Story:** As a farm manager, I want formulations to consider my current feed inventory, so that I can use ingredients I already have in stock.

#### Acceptance Criteria

1. WHEN displaying ingredients, THE System SHALL show current stock levels from feed_inventory table
2. THE System SHALL highlight ingredients that are low or out of stock
3. THE Formulation_UI SHALL provide an option to exclude unavailable ingredients from optimization
4. THE Formulation_UI SHALL provide an option to limit ingredient quantities to available stock
5. WHEN an ingredient is out of stock and excluded, THE System SHALL recalculate optimization without that ingredient

### Requirement 7: Recipe Comparison

**User Story:** As a farm manager, I want to compare multiple formulations side by side, so that I can choose the best option for my situation.

#### Acceptance Criteria

1. THE Comparison_UI SHALL allow selection of 2-3 formulations for comparison
2. THE Comparison_UI SHALL display cost difference between formulations
3. THE Comparison_UI SHALL display nutritional differences for key nutrients
4. THE Comparison_UI SHALL highlight which formulation is most cost-effective
5. THE Comparison_UI SHALL show ingredient differences between formulations

### Requirement 8: Saved Formulations

**User Story:** As a farm manager, I want to save and reuse formulations, so that I don't have to recalculate every time.

#### Acceptance Criteria

1. THE System SHALL allow users to save formulations with custom names
2. THE Saved_Formulation SHALL store species, production_stage, ingredient quantities, total cost, and nutritional values
3. THE System SHALL display a list of saved formulations for the user
4. WHEN viewing a saved formulation, THE System SHALL allow re-running optimization with current prices
5. THE System SHALL track creation date and last modified date for saved formulations
6. THE System SHALL allow users to delete saved formulations

### Requirement 9: Export and Share

**User Story:** As a farm manager, I want to export and share formulations, so that I can print recipes or share with other farmers.

#### Acceptance Criteria

1. THE System SHALL generate a PDF export containing ingredient list, quantities, cost breakdown, and nutritional analysis
2. THE PDF_Export SHALL include the formulation name, species, production stage, and date
3. THE System SHALL generate a shareable code or link for formulations
4. WHEN a shared code is entered, THE System SHALL load the formulation for viewing
5. THE Shared_Formulation SHALL be read-only for recipients unless they save a copy

### Requirement 10: Server Functions Architecture

**User Story:** As a developer, I want API endpoints following the three-layer architecture, so that the feature integrates cleanly with the existing codebase.

#### Acceptance Criteria

1. THE Server_Functions SHALL use dynamic imports for database access to support Cloudflare Workers
2. THE Server_Functions SHALL follow Server → Service → Repository pattern
3. THE Repository_Layer SHALL handle all database operations for ingredients, requirements, prices, and formulations
4. THE Service_Layer SHALL contain optimization logic and nutritional calculations
5. THE Server_Layer SHALL handle authentication, validation, and orchestration
6. THE HiGHS_WASM_Bundle SHALL be loaded lazily to minimize initial bundle size

### Requirement 11: Multi-Currency Support

**User Story:** As a farmer in any country, I want to see feed costs in my local currency, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. THE System SHALL display all prices using the user's currency from user_settings.currencyCode
2. THE System SHALL format prices according to the user's locale settings
3. WHEN exporting PDF reports, THE System SHALL include the currency symbol and formatting
4. THE System SHALL store prices in the user's local currency (no conversion needed)
5. THE Formulation_UI SHALL display the currency symbol next to all price inputs

### Requirement 12: Configurable Batch Size

**User Story:** As a farmer, I want to specify my batch size, so that I can formulate feed for my actual production needs.

#### Acceptance Criteria

1. THE Formulation_UI SHALL allow selection of batch sizes: 25kg, 50kg, 100kg, 250kg, 500kg, 1000kg, or custom
2. WHEN a batch size is selected, THE System SHALL scale all ingredient quantities proportionally
3. THE System SHALL display total batch cost based on the selected batch size
4. THE System SHALL display cost per kg regardless of batch size for comparison
5. THE PDF_Export SHALL include the selected batch size and scaled quantities

### Requirement 13: Ingredient Substitutions and Relaxation

**User Story:** As a farmer, I want suggestions when optimization fails, so that I can adjust my available ingredients to find a feasible solution.

#### Acceptance Criteria

1. WHEN optimization fails, THE System SHALL identify which constraints are violated
2. THE System SHALL suggest ingredient substitutions that could satisfy violated constraints
3. THE System SHALL provide a "Relax Constraints" option that reduces minimum requirements by 5%
4. THE System SHALL display which ingredients could be added to make the formulation feasible
5. THE Infeasibility_Report SHALL rank suggestions by impact on feasibility

### Requirement 14: Formulation Usage Tracking

**User Story:** As a farmer, I want to link formulations to my batches, so that I can track which feed recipes I used for each production cycle.

#### Acceptance Criteria

1. THE System SHALL allow linking a saved formulation to one or more batches
2. WHEN viewing a batch, THE System SHALL display the linked formulation if any
3. WHEN viewing a formulation, THE System SHALL display which batches have used it
4. THE System SHALL track usage count for each formulation
5. THE Formulation_History SHALL show formulation performance (FCR, growth) when linked to completed batches

### Requirement 15: Ingredient Price History

**User Story:** As a farmer, I want to see how ingredient prices have changed, so that I can make better purchasing decisions.

#### Acceptance Criteria

1. THE System SHALL store price history when user_ingredient_prices are updated
2. THE System SHALL display price trend indicators (up, down, stable) for each ingredient
3. WHEN viewing an ingredient, THE System SHALL show price history for the last 90 days
4. THE System SHALL calculate and display percentage change from previous price
5. THE Price_History_Chart SHALL show price trends over time

### Requirement 16: Nutritional Safety Margins

**User Story:** As a farmer, I want to add safety margins to nutritional requirements, so that my feed meets industry best practices.

#### Acceptance Criteria

1. THE Formulation_UI SHALL allow setting a safety margin percentage (0%, 2%, 5%, 10%)
2. WHEN a safety margin is set, THE System SHALL increase minimum requirements by that percentage
3. THE System SHALL display both target values (with margin) and actual values in results
4. THE Default_Safety_Margin SHALL be 2% for all nutrients
5. THE PDF_Export SHALL indicate if a safety margin was applied

### Requirement 17: Mixing Instructions

**User Story:** As a farmer, I want mixing instructions with my formulation, so that I can properly prepare the feed.

#### Acceptance Criteria

1. THE PDF_Export SHALL include a recommended mixing order for ingredients
2. THE Mixing_Order SHALL group ingredients by category (grains first, then proteins, then minerals/vitamins)
3. THE System SHALL include general mixing tips based on ingredient types
4. THE System SHALL allow users to add custom mixing notes to saved formulations
5. THE Formulation_Detail_View SHALL display mixing instructions

### Requirement 18: Mobile-Optimized Price Entry

**User Story:** As a farmer in the field, I want to quickly update ingredient prices on my phone, so that I can optimize feed while at the market.

#### Acceptance Criteria

1. THE System SHALL provide a mobile-optimized quick price entry screen
2. THE Quick_Price_Entry SHALL display ingredients in a simple list with large input fields
3. THE Quick_Price_Entry SHALL support barcode/QR scanning for ingredient lookup (future enhancement)
4. THE System SHALL allow batch price updates from a CSV or spreadsheet
5. THE Mobile_UI SHALL use 48px+ touch targets and minimize scrolling
