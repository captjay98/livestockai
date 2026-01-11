# OpenLivestock Manager

<p align="center">
  <img src="public/logo-icon.png" alt="OpenLivestock Logo" width="120" />
</p>

<p align="center">
  <strong>Open-source, offline-first livestock management for poultry and aquaculture farms.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#for-ai-agents">For AI Agents</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

- 🐔 **Multi-Species Support** — Track Broilers (Poultry) and Catfish (Aquaculture) with species-specific metrics
- 📴 **Offline-First** — Works without internet; syncs automatically when connection is restored
- 📈 **Growth Forecasting** — Predict harvest dates and profit based on weight samples and growth standards
- 💰 **Financial Management** — Track feed costs, sales, expenses with profit/loss analysis
- 📦 **Inventory** — Manage feed stock, medications, and batch-level consumption
- 📋 **Audit Logs** — Comprehensive activity tracking for accountability
- 📱 **PWA** — Installable on mobile and desktop devices

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | [Kysely](https://kysely.dev) (type-safe SQL) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| State | [TanStack Query](https://tanstack.com/query) + IndexedDB persistence |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com) |

---

## Quick Start

### Prerequisites

- **Node.js 22+** (or Bun 1.0+)
- **PostgreSQL database** — We recommend [Neon](https://neon.tech) (free tier available)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/open-livestock-manager.git
cd open-livestock-manager
bun install  # or npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Initialize Database

```bash
bun run db:migrate   # Run migrations
bun run db:seed      # Seed demo data (optional)
```

### 4. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Login (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@openlivestock.local` | `password123` |

---

## Deployment

### Cloudflare Workers (Recommended)

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Set your secrets:
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL
   ```

3. Deploy:
   ```bash
   bun run deploy
   ```

### Other Platforms

The app can be deployed to any platform supporting Node.js:
- Vercel
- Railway
- Render
- Self-hosted with Docker

---

## For AI Agents

This project is designed to be AI-agent friendly. See these resources:

| File | Purpose |
|------|---------|
| [AGENTS.md](AGENTS.md) | Comprehensive guide for AI coding assistants |
| [.kiro/settings/mcp.json](.kiro/settings/mcp.json) | MCP server configuration for Neon database |
| [.kiro/steering/](.kiro/steering/) | Project-specific coding guidelines |

### Quick MCP Setup (for Kiro/Claude)

The project includes pre-configured MCP settings for:
- **Neon Database** — Query and manage your PostgreSQL database directly

See [AGENTS.md](AGENTS.md) for detailed setup instructions.

---

## Project Structure

```
├── app/
│   ├── components/     # Reusable UI components
│   ├── lib/            # Business logic & utilities
│   │   ├── auth/       # Authentication (Better Auth)
│   │   ├── batches/    # Batch management
│   │   ├── db/         # Database (Kysely + migrations)
│   │   ├── finance/    # Financial calculations
│   │   └── ...         # Other domain modules
│   └── routes/         # TanStack Router pages
├── public/             # Static assets
├── .kiro/              # AI agent configuration
│   ├── settings/       # MCP configs
│   ├── steering/       # Coding guidelines
│   └── specs/          # Feature specifications
└── ...
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun test` | Run tests |
| `bun run lint` | Run ESLint |
| `bun run check` | Format + lint |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed demo data |
| `bun run db:rollback` | Rollback last migration |
| `bun run deploy` | Build & deploy to Cloudflare |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development workflow
- Commit conventions
- Pull request guidelines

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for farmers everywhere
</p>
