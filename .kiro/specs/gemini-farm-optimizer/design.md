# Design Document: Farm Optimizer

## Overview

Farm Optimizer is an autonomous AI optimization agent that analyzes farm performance, generates improvement strategies, and **verifies them through backtesting** against historical data before recommending implementation. Built for the "Vibe Engineering" hackathon track, it demonstrates AI that doesn't just suggest - it proves.

The key differentiator is the verification loop: strategies are tested against historical batch data, simulated with confidence intervals, and only recommended after passing validation. This produces verification artifacts as evidence of testing.

### Key Design Principles

1. **Evidence-Based Recommendations**: Every strategy is backed by backtest results
2. **Verification Before Deployment**: Strategies must pass quality checks before recommendation
3. **Autonomous Refinement**: Failed strategies are refined and re-tested automatically
4. **Risk-Aware**: Includes rollback triggers and confidence intervals
5. **Outcome Tracking**: Monitors deployed strategies vs projections

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FARM OPTIMIZER ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      OPTIMIZATION PIPELINE                              │ │
│  │                                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │ │
│  │  │ PERFORMANCE │    │ STRATEGY    │    │ BACKTEST    │                │ │
│  │  │ ANALYZER    │───▶│ GENERATOR   │───▶│ ENGINE      │                │ │
│  │  │             │    │             │    │             │                │ │
│  │  │ • FCR       │    │ • Hypotheses│    │ • Simulate  │                │ │
│  │  │ • Mortality │    │ • ROI calc  │    │ • Compare   │                │ │
│  │  │ • Growth    │    │ • Reasoning │    │ • Variance  │                │ │
│  │  │ • Costs     │    │             │    │             │                │ │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘                │ │
│  │                                               │                        │ │
│  │                                        ┌──────▼──────┐                │ │
│  │                                        │ VERIFICATION│                │ │
│  │                                        │ ENGINE      │                │ │
│  │                                        │             │                │ │
│  │                                        │ • Validate  │                │ │
│  │                                        │ • Refine    │                │ │
│  │                                        │ • Artifacts │                │ │
│  │                                        └──────┬──────┘                │ │
│  │                                               │                        │ │
│  │         ┌─────────────────────────────────────┼───────────────────┐   │ │
│  │         │                                     │                   │   │ │
│  │         ▼                                     ▼                   ▼   │ │
│  │  ┌─────────────┐                       ┌─────────────┐    ┌──────────┐│ │
│  │  │ REFINE      │                       │ ARTIFACT    │    │ DEPLOY   ││ │
│  │  │ (if failed) │                       │ GENERATOR   │    │ TRACKER  ││ │
│  │  │             │                       │             │    │          ││ │
│  │  │ • Adjust    │                       │ • Results   │    │ • Monitor││ │
│  │  │ • Re-test   │                       │ • Charts    │    │ • Compare││ │
│  │  │ • Max 3x    │                       │ • Export    │    │ • Report ││ │
│  │  └─────────────┘                       └─────────────┘    └──────────┘│ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         GEMINI 3 REASONING                              │ │
│  │                                                                         │ │
│  │  • 1M token context for comprehensive historical analysis               │ │
│  │  • Strategy generation with reasoning explanations                      │ │
│  │  • Mathematical simulation and projection                               │ │
│  │  • Tool calling for data queries and artifact generation                │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATABASE (PostgreSQL)                           │ │
│  │                                                                         │ │
│  │  batches │ feed_records │ mortality_records │ weight_samples │ sales   │ │
│  │  expenses │ growth_standards │ optimization_strategies │ artifacts     │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Performance Analyzer

Analyzes farm metrics against benchmarks to identify improvement opportunities.

