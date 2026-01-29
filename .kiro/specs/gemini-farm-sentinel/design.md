# Design Document: Farm Sentinel

## Overview

Farm Sentinel is an autonomous AI monitoring agent that runs continuously over days/weeks, analyzing farm data streams, detecting anomalies, reasoning about cause-and-effect relationships, and taking corrective actions without human supervision. Built for the "Marathon Agent" hackathon track, it demonstrates long-running autonomous operation that goes far beyond simple chatbot interactions.

The system leverages Google Gemini 3's advanced capabilities:

- **1M Token Context Window**: Maintains comprehensive farm history for pattern detection
- **Semantic Memory (pgvector)**: Enables context continuity via vector similarity search
- **Thinking Levels**: Applies appropriate reasoning depth based on anomaly complexity
- **Tool Calling**: Executes autonomous actions (alerts, tasks, schedule updates)
- **Embeddings API**: Generates thought embeddings for semantic recall

### Key Design Principles

1. **Autonomous Operation**: Runs without prompts, triggered by scheduled cron jobs
2. **Semantic Memory**: Maintains reasoning state across days/weeks using pgvector embeddings in Neon DB
3. **Self-Correction**: Learns from false positive feedback to improve accuracy
4. **Real Actions**: Creates tasks, sends alerts, logs to audit system
5. **Graceful Degradation**: Handles API failures without losing monitoring state
6. **Stateless Workers**: Cloudflare Workers remain stateless; all state lives in Neon PostgreSQL

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FARM SENTINEL ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    CLOUDFLARE WORKERS RUNTIME                          │ │
│  │                                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐                                   │ │
│  │  │ CRON        │    │ SENTINEL    │                                   │ │
│  │  │ TRIGGER     │───▶│ ORCHESTRATOR│                                   │ │
│  │  │             │    │             │                                   │ │
│  │  │ • Hourly    │    │ • Farm loop │                                   │ │
│  │  │ • 4-hourly  │    │ • Cycle mgmt│                                   │ │
│  │  │ • Daily     │    │ • Error hdl │                                   │ │
│  │  └─────────────┘    └──────┬──────┘                                   │ │
│  │                            │                                           │ │
│  └────────────────────────────┼───────────────────────────────────────────┘ │
│                               │                                              │
│  ┌────────────────────────────▼───────────────────────────────────────────┐ │
│  │                      MONITORING PIPELINE                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │ │
│  │  │ DATA        │    │ ANOMALY     │    │ CAUSAL      │                │ │
│  │  │ COLLECTOR   │───▶│ DETECTOR    │───▶│ ANALYZER    │                │ │
│  │  │             │    │             │    │             │                │ │
│  │  │ • Mortality │    │ • Baseline  │    │ • Correlate │                │ │
│  │  │ • Feed      │    │ • Deviation │    │ • Hypotheses│                │ │
│  │  │ • Weight    │    │ • Severity  │    │ • Confidence│                │ │
│  │  │ • Water     │    │ • Confidence│    │ • Explain   │                │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                │ │
│  │         │                  │                  │                        │ │
│  │         └──────────────────┼──────────────────┘                        │ │
│  │                            ▼                                           │ │
│  │                   ┌─────────────┐                                      │ │
│  │                   │ GEMINI 3    │                                      │ │
│  │                   │ REASONING   │                                      │ │
│  │                   │             │                                      │ │
│  │                   │ • Deep think│                                      │ │
│  │                   │ • Tool call │                                      │ │
│  │                   │ • Embeddings│                                      │ │
│  │                   └──────┬──────┘                                      │ │
│  │                          │                                             │ │
│  └──────────────────────────┼─────────────────────────────────────────────┘ │
│                             │                                                │
│  ┌──────────────────────────▼─────────────────────────────────────────────┐ │
│  │                      ACTION EXECUTOR                                    │ │
│  │                                                                         │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │ │
│  │  │ ALERT       │    │ TASK        │    │ AUDIT       │                │ │
│  │  │ GENERATOR   │    │ CREATOR     │    │ LOGGER      │                │ │
│  │  │             │    │             │    │             │                │ │
│  │  │ • Notify    │    │ • Priority  │    │ • Actions   │                │ │
│  │  │ • Escalate  │    │ • Link batch│    │ • Reasoning │                │ │
│  │  │ • Dedupe    │    │ • Follow-up │    │ • State     │                │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                             │                                                │
│  ┌──────────────────────────▼─────────────────────────────────────────────┐ │
│  │                      DATABASE (PostgreSQL via Neon)                     │ │
│  │                                                                         │ │
│  │  batches │ mortality_records │ feed_records │ weight_samples │          │ │
│  │  water_quality │ notifications │ tasks │ audit_logs │ sentinel_state   │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │              SEMANTIC MEMORY (pgvector)                          │   │ │
│  │  │                                                                  │   │ │
│  │  │  sentinel_thought_embeddings                                     │   │ │
│  │  │  • Vector similarity search for context recall                   │   │ │
│  │  │  • Thought summaries with embeddings                             │   │ │
│  │  │  • Historical pattern matching                                   │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Sentinel Orchestrator

The main entry point that coordinates monitoring cycles across all farms.

```typescript
interface SentinelOrchestrator {
  // Lifecycle
  runScheduledCycle(): Promise<CycleResult>
  runManualCycle(farmId: string): Promise<CycleResult>

  // Farm processing
  processFarm(farmId: string, state: SentinelState): Promise<FarmResult>

  // State management
  loadState(farmId: string): Promise<SentinelState>
  saveState(farmId: string, state: SentinelState): Promise<void>

  // Metrics
  getExecutionMetrics(): ExecutionMetrics
}

interface CycleResult {
  cycleId: string
  startedAt: Date
  completedAt: Date
  farmsProcessed: number
  farmsFailed: number
  anomaliesDetected: number
  alertsCreated: number
  tasksCreated: number
  errors: CycleError[]
}

interface ExecutionMetrics {
  lastRunAt: Date
  averageDurationMs: number
  successRate: number
  totalCycles: number
  totalAnomalies: number
}
```

### 2. Data Collector

Gathers farm data from the database for analysis.

