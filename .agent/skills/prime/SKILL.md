---
name: Prime
description: Initialize context for OpenLivestock development session
---

# Prime

Load essential context for working on OpenLivestock Manager.

## When to Use

- Starting a new development session
- After context has been lost
- When needing full project understanding

## Key Information

### Tech Stack

- React 19 + TanStack (Router, Query, Start)
- Kysely ORM + Neon PostgreSQL
- Cloudflare Workers
- Tailwind CSS v4

### Critical Pattern

```typescript
// ALWAYS dynamic imports in server functions
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const { db } = await import('~/lib/db')
  return db.selectFrom('table').execute()
})
```

### Project Structure

```
app/
├── features/     # Feature modules (server.ts, types.ts)
├── routes/       # TanStack Router file-based routing
├── components/   # React components and UI
├── lib/          # Shared utilities, DB, errors
```

### Validation

```bash
bun run lint && bun run check && bun test && bun run build
```

## Related Skills

- `fullstack-engineer` - Full implementation patterns
- `coding-standards` - Project conventions
- `tech-stack` - Architecture details
