# Agent Directory & Delegation Guide

This document lists all available agents and when to delegate tasks to them.

---

## Agent Directory (10 Agents)

### Specialist Agents (Have Direct MCP Access)

These agents have direct access to external services and should be invoked as subagents when you need their capabilities.

#### backend-engineer

**MCP Access**: `@neon` (PostgreSQL database)  
**Expertise**: Kysely ORM, migrations, server functions, three-layer architecture  
**Invoke for**:

- Database schema inspection and queries
- Migration planning and execution
- Server function implementation
- Repository layer development
- Data model design

**Example**: "Check the batches table schema and suggest indexes"

#### devops-engineer

**MCP Access**: `@cloudflare-*` (Workers, KV, R2, builds, logs, docs)  
**Expertise**: Cloudflare Workers, deployment, monitoring, infrastructure  
**Invoke for**:

- Deployment status and logs
- Worker configuration and optimization
- Production monitoring and debugging
- Secrets management
- Infrastructure architecture

**Example**: "Check why the last deployment failed and review logs"

---

### Domain Agents (Delegate to Specialists)

These agents focus on their domain expertise and delegate infrastructure tasks.

#### fullstack-engineer

**Focus**: End-to-end feature implementation  
**Expertise**: TanStack Start, React, Kysely, full request flow  
**Delegates to**: backend-engineer (complex DB), devops-engineer (deploy), frontend-engineer (PWA)

#### frontend-engineer

**Focus**: React components, PWA, UI/UX  
**Expertise**: React 19, Tailwind CSS v4, TanStack Router, offline-first  
**Delegates to**: backend-engineer (data models), devops-engineer (production issues)

#### qa-engineer

**Focus**: Testing, property-based tests, quality assurance  
**Expertise**: Vitest, fast-check, integration tests, test patterns  
**Delegates to**: backend-engineer (schema), devops-engineer (logs)

#### data-analyst

**Focus**: Analytics, forecasting, reports  
**Expertise**: Growth curves, FCR, mortality analysis, financial reports  
**Delegates to**: backend-engineer (complex queries), livestock-specialist (domain metrics)

#### security-engineer

**Focus**: Auth, validation, data protection  
**Expertise**: Better Auth, Zod validation, AppError patterns, RBAC  
**Delegates to**: backend-engineer (DB permissions), devops-engineer (infra security)

#### livestock-specialist

**Focus**: Domain expertise for farming operations  
**Expertise**: Species behavior, growth standards, feed formulation, veterinary practices  
**Delegates to**: backend-engineer (batch data), data-analyst (forecasting)

#### product-architect

**Focus**: Routes, UI flows, product structure  
**Expertise**: Feature planning, user journeys, information architecture  
**Delegates to**: fullstack-engineer (implementation), backend-engineer (schema design)

#### i18n-engineer

**Focus**: Translations, localization (15 languages)  
**Expertise**: i18next, translation keys, cultural adaptation, RTL support  
**Delegates to**: backend-engineer (translatable content), livestock-specialist (terminology)

---

## MCP Access Matrix

| Agent              | MCP Server                | Purpose                                    |
| ------------------ | ------------------------- | ------------------------------------------ |
| `backend-engineer` | `@neon`                   | Database queries, schema inspection        |
| `devops-engineer`  | `@cloudflare-bindings`    | Workers, KV, R2, D1, Hyperdrive management |
| `devops-engineer`  | `@cloudflare-builds`      | Deployment status and build logs           |
| `devops-engineer`  | `@cloudflare-observability` | Worker logs and debugging                  |
| `devops-engineer`  | `@cloudflare-docs`        | Cloudflare documentation search            |

**All other agents**: Delegate to these specialists for MCP access.

---

## When to Delegate (Decision Table)

