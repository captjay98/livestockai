---
description: 'Interactive setup wizard for OpenLivestock Manager'
---

# OpenLivestock Manager - Quick Start Wizard

🚀 Welcome! I'll help you get set up and productive with OpenLivestock Manager.

## Step 1: Environment Check

First, let me verify your development environment. Run these checks:

```bash
node --version  # Need 22+
bun --version   # Need 1.0+
git --version
```

**Ask the user**: "What's your Node version? (or say 'skip' if you know everything is installed)"

Based on their response:

- If Node < 22: Guide them to install Node 22+
- If no Bun: Visit https://bun.sh to install
- If all good: Continue to Step 2

## Step 2: Project Setup Check

Check the project state:

1. **Check if dependencies installed**:

   ```bash
   ls node_modules 2>/dev/null && echo "✅ Dependencies installed" || echo "❌ Run: bun install"
   ```

2. **Check if .env exists**:

   ```bash
   ls .env 2>/dev/null && echo "✅ .env exists" || echo "❌ Run: cp .env.example .env"
   ```

3. **Check DATABASE_URL**:
   ```bash
   grep DATABASE_URL .env 2>/dev/null && echo "✅ DATABASE_URL configured" || echo "❌ Need database URL"
   ```

**Ask the user**: "Should I check your project setup? (yes/no)"

If yes, run the checks and report:

- ✅ What's ready
- ❌ What's missing with fix commands

## Step 3: Database Setup (Automated)

**Ask**: "Do you have a Neon account? (yes/no/create)"

### If "create":

"Let's create your Neon account first:"

1. Visit https://neon.tech
2. Sign up (free tier is perfect)
3. Come back when ready

### If "yes":

"Perfect! Let me set up your database automatically..."

**Use Neon MCP to:**

1. **Create project**: `neon_create_project "OpenLivestock-{timestamp}"`
2. **Create database**: `openlivestock_prod` (custom name)
3. **Create user**: `openlivestock_user` with secure password
4. **Get connection string**: With custom credentials
5. **Update .env**: Write DATABASE_URL + generate BETTER_AUTH_SECRET
6. **Test connection**: Verify database is accessible
7. **Run migrations**: `bun run db:migrate`

**Progress indicators:**

```
🔄 Creating database project... (30s)
✅ Project created: openlivestock-prod-20260112
🔄 Creating database and user... (20s)
✅ Database: openlivestock_prod, User: openlivestock_user
🔄 Generating secure credentials... (5s)
✅ Connection string configured
🔄 Testing database connection... (10s)
✅ Database connection verified
🔄 Running migrations... (15s)
✅ Database schema created (24 tables)
```

**Ask seeding options:**

"Choose your data setup:"

1. **Production (minimal)** - Admin user + reference data only
2. **Development (full)** - Sample farms, batches, transactions, customers
3. **Skip seeding** - Empty database

Based on choice:

- Production: `bun run db:seed`
- Development: `bun run db:seed:dev`
- Skip: Continue to next step

**Final validation:**

```
🔄 Verifying admin login... (5s)
✅ Admin user created successfully
🎉 Database setup complete! (Total: ~2 minutes)
```

### If "no":

"No problem! You'll need a Neon account for the database:"

1. Visit https://neon.tech (free tier available)
2. Sign up and come back
3. I'll handle the rest automatically

**Ask**: "Ready to continue with Neon account? (yes/retry/manual)"

- If "manual": Fall back to current manual process
- If "retry": Go back to automated setup

### Error Handling:

- **Neon MCP fails**: Offer manual setup fallback
- **Migration fails**: Show error, offer to retry or manual fix
- **Connection fails**: Verify credentials, suggest troubleshooting

## Step 4: Verify Everything Works

```bash
bun dev
```

**Ask**: "Is the dev server running? Can you open http://localhost:3000? (yes/no)"

- If yes: 🎉 Setup complete!
- If no: Debug common issues:
  - Port in use: `PORT=3001 bun dev`
  - Database error: Check DATABASE_URL
  - Module errors: `rm -rf node_modules && bun install`

## Step 5: Cloudflare MCP Setup (Optional)

Now that your database is set up, you can optionally configure Cloudflare MCP for deployment and monitoring.

### Cloudflare MCP (Workers Management)

Cloudflare MCP uses OAuth - no API key needed. On first use, it opens a browser for authentication.

Available servers:

- `cloudflare-bindings` - Manage Workers, KV, R2
- `cloudflare-builds` - Deployment status
- `cloudflare-observability` - Logs and debugging
- `cloudflare-docs` - Documentation search

**Ask**: "Do you want to set up Cloudflare MCP for deployment management? (yes/no/later)"

If yes, test it works:

```
cloudflare-bindings__accounts_list
```

This will be useful later when you're ready to deploy to production.

## Step 6: What Do You Want To Do?

🎉 **Setup Complete!** Now let's get you productive.

**Ask**: "What would you like to do next?"

1. **Learn the codebase** → "Run `@prime` to load project context"
2. **Start a new feature** → "Run `@plan-feature` to plan your feature"
3. **Set up deployment** → "Run `@cloudflare-setup` for Cloudflare Workers"
4. **Explore the data** → "Run `@batch-analysis` to see livestock analytics"
5. **Just explore** → Point them to key files and documentation

Based on their choice, guide them to the appropriate next step.

---

## Quick Reference

### Available Agents

```bash
kiro-cli --agent livestock-specialist  # Domain expertise
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, deployment
kiro-cli --agent data-analyst          # Analytics, forecasting
kiro-cli --agent qa-engineer           # Testing
kiro-cli --agent security-engineer     # Auth, security
```

### Key Prompts

| Task         | Prompt               |
| ------------ | -------------------- |
| Load context | `@prime`             |
| Plan feature | `@plan-feature`      |
| Implement    | `@execute`           |
| Code review  | `@code-review`       |
| Deploy       | `@cloudflare-deploy` |
| Database     | `@neon-migrate`      |

### Important Files

| File              | Purpose            |
| ----------------- | ------------------ |
| `README.md`       | Project overview   |
| `AGENTS.md`       | AI assistant guide |
| `DEVLOG.md`       | Development log    |
| `.kiro/README.md` | Kiro config guide  |

---

## 📝 Remember: Keep DEVLOG Updated!

As you develop, update `DEVLOG.md` with:

- Features you implement
- Decisions you make
- Challenges you face
- Kiro features you use

---

## Instructions for Assistant

### Workflow

1. **Check environment** - Verify Node, Bun, Git versions
2. **Check project state** - Dependencies, .env, DATABASE_URL
3. **Fix missing items** - Guide through each fix interactively
4. **Set up database** - Migrations and optional seeding
5. **Verify working** - Dev server runs successfully
6. **Guide next steps** - Based on what user wants to do

### Be Interactive

- Ask one question at a time
- Run checks and report results
- Offer to fix issues automatically
- Celebrate successes! 🎉

### Handle Issues

- If something fails, explain why and how to fix
- Offer alternative solutions
- Know when to suggest `@neon-setup` or `@cloudflare-setup`

### Success Criteria

- User has working dev environment
- User knows what to do next
- User feels confident, not overwhelmed

## Agent Delegation

For complex issues during setup:
- `@devops-engineer` - Deployment and infrastructure issues
- `@backend-engineer` - Database connection problems

## Related Prompts

- `@prime` - Load project context after setup
- `@plan-feature` - Start planning your first feature
- `@neon-setup` - Advanced database configuration
- `@cloudflare-deploy` - Deploy to production