```typescript
interface DataCollector {
  collectFarmData(
    farmId: string,
    timeWindow: TimeWindow,
  ): Promise<FarmDataSnapshot>
}

interface TimeWindow {
  start: Date
  end: Date
}

interface FarmDataSnapshot {
  farmId: string
  collectedAt: Date
  batches: BatchSnapshot[]
  recentEvents: FarmEvent[]
}

interface BatchSnapshot {
  batchId: string
  batchName: string
  species: string
  livestockType: string
  ageInDays: number
  currentQuantity: number
  initialQuantity: number

  // Mortality data
  mortalityRecords: MortalityRecord[]
  totalMortality: number
  mortalityRate: number
  dailyMortalityTrend: DailyMetric[]

  // Feed data
  feedRecords: FeedRecord[]
  totalFeedKg: number
  dailyFeedTrend: DailyMetric[]
  fcr: number | null // Feed Conversion Ratio

  // Weight data
  weightSamples: WeightSample[]
  currentAverageWeight: number | null
  expectedWeight: number | null // From growth standards
  growthDeviation: number | null // Percentage from expected

  // Water quality (fish only)
  waterQualityRecords: WaterQualityRecord[] | null
  latestWaterQuality: WaterQualitySnapshot | null
}

interface DailyMetric {
  date: Date
  value: number
}

interface FarmEvent {
  type:
    | 'feed_change'
    | 'vaccination'
    | 'treatment'
    | 'water_quality_change'
    | 'weather'
    | 'supplier_change'
  date: Date
  description: string
  batchId: string | null
  metadata: Record<string, any>
}
```

### 3. Anomaly Detector

Identifies deviations from expected patterns.

```typescript
interface AnomalyDetector {
  detectAnomalies(
    snapshot: BatchSnapshot,
    thresholds: AnomalyThresholds,
    history: BatchHistory,
  ): Promise<DetectedAnomaly[]>
}

interface AnomalyThresholds {
  // Mortality thresholds (percentage points above baseline)
  mortalityDailySpike: number // Default: 0.5%
  mortalityTrendIncrease: number // Default: 0.3% per day for 3+ days

  // Feed thresholds (percentage deviation from expected)
  feedConsumptionHigh: number // Default: 20%
  feedConsumptionLow: number // Default: 20%

  // Growth thresholds (percentage deviation from standard)
  growthDeviationHigh: number // Default: 15%
  growthDeviationLow: number // Default: 15%

  // Water quality thresholds
  phDeviation: number // Default: 0.5 units
  temperatureDeviation: number // Default: 2°C
  dissolvedOxygenMin: number // Default: 5 mg/L
  ammoniaMax: number // Default: 0.5 mg/L
}

interface DetectedAnomaly {
  id: string
  batchId: string
  type: AnomalyType
  severity: SeverityLevel
  confidence: number // 0-1

  // Detection details
  metric: string
  currentValue: number
  expectedValue: number
  deviation: number
  deviationPercent: number

  // Trend information
  trendDirection: 'increasing' | 'decreasing' | 'stable'
  trendDuration: number // days

  // Timestamps
  detectedAt: Date
  firstObservedAt: Date
}

type AnomalyType =
  | 'mortality_spike'
  | 'mortality_trend'
  | 'feed_consumption_high'
  | 'feed_consumption_low'
  | 'growth_deviation_high'
  | 'growth_deviation_low'
  | 'water_ph_deviation'
  | 'water_temperature_deviation'
  | 'water_oxygen_low'
  | 'water_ammonia_high'

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'
```

### 4. Causal Analyzer

Correlates anomalies with potential causes using Gemini 3.

```typescript
interface CausalAnalyzer {
  analyzeAnomalies(
    anomalies: DetectedAnomaly[],
    snapshot: FarmDataSnapshot,
    thoughtHistory: ThoughtSignature[],
  ): Promise<CausalAnalysis>
}

interface CausalAnalysis {
  anomalyId: string
  probableCauses: ProbableCause[]
  hypotheses: Hypothesis[]
  recommendations: Recommendation[]
  reasoning: string // Human-readable explanation
  thoughtSignature: ThoughtSignature
}

interface ProbableCause {
  cause: string
  confidence: number // 0-1
  correlatedEvent: FarmEvent | null
  evidence: string[]
  timelag: number // days between event and anomaly
}

interface Hypothesis {
  id: string
  description: string
  confidence: number
  status: 'investigating' | 'confirmed' | 'refuted'
  evidence: string[]
  nextSteps: string[]
}

interface Recommendation {
  action: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  rationale: string
  autonomous: boolean // Can be executed without human approval
}

interface ThoughtSignature {
  id: string
  createdAt: Date
  farmId: string

  // Compressed state
  activeAnomalies: string[] // Anomaly IDs being tracked
  hypotheses: Hypothesis[]
  pendingFollowUps: FollowUp[]
  learnedPatterns: LearnedPattern[]

  // Context summary
  contextSummary: string // Natural language summary for Gemini
  keyObservations: string[]
}

interface FollowUp {
  id: string
  anomalyId: string
  action: string
  scheduledFor: Date
  completed: boolean
}

interface LearnedPattern {
  pattern: string
  confidence: number
  occurrences: number
  lastSeen: Date
}
```

### 5. Action Executor

Executes autonomous actions based on analysis results.

```typescript
interface ActionExecutor {
  executeActions(
    analysis: CausalAnalysis,
    farmId: string,
    userId: string,
  ): Promise<ExecutedAction[]>
}

interface ExecutedAction {
  id: string
  type: ActionType
  status: 'success' | 'failed' | 'pending_approval'
  details: Record<string, any>
  createdAt: Date
}

type ActionType =
  | 'create_alert'
  | 'create_task'
  | 'log_observation'
  | 'update_threshold'
  | 'escalate_alert'

// Alert creation
interface AlertInput {
  farmId: string
  userId: string
  batchId: string
  type: string
  title: string
  message: string
  severity: SeverityLevel
  anomalyId: string
  recommendations: string[]
  actionUrl: string | null
}

// Task creation
interface TaskInput {
  farmId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  batchId: string | null
  dueDate: Date | null
  frequency: 'daily' | 'weekly' | 'monthly' | null
}
```

### 6. Sentinel State Manager

Manages persistent state in Neon PostgreSQL (no Durable Objects - stateless workers).

