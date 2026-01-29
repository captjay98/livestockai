# Contributing to OpenLivestock Manager

Thank you for your interest in contributing! We love pull requests from everyone. By participating in this project, you agree to abide by our Code of Conduct and follow our collaboration guidelines.

## 1. Development Workflow

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/your-username/open-livestock-manager.git
    ```
3.  **Create a Branch** for your work. We use the `type/short-description` format:
    - `feat/add-batch-analysis`
    - `fix/login-error-toast`
    - `docs/update-readme`

## 2. Commit Conventions

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification. This helps us generate changelogs and version numbers automatically.

**Format**:

```
<type>(<scope>): <short description>

<body with details>
- Change 1
- Change 2
- Change 3

<optional footer>
```

### Allowed Types:

- `feat`: A new feature for the user (e.g., "add forecast chart").
- `fix`: A bug fix (e.g., "fix negative inventory on delete").
- `docs`: Documentation only changes.
- `style`: Formatting, missing semi-colons, etc (no production code change).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to the build process or auxiliary tools (e.g., "bump deps").

### Examples:

```
feat(auth): implement google oauth login

- Add Google OAuth provider to Better Auth config
- Create OAuth callback route
- Add "Sign in with Google" button to login page
```

```
fix(db): add missing index on batch_id

- Add composite index on (farmId, batchId) for feed_records
- Improves query performance by ~40% on large farms
```

```
docs: update installation steps in readme

- Add Bun as alternative to npm
- Update Node.js version requirement to 22+
- Add troubleshooting section for common issues
```

## 3. Pull Request Guidelines

- **One Feature per PR**: Keep your changes focused.
- **Self-Review**: Review your own code before submitting.
- **Tests**: Ensure all tests pass. If adding a feature, add a corresponding test.
- **Linting**: Run the linter locally to ensure no style regressions.

## 4. Local Development Shortcuts

We use `bun` for package management and scripting.

- **Install Dependencies**: `bun install`
- **Run Dev Server**: `bun dev`
- **Lint & Format**: `bun check` (Runs Prettier & ESLint)
- **Run Tests**: `bun run test`
- **Database**:
  - Migrate: `bun run db:migrate`
  - Seed (production): `bun run db:seed` - Admin user + reference data
  - Seed (development): `bun run db:seed:dev` - Full demo data with farms, batches, transactions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