```typescript
interface PerformanceAnalyzer {
  analyzeFarm(
    farmId: string,
    period: AnalysisPeriod,
  ): Promise<PerformanceAnalysis>
}

interface AnalysisPeriod {
  startDate: Date
  endDate: Date
  minBatches: number // Minimum batches required for analysis
}

interface PerformanceAnalysis {
  farmId: string
  analyzedAt: Date
  period: AnalysisPeriod
  batchesAnalyzed: number

  // Core metrics
  metrics: FarmMetrics
  benchmarks: IndustryBenchmarks
  deviations: MetricDeviation[]

  // Financial impact
  financialImpact: FinancialImpact

  // Top improvement areas
  topOpportunities: ImprovementOpportunity[]
}

interface FarmMetrics {
  averageFCR: number
  averageMortalityRate: number
  averageFeedCostPerUnit: number
  averageGrowthRate: number // % of expected
  averageCycleLength: number // days
  totalBatchesCompleted: number
}

interface IndustryBenchmarks {
  species: string
  targetFCR: number
  targetMortalityRate: number
  targetFeedCostPerUnit: number
  targetGrowthRate: number
  source: string // e.g., "Cobb 500 Performance Guide 2024"
}

interface MetricDeviation {
  metric: string
  currentValue: number
  benchmarkValue: number
  deviationPercent: number
  direction: 'above' | 'below' | 'at_target'
  financialImpactPerUnit: number
}

interface ImprovementOpportunity {
  metric: string
  currentValue: number
  targetValue: number
  potentialSavingsPerUnit: number
  potentialAnnualSavings: number
  priority: 'high' | 'medium' | 'low'
}
```

### 2. Strategy Generator

Generates optimization hypotheses using Gemini 3.

```typescript
interface StrategyGenerator {
  generateStrategies(
    analysis: PerformanceAnalysis,
    constraints: StrategyConstraints,
  ): Promise<GeneratedStrategy[]>
}

interface StrategyConstraints {
  maxImplementationCost: number
  availableEquipment: string[]
  excludeStrategies: string[] // Previously failed strategies
}

interface GeneratedStrategy {
  id: string
  name: string
  description: string
  targetMetric: string

  // Expected outcomes
  expectedImprovement: {
    min: number // percentage
    max: number // percentage
    mostLikely: number
  }

  // Implementation
  implementationCost: number
  implementationSteps: string[]
  timeToImplement: number // days

  // ROI
  expectedROI: number
  paybackPeriod: number // days

  // Reasoning
  reasoning: string
  references: string[] // Research or best practices

  // Status
  status: 'generated' | 'backtesting' | 'verified' | 'failed' | 'deployed'
}
```

### 3. Backtest Engine

Tests strategies against historical batch data.

```typescript
interface BacktestEngine {
  backtest(
    strategy: GeneratedStrategy,
    batches: CompletedBatch[],
  ): Promise<BacktestResult>
}

interface CompletedBatch {
  id: string
  species: string
  startDate: Date
  endDate: Date
  initialQuantity: number
  finalQuantity: number
  totalFeedKg: number
  totalMortality: number
  averageFinalWeight: number
  fcr: number
  mortalityRate: number
  feedCostPerUnit: number
}

interface BacktestResult {
  strategyId: string
  batchesTestedCount: number

  // Per-batch results
  batchResults: BatchBacktestResult[]

  // Aggregate results
  averageImprovement: number
  standardDeviation: number
  improvementRange: { min: number; max: number }

  // Success metrics
  batchesImproved: number
  batchesUnchanged: number
  batchesWorsened: number
  successRate: number // batchesImproved / total

  // Side effects
  mortalityImpact: 'positive' | 'neutral' | 'negative'
  weightImpact: 'positive' | 'neutral' | 'negative'

  // Confidence
  confidence: number // 0-1
  varianceFlag: boolean // true if high variance between batches
}

interface BatchBacktestResult {
  batchId: string
  batchName: string

  // Actual values
  actualMetric: number

  // Simulated values
  simulatedMetric: number

  // Improvement
  improvement: number
  improvementPercent: number

  // Financial
  savingsPerUnit: number
  totalSavings: number
}
```