```typescript
interface SentinelStateManager {
  // State operations
  getState(farmId: string): Promise<SentinelState>
  setState(farmId: string, state: SentinelState): Promise<void>

  // Threshold management
  getThresholds(farmId: string): Promise<AnomalyThresholds>
  updateThreshold(farmId: string, key: string, value: number): Promise<void>

  // Feedback processing
  recordFalsePositive(
    farmId: string,
    alertId: string,
    anomalyType: AnomalyType,
  ): Promise<void>

  // Cleanup
  archiveOldState(farmId: string, olderThan: Date): Promise<void>
  resetState(farmId: string): Promise<void>
}

interface SentinelState {
  farmId: string
  version: number
  lastUpdatedAt: Date

  // Monitoring state
  lastCycleAt: Date | null
  lastCycleResult: 'success' | 'partial' | 'failed' | null
  consecutiveFailures: number

  // Active tracking (thought history moved to semantic memory)
  activeAnomalies: ActiveAnomaly[]

  // Learned thresholds
  thresholds: AnomalyThresholds
  thresholdAdjustments: ThresholdAdjustment[]

  // Feedback tracking
  falsePositives: FalsePositiveRecord[]
  confirmedDetections: ConfirmedDetection[]

  // Pending actions
  pendingActions: PendingAction[]
}

interface ActiveAnomaly {
  anomalyId: string
  batchId: string
  type: AnomalyType
  firstDetectedAt: Date
  lastSeenAt: Date
  severity: SeverityLevel
  alertSent: boolean
  resolved: boolean
  resolvedAt: Date | null
}

interface ThresholdAdjustment {
  key: string
  originalValue: number
  adjustedValue: number
  reason: string
  adjustedAt: Date
}

interface FalsePositiveRecord {
  alertId: string
  anomalyType: AnomalyType
  reportedAt: Date
  thresholdAdjusted: boolean
}

interface ConfirmedDetection {
  anomalyId: string
  anomalyType: AnomalyType
  confirmedAt: Date
  outcome: string
}

interface PendingAction {
  id: string
  type: ActionType
  data: Record<string, any>
  scheduledFor: Date
  retryCount: number
}
```

### 6.1 Semantic Memory Manager

Manages thought embeddings using pgvector for context continuity across monitoring cycles.

```typescript
interface SemanticMemoryManager {
  // Save thought with embedding for future recall
  saveThought(thought: ThoughtWithEmbedding): Promise<void>

  // Recall similar historical context based on current data
  recallContext(
    farmId: string,
    currentData: FarmDataSnapshot,
    limit?: number,
  ): Promise<ThoughtSignature[]>

  // Search for similar thoughts by embedding
  searchSimilarThoughts(
    farmId: string,
    embedding: number[],
    threshold: number,
    limit?: number,
  ): Promise<ThoughtSignature[]>

  // Get recent thought history (non-semantic, time-based)
  getRecentThoughts(farmId: string, days: number): Promise<ThoughtSignature[]>

  // Archive old thoughts
  archiveOldThoughts(farmId: string, olderThan: Date): Promise<void>
}

interface ThoughtWithEmbedding {
  farmId: string
  summary: string
  embedding: number[] // 768-dimensional vector from Gemini embeddings
  activeAnomalies: string[]
  hypotheses: Hypothesis[]
  pendingFollowUps: FollowUp[]
  outcome: Record<string, any> | null
}

interface ThoughtSignature {
  id: string
  createdAt: Date
  farmId: string

  // Compressed state
  activeAnomalies: string[] // Anomaly IDs being tracked
  hypotheses: Hypothesis[]
  pendingFollowUps: FollowUp[]
  learnedPatterns: LearnedPattern[]

  // Context summary
  contextSummary: string // Natural language summary for Gemini
  keyObservations: string[]

  // Similarity score (populated during recall)
  similarityScore?: number
}

interface FollowUp {
  id: string
  anomalyId: string
  action: string
  scheduledFor: Date
  completed: boolean
}

interface LearnedPattern {
  pattern: string
  confidence: number
  occurrences: number
  lastSeen: Date
}
```

### 7. Gemini Integration

Interface for Gemini 3 API interactions (standard API only - no Live API).

```typescript
interface GeminiClient {
  analyze(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse>
  embed(text: string): Promise<number[]> // Generate embeddings for semantic memory
}

interface GeminiAnalysisRequest {
  systemPrompt: string
  context: string // Farm data and thought history
  query: string
  // Gemini 3 thinking configuration
  thinkingConfig: {
    // Gemini 3 Pro/Flash: Use thinkingLevel
    thinkingLevel: 'minimal' | 'low' | 'medium' | 'high'
    includeThoughts?: boolean // Whether to return thought summaries
  }
  tools: GeminiTool[]
  maxTokens: number
}

// Thinking configuration guidelines (Gemini 3 only):
// - 'minimal': Quick checks, simple validations
// - 'low': Basic analysis, fast response (Vision Assistant)
// - 'medium': Balanced reasoning (Vet Assist Mode)
// - 'high': Deep causal analysis (Sentinel default, Optimizer)
//
// Note: Gemini 2.5's thinkingBudget (0-24576 tokens) is NOT used.
// All features use Gemini 3 models with thinkingLevel configuration.

interface GeminiAnalysisResponse {
  content: string
  toolCalls: ToolCall[]
  thoughtSummary: string // Summary of reasoning for debugging/logging
  tokensUsed: number
  thinkingTime: number
}

interface GeminiTool {
  name: string
  description: string
  parameters: Record<string, any>
}

interface ToolCall {
  name: string
  arguments: Record<string, any>
}

// Available tools for Sentinel
const SENTINEL_TOOLS: GeminiTool[] = [
  {
    name: 'create_alert',
    description: 'Create an alert notification for the farmer',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        batchId: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'message', 'severity', 'batchId'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a follow-up task for the farmer',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        batchId: { type: 'string' },
        dueInDays: { type: 'number' },
      },
      required: ['title', 'priority'],
    },
  },
  {
    name: 'query_historical_data',
    description: 'Query historical farm data for pattern analysis',
    parameters: {
      type: 'object',
      properties: {
        batchId: { type: 'string' },
        metric: { type: 'string' },
        daysBack: { type: 'number' },
      },
      required: ['batchId', 'metric', 'daysBack'],
    },
  },
  {
    name: 'update_hypothesis',
    description: 'Update the status of a hypothesis based on new evidence',
    parameters: {
      type: 'object',
      properties: {
        hypothesisId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['investigating', 'confirmed', 'refuted'],
        },
        evidence: { type: 'string' },
      },
      required: ['hypothesisId', 'status'],
    },
  },
]
```

## Data Models

### Sentinel State Table

New table to persist Sentinel state:

