# Feature: API Reference Documentation

## Feature Description

Generate comprehensive API reference documentation from TypeScript code using TypeDoc. Auto-generate documentation for server functions, hooks, utilities, and types with proper JSDoc comments.

## User Story

As a **developer integrating with OpenLivestock or extending its functionality**
I want to **browse auto-generated API documentation for all server functions, hooks, and utilities**
So that **I can quickly understand function signatures, parameters, return types, and usage without reading source code**

## Problem Statement

Current documentation lacks:
- Searchable API reference for 24 server function modules
- Documentation for hooks and utilities
- Type definitions reference
- Function signatures with parameter descriptions
- Return type documentation
- Usage examples for each function

Developers must read source code to understand APIs, which is time-consuming and error-prone.

## Solution Statement

Use TypeDoc to auto-generate API documentation from TypeScript code:
1. Add comprehensive JSDoc comments to all public functions
2. Configure TypeDoc to generate HTML documentation
3. Organize documentation by module (batches, sales, feed, etc.)
4. Add usage examples in JSDoc comments
5. Deploy documentation to docs/api/ directory
6. Add npm script to regenerate documentation

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Documentation (requires JSDoc comments in code)
**Dependencies**: typedoc (npm package)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/batches/server.ts` (lines 1-80) - Why: Example server functions to document
- `app/features/sales/server.ts` - Why: Financial server functions
- `app/features/feed/server.ts` - Why: Feed management functions
- `app/features/mortality/server.ts` - Why: Mortality tracking functions
- `app/features/settings/server.ts` - Why: Settings functions
- `app/features/settings/currency.ts` - Why: Utility functions to document
- `app/features/settings/date-formatter.ts` - Why: Utility functions
- `app/hooks/useModuleNavigation.ts` - Why: React hooks to document
- `app/lib/db/types.ts` - Why: Database types to document
- `package.json` - Why: Add typedoc dependency and scripts

### New Files to Create

- `typedoc.json` - TypeDoc configuration
- `docs/api/.gitkeep` - API docs output directory
- `.github/workflows/docs.yml` - CI workflow to regenerate docs
- `scripts/generate-docs.ts` - Script to generate documentation

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [TypeDoc Documentation](https://typedoc.org/)
  - Specific section: Configuration, JSDoc Tags
  - Why: Learn TypeDoc configuration and JSDoc syntax
- [TSDoc Standard](https://tsdoc.org/)
  - Specific section: Tag Reference
  - Why: Standard JSDoc tags for TypeScript
- [TypeDoc GitHub Pages](https://typedoc.org/guides/installation/)
  - Specific section: Installation and Usage
  - Why: Setup instructions

### Patterns to Follow

**JSDoc Comment Pattern:**
```typescript
/**
 * Create a new batch for livestock tracking
 * 
 * @param userId - The ID of the user creating the batch
 * @param data - Batch creation data including farm, species, quantity
 * @returns Promise resolving to the created batch ID
 * @throws {Error} If user doesn't have access to the farm
 * 
 * @example
 * ```typescript
 * const batchId = await createBatch('user-123', {
 *   farmId: 'farm-456',
 *   livestockType: 'poultry',
 *   species: 'broiler',
 *   initialQuantity: 100,
 *   acquisitionDate: new Date(),
 *   costPerUnit: 500
 * })
 * ```
 */
export async function createBatch(
  userId: string,
  data: CreateBatchData,
): Promise<string> {
  // Implementation
}
```

**Interface Documentation Pattern:**
```typescript
/**
 * Data required to create a new batch
 */
export interface CreateBatchData {
  /** The farm ID where the batch will be created */
  farmId: string
  
  /** Type of livestock (poultry, fish, cattle, goats, sheep, bees) */
  livestockType: LivestockType
  
  /** Specific species (e.g., broiler, catfish, angus) */
  species: string
  
  /** Initial number of animals in the batch */
  initialQuantity: number
  
  /** Date the batch was acquired */
  acquisitionDate: Date
  
  /** Cost per animal unit in user's currency */
  costPerUnit: number
}
```

**Utility Function Pattern:**
```typescript
/**
 * Format a number as currency based on user settings
 * 
 * @param amount - The numeric amount to format
 * @param settings - User currency settings (symbol, decimals, separators)
 * @returns Formatted currency string (e.g., "$1,234.56" or "₦1,234.56")
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56, {
 *   currencySymbol: '$',
 *   currencyDecimals: 2,
 *   thousandSeparator: ',',
 *   decimalSeparator: '.'
 * })
 * // Returns: "$1,234.56"
 * ```
 */
