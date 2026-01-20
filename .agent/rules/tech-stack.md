---
description: OpenLivestock technical architecture and stack
---

# Tech Stack

## Primary Stack

- **Frontend**: React 19 + TanStack Router
- **Backend**: TanStack Start (SSR) with server functions
- **Database**: PostgreSQL via Neon (serverless) + Kysely ORM
- **Deployment**: Cloudflare Workers
- **Styling**: Tailwind CSS v4

## Request Flow

```
Browser → Cloudflare Worker → TanStack Start → Server Functions → Kysely → Neon PostgreSQL
```

## Key Patterns

- Dynamic imports for database (`await import('../db')`)
- All database operations in server functions
- End-to-end TypeScript from database to UI
- Offline-first with IndexedDB persistence

## Validation Commands

```bash
bun run lint       # Linting
bun run check      # Type checking
bun test           # Run tests
bun run build      # Production build
```
