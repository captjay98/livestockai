# OpenLivestock Manager

**OpenLivestock Manager** is an open-source, offline-first livestock management system designed for poultry and aquaculture farming. It helps farmers track growth, manage expenses, and ensure profitability even in areas with unreliable internet connectivity.

## Features

-   **Multi-Species Support**: Built-in tracking for Broilers (Poultry) and Catfish (Aquaculture).
-   **Offline-First**: Works without internet. Syncs data automatically when connection is restored.
-   **Growth Forecasting**: Predict harvest dates and potential profit based on real-time weight samples and growth calculators.
-   **Financial Management**: Track feed costs, sales, and expenses with rigorous profit/loss logic.
-   **Inventory**: Manage feed stock, medications, and batch-level consumption.
-   **Audit Logs**: Comprehensive activity tracking for admin accountability.
-   **PWA**: Installable on mobile and desktop devices.

## Tech Stack

-   **Framework**: [TanStack Start](https://tanstack.com/start/latest) (React 19, SSR)
-   **Database**: PostgreSQL (via [Neon](https://neon.tech) or any Postgres provider)
-   **ORM**: [Kysely](https://kysely.dev)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
-   **State/Sync**: [TanStack Query](https://tanstack.com/query/latest) with IndexedDB persistence.

## Getting Started

### Prerequisites

-   Node.js 22+
-   Bun (recommended) or npm/pnpm
-   PostgreSQL database

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/open-livestock-manager.git
    cd open-livestock-manager
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Configure Environment:
    Copy `.env.example` to `.env` and update your database credentials.
    ```bash
    cp .env.example .env
    ```

4.  Initialize Database:
    Run migrations and seed default data.
    ```bash
    bun run db:migrate
    bun run db:seed
    ```

5.  Start Development Server:
    ```bash
    bun dev
    ```

## Default Credentials (Seed Data)

-   **Admin**: `admin@openlivestock.local` / `password`
-   **Staff**: `staff@openlivestock.local` / `password`

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
