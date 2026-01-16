# Documentation Index

Central hub for all OpenLivestock Manager documentation.

---

## Getting Started

**New to OpenLivestock?** Start here:

1. [README.md](../README.md) - Project overview, features, quick start
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
3. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production

**For Developers:**

- [AGENTS.md](../AGENTS.md) - AI agent development guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [INTEGRATIONS.md](./INTEGRATIONS.md) - SMS/Email provider system

**Project History:**

- [DEVLOG.md](../DEVLOG.md) - Day-by-day development timeline
- [ROADMAP.md](../ROADMAP.md) - Future plans

---

## Core Documentation

### User Guides

| Document                         | Description                              | Audience            |
| -------------------------------- | ---------------------------------------- | ------------------- |
| [README.md](../README.md)        | Project overview, features, installation | Everyone            |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide              | Farm owners, DevOps |

### Developer Guides

| Document                              | Description                   | Audience                  |
| ------------------------------------- | ----------------------------- | ------------------------- |
| [AGENTS.md](../AGENTS.md)             | AI agent development patterns | AI assistants, Developers |
| [ARCHITECTURE.md](./ARCHITECTURE.md)  | System architecture overview  | Developers                |
| [INTEGRATIONS.md](./INTEGRATIONS.md)  | SMS/Email provider system     | Developers                |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines       | Contributors              |

### Project Management

| Document                    | Description                   | Audience |
| --------------------------- | ----------------------------- | -------- |
| [DEVLOG.md](../DEVLOG.md)   | Development timeline (9 days) | Everyone |
| [ROADMAP.md](../ROADMAP.md) | Future features and plans     | Everyone |

---

## Technical Documentation

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture
  - Tech stack overview
  - Request flow (Browser → Cloudflare → TanStack Start → Kysely → Neon)
  - Key patterns (server functions, dynamic imports)
  - Database schema overview

- **[INTEGRATIONS.md](./INTEGRATIONS.md)** - Provider system
  - Built-in SMS/Email providers
  - Creating custom providers
  - Configuration guide
  - Testing strategies

### Development

- **[AGENTS.md](../AGENTS.md)** - AI development guide
  - Server function patterns (dynamic imports)
  - Database query patterns (Kysely)
  - Component patterns
  - Testing patterns
  - MCP server usage

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution workflow
  - Code style guidelines
  - Pull request process
  - Testing requirements

### Deployment

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production setup
  - Cloudflare Workers deployment
  - Neon database setup
  - Environment configuration
  - Monitoring and debugging

---

## Kiro Configuration

Kiro CLI configuration for AI-assisted development:

### Steering Documents

Located in `.kiro/steering/`:

| Document              | Purpose                                 |
| --------------------- | --------------------------------------- |
| `product.md`          | Product overview, target users          |
| `tech.md`             | Technical architecture, stack decisions |
| `structure.md`        | Project structure, naming conventions   |
| `coding-standards.md` | Code patterns, server function rules    |
| `cloudflare.md`       | Cloudflare Workers patterns             |

### Custom Prompts (25)

Located in `.kiro/prompts/`:

**Development:**

- `@plan-feature` - Create comprehensive implementation plans
- `@execute` - Execute implementation plans
- `@code-review` - Review code quality
- `@commit-plan` - Generate structured commits
- `@update-devlog` - Update DEVLOG automatically

**Livestock Domain:**

- `@batch-analysis` - Analyze batch performance
- `@mortality-analysis` - Analyze death patterns
- `@growth-forecast` - Review growth predictions
- `@feed-optimization` - Feed conversion analysis

**Financial:**

- `@financial-report` - Generate P&L analysis
- `@cost-analysis` - Analyze expenses
- `@sales-forecast` - Project revenue

**Infrastructure:**

- `@neon-setup` - Database configuration
- `@neon-migrate` - Run migrations
- `@cloudflare-deploy` - Deploy to Workers
- `@cloudflare-debug` - Debug deployment issues

**Quality:**

- `@test-coverage` - Analyze test coverage
- `@accessibility-audit` - WCAG compliance
- `@performance-audit` - Performance optimization
- `@pwa-optimize` - PWA optimization

See [.kiro/README.md](../.kiro/README.md) for full Kiro configuration details.

### Specialized Agents (9)

- `fullstack-engineer` - End-to-end feature implementation
- `backend-engineer` - Server functions, database
- `frontend-engineer` - React components, UI
- `devops-engineer` - Deployment, infrastructure
- `data-analyst` - Analytics, reporting
- `livestock-specialist` - Domain expertise
- `qa-engineer` - Testing strategies
- `security-engineer` - Security audits
- `i18n-engineer` - Internationalization

---

## Implementation Plans

Located in `.agents/plans/`:

**Completed Plans:**

- `settings-ux-improvements.md` - Settings page consolidation ✅
- `provider-agnostic-integrations.md` - SMS/Email provider system ✅
- `daily-operations-crud-completion.md` - CRUD for daily operations ✅
- `consolidate-creation-to-dialogs.md` - Dialog standardization ✅

**Future Plans:**

- `optional-integrations-implementation.md` - Weather, market prices
- `add-hausa-translations.md` - Nigerian language support
- `regional-market-packages.md` - Community market data

See `.agents/plans/` directory for all implementation plans.

---

## GitHub Templates

Located in `.github/`:

- `ISSUE_TEMPLATE/bug_report.md` - Bug report template
- `ISSUE_TEMPLATE/feature_request.md` - Feature request template
- `PULL_REQUEST_TEMPLATE.md` - PR template

---

## Quick Reference

### Common Commands

```bash
# Development
bun dev                    # Start dev server
bun run db:migrate         # Run migrations
bun run db:seed:dev        # Seed demo data

# Quality
bun test                   # Run tests
bun run check              # Type check
bun run lint               # Lint code

# Production
bun build                  # Build for production
bun run deploy             # Deploy to Cloudflare
```

### Key Files

| File                       | Purpose                   |
| -------------------------- | ------------------------- |
| `app/lib/db/types.ts`      | Database schema types     |
| `app/features/*/server.ts` | Server functions          |
| `app/routes/_auth/*/`      | Protected routes          |
| `wrangler.jsonc`           | Cloudflare Workers config |
| `vite.config.ts`           | Build configuration       |

### Important Patterns

**Server Functions:**

```typescript
// Always use dynamic imports for Cloudflare Workers
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const { db } = await import('../db') // ✅ Dynamic
  return db.selectFrom('table').execute()
})
```

**Currency Formatting:**

```typescript
import { useFormatCurrency } from '~/features/settings'

const { format: formatCurrency } = useFormatCurrency()
formatCurrency(1234.56) // Uses user's currency preference
```

---

## Documentation Status

| Category         | Status      | Notes                              |
| ---------------- | ----------- | ---------------------------------- |
| User Guides      | ✅ Complete | README, DEPLOYMENT                 |
| Developer Guides | ✅ Complete | AGENTS, ARCHITECTURE, INTEGRATIONS |
| API Reference    | ⚠️ Partial  | Inline JSDoc comments only         |
| Testing Docs     | ⚠️ Partial  | Covered in AGENTS.md               |
| Deployment       | ✅ Complete | DEPLOYMENT.md                      |
| Diagrams         | ❌ Missing  | Architecture diagrams needed       |
| Video Tutorials  | ❌ Missing  | Planned for future                 |
| Translations     | ❌ Missing  | English only                       |

---

## Contributing to Documentation

Documentation improvements are always welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Priority areas:**

1. Architecture diagrams
2. Video tutorials
3. API reference documentation
4. Translations (French, Portuguese, Swahili)

---

**Last Updated**: January 15, 2026
