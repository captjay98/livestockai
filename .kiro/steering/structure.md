# Project Structure

## Directory Layout

```
LivestockAI/
├── app/                          # TanStack Start application
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI components (shadcn/ui)
│   │   ├── dialogs/              # Create/edit modal dialogs
│   │   └── layout/               # Layout components (shell, sidebar)
│   ├── features/                 # Business logic & server functions
│   │   ├── auth/                 # Authentication (Better Auth)
│   │   ├── batches/              # Batch management
│   │   ├── sales/                # Sales & revenue
│   │   ├── settings/             # User preferences & currency
│   │   ├── modules/              # Feature module system
│   │   └── ...                   # Other features
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core utilities
│   │   └── db/                   # Database (Kysely + migrations)
│   ├── routes/                   # TanStack Router pages
│   │   ├── _auth/                # Protected routes (directory-based)
│   │   │   ├── batches/
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   └── index.tsx             # Public landing
│   └── styles/                   # Global styles (Tailwind)
├── public/                       # Static assets
│   ├── icons/                    # PWA icons
│   └── manifest.json             # PWA manifest
├── tests/                        # Test files
│   └── features/                 # Property-based tests by feature
├── docs/                         # Documentation
│   └── ARCHITECTURE.md           # System architecture
├── .kiro/                        # Kiro CLI configuration
│   ├── steering/                 # Project knowledge
│   ├── prompts/                  # Custom commands
│   ├── agents/                   # Agent configurations
│   └── settings/                 # MCP and hooks
└── .agents/                      # Implementation plans
```

## File Naming Conventions

### General Rules

- **Files**: kebab-case (e.g., `batch-dialog.tsx`, `growth-calculator.ts`)
- **Directories**: kebab-case (e.g., `user-management/`, `feed-records/`)
- **Components**: PascalCase files (e.g., `BatchDialog.tsx`, `GrowthChart.tsx`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`, `calculateGrowth.ts`)

### Specific Patterns

- **React Components**: `ComponentName.tsx`
- **Server Functions**: `server.ts` (in feature directories)
- **Service Layer**: `service.ts` (pure business logic)
- **Repository Layer**: `repository.ts` (database operations)
- **Types**: `types.ts` or `schema.ts`
- **Tests**: `*.test.ts` or `*.spec.ts`
- **Database Migrations**: `YYYY-MM-DD-NNN-description.ts`

## Module Organization

### Feature-Based Structure (Three-Layer Architecture)

Each major feature has its own directory in `app/features/`:

```
app/features/batches/
├── server.ts              # Server functions (auth, validation, orchestration)
├── service.ts             # Pure business logic (calculations, validations)
├── repository.ts          # Database operations (CRUD, queries)
├── types.ts               # TypeScript types
├── constants.ts           # Feature constants
└── index.ts               # Public exports
```

**Layer Responsibilities:**

- **server.ts**: Auth middleware, input validation, orchestrates service/repository
- **service.ts**: Pure functions for business logic (testable without DB)
- **repository.ts**: All database queries and mutations

### Component Organization

```
app/components/
├── ui/                    # Base components (Button, Input, etc.)
├── dialogs/               # Create/edit modal dialogs
├── layout/                # Layout components (shell, sidebar)
└── feature-specific/      # Feature-specific components
```

## Configuration Files

### Root Level

- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`vite.config.ts`** - Vite build configuration
- **`wrangler.jsonc`** - Cloudflare Workers configuration
- **`.env.example`** - Environment variable template

### Development

- **`.gitignore`** - Git ignore patterns
- **`.eslintrc.js`** - ESLint configuration
- **`.prettierrc`** - Prettier formatting rules
- **`vitest.config.ts`** - Test configuration

## Documentation Structure

### Required Documentation

- **`README.md`** - Project overview and setup
- **`AGENTS.md`** - AI agent development guide
- **`DEVLOG.md`** - Development timeline and decisions
- **`CONTRIBUTING.md`** - Contribution guidelines
- **`LICENSE`** - Project license

### Technical Documentation

- **`docs/api/`** - API documentation
- **`docs/deployment/`** - Deployment guides
- **`docs/architecture/`** - System architecture
- **`docs/database/`** - Database schema and migrations

## Asset Organization

### Public Assets

```
public/
├── icons/                 # PWA and favicon icons
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.ico
├── images/                # Application images
│   ├── logo.png
│   └── screenshots/
└── manifest.json          # PWA manifest
```

### Component Assets

- **Icons**: Use Lucide React icon library
- **Images**: Store in `public/images/` with descriptive names
- **Fonts**: Load via Tailwind CSS or web fonts

## Build Artifacts

### Development

- **`node_modules/`** - Dependencies (ignored)
- **`.vinxi/`** - TanStack Start build cache (ignored)
- **`dist/`** - Build output (ignored)

### Production

- **Cloudflare Workers**: Optimized bundle
- **Static assets**: CDN-distributed files
- **Source maps**: For debugging (optional)

## Environment-Specific Files

### Environment Variables

- **`.env`** - Local development (ignored)
- **`.env.example`** - Template for required variables
- **Production**: Set via Cloudflare Workers secrets

### Configuration

- **Development**: Local database, hot reload
- **Staging**: Preview deployments, test data
- **Production**: Edge deployment, production database

## Database Organization

### Schema Files

```
app/lib/db/
├── index.ts               # Database connection
├── types.ts               # TypeScript types
├── migrations/            # Database migrations
│   └── YYYY-MM-DD-NNN-description.ts
└── seeds/                 # Test data
    ├── production.ts      # Admin + reference data
    ├── development.ts     # Full demo data
    └── helpers.ts         # Seeding utilities
```

### Migration Naming

- **Format**: `YYYY-MM-DD-NNN-description.ts`
- **Example**: `2024-01-15-001-create-batches-table.ts`
- **Sequential**: Use incremental numbers for same-day migrations

## Testing Organization

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── lib/               # Business logic tests
│   └── components/        # Component tests
├── integration/           # Integration tests
│   ├── api/               # API endpoint tests
│   └── database/          # Database tests
└── e2e/                   # End-to-end tests
    ├── auth/              # Authentication flows
    └── workflows/         # User workflows
```

### Test Naming

- **Unit tests**: `feature.test.ts`
- **Component tests**: `Component.test.tsx`
- **Integration tests**: `feature.integration.test.ts`
- **E2E tests**: `workflow.e2e.test.ts`

## Import Path Organization

### Absolute Imports

Use `~/` prefix for all internal imports:

```typescript
import { Button } from '~/components/ui/button'
import { getBatches } from '~/features/batches/server'
import type { Batch } from '~/lib/db/types'
```

### Import Order

1. React/framework imports
2. Third-party library imports
3. Internal imports (absolute paths)
4. Type imports (grouped separately)

## Code Organization Best Practices

### Single Responsibility

- Each file has a single, clear purpose
- Components focus on UI rendering
- Server functions handle data operations
- Utilities provide reusable logic

### Dependency Direction

- UI components depend on business logic
- Business logic is independent of UI
- Database layer is isolated from business logic
- Types are shared across layers

### Feature Isolation

- Features are self-contained modules
- Shared utilities are in common directories
- Cross-feature dependencies are minimized
- Each feature can be developed independently