```sql
CREATE TABLE sentinel_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,

  -- Monitoring state
  last_cycle_at TIMESTAMPTZ,
  last_cycle_result VARCHAR(20),
  consecutive_failures INTEGER DEFAULT 0,

  -- Serialized state (JSONB for flexibility)
  thought_signatures JSONB DEFAULT '[]',
  active_anomalies JSONB DEFAULT '[]',
  thresholds JSONB NOT NULL,
  threshold_adjustments JSONB DEFAULT '[]',
  false_positives JSONB DEFAULT '[]',
  confirmed_detections JSONB DEFAULT '[]',
  pending_actions JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(farm_id)
);

CREATE INDEX idx_sentinel_state_farm ON sentinel_state(farm_id);
CREATE INDEX idx_sentinel_state_last_cycle ON sentinel_state(last_cycle_at);
```

### Sentinel Thought Embeddings Table (pgvector)

New table for semantic memory using pgvector:

```sql
-- Enable pgvector extension (run once per database)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE sentinel_thought_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,

  -- Thought content
  summary TEXT NOT NULL,
  context_summary TEXT,
  key_observations JSONB DEFAULT '[]',

  -- Tracking state at time of thought
  active_anomalies JSONB DEFAULT '[]',
  hypotheses JSONB DEFAULT '[]',
  pending_follow_ups JSONB DEFAULT '[]',
  learned_patterns JSONB DEFAULT '[]',
  outcome JSONB,

  -- Vector embedding for semantic search (768 dimensions for Gemini embeddings)
  embedding vector(768) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Index for farm-based queries
CREATE INDEX idx_thought_embeddings_farm ON sentinel_thought_embeddings(farm_id);

-- Index for time-based queries
CREATE INDEX idx_thought_embeddings_created ON sentinel_thought_embeddings(created_at);

-- IVFFlat index for vector similarity search (cosine distance)
-- Note: Create after inserting initial data for better index quality
CREATE INDEX idx_thought_embeddings_vector ON sentinel_thought_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Partial index for non-archived thoughts
CREATE INDEX idx_thought_embeddings_active ON sentinel_thought_embeddings(farm_id, created_at)
  WHERE archived_at IS NULL;
```

### Sentinel Alerts Table

Track Sentinel-generated alerts for deduplication and feedback:

```sql
CREATE TABLE sentinel_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),
  batch_id UUID REFERENCES batches(id),
  notification_id UUID REFERENCES notifications(id),

  anomaly_type VARCHAR(50) NOT NULL,
  anomaly_id VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,

  -- Causal analysis
  probable_causes JSONB,
  recommendations JSONB,
  reasoning TEXT,

  -- Feedback
  is_false_positive BOOLEAN DEFAULT FALSE,
  feedback_at TIMESTAMPTZ,
  feedback_notes TEXT,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_alerts_farm ON sentinel_alerts(farm_id);
CREATE INDEX idx_sentinel_alerts_batch ON sentinel_alerts(batch_id);
CREATE INDEX idx_sentinel_alerts_anomaly ON sentinel_alerts(anomaly_id);
CREATE INDEX idx_sentinel_alerts_created ON sentinel_alerts(created_at);
```

### Sentinel Execution Log Table

Track monitoring cycle executions:

```sql
CREATE TABLE sentinel_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL,
  farm_id UUID REFERENCES farms(id),

  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  status VARCHAR(20) NOT NULL, -- 'success', 'partial', 'failed'

  -- Metrics
  batches_analyzed INTEGER DEFAULT 0,
  anomalies_detected INTEGER DEFAULT 0,
  alerts_created INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Token usage
  tokens_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_exec_cycle ON sentinel_execution_log(cycle_id);
CREATE INDEX idx_sentinel_exec_farm ON sentinel_execution_log(farm_id);
CREATE INDEX idx_sentinel_exec_started ON sentinel_execution_log(started_at);
```

### TypeScript Database Types

```typescript
interface SentinelStateTable {
  id: Generated<string>
  farmId: string
  version: Generated<number>

  lastCycleAt: Date | null
  lastCycleResult: 'success' | 'partial' | 'failed' | null
  consecutiveFailures: Generated<number>

  // Note: thoughtSignatures moved to sentinel_thought_embeddings table
  activeAnomalies: ActiveAnomaly[]
  thresholds: AnomalyThresholds
  thresholdAdjustments: ThresholdAdjustment[]
  falsePositives: FalsePositiveRecord[]
  confirmedDetections: ConfirmedDetection[]
  pendingActions: PendingAction[]

  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

interface SentinelThoughtEmbeddingTable {
  id: Generated<string>
  farmId: string

  // Thought content
  summary: string
  contextSummary: string | null
  keyObservations: string[]

  // Tracking state
  activeAnomalies: string[]
  hypotheses: Hypothesis[]
  pendingFollowUps: FollowUp[]
  learnedPatterns: LearnedPattern[]
  outcome: Record<string, any> | null

  // Vector embedding (768 dimensions)
  embedding: number[]

  createdAt: Generated<Date>
  archivedAt: Date | null
}

interface SentinelAlertTable {
  id: Generated<string>
  farmId: string
  batchId: string | null
  notificationId: string | null

  anomalyType: AnomalyType
  anomalyId: string
  severity: SeverityLevel

  probableCauses: ProbableCause[] | null
  recommendations: string[] | null
  reasoning: string | null

  isFalsePositive: Generated<boolean>
  feedbackAt: Date | null
  feedbackNotes: string | null

  resolved: Generated<boolean>
  resolvedAt: Date | null
  resolutionNotes: string | null

  createdAt: Generated<Date>
}

interface SentinelExecutionLogTable {
  id: Generated<string>
  cycleId: string
  farmId: string | null

  startedAt: Date
  completedAt: Date | null
  durationMs: number | null

  status: 'success' | 'partial' | 'failed'

  batchesAnalyzed: Generated<number>
  anomaliesDetected: Generated<number>
  alertsCreated: Generated<number>
  tasksCreated: Generated<number>

  errorMessage: string | null
  errorStack: string | null

  tokensUsed: Generated<number>

  createdAt: Generated<Date>
}
```

## Technical Implementation Example

This example shows the complete monitoring cycle using pgvector semantic memory:

