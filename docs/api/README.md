**LivestockAI API Reference**

---

# LivestockAI Manager

<p align="center">
  <img src="_media/logo-icon.png" alt="LivestockAI Logo" width="120" />
</p>

<p align="center">
  <strong>Offline-first livestock management supporting 6 livestock types.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#for-ai-agents">For AI Agents</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  🌍 <strong>Languages:</strong>
  <a href="_media/README.fr.md">Français</a> •
  <a href="_media/README.pt.md">Português</a> •
  <a href="_media/README.sw.md">Kiswahili</a>
</p>

---

## Features

### 🐔 Multi-Species Livestock Management

- **Modular species support** — Poultry (broilers, layers, turkey, duck), Aquaculture (catfish, tilapia), with extensible architecture for Cattle, Goats, Sheep, and Bees
- **Batch lifecycle tracking** — From acquisition to sale with status management (active, depleted, sold)
- **Species-specific metrics** — Feed types, growth standards, and structure types per species
- **Multi-farm support** — Manage multiple farms from a single account with farm-level filtering

### 📊 Predictive Analytics & Health Monitoring

- **Growth forecasting** — Predict harvest dates and target weights using species-specific growth curves
- **Revenue projections** — Estimate profit based on current weight samples and market prices
- **Weight sampling** — Track average, min, max weights with sample sizes
- **Mortality alerts** — Automatic warnings when batches exceed normal mortality thresholds
- **Mortality tracking** — Record deaths by cause (disease, predator, weather, unknown) with rate analysis
- **Vaccination schedules** — Track vaccinations with due date reminders
- **Water quality** (Aquaculture) — Monitor pH, temperature, dissolved oxygen, ammonia levels

### 💰 Financial Management

- **Sales tracking** — Record sales by quantity, weight, or unit with customer linking
- **Expense management** — Categorized expenses (feed, medicine, equipment, labor, utilities, etc.)
- **Invoicing** — Generate customer invoices with line items and payment status tracking
- **Profit/Loss reports** — Period-based P&L analysis with revenue and expense breakdowns
- **20+ currency presets** — International support (USD, EUR, GBP, NGN, KES, ZAR, INR, etc.)

### 📦 Inventory & Feed

- **Feed inventory** — Track stock levels with low-threshold alerts
- **Medication inventory** — Monitor quantities with expiry date tracking
- **Feed consumption** — Log daily feeding by batch with cost tracking
- **Feed conversion analysis** — Calculate efficiency ratios

### 👥 CRM & Contacts

- **Customer management** — Track buyers with contact info and purchase history
- **Supplier management** — Manage hatcheries, feed mills, pharmacies, equipment suppliers
- **Customer types** — Individual, restaurant, retailer, wholesaler classification

### 📱 Progressive Web App (PWA)

- **Offline-first** — Full functionality without internet; syncs when reconnected
- **Installable** — Add to home screen on mobile and desktop
- **Auto-updates** — Service worker handles app updates seamlessly

### 🌍 Internationalization

- **Configurable currency** — Symbol, decimals, position, separators
- **Date formats** — MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- **Units** — Weight (kg/lbs), area (sqm/sqft), temperature (°C/°F)
- **Time formats** — 12-hour or 24-hour clock

### 📋 Reporting & Audit

- **5 report types** — Profit/Loss, Inventory, Sales, Feed, Eggs
- **Date range filtering** — Custom period analysis
- **Export capability** — Download reports for external use
- **Audit logs** — Complete activity history with user, action, entity tracking

### 🔐 Security & Auth

- **Better Auth** — Secure session-based authentication
- **Role-based access** — Admin and staff roles
- **Protected routes** — All farm data behind authentication

---

## Screenshots

<!-- TODO: Add screenshots -->

| Dashboard                                            | Batch Management                                       |
| ---------------------------------------------------- | ------------------------------------------------------ |
| ![Dashboard](screenshots/dashboard.png)              | ![Batches](screenshots/batches.png)                    |
| _Farm overview with KPIs, alerts, and quick actions_ | _Batch list with status, species, and mortality rates_ |

| Batch Detail                                    | Financial Reports                             |
| ----------------------------------------------- | --------------------------------------------- |
| ![Batch Detail](screenshots/batch-detail.png)   | ![Reports](screenshots/reports.png)           |
| _Growth chart, projections, and batch timeline_ | _Profit/Loss analysis with expense breakdown_ |

| Mobile View                       | Offline Mode                        |
| --------------------------------- | ----------------------------------- |
| ![Mobile](screenshots/mobile.png) | ![Offline](screenshots/offline.png) |
| _Responsive design for field use_ | _Works without internet connection_ |

| Settings                               | Invoices                                   |
| -------------------------------------- | ------------------------------------------ |
| ![Settings](screenshots/settings.png)  | ![Invoices](screenshots/invoices.png)      |
| _Currency, date, and unit preferences_ | _Customer invoicing with payment tracking_ |

## Tech Stack

