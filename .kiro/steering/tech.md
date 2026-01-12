# Technical Architecture

## Technology Stack

### Primary Stack

- **Frontend**: React 19 with TanStack Router for client-side routing
- **Backend**: TanStack Start (SSR) with server functions
- **Database**: PostgreSQL via Neon (serverless) with Kysely ORM
- **Deployment**: Cloudflare Workers for edge computing
- **Styling**: Tailwind CSS v4 for modern, responsive design

### Supporting Technologies

- **State Management**: TanStack Query with IndexedDB persistence
- **Authentication**: Better Auth for secure user management
- **Type Safety**: Full TypeScript integration across the stack
- **Testing**: Vitest with fast-check for property-based testing
- **Build Tools**: Vite for fast development and optimized builds

## Architecture Overview

### Full-Stack TypeScript Architecture

- **Server Functions**: All database operations use TanStack Start's `createServerFn()`
- **Type-Safe Queries**: Kysely provides compile-time SQL validation
- **Edge Deployment**: Cloudflare Workers for global performance
- **Offline-First**: IndexedDB persistence with automatic sync

### Request Flow

```
Browser → Cloudflare Worker → TanStack Start → Server Functions → Kysely → Neon PostgreSQL
```

### Key Patterns

- **Dynamic Imports**: Database imports use `await import('../db')` for Cloudflare compatibility
- **Server Functions**: All database operations isolated in server functions
- **Type Safety**: End-to-end TypeScript from database to UI
- **Progressive Enhancement**: Works offline, syncs when online

## Development Environment

### Required Tools

- **Node.js 22+** or **Bun 1.0+** for runtime
- **PostgreSQL database** (Neon recommended for serverless)
- **Git** for version control
- **Modern IDE** with TypeScript support (VS Code recommended)

### Package Management

- **Bun** for package management and runtime
- **Lockfile**: bun.lockb for reproducible builds
- **Scripts**: Comprehensive bun scripts for development workflow

### Development Server

- **Hot reload**: Instant updates during development
- **Type checking**: Real-time TypeScript validation
- **Database migrations**: Automated schema management
- **Testing**: Continuous test runner with coverage

## Code Standards

### TypeScript Standards

- **Strict mode**: Full TypeScript strict configuration
- **Type imports**: Use `import type` for type-only imports
- **Interface over type**: Prefer interfaces for object shapes
- **Explicit return types**: Required for public functions

### Naming Conventions

- **Files**: kebab-case (e.g., `batch-dialog.tsx`)
- **Components**: PascalCase (e.g., `BatchDialog`)
- **Functions**: camelCase (e.g., `getBatches`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_BATCH_SIZE`)
- **Database columns**: camelCase (e.g., `batchName`, `farmId`)

### Import Organization

1. React/framework imports
2. Third-party library imports
3. Local imports (absolute paths with `~/`)
4. Type imports (grouped separately)

### Server Function Patterns

- **Dynamic imports**: Always use `const { db } = await import('../db')`
- **Validation**: Use Zod schemas for input validation
- **Error handling**: Structured error responses
- **Type safety**: Leverage Kysely's type inference

## Testing Strategy

### Testing Framework

- **Vitest**: Fast unit testing with TypeScript support
- **Fast-check**: Property-based testing for business logic
- **Testing Library**: Component testing for React components
- **Playwright**: End-to-end testing for critical user flows

### Testing Patterns

- **Property tests**: Use fast-check for mathematical operations
- **Unit tests**: Focus on business logic and utilities
- **Component tests**: Test user interactions and state changes
- **Integration tests**: Test server functions and database operations

### Coverage Requirements

- **Minimum 80%** code coverage for business logic
- **100%** coverage for financial calculations
- **Critical path testing** for offline functionality
- **Cross-browser testing** for PWA features

## Deployment Process

### Cloudflare Workers Deployment

- **Build process**: Optimized for edge computing
- **Environment variables**: Secure secret management
- **Database connections**: Serverless-compatible patterns
- **Static assets**: CDN distribution

### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Type checking**: Pre-deployment validation
- **Database migrations**: Automated schema updates
- **Performance monitoring**: Core Web Vitals tracking

### Environment Management

- **Development**: Local development with hot reload
- **Staging**: Preview deployments for testing
- **Production**: Edge deployment with monitoring
- **Database**: Separate instances per environment

## Performance Requirements

### Core Web Vitals

- **LCP**: <2.5 seconds for largest contentful paint
- **FID**: <100ms for first input delay
- **CLS**: <0.1 for cumulative layout shift
- **TTFB**: <800ms for time to first byte

### Offline Performance

- **Initial load**: <3 seconds on 3G connection
- **Offline mode**: Full functionality without internet
- **Sync performance**: <5 seconds for data synchronization
- **Storage efficiency**: Optimized IndexedDB usage

### Scalability Targets

- **Concurrent users**: 1000+ simultaneous users
- **Database performance**: <100ms query response time
- **Memory usage**: <50MB per user session
- **Bundle size**: <500KB initial JavaScript bundle

## Security Considerations

### Authentication & Authorization

- **Better Auth**: Secure session management
- **Role-based access**: Farm owner, manager, worker roles
- **Session security**: Secure cookie configuration
- **Password policies**: Strong password requirements

### Data Protection

- **Encryption**: TLS 1.3 for data in transit
- **Database security**: Encrypted connections to Neon
- **Input validation**: Comprehensive Zod schemas
- **XSS protection**: React's built-in protections

### API Security

- **Rate limiting**: Cloudflare Workers rate limiting
- **CORS configuration**: Restricted cross-origin requests
- **Input sanitization**: Server-side validation
- **Error handling**: No sensitive data in error messages

### Compliance

- **Data privacy**: GDPR-compliant data handling
- **Audit trails**: Comprehensive activity logging
- **Data retention**: Configurable retention policies
- **Export capabilities**: User data portability
