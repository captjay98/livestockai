---
name: Commit Plan
description: Plan and structure git commits
---

# Commit Plan

Create well-structured, atomic commits.

## Commit Message Format

```
type(scope): brief description

- Detail 1
- Detail 2
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```
feat(batches): add weight tracking functionality

- Add weight_samples table migration
- Create server functions for weight CRUD
- Add weight chart component
```

```
fix(auth): resolve session expiry issue

- Increase session timeout to 7 days
- Add refresh token rotation
```

## Atomic Commits

Each commit should:

- Focus on one logical change
- Build successfully
- Pass tests

## Process

1. Group related changes
2. Write descriptive message
3. Verify build/tests pass
4. Commit