export function formatCurrency(
  amount: number,
  settings: CurrencySettings
): string {
  // Implementation
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Setup TypeDoc

Install TypeDoc and configure:
- Add typedoc dependency
- Create typedoc.json configuration
- Configure output directory (docs/api/)
- Set up module organization

### Phase 2: Add JSDoc Comments

Add comprehensive JSDoc comments to:
- All server functions (24 modules)
- All utility functions (currency, date, units)
- All React hooks
- All interfaces and types

### Phase 3: Generate Documentation

Generate initial documentation:
- Run TypeDoc
- Review output
- Fix any issues
- Organize by module

### Phase 4: Automation

Automate documentation generation:
- Add npm script
- Create CI workflow
- Add pre-commit hook (optional)

---

## STEP-BY-STEP TASKS

### Task 1: CREATE typedoc.json

- **IMPLEMENT**: TypeDoc configuration file
- **OPTIONS**:
  - entryPoints: ["app/features/*/server.ts", "app/hooks/*.ts", "app/features/*/utils.ts"]
  - out: "docs/api"
  - exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
  - excludePrivate: true
  - excludeProtected: true
  - plugin: ["typedoc-plugin-markdown"] (optional)
- **VALIDATE**: `cat typedoc.json`

### Task 2: UPDATE package.json - Add TypeDoc Dependency

- **IMPLEMENT**: Add typedoc to devDependencies
- **VERSION**: "^0.26.0" (latest stable)
- **SCRIPTS**: Add "docs:generate": "typedoc"
- **VALIDATE**: `bun install && bun run docs:generate --help`

### Task 3: UPDATE app/features/batches/server.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: createBatch, getBatches, getBatchById, updateBatch, deleteBatch, updateBatchQuantity, getBatchStats, getInventorySummary, getBatchesPaginated
- **PATTERN**: Include @param, @returns, @throws, @example for each
- **VALIDATE**: `bun run docs:generate` (check batches module in output)

### Task 4: UPDATE app/features/sales/server.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: createSale, getSales, getSaleById, updateSale, deleteSale, getSalesSummary
- **PATTERN**: Same as batches
- **VALIDATE**: Check sales module in generated docs

### Task 5: UPDATE app/features/feed/server.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: createFeedRecord, getFeedRecords, updateFeedRecord, deleteFeedRecord, getFeedSummary
- **PATTERN**: Same as batches
- **VALIDATE**: Check feed module in generated docs

### Task 6: UPDATE app/features/mortality/server.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: createMortalityRecord, getMortalityRecords, updateMortalityRecord, deleteMortalityRecord, getMortalityStats
- **PATTERN**: Same as batches
- **VALIDATE**: Check mortality module in generated docs

### Task 7: UPDATE app/features/settings/currency.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: formatCurrency, toNumber, toDbString, add, subtract, multiply, divide
- **PATTERN**: Include @example for each utility
- **VALIDATE**: Check currency utilities in generated docs

### Task 8: UPDATE app/features/settings/date-formatter.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all exported functions
- **FUNCTIONS**: formatDate, formatTime, formatDateTime
- **PATTERN**: Include @example for each
- **VALIDATE**: Check date utilities in generated docs

### Task 9: UPDATE app/hooks/useModuleNavigation.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to hook and helper functions
- **FUNCTIONS**: useModuleNavigation, filterNavigationByModules
- **PATTERN**: Document React hook usage
- **VALIDATE**: Check hooks in generated docs

### Task 10: UPDATE app/lib/db/types.ts - Add JSDoc Comments

- **IMPLEMENT**: Add JSDoc comments to all interfaces
- **INTERFACES**: BatchTable, SaleTable, FeedTable, MortalityTable, etc.
- **PATTERN**: Document each field with /** comment */
- **VALIDATE**: Check types in generated docs

### Task 11: CREATE scripts/generate-docs.ts

- **IMPLEMENT**: Script to generate documentation with custom processing
- **FEATURES**:
  - Run TypeDoc
  - Copy to docs/api/
  - Generate index.html with navigation
  - Add search functionality
- **VALIDATE**: `bun run scripts/generate-docs.ts`

### Task 12: CREATE .github/workflows/docs.yml

- **IMPLEMENT**: CI workflow to regenerate docs on push
- **TRIGGER**: On push to main branch
- **STEPS**:
  - Checkout code
  - Install dependencies
  - Generate docs
  - Commit and push to gh-pages branch (optional)
- **VALIDATE**: Push to trigger workflow

### Task 13: UPDATE docs/INDEX.md - Link to API Reference

- **IMPLEMENT**: Add API Reference section
- **LINK**: Link to docs/api/index.html
- **DESCRIPTION**: "Auto-generated API documentation for all server functions, hooks, and utilities"
- **VALIDATE**: `grep "API Reference" docs/INDEX.md`

### Task 14: CREATE docs/api/README.md

- **IMPLEMENT**: README explaining API documentation
- **SECTIONS**:
  - Overview
  - How to navigate
  - How to regenerate
  - Contributing (adding JSDoc comments)
- **VALIDATE**: `cat docs/api/README.md`

---

## TESTING STRATEGY

### Manual Validation

**Documentation Quality:**
1. Generate documentation: `bun run docs:generate`
2. Open docs/api/index.html in browser
3. Navigate to each module
4. Verify all functions documented
5. Check examples render correctly

**Search Functionality:**
1. Use search bar in generated docs
2. Search for function names
3. Verify results are accurate

**Mobile Responsiveness:**
1. Open docs on mobile device
2. Verify navigation works
3. Check readability

### Automated Validation

**TypeScript Compilation:**
```bash
bun run check
```

**JSDoc Syntax:**
```bash
bun run docs:generate
# Check for warnings/errors
```

---

## VALIDATION COMMANDS

### Level 1: Install Dependencies

```bash
bun install
```

### Level 2: Generate Documentation

```bash
bun run docs:generate
```

### Level 3: Verify Output

```bash
# Check docs generated
ls -la docs/api/

# Check index exists
test -f docs/api/index.html && echo "✅ Documentation generated"
```

### Level 4: Manual Review

```bash
# Open in browser
open docs/api/index.html

# Or serve locally
cd docs/api && python3 -m http.server 8080
# Visit http://localhost:8080
```

### Level 5: CI Validation

```bash
# Trigger CI workflow
git add .
git commit -m "docs: add API reference documentation"
git push origin main
```

---

## ACCEPTANCE CRITERIA

- [x] TypeDoc installed and configured
- [x] All 24 server function modules have JSDoc comments
- [x] All utility functions have JSDoc comments
- [x] All React hooks have JSDoc comments
- [x] All interfaces have JSDoc comments
- [x] Documentation generates without errors
- [x] Documentation is browsable and searchable
- [x] Examples render correctly
- [x] npm script added for regeneration
- [x] CI workflow added for automation
- [x] docs/INDEX.md links to API reference
- [x] API documentation is mobile-responsive

---

## COMPLETION CHECKLIST

- [ ] Task 1: typedoc.json created
- [ ] Task 2: TypeDoc dependency added
- [ ] Task 3: Batches server functions documented
- [ ] Task 4: Sales server functions documented
- [ ] Task 5: Feed server functions documented
- [ ] Task 6: Mortality server functions documented
- [ ] Task 7: Currency utilities documented
- [ ] Task 8: Date utilities documented
- [ ] Task 9: Hooks documented
- [ ] Task 10: Database types documented
- [ ] Task 11: Generate docs script created
- [ ] Task 12: CI workflow created
- [ ] Task 13: INDEX.md updated
- [ ] Task 14: API README created
- [ ] Documentation generates successfully
- [ ] All modules visible in output
- [ ] Examples render correctly
- [ ] Search works

---

## NOTES

### JSDoc Tags to Use

- `@param` - Parameter description
- `@returns` - Return value description
- `@throws` - Exceptions thrown
- `@example` - Usage example
- `@see` - Related functions/docs
- `@deprecated` - Mark deprecated functions
- `@internal` - Mark internal functions (excluded from docs)

### Documentation Organization

TypeDoc will organize by:
1. **Modules** - Each feature (batches, sales, feed)
2. **Functions** - Exported functions
3. **Interfaces** - Type definitions
4. **Enums** - Enumerated types

### Design Decisions

- **TypeDoc over JSDoc** - Better TypeScript support, type inference
- **HTML output** - More interactive than markdown
- **Module-based organization** - Matches codebase structure
- **Examples in JSDoc** - Show real usage patterns
- **CI automation** - Keep docs in sync with code

### Estimated Time

- TypeDoc setup: ~30 minutes
- JSDoc comments (24 modules): ~2 hours
- JSDoc comments (utilities/hooks): ~30 minutes
- Generate docs script: ~30 minutes
- CI workflow: ~30 minutes
- **Total**: ~4 hours

### Confidence Score

**7/10** - Moderate complexity. Main risks:
1. Time-consuming to add JSDoc to all functions
2. Ensuring examples are accurate and helpful
3. TypeDoc configuration may need tweaking
4. CI workflow may need debugging

### Future Enhancements

- Add typedoc-plugin-markdown for markdown output
- Generate PDF documentation
- Add interactive playground for testing functions
- Integrate with Algolia for better search
