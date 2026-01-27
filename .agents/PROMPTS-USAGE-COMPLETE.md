# Kiro CLI Prompts - Complete Usage Documentation

**Last Updated**: January 27, 2026

---

## Prompts Documentation Status

| Prompt | Category | Documented | Days Used | Notes |
|--------|----------|-----------|-----------|-------|
| **@plan-feature** | Planning | ✅ Yes | 13-19 | 28+ plans generated |
| **@execute** | Implementation | ✅ Yes | 13-19 | All implementations |
| **@code-review** | Quality | ✅ Yes | 16-19 | Audit reports |
| **@test-coverage** | Quality | ✅ Yes | 16-19 | Test generation |
| **@commit-plan** | Documentation | ✅ Yes | 16-19 | Commit strategies |
| **@update-devlog** | Documentation | ✅ Yes | 16-19 | DEVLOG updates |
| **@plan-structure** | Planning | ✅ Yes | 7, 16-18 | Directory reorganization |
| **@ui-audit** | Quality | ✅ Yes | 3, 16-18, 18 | Mobile UI, consistency |
| **@sync-docs** | Documentation | ✅ Yes | 10-12, 15 | TypeDocs updates |
| **@sync-guides** | Documentation | ✅ Yes | 10-12, 15, 16-18 | README, docs/ updates |
| **@neon-setup** | Infrastructure | ✅ Mentioned | Various | Database setup |
| **@cloudflare-setup** | Infrastructure | ✅ Mentioned | Various | CF Workers setup |
| **@cloudflare-deploy** | Infrastructure | ✅ Mentioned | Various | Deployment |
| **@cloudflare-debug** | Infrastructure | ✅ Mentioned | Various | CF debugging |
| **@pwa-optimize** | Infrastructure | ✅ Mentioned | Various | PWA optimization |
| **@batch-analysis** | Domain | ✅ Mentioned | Various | Livestock analytics |
| **@feed-optimization** | Domain | ✅ Mentioned | 19 | Feed formulation |
| **@growth-forecast** | Domain | ✅ Mentioned | 19 | Growth predictions |
| **@mortality-analysis** | Domain | ✅ Mentioned | Various | Mortality tracking |
| **@financial-report** | Domain | ✅ Mentioned | Various | P&L analysis |
| **@cost-analysis** | Domain | ✅ Mentioned | Various | Cost breakdown |
| **@sales-forecast** | Domain | ✅ Mentioned | Various | Revenue projections |
| **@accessibility-audit** | Quality | ✅ Mentioned | Various | A11y checks |
| **@performance-audit** | Quality | ✅ Mentioned | Various | Performance checks |
| **@offline-debug** | Quality | ✅ Mentioned | Various | Offline mode debug |
| **@prime** | Setup | ❌ No | ? | Load project context |
| **@quickstart** | Setup | ❌ No | ? | Interactive setup |
| **@competitive-analysis** | Planning | ❌ No | ? | Market analysis |
| **@code-review-hackathon** | Quality | ❌ No | ? | Hackathon review |

**Summary**: 25/29 prompts documented (86%)

---

## Detailed Prompt Usage

### Planning Prompts

#### @plan-feature
**Purpose**: Generate comprehensive feature implementation plans  
**Days Used**: 13-19 (all major development days)  
**Plans Generated**: 28+ comprehensive plans  
**Output**: Markdown files with task breakdowns, file changes, validation checkpoints  
**Example Plans**:
- `service-layer-refactoring.md` (20KB)
- `comprehensive-codebase-audit-2026-01-22.md` (43KB)
- `refactor-tanstack-router-patterns.md` (25KB)

#### @plan-structure
**Purpose**: Plan directory reorganization and codebase structure changes  
**Days Used**: Day 7 (Jan 13), Days 16-18 (Jan 22-24)  
**Plans Generated**: 4 structure plans  
**Output**: File movement strategies, import update plans  
**Example Plans**:
- `codebase-cleanup-final-organization.md` (20KB)
- `consolidate-codebase-organization.md` (19KB)
- `refactor-routing-to-directory-structure.md` (15KB)
- `reorganize-project-structure.md` (25KB)

---

### Implementation Prompts

#### @execute
**Purpose**: Implement features from generated plans  
**Days Used**: 13-19 (all implementations)  
**Usage**: Referenced plan files, delegated to subagents  
**Pattern**: `@execute` → reads plan → delegates to specialized subagents  
**Result**: All 66+ commits across Days 13-19

---

### Quality Prompts

#### @code-review
**Purpose**: Generate comprehensive code quality audits  
**Days Used**: Days 16-19  
**Output**: Audit reports with severity ratings, fix recommendations  
**Example Reports**:
- `comprehensive-codebase-audit-2026-01-22.md` (43KB)
- `comprehensive-audit-remediation.md` (30KB)

#### @test-coverage
**Purpose**: Generate tests following established patterns  
**Days Used**: Days 16-19  
**Output**: Service tests, integration tests, property tests  
**Result**: 1,306 tests (99.8% pass rate)

#### @ui-audit
**Purpose**: Audit UI consistency, mobile-friendliness, design system compliance  
**Days Used**: Day 3 (mobile), Days 16-18 (standards), Day 18 (redesign)  
**Plans Generated**: 4 UI audit plans  
**Example Plans**:
- `audit-button-sizes.md` (9.8KB)
- `ui-standards-compliance.md` (7.7KB)
- `ui-standards-implementation.md` (16KB)
- `complete-ui-audit-remediation.md` (14KB)

---

### Documentation Prompts

#### @commit-plan
**Purpose**: Generate commit strategies for complex changes  
**Days Used**: Days 16-19  
**Output**: Commit message templates, breaking change documentation  
**Result**: Well-structured commit history with conventional commits

