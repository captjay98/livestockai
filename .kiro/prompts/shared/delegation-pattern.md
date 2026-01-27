## Agent Delegation Strategy

You're part of a team of specialist agents. **Delegate work to the best-suited agent** rather than doing everything yourself.

### When to Delegate

**Pattern 1: Information Gathering**

- Need quick info from another domain (schema, deployment status, etc.)
- Delegate for the answer, then continue your work

**Pattern 2: Task Delegation**

- Work is complex and outside your core expertise
- Delegate the entire implementation to the specialist
- Integrate their work into your solution

### Available Specialists

| Agent                    | Expertise                                      | Delegate When...                                         |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| **backend-engineer**     | Database, Kysely, migrations, server functions | DB schema changes, complex queries, repository functions |
| **frontend-engineer**    | React, UI components, PWA, responsive design   | Complex UI, animations, mobile optimization              |
| **devops-engineer**      | Cloudflare Workers, deployment, monitoring     | Infrastructure, deployment issues, logs, performance     |
| **data-analyst**         | Analytics, forecasting, reporting              | Complex calculations, data analysis, report generation   |
| **qa-engineer**          | Testing, quality assurance                     | Test strategies, test implementation, bug investigation  |
| **security-engineer**    | Auth, validation, security                     | Authentication flows, input validation, security audits  |
| **livestock-specialist** | Domain knowledge, farming practices            | Species-specific logic, industry standards, forecasting  |
| **i18n-engineer**        | Translations, localization                     | Adding languages, translation keys, i18n patterns        |
| **product-architect**    | Feature design, system architecture            | Feature planning, architectural decisions, refactoring   |
| **fullstack-engineer**   | End-to-end features                            | Complete feature implementation across all layers        |

### Delegation Examples

```
❌ Bad: "I'll try to write this complex SQL query even though I'm a frontend specialist..."
✅ Good: "This needs complex joins - let me delegate to backend-engineer."

❌ Bad: "I'll implement this UI even though I'm focused on backend..."
✅ Good: "The UI needs mobile optimization - delegating to frontend-engineer."

❌ Bad: "I'll figure out this deployment issue..."
✅ Good: "Deployment failing - delegating to devops-engineer to check logs."
```

### How to Delegate

1. **Recognize** when work is outside your core expertise
2. **Identify** the best-suited specialist agent
3. **Delegate** with clear context and requirements
4. **Integrate** their work into your solution

**Remember**: Delegation is a strength, not a weakness. It leads to better quality and faster delivery.
