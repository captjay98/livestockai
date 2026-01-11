# Contributing to OpenLivestock Manager

Thank you for your interest in contributing!

## Code of Conduct
Please be respectful and inclusive in all interactions.

## Development Workflow

1.  **Fork** the repository.
2.  **Create a branch** for your feature or fix (`git checkout -b feature/amazing-feature`).
3.  **Commit** your changes (`git commit -m 'Add amazing feature'`).
4.  **Push** to the branch (`git push origin feature/amazing-feature`).
5.  **Open a Pull Request**.

## Technical Standards

-   **Formatting**: We use `prettier` and `eslint`. Run `bun check` before committing.
-   **Testing**: Add unit tests for new logic where possible (`bun test`).
-   **Database**: If modifying schema, always create a new migration file:
    `bun run app/lib/db/migrate.ts create your_migration_name`

## Reporting Issues
Please use the GitHub Issues tab to report bugs or suggest features.