```typescript
// Stateless Worker with Vector Memory (Neon pgvector)
export class FarmSentinelAgent {
  private gemini: GeminiClient
  private stateManager: SentinelStateManager
  private memoryManager: SemanticMemoryManager
  private dataCollector: DataCollector
  private anomalyDetector: AnomalyDetector
  private actionExecutor: ActionExecutor

  async runMonitoringCycle(farmId: string): Promise<CycleResult> {
    const cycleId = crypto.randomUUID()
    const startedAt = new Date()

    try {
      // 1. Collect recent data (last 24h)
      const data = await this.dataCollector.collectFarmData(farmId, {
        start: subDays(new Date(), 1),
        end: new Date(),
      })

      // 2. Recall similar historical context (Semantic Memory via pgvector)
      const historicalContext = await this.memoryManager.recallContext(
        farmId,
        data,
        5, // Top 5 most similar past thoughts
      )

      // 3. Load current state (thresholds, active anomalies)
      const state = await this.stateManager.getState(farmId)

      // 4. Detect anomalies
      const anomalies = await this.anomalyDetector.detectAnomalies(
        data,
        state.thresholds,
      )

      // 5. Reason with Gemini 3 (using thinking level for deep analysis)
      const analysis = await this.gemini.analyze({
        systemPrompt: SENTINEL_SYSTEM_PROMPT,
        context: this.buildContext(data, historicalContext, state),
        query: this.buildAnalysisQuery(anomalies),
        thinkingConfig: {
          thinkingLevel: 'high', // Deep reasoning for causal analysis
          includeThoughts: true, // Get thought summaries for debugging
        },
        tools: SENTINEL_TOOLS,
        maxTokens: 4096,
      })

      // 6. Execute actions (alerts, tasks)
      const actions = await this.actionExecutor.executeActions(
        analysis,
        farmId,
        state.userId,
      )

      // 7. Generate embedding for this thought
      const embedding = await this.gemini.embed(analysis.thoughtSummary)

      // 8. Save thought embedding for future semantic recall
      await this.memoryManager.saveThought({
        farmId,
        summary: analysis.thoughtSummary,
        embedding,
        activeAnomalies: anomalies.map((a) => a.id),
        hypotheses: analysis.hypotheses,
        pendingFollowUps: analysis.followUps,
        outcome: { actions: actions.map((a) => a.type) },
      })

      // 9. Update state
      await this.stateManager.setState(farmId, {
        ...state,
        lastCycleAt: new Date(),
        lastCycleResult: 'success',
        consecutiveFailures: 0,
        activeAnomalies: this.updateActiveAnomalies(
          state.activeAnomalies,
          anomalies,
        ),
      })

      return {
        cycleId,
        startedAt,
        completedAt: new Date(),
        farmsProcessed: 1,
        farmsFailed: 0,
        anomaliesDetected: anomalies.length,
        alertsCreated: actions.filter((a) => a.type === 'create_alert').length,
        tasksCreated: actions.filter((a) => a.type === 'create_task').length,
        errors: [],
      }
    } catch (error) {
      // Handle errors gracefully
      await this.stateManager.setState(farmId, {
        ...(await this.stateManager.getState(farmId)),
        lastCycleAt: new Date(),
        lastCycleResult: 'failed',
        consecutiveFailures:
          (await this.stateManager.getState(farmId)).consecutiveFailures + 1,
      })
      throw error
    }
  }

  private buildContext(
    data: FarmDataSnapshot,
    history: ThoughtSignature[],
    state: SentinelState,
  ): string {
    return `
## Current Farm Data
${JSON.stringify(data, null, 2)}

## Historical Context (Similar Past Situations)
${history.map((t) => `- [${t.createdAt}] ${t.contextSummary} (similarity: ${t.similarityScore?.toFixed(2)})`).join('\n')}

## Active Anomalies Being Tracked
${state.activeAnomalies.map((a) => `- ${a.type}: ${a.severity} (since ${a.firstDetectedAt})`).join('\n')}

## Current Thresholds
${JSON.stringify(state.thresholds, null, 2)}
    `.trim()
  }
}
```

### Semantic Memory Query Example