| Layer      | Technology                                                           |
| ---------- | -------------------------------------------------------------------- |
| Framework  | [TanStack Start](https://tanstack.com/start) (React 19, SSR)         |
| Database   | PostgreSQL via [Neon](https://neon.tech) (serverless)                |
| ORM        | [Kysely](https://kysely.dev) (type-safe SQL)                         |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com)                           |
| State      | [TanStack Query](https://tanstack.com/query) + IndexedDB persistence |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com)                 |

---

## Quick Start

### Prerequisites

- **Node.js 22+** (or Bun 1.0+)
- **Neon account** — Free at [neon.tech](https://neon.tech) (database setup is automated)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/livestock-ai.git
cd livestock-ai
bun install
```

### 2. Automated Setup

```bash
kiro-cli
@quickstart  # Interactive setup wizard
```

The quickstart wizard will:

- ✅ Check your environment (Node, Bun)
- ✅ Create your database automatically via Neon MCP
- ✅ Configure environment variables
- ✅ Run migrations and seed demo data
- ✅ Start the development server

### 3. Start Developing

```bash
bun dev  # If not started automatically
```

Open [http://localhost:3001](http://localhost:3001)

### Default Login Credentials

After running the seeder, you can log in with these default accounts:

#### Production Seeder (`bun run db:seed`)

| Role  | Email                     | Password      |
| ----- | ------------------------- | ------------- |
| Admin | `admin@livestockai.local` | `password123` |

#### Development Seeder (`bun run db:seed:dev`)

| Role  | Email                     | Password      |
| ----- | ------------------------- | ------------- |
| Admin | `admin@livestockai.local` | `password123` |
| Demo  | `demo@livestockai.local`  | `demo123`     |

**⚠️ Security Note**: Change these default passwords immediately in production environments. You can set custom credentials via environment variables:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Name
```

### Manual Setup (Alternative)

If you prefer manual setup or don't have Kiro CLI:

<details>
<summary>Click to expand manual setup instructions</summary>

#### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

#### Initialize Database

```bash
bun run db:migrate   # Run migrations
bun run db:seed      # Seed production data (admin user + reference data)
```

For development with demo data:

```bash
bun run db:seed:dev  # Seed full demo data
```

</details>

---

## Deployment

### Cloudflare Workers (Recommended)

1. Install Wrangler CLI:

   ```bash
   bun add -g wrangler
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

## Documentation

Comprehensive guides for users, developers, and AI agents:

| Document                                       | Description                | Audience      |
| ---------------------------------------------- | -------------------------- | ------------- |
| **[docs/INDEX.md](_media/INDEX.md)**           | **Documentation hub**      | Everyone      |
| [AGENTS.md](_media/AGENTS.md)                  | AI agent development guide | AI assistants |
| [docs/ARCHITECTURE.md](_media/ARCHITECTURE.md) | System architecture        | Developers    |
| [docs/DEPLOYMENT.md](_media/DEPLOYMENT.md)     | Production deployment      | DevOps        |
| [docs/TESTING.md](_media/TESTING.md)           | Testing strategies         | Developers    |
| [docs/DATABASE.md](_media/DATABASE.md)         | Database schema & Kysely   | Developers    |
| [docs/INTEGRATIONS.md](_media/INTEGRATIONS.md) | SMS/Email providers        | Developers    |
| [DEVLOG.md](_media/DEVLOG.md)                  | Development timeline       | Everyone      |
| [CONTRIBUTING.md](_media/CONTRIBUTING.md)      | Contribution guide         | Contributors  |

## For AI Agents

This project is designed to be AI-agent friendly. See these resources:

| File                                | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| [AGENTS.md](_media/AGENTS.md)       | Comprehensive guide for AI coding assistants |
| [DEVLOG.md](_media/DEVLOG.md)       | Development timeline and decisions           |
| [.kiro/README.md](_media/README.md) | Kiro CLI configuration guide                 |

### Kiro CLI Setup

The project includes comprehensive Kiro CLI configuration:

**Quick Start:**

```bash
kiro-cli
@quickstart  # Interactive setup wizard
```

**Available Agents (9):**

```bash
kiro-cli --agent livestock-specialist  # Domain expertise
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, deployment
kiro-cli --agent data-analyst          # Analytics, forecasting
kiro-cli --agent qa-engineer           # Testing
kiro-cli --agent security-engineer     # Auth, security
```

**Key Prompts (27):**

```bash
@prime              # Load project context
@plan-feature       # Plan new features
@execute            # Implement from plans
@code-review        # Review code quality
@neon-setup         # Database setup
@cloudflare-deploy  # Deploy to Workers
@batch-analysis     # Livestock analytics
@financial-report   # P&L analysis
```

See [.kiro/README.md](_media/README.md) for full documentation.

### MCP Integration

This project includes pre-configured MCP servers for database and Cloudflare Workers management:

| Server                     | Purpose                     | Agent Access                                                          |
| -------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `neon`                     | PostgreSQL database queries | backend-engineer, devops-engineer, data-analyst, livestock-specialist |
| `cloudflare-bindings`      | Workers management          | devops-engineer                                                       |
| `cloudflare-builds`        | Deployment status           | devops-engineer                                                       |
| `cloudflare-observability` | Logs and debugging          | devops-engineer                                                       |
| `cloudflare-docs`          | Documentation search        | devops-engineer                                                       |

All MCP servers authenticate via OAuth (no API keys needed). Enhanced agents can now:

- Query database directly for analysis and development
- Manage Cloudflare infrastructure programmatically
- Access indexed knowledge bases across sessions
- Create and manage todo lists for complex workflows

See [AGENTS.md](_media/AGENTS.md) for details.

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

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `bun dev`             | Start development server             |
| `bun build`           | Build for production                 |
| `bun run test`        | Run tests                            |
| `bun run lint`        | Run ESLint                           |
| `bun run check`       | Format + lint                        |
| `bun run db:migrate`  | Run database migrations              |
| `bun run db:seed`     | Seed production data (admin + refs)  |
| `bun run db:seed:dev` | Seed full demo data (farms, batches) |
| `bun run db:rollback` | Rollback last migration              |
| `bun run deploy`      | Build & deploy to Cloudflare         |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](_media/CONTRIBUTING.md) for:

- Development workflow
- Commit conventions
- Pull request guidelines

---

## License

MIT License — see [LICENSE](_media/LICENSE) for details.

---

<p align="center">
  Made with ❤️ for farmers everywhere
</p>