### 4. Verification Engine

Validates strategies against quality criteria.

```typescript
interface VerificationEngine {
  verify(
    strategy: GeneratedStrategy,
    backtestResult: BacktestResult,
  ): Promise<VerificationResult>

  refineStrategy(
    strategy: GeneratedStrategy,
    failures: VerificationFailure[],
  ): Promise<GeneratedStrategy | null>
}

interface VerificationResult {
  strategyId: string
  passed: boolean

  // Checklist
  checks: VerificationCheck[]

  // Failures
  failures: VerificationFailure[]

  // Refinement
  refinementAttempt: number
  canRefine: boolean
}

interface VerificationCheck {
  name: string
  description: string
  passed: boolean
  actualValue: number | string
  requiredValue: number | string
}

interface VerificationFailure {
  check: string
  reason: string
  suggestion: string
}

// Verification criteria
const VERIFICATION_CRITERIA = {
  minSuccessRate: 0.75, // 75% of batches must improve
  minConfidence: 0.7, // 70% confidence required
  maxMortalityImpact: 0, // No negative mortality impact
  maxWeightImpact: 0, // No negative weight impact
  minROI: 1.0, // Savings must exceed implementation cost
  maxRefinementAttempts: 3,
}
```

### 5. Artifact Generator

Creates verification artifacts for evidence.

```typescript
interface ArtifactGenerator {
  generateArtifact(
    strategy: GeneratedStrategy,
    backtestResult: BacktestResult,
    verificationResult: VerificationResult,
  ): Promise<VerificationArtifact>
}

interface VerificationArtifact {
  id: string
  strategyId: string
  createdAt: Date
  version: number

  // Strategy summary
  strategySummary: {
    name: string
    description: string
    targetMetric: string
    expectedImprovement: string
  }

  // Backtest results
  backtestSummary: {
    batchesTested: number
    averageImprovement: number
    successRate: number
    confidence: number
  }

  // Per-batch details
  batchDetails: BatchBacktestResult[]

  // Verification checklist
  verificationChecklist: VerificationCheck[]

  // Projections
  projections: {
    nextBatchExpected: { min: number; max: number; mostLikely: number }
    annualSavings: { min: number; max: number; mostLikely: number }
    breakEvenDays: number
  }

  // Risk analysis
  riskAnalysis: {
    rollbackTrigger: RollbackTrigger
    worstCaseScenario: string
    mitigationSteps: string[]
  }

  // Chart data for visualization
  chartData: {
    backtestComparison: { batch: string; actual: number; simulated: number }[]
    improvementDistribution: { range: string; count: number }[]
  }
}
```

### 6. Implementation Plan Generator

Creates step-by-step deployment instructions.

```typescript
interface ImplementationPlanGenerator {
  generatePlan(
    strategy: GeneratedStrategy,
    artifact: VerificationArtifact,
    targetBatch: string | null,
  ): Promise<ImplementationPlan>
}

interface ImplementationPlan {
  id: string
  strategyId: string
  createdAt: Date

  // Timeline
  timeline: ImplementationStep[]
  totalDuration: number // days

  // Prerequisites
  prerequisites: Prerequisite[]

  // Monitoring
  monitoringCheckpoints: MonitoringCheckpoint[]

  // Rollback
  rollbackTrigger: RollbackTrigger
  rollbackProcedure: string[]

  // Target
  targetBatchId: string | null
  recommendedStartDate: Date
}

interface ImplementationStep {
  week: number
  day: number
  action: string
  details: string
  estimatedTime: string
  responsible: string // e.g., "Farm Manager"
}

interface Prerequisite {
  item: string
  description: string
  estimatedCost: number
  leadTime: number // days
}

interface MonitoringCheckpoint {
  day: number
  metric: string
  expectedValue: number
  acceptableRange: { min: number; max: number }
  action: string // What to do if outside range
}

interface RollbackTrigger {
  metric: string
  threshold: number
  comparison: 'gt' | 'lt' | 'gte' | 'lte'
  duration: number // consecutive days
  description: string
}
```

