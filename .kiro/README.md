# OpenLivestock Manager - Kiro CLI Configuration

This directory contains the Kiro CLI configuration for OpenLivestock Manager, including custom agents, prompts, steering documents, and automation hooks.

## Quick Start

```bash
# Start Kiro CLI
kiro-cli

# Load project context
@prime

# Plan a new feature
@plan-feature

# Use a specialized agent
kiro-cli --agent backend-engineer
```

## Directory Structure

```
.kiro/
├── agents/                    # Custom AI agents
│   ├── prompts/               # Agent prompt files
│   ├── livestock-specialist.json
│   ├── backend-engineer.json
│   ├── frontend-engineer.json
│   ├── devops-engineer.json
│   ├── data-analyst.json
│   ├── qa-engineer.json
│   └── security-engineer.json
├── prompts/                   # Custom prompts (27 total)
├── steering/                  # Project knowledge
│   ├── product.md
│   ├── tech.md
│   ├── structure.md
│   └── coding-standards.md
├── settings/
│   ├── mcp.json               # MCP server config (Neon)
│   └── hooks.json             # Automation hooks
└── README.md                  # This file
```

## Agents (9)

| Agent                  | Purpose                                   | Usage                                   |
| ---------------------- | ----------------------------------------- | --------------------------------------- |
| `fullstack-engineer`   | **Primary** - Full feature implementation | `kiro-cli --agent fullstack-engineer`   |
| `livestock-specialist` | Domain expert for multi-species livestock | `kiro-cli --agent livestock-specialist` |
| `backend-engineer`     | TanStack Start, Kysely, Neon (with MCP)   | `kiro-cli --agent backend-engineer`     |
| `frontend-engineer`    | React, TanStack Router, PWA               | `kiro-cli --agent frontend-engineer`    |
| `devops-engineer`      | Cloudflare Workers, CI/CD (with MCP)      | `kiro-cli --agent devops-engineer`      |
| `data-analyst`         | Growth forecasting, financials            | `kiro-cli --agent data-analyst`         |
| `qa-engineer`          | Testing, Vitest, Playwright               | `kiro-cli --agent qa-engineer`          |
| `security-engineer`    | Auth, Better Auth, security               | `kiro-cli --agent security-engineer`    |
| `i18n-engineer`        | Internationalization, localization        | `kiro-cli --agent i18n-engineer`        |

### Agent Capabilities

Each agent has specific tools, write permissions, and MCP access:

| Agent                  | Write Paths                                                                                                                         | MCP Access       | Key Tools                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------- |
| `fullstack-engineer`   | `app/**`, `tests/**`, `*.md`, `.kiro/**`                                                                                            | Neon             | code, web_search, knowledge, todo_list         |
| `livestock-specialist` | `app/features/monitoring/**`, `app/features/batches/**`, `app/features/growth/**`, `app/features/health/**`, `app/features/feed/**` | Neon             | web_search, knowledge, todo_list               |
| `backend-engineer`     | `app/features/**`, `app/lib/**`, `*.md`                                                                                             | Neon             | code, web_search, knowledge, todo_list         |
| `frontend-engineer`    | `app/components/**`, `app/routes/**`, `*.md`                                                                                        | -                | code, web_search, knowledge, todo_list         |
| `devops-engineer`      | `wrangler.jsonc`, `.github/**`, `.kiro/**`, `.env*`, `package.json`                                                                 | Neon, Cloudflare | wrangler, web_search, knowledge, todo_list     |
| `data-analyst`         | `app/features/reports/**`, `app/features/monitoring/**`, `app/features/analytics/**`                                                | Neon             | web_search, execute_bash, knowledge, todo_list |
| `qa-engineer`          | `app/**/*.test.ts`, `tests/**`, `*.md`                                                                                              | -                | code, web_search, knowledge, todo_list         |
| `security-engineer`    | `app/features/auth/**`, `app/routes/_auth.tsx`                                                                                      | -                | code, web_search, knowledge, todo_list         |
| `i18n-engineer`        | `app/features/i18n/**`, `public/locales/**`, `app/routes/**`                                                                        | -                | web_search, knowledge, todo_list               |

**Recommended Agent Selection:**

- **New features**: Use `fullstack-engineer` (handles DB → UI in one pass)
- **Domain questions**: Use `livestock-specialist`
- **Deployment/infra**: Use `devops-engineer`
- **Specialized work**: Use the specific agent (backend, frontend, qa, etc.)

### Agent Delegation Pattern

**All agents are delegation-aware** - they recognize when work is better suited to another specialist and delegate accordingly.

**Two delegation patterns:**

1. **Information Gathering**: Quick questions to another domain
2. **Task Delegation**: Complex work delegated to specialist, then integrated

**See**: [Agent Delegation Pattern](.kiro/docs/agent-delegation-pattern.md) | [Quick Reference](.kiro/docs/agent-delegation-quick-ref.md)

**Example:**

```
Frontend Agent: "This needs DB migrations - delegating to backend-engineer"
Backend Agent: [Creates migration and repository functions]
Frontend Agent: [Integrates new API into components]
```

### Universal Agent Tools

All 9 agents now have access to:

- **knowledge**: Access indexed knowledge bases across chat sessions
- **todo_list**: Create and manage task lists for complex workflows
- **web_search**: Research documentation and best practices
- **fs_read, grep, glob**: File system operations and search

### Agent Safety Features

All agents include:

- **Pre-tool hooks**: Review changes before writing files
- **Post-tool hooks**: Auto-run linters, tests, or security scans
- **Path restrictions**: Limited to specific directories
- **Command denylists**: Prevent destructive operations (`rm -rf`, `sudo`, `git push`)

### Example Agent Session