| You Are                  | Task Type                 | Delegate To                                |
| ------------------------ | ------------------------- | ------------------------------------------ |
| **Any Agent**            | Database schema/queries   | `backend-engineer`                         |
| **Any Agent**            | Deployment/infrastructure | `devops-engineer`                          |
| **Any Agent**            | Species-specific logic    | `livestock-specialist`                     |
| **Backend**              | Complex UI/animations     | `frontend-engineer`                        |
| **Backend**              | Analytics/reporting       | `data-analyst`                             |
| **Frontend**             | Database migrations       | `backend-engineer`                         |
| **Frontend**             | Test strategy             | `qa-engineer`                              |
| **Fullstack**            | Complex DB work           | `backend-engineer`                         |
| **Fullstack**            | PWA optimization          | `frontend-engineer`                        |
| **DevOps**               | Code bugs/features        | `backend-engineer` or `fullstack-engineer` |
| **DevOps**               | Security audits           | `security-engineer`                        |
| **QA**                   | Implementation work       | `backend-engineer` or `fullstack-engineer` |
| **QA**                   | Domain logic              | `livestock-specialist`                     |
| **Data Analyst**         | Database queries          | `backend-engineer`                         |
| **Data Analyst**         | Domain metrics            | `livestock-specialist`                     |
| **Security**             | DB permissions            | `backend-engineer`                         |
| **Security**             | Infrastructure security   | `devops-engineer`                          |
| **Livestock Specialist** | Implementation            | `backend-engineer` or `fullstack-engineer` |
| **Livestock Specialist** | Data analysis             | `data-analyst`                             |
| **i18n**                 | Database content          | `backend-engineer`                         |
| **i18n**                 | Domain terminology        | `livestock-specialist`                     |
| **Product Architect**    | Implementation            | `fullstack-engineer`                       |
| **Product Architect**    | Schema design             | `backend-engineer`                         |

---

## Delegation Patterns

### Pattern 1: Information Gathering

```
"Let me check the schema first - delegating to backend-engineer..."
"Need to verify deployment status - delegating to devops-engineer..."
"What's the species-specific logic here? Delegating to livestock-specialist..."
```

### Pattern 2: Task Delegation

```
"This needs complex DB migrations - delegating full implementation to backend-engineer."
"UI needs mobile optimization - delegating to frontend-engineer."
"Deployment architecture needed - delegating to devops-engineer."
```

### Pattern 3: Collaborative Work

```
"I'll handle the UI, but delegating data model design to backend-engineer."
"I'll write the tests, but need backend-engineer to verify the schema first."
"I'll plan the feature, then delegate implementation to fullstack-engineer."
```

---

## How to Delegate

Use the `use_subagent` tool to invoke specialist agents:

```typescript
// Example: Delegating to backend-engineer
{
  "command": "InvokeSubagents",
  "content": {
    "subagents": [{
      "agent_name": "backend-engineer",
      "query": "Check the batches table schema and list all columns with their types",
      "relevant_context": "Working on batch detail page, need to understand available fields"
    }]
  }
}
```

The specialist will use their MCP access to complete the task and return results.

---

## Anti-Patterns (Don't Do This)

❌ "I'll try to write this SQL even though I'm a frontend specialist"  
❌ "Let me implement this UI even though I'm backend-focused"  
❌ "I'll figure out this deployment issue myself"  
❌ "I'll guess at the species-specific requirements"  
❌ "I'll write the migration without checking the schema"

---

## Best Practices

✅ **Recognize when work is outside your expertise**  
✅ **Delegate early** (don't struggle first)  
✅ **Provide clear context** when delegating  
✅ **Integrate specialist's work** into your solution  
✅ **Learn from the specialist's approach**  
✅ **Acknowledge delegation** in your response to the user

---

## Remember

**Delegation is a strength, not a weakness.**

It leads to:

- **Better quality** - Specialists handle their domain
- **Faster delivery** - No context switching
- **Knowledge sharing** - Learn from each other
- **Clearer responsibilities** - Everyone knows their role
- **Better user experience** - Right expert for each task