### 7. Deployment Tracker

Monitors deployed strategies vs projections.

```typescript
interface DeploymentTracker {
  deployStrategy(
    strategyId: string,
    targetBatchId: string,
    userId: string,
  ): Promise<DeployedStrategy>

  trackProgress(deploymentId: string): Promise<DeploymentProgress>

  generateReport(deploymentId: string): Promise<DeploymentReport>
}

interface DeployedStrategy {
  id: string
  strategyId: string
  farmId: string
  targetBatchId: string

  deployedAt: Date
  deployedBy: string

  status: 'active' | 'completed' | 'rolled_back' | 'abandoned'

  // Projections at deployment time
  projectedImprovement: number
  projectedSavings: number

  // Actual results (updated as batch progresses)
  actualImprovement: number | null
  actualSavings: number | null
  variance: number | null
}

interface DeploymentProgress {
  deploymentId: string
  daysActive: number

  // Current metrics
  currentMetrics: {
    metric: string
    projected: number
    actual: number
    variance: number
    status: 'on_track' | 'ahead' | 'behind' | 'critical'
  }[]

  // Rollback status
  rollbackTriggered: boolean
  rollbackReason: string | null

  // Checkpoints
  checkpointsPassed: number
  checkpointsFailed: number
}

interface DeploymentReport {
  deploymentId: string
  strategyName: string

  // Summary
  outcome: 'success' | 'partial' | 'failure'

  // Comparison
  projectedImprovement: number
  actualImprovement: number
  variance: number

  // Financial
  projectedSavings: number
  actualSavings: number

  // Learnings
  insights: string[]
  recommendedAdjustments: string[]

  // Impact on future strategies
  confidenceAdjustment: number // How much to adjust confidence for similar strategies
}
```

## Data Models

### Optimization Strategies Table

```sql
CREATE TABLE optimization_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),

  -- Strategy details
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  target_metric VARCHAR(50) NOT NULL,
  reasoning TEXT,

  -- Expected outcomes
  expected_improvement_min DECIMAL(5,2),
  expected_improvement_max DECIMAL(5,2),
  expected_improvement_likely DECIMAL(5,2),
  implementation_cost DECIMAL(12,2),
  expected_roi DECIMAL(5,2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'generated',
  refinement_attempts INTEGER DEFAULT 0,

  -- Verification
  verified_at TIMESTAMPTZ,
  confidence DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opt_strategies_farm ON optimization_strategies(farm_id);
CREATE INDEX idx_opt_strategies_status ON optimization_strategies(status);
```

### Verification Artifacts Table

```sql
CREATE TABLE verification_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES optimization_strategies(id),

  -- Version
  version INTEGER NOT NULL DEFAULT 1,

  -- Content (JSONB for flexibility)
  strategy_summary JSONB NOT NULL,
  backtest_summary JSONB NOT NULL,
  batch_details JSONB NOT NULL,
  verification_checklist JSONB NOT NULL,
  projections JSONB NOT NULL,
  risk_analysis JSONB NOT NULL,
  chart_data JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artifacts_strategy ON verification_artifacts(strategy_id);
```

### Deployed Strategies Table

```sql
CREATE TABLE deployed_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES optimization_strategies(id),
  farm_id UUID NOT NULL REFERENCES farms(id),
  target_batch_id UUID REFERENCES batches(id),
  deployed_by UUID NOT NULL REFERENCES users(id),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',

  -- Projections
  projected_improvement DECIMAL(5,2),
  projected_savings DECIMAL(12,2),

  -- Actuals (updated as batch progresses)
  actual_improvement DECIMAL(5,2),
  actual_savings DECIMAL(12,2),
  variance DECIMAL(5,2),

  -- Rollback
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Timestamps
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_deployed_farm ON deployed_strategies(farm_id);
CREATE INDEX idx_deployed_status ON deployed_strategies(status);
```