#### @update-devlog
**Purpose**: Update DEVLOG.md with progress documentation  
**Days Used**: Days 16-19  
**Output**: Structured DEVLOG entries with metrics, insights, challenges  
**Result**: Comprehensive development timeline

#### @sync-docs
**Purpose**: Update TypeDocs API documentation  
**Days Used**: Days 10-12 (documentation sprint), Day 15  
**Plans Generated**: 2 documentation plans  
**Example Plans**:
- `documentation-enhancement-plans-summary.md` (6.9KB)
- `add-api-reference.md` (14KB)

#### @sync-guides
**Purpose**: Update README, docs/, and user guides  
**Days Used**: Days 10-12, Day 15, Days 16-18  
**Plans Generated**: 3 guide plans  
**Example Plans**:
- `add-interactive-examples.md` (14KB)
- `add-visual-diagrams.md` (12KB)
- `documentation-enhancement-plans-summary.md` (6.9KB)

---

### Infrastructure Prompts

#### @neon-setup
**Purpose**: Database setup and configuration  
**Usage**: Mentioned in DEVLOG, used for database initialization  

#### @cloudflare-setup
**Purpose**: Cloudflare Workers configuration  
**Usage**: Mentioned in DEVLOG, used for deployment setup  

#### @cloudflare-deploy
**Purpose**: Deploy to Cloudflare Workers  
**Usage**: Mentioned in DEVLOG, used for production deployments  

#### @cloudflare-debug
**Purpose**: Debug Cloudflare Workers issues  
**Usage**: Mentioned in DEVLOG, used for troubleshooting  

#### @pwa-optimize
**Purpose**: PWA performance optimization  
**Usage**: Mentioned in DEVLOG, used for offline capabilities  

---

### Domain-Specific Prompts

#### @batch-analysis
**Purpose**: Livestock batch analytics and insights  
**Usage**: Mentioned in DEVLOG, used for batch performance analysis  

#### @feed-optimization
**Purpose**: Feed formulation optimization  
**Days Used**: Day 19 (feed calculator feature)  
**Usage**: Linear programming optimization for feed formulations  

#### @growth-forecast
**Purpose**: Growth predictions using breed-specific curves  
**Days Used**: Day 19 (breed-specific forecasting)  
**Usage**: Intelligent growth forecasting with alerts  

#### @mortality-analysis
**Purpose**: Mortality tracking and analysis  
**Usage**: Mentioned in DEVLOG, used for mortality rate calculations  

#### @financial-report
**Purpose**: P&L analysis and financial reporting  
**Usage**: Mentioned in DEVLOG, used for financial insights  

#### @cost-analysis
**Purpose**: Cost breakdown and analysis  
**Usage**: Mentioned in DEVLOG, used for expense categorization  

#### @sales-forecast
**Purpose**: Revenue projections  
**Usage**: Mentioned in DEVLOG, used for sales predictions  

---

### Undocumented Prompts

#### @prime
**Purpose**: Load project context for AI agents  
**Status**: Not yet documented in DEVLOG  
**Likely Usage**: Session initialization, context loading  

#### @quickstart
**Purpose**: Interactive setup wizard  
**Status**: Not yet documented in DEVLOG  
**Likely Usage**: New user onboarding, environment setup  

#### @competitive-analysis
**Purpose**: Market analysis and competitive research  
**Status**: Not yet documented in DEVLOG  
**Likely Usage**: Feature planning, market positioning  

#### @code-review-hackathon
**Purpose**: Hackathon-specific code review  
**Status**: Not yet documented in DEVLOG  
**Likely Usage**: Pre-submission review, demo preparation  

---

## Workflow Patterns

### Standard Feature Development
1. **@plan-feature** → Generate comprehensive plan
2. **@execute** → Implement from plan (delegates to subagents)
3. **@code-review** → Quality audit
4. **@test-coverage** → Generate tests
5. **@commit-plan** → Create commits
6. **@update-devlog** → Document progress

### Structure Refactoring
1. **@plan-structure** → Plan directory changes
2. **@execute** → Move files, update imports
3. **@code-review** → Verify no broken imports
4. **@commit-plan** → Document changes

### UI Enhancement
1. **@ui-audit** → Audit current state
2. **@plan-feature** → Plan improvements
3. **@execute** → Implement changes
4. **@code-review** → Verify consistency

### Documentation Update
1. **@sync-docs** → Update TypeDocs
2. **@sync-guides** → Update README, docs/
3. **@commit-plan** → Document changes

---

## Impact Metrics

### Plans Generated
- **Total**: 50+ comprehensive plans
- **Total Size**: ~800KB of planning documentation
- **Average Plan Size**: 16KB
- **Largest Plan**: `fix-i18n-inconsistencies.md` (54KB)

### Time Savings
- **Days 16-19**: 78-113 hours saved (65-73% reduction)
- **Average**: ~20 hours saved per major development day
- **Pattern Replication**: 10x faster after initial pattern established

### Quality Improvements
- **Test Coverage**: 1,306 tests (99.8% pass rate)
- **Type Safety**: 100% (0 TypeScript errors)
- **Code Quality**: 0 ESLint errors
- **Documentation**: 5,211 lines in DEVLOG

---

## Next Steps

1. **Document @prime usage** - Session initialization patterns
2. **Document @quickstart usage** - Setup wizard workflows
3. **Update earlier days** (13-15) with prompt usage details
4. **Track @competitive-analysis** usage for market research
5. **Document @code-review-hackathon** for submission preparation

---

**Built with ❤️ using Kiro CLI and AI-accelerated development**