```typescript
// Example: Recall similar historical context using pgvector
async function recallContext(
  farmId: string,
  currentData: FarmDataSnapshot,
  limit: number = 5,
): Promise<ThoughtSignature[]> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  // Generate embedding for current situation
  const currentSummary = summarizeFarmData(currentData)
  const currentEmbedding = await gemini.embed(currentSummary)

  // Query pgvector for similar past thoughts
  // Uses cosine similarity (1 - cosine_distance)
  const results = await db
    .selectFrom('sentinel_thought_embeddings')
    .select([
      'id',
      'summary',
      'context_summary as contextSummary',
      'key_observations as keyObservations',
      'active_anomalies as activeAnomalies',
      'hypotheses',
      'pending_follow_ups as pendingFollowUps',
      'learned_patterns as learnedPatterns',
      'created_at as createdAt',
      sql<number>`1 - (embedding <=> ${currentEmbedding}::vector)`.as(
        'similarityScore',
      ),
    ])
    .where('farm_id', '=', farmId)
    .where('archived_at', 'is', null)
    .orderBy(sql`embedding <=> ${currentEmbedding}::vector`) // Cosine distance
    .limit(limit)
    .execute()

  return results.map((r) => ({
    ...r,
    keyObservations: r.keyObservations || [],
    activeAnomalies: r.activeAnomalies || [],
    hypotheses: r.hypotheses || [],
    pendingFollowUps: r.pendingFollowUps || [],
    learnedPatterns: r.learnedPatterns || [],
  }))
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Data Collection Completeness

_For any_ farm with N active batches, the data collector SHALL return a FarmDataSnapshot containing exactly N BatchSnapshots, each with mortality records, feed records, and weight samples from the configured time window.

**Validates: Requirements 1.1, 1.2, 1.3, 1.6**

### Property 2: Aquaculture Water Quality Collection

_For any_ batch with livestockType 'fish', the BatchSnapshot SHALL include water quality records. _For any_ batch with livestockType other than 'fish', water quality records SHALL be null.

**Validates: Requirements 1.4**

### Property 3: Empty Farm Skipping

_For any_ farm with zero active batches, the monitoring cycle SHALL skip that farm and not produce any anomalies, alerts, or state changes for it.

**Validates: Requirements 1.8**

### Property 4: Anomaly Detection Threshold Compliance

_For any_ metric value that deviates from baseline by more than the configured threshold, the anomaly detector SHALL return a DetectedAnomaly. _For any_ metric value within the threshold, no anomaly SHALL be detected.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Anomaly Severity Assignment

_For any_ detected anomaly, the severity level SHALL be determined by deviation magnitude: critical (>3x threshold), high (2-3x threshold), medium (1.5-2x threshold), low (1-1.5x threshold).

**Validates: Requirements 2.5**

### Property 6: Confidence Score Validity

_For any_ detected anomaly, the confidence score SHALL be a number between 0 and 1 inclusive.

**Validates: Requirements 2.6**

### Property 7: Spike vs Trend Classification

_For any_ anomaly lasting 1 day, the type SHALL be classified as a spike. _For any_ anomaly lasting 3+ consecutive days, the type SHALL be classified as a trend.

**Validates: Requirements 2.7**

### Property 8: Event Correlation Window

_For any_ detected anomaly, the causal analyzer SHALL search for correlated events within the configured correlation window (default 7 days). Events outside this window SHALL NOT be included as probable causes.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 9: Probable Causes Ranking

_For any_ causal analysis result, the probable causes SHALL be sorted in descending order by confidence score, and each cause SHALL have a confidence score between 0 and 1.

**Validates: Requirements 3.7**

### Property 10: Thought Embedding Generation

_For any_ completed monitoring cycle, a thought embedding SHALL be generated containing: summary text, 768-dimensional embedding vector, activeAnomalies array, hypotheses array, and pendingFollowUps array.

**Validates: Requirements 4.1, 4.2**

### Property 11: Semantic Context Recall

_For any_ monitoring cycle after the first, the semantic memory SHALL be queried using vector similarity to retrieve relevant historical thoughts for context.

**Validates: Requirements 4.3, 4.9**

### Property 12: Thought Embedding Retention

_For any_ farm, the thought embeddings SHALL retain at least 14 days of entries in active state. Entries older than 14 days MAY be archived (archived_at set).

**Validates: Requirements 4.6**

### Property 13: Anomaly Resolution Recording

_For any_ anomaly that was previously active but is no longer detected, the state SHALL be updated to mark it as resolved with a resolution timestamp.

**Validates: Requirements 4.7**

### Property 14: High Severity Alert Creation

_For any_ anomaly with severity 'high' or 'critical', an alert SHALL be created in the same monitoring cycle.

**Validates: Requirements 5.1**

### Property 15: Medium Severity Escalation

_For any_ anomaly with severity 'medium' that persists for 2 or more consecutive days, an alert SHALL be created.

**Validates: Requirements 5.2**

### Property 16: Alert Content Completeness

_For any_ created alert, it SHALL contain: batchId, anomalyType, severity, at least one probable cause, and at least one recommendation.

**Validates: Requirements 5.3, 5.7**

### Property 17: Alert Deduplication

_For any_ ongoing anomaly, at most one alert SHALL be created within a 24-hour period. Subsequent detections of the same anomaly SHALL update the existing alert rather than create a new one.

**Validates: Requirements 5.5**

### Property 18: Alert Escalation

_For any_ anomaly whose severity increases between monitoring cycles, the associated alert SHALL be updated with the new severity level.

**Validates: Requirements 5.6**

### Property 19: Related Anomaly Consolidation

_For any_ set of anomalies detected in the same batch within the same monitoring cycle, they SHALL be consolidated into a single alert with multiple anomaly references.

**Validates: Requirements 5.8**

### Property 20: Task Creation from Recommendations

_For any_ recommendation marked as autonomous=true, a task SHALL be created in the tasks table with the recommendation as the description.

**Validates: Requirements 6.1**

### Property 21: Task Priority Mapping

_For any_ task created from an anomaly, the priority SHALL map as: critical→urgent, high→high, medium→medium, low→low.

**Validates: Requirements 6.2**

### Property 22: Task Batch Linking

_For any_ task created from a batch-specific anomaly, the task SHALL have the batchId field set to the anomaly's batch.

**Validates: Requirements 6.3**

### Property 23: Audit Logging Completeness

_For any_ autonomous action (alert creation, task creation, threshold adjustment), an entry SHALL be created in audit_logs with the action type and details.

**Validates: Requirements 6.5**

### Property 24: Restricted Action Types

_For any_ action that would directly modify mortality_records, sales, or batches tables, the action SHALL be marked as requiring human approval and SHALL NOT be executed autonomously.

**Validates: Requirements 6.6, 6.7**

### Property 25: False Positive Threshold Adjustment

_For any_ alert marked as false positive, the relevant threshold SHALL be increased by a configured adjustment factor (default: 10%).

**Validates: Requirements 7.2**

### Property 26: False Positive Rate Tracking

_For any_ anomaly type, the false positive rate SHALL be calculated as (false positives / total alerts) and stored in the sentinel state.

**Validates: Requirements 7.3**

### Property 27: Hypothesis Confidence Update

_For any_ hypothesis that is confirmed by subsequent data, the confidence for similar future detections SHALL increase. _For any_ hypothesis that is refuted, the confidence SHALL decrease.

**Validates: Requirements 7.5, 7.6**

### Property 28: Per-Farm Threshold Persistence

_For any_ farm, threshold adjustments SHALL be stored in that farm's sentinel state and SHALL persist across monitoring cycles.

**Validates: Requirements 7.7**

### Property 29: State Persistence Round-Trip

_For any_ sentinel state saved to the database, loading that state SHALL return an equivalent object with all fields preserved.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 30: State Corruption Recovery

_For any_ corrupted or invalid state data, loading SHALL return the default state configuration rather than throwing an error.

**Validates: Requirements 8.4**

### Property 31: Per-Farm State Isolation

_For any_ two different farms, their sentinel states SHALL be completely independent. Changes to one farm's state SHALL NOT affect another farm's state.

**Validates: Requirements 8.5**

### Property 32: State Archival

_For any_ thought signature older than 30 days, it SHALL be moved to an archive and removed from the active state.

**Validates: Requirements 8.6**

### Property 33: Execution Failure Isolation

_For any_ farm whose monitoring fails, other farms in the same cycle SHALL continue to be processed.

**Validates: Requirements 9.7, 13.3**

### Property 34: API Retry Behavior

_For any_ failed Gemini API call, the system SHALL retry up to 3 times with exponential backoff before marking the operation as failed.

**Validates: Requirements 13.2, 13.4**

### Property 35: Consecutive Failure Alerting

_For any_ farm with 3 or more consecutive monitoring failures, an administrator alert SHALL be created.

**Validates: Requirements 13.7**

### Property 36: Species-Specific Configuration

_For any_ batch, the anomaly thresholds and growth standards SHALL be determined by the batch's species. Different species SHALL have different default thresholds.

**Validates: Requirements 11.1, 11.2, 11.4**

### Property 37: Multi-Species Farm Handling

_For any_ farm with batches of multiple species, each batch SHALL be analyzed with its species-specific configuration independently.

**Validates: Requirements 11.7, 11.8**

### Property 38: Notification Preference Compliance

_For any_ user with specific notification preferences disabled, alerts of that type SHALL NOT be created for that user's farms.

**Validates: Requirements 12.5**

### Property 39: Data Access Authorization

_For any_ monitoring cycle, the sentinel SHALL only access data for farms that are authorized for monitoring. Unauthorized farm data SHALL NOT be accessible.

**Validates: Requirements 14.1, 14.2**

### Property 40: Opt-Out Compliance

_For any_ farm where the owner has opted out of AI monitoring, the sentinel SHALL skip that farm entirely.

**Validates: Requirements 14.7**

## Error Handling

### API Errors

| Error Type             | Handling Strategy                           | Recovery Action                                               |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Gemini API timeout     | Retry with exponential backoff (1s, 2s, 4s) | After 3 retries, skip farm and log error                      |
| Gemini API rate limit  | Queue request, wait for rate limit reset    | Continue with other farms, retry later                        |
| Gemini API unavailable | Log error, mark cycle as partial            | Continue with basic anomaly detection without causal analysis |
| Invalid API response   | Log response, retry once                    | Use cached analysis if available                              |

### Database Errors

| Error Type         | Handling Strategy            | Recovery Action                       |
| ------------------ | ---------------------------- | ------------------------------------- |
| Connection timeout | Retry with backoff           | After 3 retries, abort cycle          |
| State corruption   | Reset to default state       | Log corruption details for debugging  |
| Write failure      | Retry once                   | Queue for next cycle if still failing |
| Read failure       | Use cached data if available | Skip farm if no cache                 |

### Processing Errors

| Error Type                  | Handling Strategy          | Recovery Action                     |
| --------------------------- | -------------------------- | ----------------------------------- |
| Invalid batch data          | Skip batch, log warning    | Continue with other batches         |
| Threshold calculation error | Use default thresholds     | Log error for investigation         |
| Action execution failure    | Log error, mark as pending | Retry in next cycle                 |
| State save failure          | Retry once                 | Keep state in memory for next cycle |

### Error Logging Format

```typescript
interface SentinelError {
  cycleId: string
  farmId: string | null
  batchId: string | null
  errorType: string
  errorMessage: string
  errorStack: string | null
  context: Record<string, any>
  timestamp: Date
  retryCount: number
  resolved: boolean
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, integration points, and error conditions
- **Property tests**: Verify universal properties across all valid inputs using fast-check

### Property-Based Testing Configuration

- **Library**: fast-check for TypeScript
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: gemini-farm-sentinel, Property {number}: {property_text}`

### Test Categories

#### 1. Data Collection Tests (Property-Based)

```typescript
// Property 1: Data Collection Completeness
describe('DataCollector', () => {
  it('should collect data for all active batches', () => {
    fc.assert(
      fc.property(arbitraryFarmWithBatches(), async (farm) => {
        const snapshot = await dataCollector.collectFarmData(farm.id, {
          start: subDays(new Date(), 1),
          end: new Date(),
        })

        const activeBatches = farm.batches.filter((b) => b.status === 'active')
        expect(snapshot.batches.length).toBe(activeBatches.length)

        for (const batch of snapshot.batches) {
          expect(batch.mortalityRecords).toBeDefined()
          expect(batch.feedRecords).toBeDefined()
          expect(batch.weightSamples).toBeDefined()
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Property 2: Aquaculture Water Quality
describe('DataCollector - Water Quality', () => {
  it('should include water quality only for fish batches', () => {
    fc.assert(
      fc.property(arbitraryBatchSnapshot(), (snapshot) => {
        if (snapshot.livestockType === 'fish') {
          expect(snapshot.waterQualityRecords).not.toBeNull()
        } else {
          expect(snapshot.waterQualityRecords).toBeNull()
        }
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 2. Anomaly Detection Tests (Property-Based)

```typescript
// Property 4: Anomaly Detection Threshold Compliance
describe('AnomalyDetector', () => {
  it('should detect anomalies when threshold exceeded', () => {
    fc.assert(
      fc.property(
        arbitraryBatchSnapshot(),
        arbitraryThresholds(),
        (snapshot, thresholds) => {
          const anomalies = anomalyDetector.detectAnomalies(
            snapshot,
            thresholds,
          )

          // If mortality rate exceeds threshold, anomaly should be detected
          if (snapshot.mortalityRate > thresholds.mortalityDailySpike) {
            expect(anomalies.some((a) => a.type === 'mortality_spike')).toBe(
              true,
            )
          }

          // If within threshold, no anomaly
          if (snapshot.mortalityRate <= thresholds.mortalityDailySpike * 0.9) {
            expect(anomalies.some((a) => a.type === 'mortality_spike')).toBe(
              false,
            )
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 6: Confidence Score Validity
describe('AnomalyDetector - Confidence', () => {
  it('should assign valid confidence scores', () => {
    fc.assert(
      fc.property(arbitraryDetectedAnomaly(), (anomaly) => {
        expect(anomaly.confidence).toBeGreaterThanOrEqual(0)
        expect(anomaly.confidence).toBeLessThanOrEqual(1)
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 3. State Management Tests (Property-Based)

```typescript
// Property 29: State Persistence Round-Trip
describe('SentinelStateManager', () => {
  it('should preserve state through save/load cycle', () => {
    fc.assert(
      fc.property(arbitrarySentinelState(), async (state) => {
        await stateManager.setState(state.farmId, state)
        const loaded = await stateManager.getState(state.farmId)

        expect(loaded.farmId).toBe(state.farmId)
        expect(loaded.thresholds).toEqual(state.thresholds)
        expect(loaded.activeAnomalies.length).toBe(state.activeAnomalies.length)
        expect(loaded.thoughtSignatures.length).toBe(
          state.thoughtSignatures.length,
        )
      }),
      { numRuns: 100 },
    )
  })
})

// Property 31: Per-Farm State Isolation
describe('SentinelStateManager - Isolation', () => {
  it('should maintain independent state per farm', () => {
    fc.assert(
      fc.property(
        arbitrarySentinelState(),
        arbitrarySentinelState(),
        async (state1, state2) => {
          // Ensure different farm IDs
          state2.farmId = state1.farmId + '-other'

          await stateManager.setState(state1.farmId, state1)
          await stateManager.setState(state2.farmId, state2)

          const loaded1 = await stateManager.getState(state1.farmId)
          const loaded2 = await stateManager.getState(state2.farmId)

          expect(loaded1.thresholds).toEqual(state1.thresholds)
          expect(loaded2.thresholds).toEqual(state2.thresholds)
          expect(loaded1.thresholds).not.toEqual(loaded2.thresholds)
        },
      ),
      { numRuns: 100 },
    )
  })
})
```

#### 4. Alert Generation Tests (Property-Based)

```typescript
// Property 14: High Severity Alert Creation
describe('ActionExecutor - Alerts', () => {
  it('should create alerts for high/critical anomalies', () => {
    fc.assert(
      fc.property(arbitraryCausalAnalysis(), async (analysis) => {
        const anomaly = analysis.anomalies[0]
        if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
          const actions = await actionExecutor.executeActions(
            analysis,
            farmId,
            userId,
          )
          expect(actions.some((a) => a.type === 'create_alert')).toBe(true)
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Property 17: Alert Deduplication
describe('ActionExecutor - Deduplication', () => {
  it('should not create duplicate alerts within 24 hours', () => {
    fc.assert(
      fc.property(arbitraryAnomalyId(), async (anomalyId) => {
        // Create first alert
        await actionExecutor.createAlert({ anomalyId, ...alertData })

        // Attempt to create duplicate
        const result = await actionExecutor.createAlert({
          anomalyId,
          ...alertData,
        })

        expect(result.status).toBe('deduplicated')

        // Verify only one alert exists
        const alerts = await getAlertsForAnomaly(anomalyId)
        expect(alerts.length).toBe(1)
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 5. Integration Tests (Unit)

```typescript
describe('Farm Sentinel Integration', () => {
  it('should complete full monitoring cycle', async () => {
    // Setup test farm with known data
    const farm = await createTestFarm()
    const batch = await createTestBatch(farm.id, {
      mortalityRate: 0.08, // Above threshold
    })

    // Run monitoring cycle
    const result = await sentinel.runManualCycle(farm.id)

    expect(result.anomaliesDetected).toBeGreaterThan(0)
    expect(result.alertsCreated).toBeGreaterThan(0)

    // Verify state was saved
    const state = await stateManager.getState(farm.id)
    expect(state.activeAnomalies.length).toBeGreaterThan(0)
  })

  it('should maintain context across cycles', async () => {
    const farm = await createTestFarm()

    // First cycle - detect anomaly
    await sentinel.runManualCycle(farm.id)
    const state1 = await stateManager.getState(farm.id)

    // Second cycle - should reference previous
    await sentinel.runManualCycle(farm.id)
    const state2 = await stateManager.getState(farm.id)

    expect(state2.thoughtSignatures.length).toBeGreaterThan(
      state1.thoughtSignatures.length,
    )
  })
})
```

### Test Data Generators (Arbitraries)

```typescript
const arbitraryFarmId = () => fc.uuid()

const arbitraryBatchSnapshot = () =>
  fc.record({
    batchId: fc.uuid(),
    batchName: fc.string({ minLength: 1, maxLength: 50 }),
    species: fc.constantFrom(
      'broiler',
      'layer',
      'catfish',
      'tilapia',
      'angus',
      'boer',
    ),
    livestockType: fc.constantFrom(
      'poultry',
      'fish',
      'cattle',
      'goats',
      'sheep',
    ),
    ageInDays: fc.integer({ min: 1, max: 365 }),
    currentQuantity: fc.integer({ min: 1, max: 10000 }),
    initialQuantity: fc.integer({ min: 1, max: 10000 }),
    mortalityRate: fc.float({ min: 0, max: 0.2 }),
    totalFeedKg: fc.float({ min: 0, max: 10000 }),
    fcr: fc.float({ min: 1, max: 3 }),
    currentAverageWeight: fc.float({ min: 0.1, max: 100 }),
    expectedWeight: fc.float({ min: 0.1, max: 100 }),
  })

const arbitraryThresholds = () =>
  fc.record({
    mortalityDailySpike: fc.float({ min: 0.001, max: 0.05 }),
    mortalityTrendIncrease: fc.float({ min: 0.001, max: 0.02 }),
    feedConsumptionHigh: fc.float({ min: 0.1, max: 0.5 }),
    feedConsumptionLow: fc.float({ min: 0.1, max: 0.5 }),
    growthDeviationHigh: fc.float({ min: 0.1, max: 0.3 }),
    growthDeviationLow: fc.float({ min: 0.1, max: 0.3 }),
  })

const arbitraryDetectedAnomaly = () =>
  fc.record({
    id: fc.uuid(),
    batchId: fc.uuid(),
    type: fc.constantFrom(
      'mortality_spike',
      'mortality_trend',
      'feed_consumption_high',
      'feed_consumption_low',
      'growth_deviation_high',
      'growth_deviation_low',
    ),
    severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
    confidence: fc.float({ min: 0, max: 1 }),
    currentValue: fc.float({ min: 0, max: 100 }),
    expectedValue: fc.float({ min: 0, max: 100 }),
    deviation: fc.float({ min: -50, max: 50 }),
    deviationPercent: fc.float({ min: -100, max: 100 }),
  })

const arbitrarySentinelState = () =>
  fc.record({
    farmId: fc.uuid(),
    version: fc.integer({ min: 1, max: 1000 }),
    lastCycleAt: fc.date(),
    lastCycleResult: fc.constantFrom('success', 'partial', 'failed'),
    consecutiveFailures: fc.integer({ min: 0, max: 10 }),
    thresholds: arbitraryThresholds(),
    activeAnomalies: fc.array(arbitraryDetectedAnomaly(), { maxLength: 10 }),
    thoughtSignatures: fc.array(
      fc.record({
        id: fc.uuid(),
        createdAt: fc.date(),
        contextSummary: fc.string({ maxLength: 500 }),
      }),
      { maxLength: 14 },
    ),
  })
```

### E2E Test Scenarios

1. **Multi-Day Monitoring**: Run sentinel over 3 simulated days, verify context continuity
2. **False Positive Learning**: Mark alert as false positive, verify threshold adjustment
3. **Anomaly Resolution**: Create anomaly, resolve it, verify state update
4. **Multi-Farm Isolation**: Run sentinel on 2 farms, verify independent states
5. **API Failure Recovery**: Simulate API failure, verify retry and graceful degradation