### Optimization Cycles Table

```sql
CREATE TABLE optimization_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),

  -- Execution
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL,

  -- Results
  batches_analyzed INTEGER DEFAULT 0,
  strategies_generated INTEGER DEFAULT 0,
  strategies_verified INTEGER DEFAULT 0,

  -- Errors
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opt_cycles_farm ON optimization_cycles(farm_id);
```

## Correctness Properties

### Property 1: Analysis Data Completeness

_For any_ performance analysis, the result SHALL include FCR, mortality rate, feed cost per unit, and growth rate metrics for all completed batches in the analysis period.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Minimum Batch Requirement

_For any_ analysis request with fewer than 3 completed batches, the analyzer SHALL return an error indicating insufficient data.

**Validates: Requirements 1.9**

### Property 3: Strategy Generation Count

_For any_ identified improvement opportunity, the strategy generator SHALL produce at least 3 distinct optimization hypotheses.

**Validates: Requirements 2.1**

### Property 4: Strategy ROI Ranking

_For any_ set of generated strategies, they SHALL be sorted in descending order by expected ROI.

**Validates: Requirements 2.5**

### Property 5: Backtest Batch Coverage

_For any_ backtest execution, all completed batches in the analysis period SHALL be included in the simulation.

**Validates: Requirements 3.1**

### Property 6: Backtest Statistical Validity

_For any_ backtest with fewer than 4 batches, the result SHALL include a reduced confidence flag.

**Validates: Requirements 3.8, 3.9**

### Property 7: Confidence Interval Calculation

_For any_ projection, both 80% and 95% confidence intervals SHALL be calculated and included.

**Validates: Requirements 4.2**

### Property 8: Verification Success Rate Threshold

_For any_ strategy to pass verification, at least 75% of backtested batches SHALL show improvement.

**Validates: Requirements 5.1**

### Property 9: Verification Side Effect Check

_For any_ strategy to pass verification, no backtested batch SHALL show negative impact on mortality or final weight.

**Validates: Requirements 5.2, 5.3**

### Property 10: Verification Cost-Benefit Check

_For any_ strategy to pass verification, projected savings SHALL exceed implementation cost.

**Validates: Requirements 5.4**

### Property 11: Refinement Limit

_For any_ strategy that fails verification, at most 3 refinement attempts SHALL be made before discarding.

**Validates: Requirements 5.7**

### Property 12: Artifact Completeness

_For any_ verification artifact, it SHALL contain: strategy summary, backtest results, verification checklist, projections, and risk analysis.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 13: Implementation Plan Structure

_For any_ implementation plan, it SHALL include numbered steps, timeline, prerequisites, monitoring checkpoints, and rollback trigger.

**Validates: Requirements 7.2, 7.3, 7.5, 7.6**

### Property 14: Rollback Trigger Specification

_For any_ rollback trigger, it SHALL specify the metric, threshold, comparison operator, and duration.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 15: Deployment Tracking

_For any_ deployed strategy, actual metrics SHALL be tracked and compared against projections.

**Validates: Requirements 9.3, 9.4**

### Property 16: Outcome-Based Learning

_For any_ completed deployment, the outcome SHALL be used to adjust confidence for similar future strategies.

**Validates: Requirements 9.5, 9.7**

### Property 17: Species-Specific Benchmarks

_For any_ analysis, the benchmarks used SHALL match the species of the batches being analyzed.

**Validates: Requirements 12.1, 12.3**

### Property 18: Audit Logging

_For any_ optimization action (strategy generation, deployment, rollback), an entry SHALL be created in audit_logs.

**Validates: Requirements 13.4**

## Error Handling

### Analysis Errors