```bash
# Start a backend engineering session
kiro-cli --agent backend-engineer

# Agent responds with:
# ⚙️ Backend Engineer ready.
# M app/features/batches/server.ts
# M app/routes/api/batches.ts

# Then you can ask:
# "Create a new server function for feed records"
```

### Switching Agents

```bash
# During a chat session, switch agents
/agent swap backend-engineer

# Or start directly with an agent
kiro-cli --agent frontend-engineer "Create a new batch card component"
```

## Prompts (27)

### Core Development (6)

| Prompt                   | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `@prime`                 | Load project context                                          |
| `@plan-feature`          | Plan new features                                             |
| `@execute`               | Implement from plans                                          |
| `@code-review`           | Technical code review                                         |
| `@code-review-hackathon` | Hackathon evaluation                                          |
| `@quickstart`            | Interactive setup wizard with automated database & deployment |

### Advanced Setup (3)

| Prompt              | Description                  |
| ------------------- | ---------------------------- |
| `@neon-setup`       | Advanced Neon configuration  |
| `@cloudflare-setup` | Advanced Cloudflare features |
| `@cloudflare-debug` | Debug deployment issues      |

### Infrastructure (4)

| Prompt               | Description                                  |
| -------------------- | -------------------------------------------- |
| `@cloudflare-deploy` | Deploy to Workers                            |
| `@neon-migrate`      | Database migrations                          |
| `@neon-optimize`     | Query optimization                           |
| `@performance-audit` | Performance optimization for PWA, mobile, 3G |

### Livestock Domain (4)

| Prompt                | Description               |
| --------------------- | ------------------------- |
| `@batch-analysis`     | Analyze batch performance |
| `@growth-forecast`    | Growth predictions        |
| `@mortality-analysis` | Mortality patterns        |
| `@feed-optimization`  | Feed efficiency           |

### Financial (3)

| Prompt              | Description         |
| ------------------- | ------------------- |
| `@financial-report` | P&L analysis        |
| `@cost-analysis`    | Cost breakdown      |
| `@sales-forecast`   | Revenue projections |

### Quality & Testing (3)

| Prompt                  | Description                    |
| ----------------------- | ------------------------------ |
| `@test-coverage`        | Test coverage analysis         |
| `@accessibility-audit`  | A11y testing for rural farmers |
| `@competitive-analysis` | Market research                |

### PWA & Optimization (2)

| Prompt           | Description     |
| ---------------- | --------------- |
| `@offline-debug` | Fix sync issues |
| `@pwa-optimize`  | PWA performance |

## Hooks

Configured in `.kiro/settings/hooks.json`:

- **agentSpawn**: Shows git status when agent starts
- **postToolUse (write)**: Auto-runs `bun run lint --fix` after file writes

## MCP Servers

Configured in `.kiro/settings/mcp.json`. MCP enables direct database and infrastructure access from Kiro.

### Neon (Database)

Provides PostgreSQL database access:

- `get_database_tables` - List all tables
- `describe_table_schema` - Get table structure
- `run_sql` - Execute SQL queries
- `list_projects` - List Neon projects

**Setup for Kiro CLI:**
Neon MCP uses OAuth authentication - no API key needed. On first use, it opens a browser for authentication.

### Cloudflare (4 servers)

| Server                     | Purpose                    |
| -------------------------- | -------------------------- |
| `cloudflare-bindings`      | Manage Workers, KV, R2, D1 |
| `cloudflare-builds`        | Deployment status and logs |
| `cloudflare-observability` | Worker logs and debugging  |
| `cloudflare-docs`          | Documentation search       |

**Setup for Kiro CLI:**
Cloudflare MCP uses OAuth - no API key needed. On first use, it opens a browser for authentication.

### Usage Examples

```bash
# Neon - Check tables
neon__get_database_tables

# Neon - Query data
neon__run_sql "SELECT COUNT(*) FROM batches"

# Cloudflare - Check deployment
cloudflare-builds__get_latest_build

# Cloudflare - View logs
cloudflare-observability__get_worker_logs worker_name="jayfarms"
```

## Workflows

### New Developer Setup

```bash
# New Developer Setup
@quickstart     # Interactive setup wizard (database + deployment)
@neon-setup     # Advanced database features
@cloudflare-setup # Advanced deployment features
```

### Feature Development

```bash
@prime          # Load context
@plan-feature   # Plan the feature
@execute        # Implement
@code-review    # Review code
```

### Deployment

```bash
@cloudflare-deploy  # Deploy to production
@cloudflare-debug   # If issues arise
```

### Analytics

```bash
@batch-analysis     # Batch performance
@financial-report   # P&L report
@growth-forecast    # Growth predictions
```

## Customization

### Add New Prompt

Create a markdown file in `.kiro/prompts/`:

```markdown
---
description: 'Your prompt description'
---

# Prompt Title

Your prompt content here...
```

### Add New Agent

Create a JSON file in `.kiro/agents/`:

```json
{
  "name": "my-agent",
  "description": "Agent description",
  "prompt": "file://./prompts/my-agent.md",
  "tools": ["read", "write", "shell"],
  "allowedTools": ["read"]
}
```

## Resources

- [Kiro CLI Documentation](https://kiro.dev/docs/cli)
- [OpenLivestock Manager README](../README.md)
- [AGENTS.md](../AGENTS.md) - AI agent development guide
- [DEVLOG.md](../DEVLOG.md) - Development timeline

---

## Important: Keep DEVLOG Updated!

As you develop, regularly update `DEVLOG.md` with:

- Features implemented
- Technical decisions and rationale
- Challenges faced and solutions
- Kiro features used (specs, prompts, agents)
- Time spent on tasks

This is critical for hackathon submissions and project documentation.