| Error Type                   | Handling Strategy                      | User Feedback                                    |
| ---------------------------- | -------------------------------------- | ------------------------------------------------ |
| Insufficient data            | Return error with minimum requirements | "Need at least 3 completed batches for analysis" |
| No improvement opportunities | Return empty strategies list           | "Your farm is performing at or above benchmarks" |
| Benchmark not found          | Use generic species benchmark          | "Using standard benchmarks for [species]"        |

### Backtest Errors

| Error Type         | Handling Strategy       | User Feedback                                                   |
| ------------------ | ----------------------- | --------------------------------------------------------------- |
| Simulation failure | Log error, skip batch   | "Could not simulate batch [name], excluded from results"        |
| High variance      | Flag in results         | "Results vary significantly between batches - review carefully" |
| All batches fail   | Mark strategy as failed | "Strategy did not improve any tested batches"                   |

### Verification Errors

| Error Type              | Handling Strategy  | User Feedback                                                              |
| ----------------------- | ------------------ | -------------------------------------------------------------------------- |
| All checks fail         | Attempt refinement | "Refining strategy parameters..."                                          |
| Max refinements reached | Discard strategy   | "Strategy could not be verified after 3 attempts"                          |
| No strategies pass      | Report to user     | "No verified strategies available - try again after more batches complete" |

### Deployment Errors

| Error Type         | Handling Strategy            | User Feedback                                       |
| ------------------ | ---------------------------- | --------------------------------------------------- |
| Rollback triggered | Mark as rolled back, notify  | "Strategy rolled back due to [trigger condition]"   |
| Batch cancelled    | Mark as abandoned            | "Target batch was cancelled - deployment abandoned" |
| Tracking failure   | Continue with available data | "Some metrics unavailable - partial tracking"       |

## Testing Strategy

### Property-Based Tests

```typescript
// Property 1: Analysis Data Completeness
describe('PerformanceAnalyzer', () => {
  it('should include all required metrics for any valid farm', () => {
    fc.assert(
      fc.property(arbitraryFarmWithBatches({ minBatches: 3 }), async (farm) => {
        const analysis = await analyzer.analyzeFarm(farm.id, defaultPeriod)

        expect(analysis.metrics.averageFCR).toBeDefined()
        expect(analysis.metrics.averageMortalityRate).toBeDefined()
        expect(analysis.metrics.averageFeedCostPerUnit).toBeDefined()
        expect(analysis.metrics.averageGrowthRate).toBeDefined()
      }),
    )
  })
})

// Property 8: Verification Success Rate Threshold
describe('VerificationEngine', () => {
  it('should require 75% success rate for verification', () => {
    fc.assert(
      fc.property(arbitraryBacktestResult(), (result) => {
        const verification = verifier.verify(strategy, result)

        if (result.successRate < 0.75) {
          expect(verification.passed).toBe(false)
        }
      }),
    )
  })
})
```

### Integration Tests

```typescript
describe('Optimization Cycle', () => {
  it('should complete full cycle: analyze → generate → backtest → verify', async () => {
    const farm = await seedFarmWithBatches(6)

    const cycle = await optimizer.runCycle(farm.id)

    expect(cycle.status).toBe('completed')
    expect(cycle.strategiesGenerated).toBeGreaterThan(0)
  })

  it('should create verification artifact for verified strategy', async () => {
    const strategy = await createVerifiedStrategy()

    const artifact = await getArtifact(strategy.id)

    expect(artifact).toBeDefined()
    expect(artifact.backtestSummary).toBeDefined()
    expect(artifact.verificationChecklist).toBeDefined()
  })
})
```

### E2E Test Scenarios

1. **Happy Path**: Analyze farm → Generate strategies → Backtest → Verify → Deploy → Track
2. **Refinement Flow**: Strategy fails verification → Refine → Re-test → Pass
3. **Rollback Flow**: Deploy strategy → Trigger rollback condition → Auto-rollback
4. **Insufficient Data**: Attempt analysis with < 3 batches → Receive error
