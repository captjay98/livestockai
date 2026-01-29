# Design Document: Gemini Vision Assistant

## Overview

The Gemini Vision Assistant is a comprehensive AI-powered livestock assessment system operating in two complementary modes:

1. **Live Mode**: Real-time frame-by-frame analysis using Gemini 3 Flash's standard API for continuous assessment, weight estimation, counting, and adaptive guidance through the phone camera.

2. **Vet Assist Mode**: Offline-capable diagnostic tool combining an embedded decision tree expert system for instant triage with optional AI-powered photo analysis for detailed diagnosis.

Built for the "Real-Time Teacher" hackathon track, it demonstrates true multimodal understanding beyond simple object detection, while addressing the critical need for veterinary guidance in rural areas with limited connectivity.

The system integrates with LivestockAI's existing batch management, task system, and notification infrastructure, as well as Farm Sentinel (autonomous monitoring) and Farm Optimizer (strategy generation) for a complete intelligence loop.

### Key Design Principles

1. **Context-Aware Intelligence**: Every analysis incorporates batch data, growth curves, and farm history
2. **Actionable Outputs**: Observations lead to tasks, notifications, and logged records
3. **Adaptive Teaching**: Explains reasoning to help farmers learn
4. **Field-Ready UX**: Voice interface, large touch targets, offline resilience
5. **Privacy-First**: No persistent video storage, secure data handling
6. **Offline-First Diagnostics**: Decision tree works without any network connectivity
7. **Store-and-Forward**: Photos queued for AI analysis when connectivity is restored
8. **Cross-System Integration**: Diagnoses inform Sentinel anomaly detection and Optimizer strategies

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VISION ASSISTANT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT (PWA)                                    │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │ Camera      │  │ Voice       │  │ UI          │  │ Mode        │   │ │
│  │  │ Manager     │  │ Interface   │  │ Components  │  │ Selector    │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ • Stream    │  │ • Speech    │  │ • Overlay   │  │ • Live      │   │ │
│  │  │ • Frames    │  │   Recognition│  │ • Controls  │  │ • Vet Assist│   │ │
│  │  │ • Preview   │  │ • TTS       │  │ • Summary   │  │             │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  │         │                │                │                │          │ │
│  │         └────────────────┴────────────────┴────────────────┘          │ │
│  │                                    │                                   │ │
│  │         ┌──────────────────────────┼──────────────────────────┐       │ │
│  │         │                          │                          │       │ │
│  │  ┌──────▼──────┐            ┌──────▼──────┐            ┌──────▼──────┐│ │
│  │  │ Vision      │            │ Decision    │            │ Diagnosis   ││ │
│  │  │ Session     │            │ Tree        │            │ Queue       ││ │
│  │  │ Manager     │            │ Engine      │            │ Manager     ││ │
│  │  │ (Live Mode) │            │ (Offline)   │            │ (Store&Fwd) ││ │
│  │  └──────┬──────┘            └──────┬──────┘            └──────┬──────┘│ │
│  │         │                          │                          │       │ │
│  └─────────┼──────────────────────────┼──────────────────────────┼───────┘ │
│            │                          │                          │         │
│  ┌─────────▼──────────────────────────┼──────────────────────────▼───────┐ │
│  │                    GEMINI API (Online Only)                           │ │
│  │                                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │ │
│  │  │ Frame       │  │ Photo       │  │ Tool        │                   │ │
│  │  │ Analysis    │  │ Analysis    │  │ Calling     │                   │ │
│  │  │             │  │ (REST)      │  │             │                   │ │
│  │  │ • Frames    │  │ • Single    │  │ • Tasks     │                   │ │
│  │  │ • Context   │  │   Photo     │  │ • Logs      │                   │ │
│  │  │ • Batch     │  │ • Queued    │  │ • Notify    │                   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼────────────────────────────────────────────┐ │
│  │                    SERVER FUNCTIONS                                    │ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ Context     │  │ Observation │  │ Task        │  │ Diagnosis   │  │ │
│  │  │ Provider    │  │ Logger      │  │ Creator     │  │ Manager     │  │ │
│  │  │             │  │             │  │             │  │             │  │ │
│  │  │ • Batch     │  │ • Save      │  │ • Create    │  │ • History   │  │ │
│  │  │ • History   │  │ • Screenshot│  │ • Priority  │  │ • Queue     │  │ │
│  │  │ • Standards │  │ • Audit     │  │ • Link      │  │ • Escalate  │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼────────────────────────────────────────────┐ │
│  │                    DATABASE (PostgreSQL)                               │ │
│  │                                                                        │ │
│  │  batches │ weight_samples │ mortality_records │ tasks │ audit_logs    │ │
│  │  vision_sessions │ vision_observations │ diagnosis_history            │ │
│  │  diagnosis_queue │ decision_tree_data │ care_protocols                │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼────────────────────────────────────────────┐ │
│  │                    CROSS-SYSTEM INTEGRATION                            │ │
│  │                                                                        │ │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐             │ │
│  │  │ Farm Sentinel           │  │ Farm Optimizer          │             │ │
│  │  │ (Autonomous Monitoring) │  │ (Strategy Generation)   │             │ │
│  │  │                         │  │                         │             │ │
│  │  │ • Outbreak detection    │  │ • Health-informed       │             │ │
│  │  │ • Anomaly correlation   │  │   strategies            │             │ │
│  │  │ • Disease risk scores   │  │ • Preventive ROI        │             │ │
│  │  └─────────────────────────┘  └─────────────────────────┘             │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Vision Session Manager

The central orchestrator for camera analysis sessions.

```typescript
interface VisionSession {
  id: string
  userId: string
  farmId: string
  batchId: string | null
  status: 'initializing' | 'active' | 'paused' | 'ended'
  startedAt: Date
  endedAt: Date | null
  observations: VisionObservation[]
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
}

interface VisionSessionConfig {
  batchId?: string
  enableVoice: boolean
  enableOverlay: boolean
  frameRate: number // frames per second to analyze
}

// Session lifecycle methods
function startSession(config: VisionSessionConfig): Promise<VisionSession>
function pauseSession(sessionId: string): Promise<void>
function resumeSession(sessionId: string): Promise<void>
function endSession(sessionId: string): Promise<VisionSessionSummary>
```

### 2. Camera Manager

Handles device camera access and frame capture.

```typescript
interface CameraConfig {
  facingMode: 'user' | 'environment'
  resolution: { width: number; height: number }
  frameRate: number
}

interface CameraManager {
  // Lifecycle
  requestPermission(): Promise<boolean>
  startStream(config: CameraConfig): Promise<MediaStream>
  stopStream(): void

  // Frame capture
  captureFrame(): ImageData
  getFrameAsBase64(): string

  // Controls
  switchCamera(): Promise<void>
  setFrameRate(fps: number): void

  // State
  isStreaming: boolean
  currentFacingMode: 'user' | 'environment'
  hasPermission: boolean
}
```

### 3. Gemini Vision Client

Client for real-time frame-by-frame analysis using Gemini 3's standard API.

> **Why Frame-by-Frame Analysis (Not Live API)?**
> Per [Google's official Gemini API documentation](https://ai.google.dev/gemini-api/docs/models) (January 2026):
>
> - **Gemini 3 Pro Preview**: Live API = "Not supported"
> - **Gemini 3 Flash Preview**: Live API = "Not supported"
> - Only `gemini-2.5-flash-native-audio-preview-12-2025` supports the Live API
>
> Frame-by-frame analysis is the **only approach** for real-time video with Gemini 3 models.

```typescript
interface GeminiVisionConfig {
  apiKey: string
  model: 'gemini-3-flash-preview' // Gemini 3 Flash for fast frame analysis
  systemPrompt: string
  tools: GeminiTool[]
  // Thinking configuration for Gemini 3
  thinkingConfig?: {
    thinkingLevel: 'minimal' | 'low' | 'medium' | 'high' // 'low' for fast response, 'high' for deep analysis
    includeThoughts?: boolean
  }
  // Frame analysis config
  frameConfig?: {
    maxFramesPerSecond: number // Recommended: 1-2 FPS for analysis
    imageQuality: number // 0.5-1.0, lower = faster upload
    maxImageSize: number // Max dimension in pixels
  }
}

interface GeminiVisionClient {
  // Lifecycle
  initialize(): Promise<void>
  dispose(): void

  // Frame analysis (standard API with image input)
  analyzeFrame(frame: string, mimeType: string): Promise<GeminiResponse>
  analyzeFrameWithContext(
    frame: string,
    mimeType: string,
    context: string,
  ): Promise<GeminiResponse>

  // Batch analysis
  analyzeMultipleFrames(
    frames: { data: string; mimeType: string }[],
  ): Promise<GeminiResponse>

  // Text queries with image context
  queryWithImage(
    frame: string,
    mimeType: string,
    query: string,
  ): Promise<GeminiResponse>

  // Events
  onResponse(callback: (response: GeminiResponse) => void): void
  onToolCall(callback: (toolCall: ToolCall) => void): void
  onError(callback: (error: Error) => void): void

  // State
  isReady: boolean
  averageLatency: number
}

interface GeminiResponse {
  type: 'text' | 'audio' | 'tool_call'
  content: string
  toolCalls?: ToolCall[]
  metadata?: {
    confidence: number
    processingTime: number
  }
}
```

### 4. Analysis Engine

Processes Gemini responses and extracts structured observations.

```typescript
interface HealthAssessment {
  overallStatus: 'healthy' | 'concerning' | 'critical'
  healthyCount: number
  concerningCount: number
  concerns: HealthConcern[]
  explanation: string
}

interface HealthConcern {
  id: string
  type:
    | 'mobility'
    | 'feathering'
    | 'respiratory'
    | 'behavior'
    | 'lesion'
    | 'other'
  severity: 'low' | 'medium' | 'high'
  description: string
  visualCues: string[]
  location: { x: number; y: number } | null // Position in frame
  suggestedAction: string
}

interface WeightEstimate {
  averageWeight: number // grams
  confidenceInterval: { low: number; high: number }
  sampleSize: number
  comparisonToStandard: {
    expectedWeight: number
    percentageOfExpected: number
    daysToTarget: number | null
  }
  conditions: string[] // factors affecting accuracy
}

interface FlockCount {
  count: number
  confidence: number // 0-1
  trackedAnimals: TrackedAnimal[]
  comparisonToRecords: {
    recordedQuantity: number
    difference: number
    possibleExplanations: string[]
  }
}

interface TrackedAnimal {
  id: string
  position: { x: number; y: number }
  tracked: boolean // whether movement is being tracked
}

interface BehaviorAnalysis {
  overallBehavior: 'normal' | 'abnormal'
  patterns: BehaviorPattern[]
  correlations: string[] // connections to recent events
}

interface BehaviorPattern {
  type: 'feeding' | 'movement' | 'social' | 'stress'
  description: string
  severity: 'low' | 'medium' | 'high'
  affectedCount: number | 'flock-wide'
  possibleCauses: string[]
}
```

### 5. Voice Interface

Handles speech recognition and text-to-speech for hands-free operation.

```typescript
interface VoiceInterface {
  // Speech recognition
  startListening(): void
  stopListening(): void
  onTranscript(callback: (text: string, isFinal: boolean) => void): void

  // Text-to-speech
  speak(text: string, priority?: 'normal' | 'high'): Promise<void>
  stopSpeaking(): void

  // State
  isListening: boolean
  isSpeaking: boolean
  isSupported: boolean
}

// Voice commands
type VoiceCommand =
  | 'start_analysis'
  | 'stop_analysis'
  | 'count_animals'
  | 'check_health'
  | 'estimate_weight'
  | 'create_task'
  | 'save_observation'
```

### 6. Visual Overlay Renderer

Renders annotations on the camera preview.

```typescript
interface OverlayConfig {
  showHealthMarkers: boolean
  showCountMarkers: boolean
  showWeightEstimate: boolean
  showStatusBar: boolean
}

interface OverlayMarker {
  id: string
  type: 'health_concern' | 'counted' | 'tracked'
  position: { x: number; y: number }
  color: string
  label?: string
  pulse?: boolean // animation for attention
}

interface OverlayRenderer {
  setConfig(config: OverlayConfig): void
  addMarker(marker: OverlayMarker): void
  removeMarker(id: string): void
  clearMarkers(): void
  setStatusText(text: string): void
  render(canvas: HTMLCanvasElement): void
}
```

### 7. Observation Logger

Persists significant findings to the database.

```typescript
interface VisionObservation {
  id: string
  sessionId: string
  batchId: string | null
  farmId: string
  type: 'health' | 'weight' | 'count' | 'behavior' | 'environment'
  timestamp: Date
  data: HealthAssessment | WeightEstimate | FlockCount | BehaviorAnalysis
  confidence: number
  screenshot: string | null // base64 image with overlay
  notes: string | null
  taskCreated: boolean
}

// Server function signatures
function logObservation(observation: CreateObservationInput): Promise<string>
function getObservations(
  batchId: string,
  limit?: number,
): Promise<VisionObservation[]>
function deleteObservation(observationId: string): Promise<void>
```

### 8. Context Provider

Loads and formats farm context for Gemini prompts.

```typescript
interface FarmContext {
  batch: {
    id: string
    species: string
    livestockType: string
    ageInDays: number
    ageInWeeks: number
    currentQuantity: number
    initialQuantity: number
    targetWeight: number | null
    targetHarvestDate: Date | null
  } | null

  recentMortality: {
    totalDeaths: number
    rate: number
    recentCauses: string[]
  }

  recentWeights: {
    date: Date
    averageWeight: number
  }[]

  growthStandard: {
    day: number
    expectedWeight: number
  }[]

  recentEvents: {
    type: string
    date: Date
    description: string
  }[]
}

function buildFarmContext(batchId: string): Promise<FarmContext>
function formatContextForPrompt(context: FarmContext): string
```

---

## Vet Assist Mode Components

### 9. Decision Tree Engine

Offline expert system for instant triage without network connectivity.

```typescript
interface DecisionTreeNode {
  id: string
  type: 'question' | 'condition' | 'action'
  content: string
  species: string[] // which species this applies to
  children?: DecisionTreeEdge[]
  metadata?: {
    source: string // veterinary literature reference
    region?: string // regional variation
    version: string
  }
}

interface DecisionTreeEdge {
  symptomId: string
  targetNodeId: string
  weight: number // confidence weight
}

interface DecisionTreeData {
  version: string
  lastUpdated: Date
  species: {
    [key: string]: {
      symptoms: Symptom[]
      conditions: Condition[]
      nodes: DecisionTreeNode[]
      rootNodeId: string
    }
  }
}

interface DecisionTreeEngine {
  // Initialization
  loadData(): Promise<void>
  getVersion(): string
  isLoaded(): boolean

  // Triage
  getSymptoms(species: string): Symptom[]
  evaluateSymptoms(species: string, symptomIds: string[]): TriageResult
  getConditionDetails(conditionId: string): Condition

  // Data management
  updateData(newData: DecisionTreeData): Promise<void>
  exportUsageStats(): UsageStats
}

interface TriageResult {
  urgency: 'critical' | 'urgent' | 'monitor' | 'normal'
  immediateActions: string[]
  possibleConditions: {
    condition: Condition
    confidence: number // 0-1
  }[]
  recommendedNextSteps: string[]
  shouldEscalateToVet: boolean
  disclaimer: string
}
```

### 10. Symptom Checklist Manager

Manages the symptom selection interface.

```typescript
interface Symptom {
  id: string
  name: string
  description: string
  category: SymptomCategory
  species: string[]
  isRedFlag: boolean // indicates critical condition
  exampleImageUrl?: string
  relatedSymptoms: string[] // commonly co-occurring symptoms
}

type SymptomCategory =
  | 'respiratory'
  | 'digestive'
  | 'skin'
  | 'behavior'
  | 'mobility'
  | 'eyes'
  | 'reproductive'
  | 'general'

interface SymptomChecklistManager {
  // Retrieval
  getCategories(species: string): SymptomCategory[]
  getSymptomsByCategory(species: string, category: SymptomCategory): Symptom[]
  getRedFlagSymptoms(species: string): Symptom[]

  // Selection
  selectSymptom(symptomId: string): void
  deselectSymptom(symptomId: string): void
  clearSelection(): void
  getSelectedSymptoms(): Symptom[]

  // Suggestions
  getSuggestedSymptoms(selectedIds: string[]): Symptom[] // based on co-occurrence
}
```

### 11. Photo Diagnosis Manager

Handles photo capture and AI analysis for detailed diagnosis.

```typescript
interface PhotoDiagnosis {
  id: string
  batchId: string | null
  farmId: string
  photos: DiagnosisPhoto[]
  selectedSymptoms: string[]
  status: 'pending' | 'analyzing' | 'complete' | 'failed'
  result: PhotoDiagnosisResult | null
  createdAt: Date
  analyzedAt: Date | null
}

interface DiagnosisPhoto {
  id: string
  base64Data: string
  mimeType: string
  capturedAt: Date
  angle?: string // 'front', 'side', 'top', 'close-up'
  sizeBytes: number
}

interface PhotoDiagnosisResult {
  conditions: {
    name: string
    confidence: number
    visualEvidence: string[]
  }[]
  overallAssessment: string
  recommendedActions: string[]
  uncertainties: string[]
  shouldConsultVet: boolean
}

interface PhotoDiagnosisManager {
  // Capture
  capturePhoto(angle?: string): Promise<DiagnosisPhoto>
  compressPhoto(
    photo: DiagnosisPhoto,
    maxSizeKB: number,
  ): Promise<DiagnosisPhoto>

  // Analysis
  submitForAnalysis(
    photos: DiagnosisPhoto[],
    symptoms: string[],
    context: FarmContext,
  ): Promise<PhotoDiagnosis>
  getAnalysisStatus(diagnosisId: string): PhotoDiagnosis

  // Queue management
  queueForLaterAnalysis(diagnosis: PhotoDiagnosis): Promise<void>
  getPendingDiagnoses(): PhotoDiagnosis[]
  processQueue(): Promise<void>
}
```

### 12. Diagnosis Queue (Store-and-Forward)

Manages offline photo queue for analysis when connectivity is restored.

```typescript
interface QueuedDiagnosis {
  id: string
  diagnosis: PhotoDiagnosis
  queuedAt: Date
  retryCount: number
  estimatedDataUsageKB: number
  expiresAt: Date // 7 days from queue time
}

interface DiagnosisQueue {
  // Queue operations
  add(diagnosis: PhotoDiagnosis): Promise<string>
  remove(id: string): Promise<void>
  getAll(): QueuedDiagnosis[]
  getCount(): number
  getTotalDataUsage(): number // KB

  // Processing
  processNext(): Promise<PhotoDiagnosisResult | null>
  processAll(): Promise<ProcessingResult>
  isProcessing(): boolean

  // Notifications
  onDiagnosisComplete(callback: (diagnosis: PhotoDiagnosis) => void): void
  onQueueEmpty(callback: () => void): void

  // Cleanup
  removeExpired(): Promise<number>
  clear(): Promise<void>
}

interface ProcessingResult {
  processed: number
  failed: number
  remaining: number
  errors: { id: string; error: string }[]
}
```

### 13. Care Protocol Manager

Provides treatment guidance based on diagnosis.

```typescript
interface CareProtocol {
  id: string
  conditionId: string
  species: string[]
  immediateActions: CareAction[]
  medications: MedicationRecommendation[]
  isolationGuidance: string | null
  monitoringSchedule: MonitoringTask[]
  whenToCallVet: string[]
  preventiveMeasures: string[]
  expectedRecoveryDays: { min: number; max: number } | null
}

interface CareAction {
  order: number
  action: string
  timing: string // 'immediately', 'within 1 hour', etc.
  details: string
  warningIfSkipped?: string
}

interface MedicationRecommendation {
  name: string
  type: 'over-the-counter' | 'prescription'
  dosageCalculation: {
    baseAmount: number
    unit: string
    perWeightUnit: number // e.g., per kg
    frequency: string
    duration: string
  }
  administrationMethod: string
  warnings: string[]
  alternatives?: string[]
}

interface MonitoringTask {
  description: string
  frequency: string // 'every 4 hours', 'daily', etc.
  duration: string
  whatToLookFor: string[]
  escalationTriggers: string[]
}

interface CareProtocolManager {
  // Retrieval
  getProtocol(conditionId: string, species: string): CareProtocol | null
  getProtocolsForConditions(
    conditionIds: string[],
    species: string,
  ): CareProtocol[]

  // Dosage calculation
  calculateDosage(
    medication: MedicationRecommendation,
    estimatedWeight: number,
  ): { amount: number; unit: string; instructions: string }

  // Task creation
  createMonitoringTasks(
    protocol: CareProtocol,
    batchId: string,
  ): Promise<string[]>
}
```

### 14. Diagnosis History Manager

Tracks all diagnoses for pattern detection and vet consultations.

```typescript
interface DiagnosisHistoryEntry {
  id: string
  batchId: string | null
  farmId: string
  userId: string
  timestamp: Date
  mode: 'decision_tree' | 'photo_analysis' | 'combined'
  selectedSymptoms: Symptom[]
  photos: DiagnosisPhoto[]
  triageResult: TriageResult | null
  photoResult: PhotoDiagnosisResult | null
  actionsTaken: string[]
  outcome: DiagnosisOutcome | null
  notes: string | null
  escalatedToVet: boolean
  vetResponse: string | null
}

interface DiagnosisOutcome {
  recordedAt: Date
  actualCondition: string | null
  recoveryStatus: 'recovered' | 'ongoing' | 'deceased' | 'unknown'
  treatmentEffectiveness:
    | 'effective'
    | 'partially_effective'
    | 'ineffective'
    | null
  notes: string
}

interface DiagnosisHistoryManager {
  // CRUD
  save(entry: Omit<DiagnosisHistoryEntry, 'id'>): Promise<string>
  get(id: string): Promise<DiagnosisHistoryEntry | null>
  update(id: string, updates: Partial<DiagnosisHistoryEntry>): Promise<void>
  delete(id: string): Promise<void>

  // Queries
  getByBatch(batchId: string, limit?: number): Promise<DiagnosisHistoryEntry[]>
  getByFarm(
    farmId: string,
    dateRange?: DateRange,
  ): Promise<DiagnosisHistoryEntry[]>
  getByCondition(conditionId: string): Promise<DiagnosisHistoryEntry[]>

  // Analysis
  getRecurringConditions(farmId: string): Promise<RecurringCondition[]>
  generateVetSummary(entryIds: string[]): Promise<VetSummaryPDF>

  // Integration
  notifyFarmSentinel(entry: DiagnosisHistoryEntry): Promise<void>
  notifyFarmOptimizer(entry: DiagnosisHistoryEntry): Promise<void>
}

interface RecurringCondition {
  conditionId: string
  conditionName: string
  occurrences: number
  lastOccurrence: Date
  affectedBatches: string[]
  possibleSystemicCauses: string[]
}
```

### 15. Vet Escalation Manager

Handles sharing diagnosis data with veterinarians.

```typescript
interface VetEscalation {
  id: string
  diagnosisId: string
  farmId: string
  status: 'draft' | 'sent' | 'viewed' | 'responded'
  channel: 'whatsapp' | 'email' | 'sms'
  recipientInfo: {
    name?: string
    phone?: string
    email?: string
  }
  packagedData: EscalationPackage
  sentAt: Date | null
  viewedAt: Date | null
  response: string | null
  respondedAt: Date | null
}

interface EscalationPackage {
  farmName: string
  farmLocation: { lat: number; lng: number } | null
  batchInfo: {
    species: string
    age: string
    quantity: number
  } | null
  symptoms: string[]
  photos: { url: string; description: string }[]
  aiAssessment: string
  urgencyLevel: string
  timestamp: Date
}

interface VetEscalationManager {
  // Package creation
  createPackage(diagnosisId: string): Promise<EscalationPackage>
  generateShareableLink(escalationId: string): Promise<string>
  generatePDF(escalationId: string): Promise<Blob>

  // Sending
  sendViaWhatsApp(escalationId: string, phone: string): Promise<void>
  sendViaEmail(escalationId: string, email: string): Promise<void>
  sendViaSMS(escalationId: string, phone: string): Promise<void>

  // Tracking
  markAsViewed(escalationId: string): Promise<void>
  recordResponse(escalationId: string, response: string): Promise<void>
  getEscalationHistory(farmId: string): Promise<VetEscalation[]>

  // Extension Worker integration
  escalateToExtensionWorker(escalationId: string): Promise<void>
}
```

## Data Models

### Vision Observations Table

New table to store vision analysis observations:

```sql
CREATE TABLE vision_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  batch_id UUID REFERENCES batches(id),
  farm_id UUID NOT NULL REFERENCES farms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'health', 'weight', 'count', 'behavior', 'environment'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL, -- structured observation data
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  screenshot TEXT, -- base64 encoded image
  notes TEXT,
  task_id UUID REFERENCES tasks(id), -- linked task if created
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vision_observations_batch ON vision_observations(batch_id);
CREATE INDEX idx_vision_observations_farm ON vision_observations(farm_id);
CREATE INDEX idx_vision_observations_session ON vision_observations(session_id);
```

### Vision Sessions Table

Track analysis sessions:

```sql
CREATE TABLE vision_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  farm_id UUID NOT NULL REFERENCES farms(id),
  batch_id UUID REFERENCES batches(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'ended'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary JSONB, -- session summary when ended
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vision_sessions_user ON vision_sessions(user_id);
CREATE INDEX idx_vision_sessions_batch ON vision_sessions(batch_id);
```

### Diagnosis History Table (Vet Assist Mode)

Track all diagnostic sessions:

```sql
CREATE TABLE diagnosis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id),
  farm_id UUID NOT NULL REFERENCES farms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  mode VARCHAR(20) NOT NULL, -- 'decision_tree', 'photo_analysis', 'combined'
  selected_symptoms JSONB NOT NULL DEFAULT '[]', -- array of symptom IDs
  photos JSONB DEFAULT '[]', -- array of photo metadata (not raw data)
  triage_result JSONB, -- decision tree output
  photo_result JSONB, -- AI photo analysis output
  actions_taken JSONB DEFAULT '[]', -- array of action strings
  outcome JSONB, -- recovery status, effectiveness
  notes TEXT,
  escalated_to_vet BOOLEAN NOT NULL DEFAULT FALSE,
  vet_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diagnosis_history_batch ON diagnosis_history(batch_id);
CREATE INDEX idx_diagnosis_history_farm ON diagnosis_history(farm_id);
CREATE INDEX idx_diagnosis_history_user ON diagnosis_history(user_id);
CREATE INDEX idx_diagnosis_history_created ON diagnosis_history(created_at);
```

### Diagnosis Queue Table (Store-and-Forward)

Queue photos for analysis when offline:

```sql
CREATE TABLE diagnosis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  batch_id UUID REFERENCES batches(id),
  photos JSONB NOT NULL, -- array of base64 photos with metadata
  selected_symptoms JSONB NOT NULL DEFAULT '[]',
  farm_context JSONB, -- cached context at time of capture
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  estimated_data_kb INTEGER NOT NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- 7 days from queue time
  processed_at TIMESTAMPTZ,
  result JSONB, -- analysis result when complete
  error TEXT -- error message if failed
);

CREATE INDEX idx_diagnosis_queue_user ON diagnosis_queue(user_id);
CREATE INDEX idx_diagnosis_queue_status ON diagnosis_queue(status);
CREATE INDEX idx_diagnosis_queue_expires ON diagnosis_queue(expires_at);
```

### Vet Escalations Table

Track escalations to veterinarians:

```sql
CREATE TABLE vet_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES diagnosis_history(id),
  farm_id UUID NOT NULL REFERENCES farms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'responded'
  channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'sms'
  recipient_info JSONB NOT NULL, -- name, phone, email
  packaged_data JSONB NOT NULL, -- full escalation package
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vet_escalations_diagnosis ON vet_escalations(diagnosis_id);
CREATE INDEX idx_vet_escalations_farm ON vet_escalations(farm_id);
CREATE INDEX idx_vet_escalations_status ON vet_escalations(status);
```

### Decision Tree Data Table (Reference Data)

Store the embedded decision tree data:

```sql
CREATE TABLE decision_tree_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  data JSONB NOT NULL, -- full decision tree structure
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_references JSONB DEFAULT '[]', -- veterinary literature citations
  regional_variant VARCHAR(50), -- e.g., 'west_africa', 'south_asia'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(species, version, regional_variant)
);

CREATE INDEX idx_decision_tree_species ON decision_tree_data(species);
CREATE INDEX idx_decision_tree_active ON decision_tree_data(is_active);
```

### Care Protocols Table (Reference Data)

Store treatment protocols:

```sql
CREATE TABLE care_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id VARCHAR(100) NOT NULL,
  species JSONB NOT NULL DEFAULT '[]', -- array of applicable species
  version VARCHAR(20) NOT NULL,
  protocol_data JSONB NOT NULL, -- full protocol structure
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_references JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(condition_id, version)
);

CREATE INDEX idx_care_protocols_condition ON care_protocols(condition_id);
CREATE INDEX idx_care_protocols_active ON care_protocols(is_active);
```

### TypeScript Database Types

```typescript
interface VisionObservationTable {
  id: Generated<string>
  sessionId: string
  batchId: string | null
  farmId: string
  userId: string
  type: 'health' | 'weight' | 'count' | 'behavior' | 'environment'
  timestamp: Generated<Date>
  data: Record<string, any>
  confidence: string // DECIMAL
  screenshot: string | null
  notes: string | null
  taskId: string | null
  createdAt: Generated<Date>
}

interface VisionSessionTable {
  id: Generated<string>
  userId: string
  farmId: string
  batchId: string | null
  status: 'active' | 'paused' | 'ended'
  startedAt: Generated<Date>
  endedAt: Date | null
  summary: Record<string, any> | null
  createdAt: Generated<Date>
}

interface DiagnosisHistoryTable {
  id: Generated<string>
  batchId: string | null
  farmId: string
  userId: string
  mode: 'decision_tree' | 'photo_analysis' | 'combined'
  selectedSymptoms: string[] // JSONB
  photos: DiagnosisPhotoMeta[] // JSONB
  triageResult: TriageResult | null // JSONB
  photoResult: PhotoDiagnosisResult | null // JSONB
  actionsTaken: string[] // JSONB
  outcome: DiagnosisOutcome | null // JSONB
  notes: string | null
  escalatedToVet: boolean
  vetResponse: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

interface DiagnosisQueueTable {
  id: Generated<string>
  farmId: string
  userId: string
  batchId: string | null
  photos: DiagnosisPhoto[] // JSONB
  selectedSymptoms: string[] // JSONB
  farmContext: FarmContext | null // JSONB
  status: 'pending' | 'processing' | 'complete' | 'failed'
  retryCount: number
  estimatedDataKb: number
  queuedAt: Generated<Date>
  expiresAt: Date
  processedAt: Date | null
  result: PhotoDiagnosisResult | null // JSONB
  error: string | null
}

interface VetEscalationTable {
  id: Generated<string>
  diagnosisId: string
  farmId: string
  userId: string
  status: 'draft' | 'sent' | 'viewed' | 'responded'
  channel: 'whatsapp' | 'email' | 'sms'
  recipientInfo: { name?: string; phone?: string; email?: string } // JSONB
  packagedData: EscalationPackage // JSONB
  sentAt: Date | null
  viewedAt: Date | null
  response: string | null
  respondedAt: Date | null
  createdAt: Generated<Date>
}

interface DecisionTreeDataTable {
  id: Generated<string>
  species: string
  version: string
  data: DecisionTreeData // JSONB
  isActive: boolean
  sourceReferences: string[] // JSONB
  regionalVariant: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

interface CareProtocolTable {
  id: Generated<string>
  conditionId: string
  species: string[] // JSONB
  version: string
  protocolData: CareProtocol // JSONB
  isActive: boolean
  sourceReferences: string[] // JSONB
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Farm Context Completeness

_For any_ batch ID provided to the context builder, the resulting FarmContext object SHALL contain: batch species, age in days, current quantity, initial quantity, recent mortality records (last 7 days), recent weight samples, and growth standards for the species.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 2: Health Assessment Structure Validity

_For any_ health assessment returned by the analysis engine, the sum of healthyCount and concerningCount SHALL equal the total animals assessed, AND every health concern SHALL have a non-empty explanation and at least one visual cue.

**Validates: Requirements 4.7, 4.8**

### Property 3: Weight Estimate Validity

_For any_ weight estimate, the confidence interval SHALL satisfy: low < averageWeight < high, AND when batch context is available, the comparisonToStandard SHALL include a valid expectedWeight and percentageOfExpected calculation.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 4: Flock Count Validity

_For any_ flock count result, the confidence SHALL be between 0 and 1 inclusive, AND every tracked animal SHALL have a unique ID, AND when batch context is available, the comparisonToRecords SHALL include the recorded quantity and calculated difference.

**Validates: Requirements 6.2, 6.4, 6.5**

### Property 5: Behavior Analysis Structure

_For any_ behavior analysis with detected patterns, every pattern SHALL have a severity value from the set {low, medium, high}, AND an affectedCount that is either a positive number or 'flock-wide', AND at least one possible cause.

**Validates: Requirements 7.4, 7.6, 7.7**

### Property 6: Observation Logging Completeness

_For any_ logged observation, it SHALL contain: sessionId, farmId, type, timestamp, data, and confidence score, AND if severity is 'high', a notification SHALL be created, AND an audit log entry SHALL be created.

**Validates: Requirements 10.2, 10.5, 10.6**

### Property 7: Task Creation Validity

_For any_ task created from a vision observation, the task title SHALL be derived from the observation type and description, AND the priority SHALL correspond to the observation severity (high→urgent, medium→normal, low→low), AND if a batch was selected, the task SHALL be linked to that batch.

**Validates: Requirements 11.2, 11.3, 11.4**

### Property 8: Session Lifecycle Consistency

_For any_ vision session, when ended, a summary SHALL be generated containing observation count and duration, AND the duration SHALL equal endedAt minus startedAt, AND the summary SHALL be persisted to the database.

**Validates: Requirements 13.2, 13.3, 13.6**

### Property 9: Single Active Session Constraint

_For any_ user, there SHALL be at most one vision session with status 'active' at any time. Starting a new session while one is active SHALL either end the existing session or return an error.

**Validates: Requirements 13.7**

### Property 10: Offline Resilience

_For any_ observation created while offline, it SHALL be queued locally, AND when connectivity is restored, all queued observations SHALL be synced to the server in order of creation.

**Validates: Requirements 14.2, 14.6**

### Property 11: Privacy Compliance

_For any_ vision session, raw video frames SHALL NOT be persisted beyond the active session, AND video frames SHALL only be transmitted to the Gemini API endpoint, AND users SHALL be able to delete any observation they created.

**Validates: Requirements 15.1, 15.2, 15.4**

### Property 12: Voice Command Recognition

_For any_ valid voice command from the set {start_analysis, stop_analysis, count_animals, check_health, estimate_weight, create_task, save_observation}, the voice interface SHALL recognize and trigger the corresponding action.

**Validates: Requirements 9.3**

### Property 13: Request Status Accuracy

_For any_ change in API request state, the connectionStatus property SHALL reflect the actual state (analyzing, idle, error) within 1 second of the change.

**Validates: Requirements 2.6**

### Property 14: Reconnection Behavior

_For any_ connection loss, the system SHALL attempt reconnection up to 3 times with exponential backoff, AND if all attempts fail, the user SHALL be notified.

**Validates: Requirements 2.4, 2.5**

### Property 15: Frame Rate Compliance

_For any_ configured frame rate N (where N >= 1), the camera manager SHALL capture at least N frames per second when the stream is active and the device supports it.

**Validates: Requirements 1.3**

---

## Vet Assist Mode Correctness Properties

### Property 16: Decision Tree Offline Operation

_For any_ symptom evaluation request, the decision tree engine SHALL return a TriageResult within 1 second WITHOUT making any network requests, AND the result SHALL include urgency level, immediate actions, and at least one possible condition.

**Validates: Requirements 17.4, 17.5, 17.8**

### Property 17: Symptom Checklist Completeness

_For any_ species supported by the system, the symptom checklist SHALL provide at least 50 unique symptom combinations, AND every symptom SHALL have a non-empty name, description, and category, AND red flag symptoms SHALL be clearly marked.

**Validates: Requirements 17.6, 18.1, 18.7**

### Property 18: Photo Compression Validity

_For any_ photo submitted for diagnosis, the compressed photo SHALL be under 100KB in size, AND the compression SHALL preserve sufficient quality for visual analysis (minimum 480px on shortest dimension).

**Validates: Requirements 19.2**

### Property 19: Diagnosis Queue Persistence

_For any_ photo queued while offline, the queue entry SHALL persist in IndexedDB, AND SHALL include: photos, selected symptoms, farm context, queue timestamp, and expiration date (7 days from queue time).

**Validates: Requirements 20.1, 20.2, 20.5**

### Property 20: Queue Processing Order

_For any_ diagnosis queue processing, entries SHALL be processed in FIFO order (oldest first), AND when connectivity is restored, processing SHALL begin automatically within 30 seconds.

**Validates: Requirements 20.3**

### Property 21: Care Protocol Completeness

_For any_ care protocol returned for a condition, it SHALL include: immediate actions, monitoring schedule, and "when to call vet" criteria, AND if medications are recommended, dosage calculations SHALL be provided.

**Validates: Requirements 21.2, 21.4, 21.7**

### Property 22: Dosage Calculation Accuracy

_For any_ medication dosage calculation, the result SHALL be proportional to the estimated animal weight, AND SHALL include the unit, frequency, and duration, AND prescription medications SHALL be clearly marked.

**Validates: Requirements 21.4, 21.5**

### Property 23: Diagnosis History Completeness

_For any_ saved diagnosis history entry, it SHALL include: timestamp, mode (decision_tree/photo_analysis/combined), selected symptoms, and either triage result or photo result (or both).

**Validates: Requirements 22.1, 22.2**

### Property 24: Vet Escalation Package Validity

_For any_ vet escalation package, it SHALL include: farm name, batch info (if available), symptoms, AI assessment, urgency level, and timestamp, AND photos SHALL be included if captured.

**Validates: Requirements 23.2, 23.4**

### Property 25: Medical Disclaimer Presence

_For any_ diagnosis result displayed to the user (triage or photo analysis), a medical disclaimer SHALL be prominently displayed stating that AI diagnosis is not a substitute for professional veterinary care.

**Validates: Requirements 27.1, 27.7**

### Property 26: Farm Sentinel Integration

_For any_ diagnosis recorded with urgency level 'critical' or 'urgent', the Farm Sentinel system SHALL be notified within 5 seconds, AND the notification SHALL include condition type, batch ID, and timestamp.

**Validates: Requirements 25.1, 25.3**

### Property 27: Farm Optimizer Integration

_For any_ diagnosis recorded, the Farm Optimizer system SHALL receive the diagnosis data for inclusion in performance analysis, AND health-related strategies SHALL consider diagnosis patterns.

**Validates: Requirements 26.1, 26.2**

## Error Handling

### Connection Errors

| Error Type         | Handling Strategy                           | User Feedback                                        |
| ------------------ | ------------------------------------------- | ---------------------------------------------------- |
| API request failed | Retry with exponential backoff (1s, 2s, 4s) | "Analyzing..." with spinner                          |
| API rate limited   | Queue frames, reduce frame rate             | "High traffic - reducing quality"                    |
| API timeout        | Retry once, then notify user                | "AI response delayed - retrying"                     |
| API unavailable    | Offer photo capture fallback                | "Live analysis unavailable - capture photos instead" |

### Camera Errors

| Error Type           | Handling Strategy                  | User Feedback                        |
| -------------------- | ---------------------------------- | ------------------------------------ |
| Permission denied    | Show explanation and settings link | "Camera access needed for analysis"  |
| Camera not available | Disable vision features            | "No camera detected"                 |
| Stream interrupted   | Attempt restart, notify if fails   | "Camera interrupted - restarting..." |

### Data Errors

| Error Type       | Handling Strategy                                   | User Feedback                              |
| ---------------- | --------------------------------------------------- | ------------------------------------------ |
| Batch not found  | Clear batch context, continue with general analysis | "Batch not found - using general analysis" |
| Save failed      | Queue for retry, notify user                        | "Couldn't save - will retry when online"   |
| Invalid response | Log error, request re-analysis                      | "Unexpected response - analyzing again"    |

### Offline Handling

```typescript
interface OfflineQueue {
  observations: QueuedObservation[]
  tasks: QueuedTask[]

  add(item: QueuedObservation | QueuedTask): void
  sync(): Promise<SyncResult>
  getCount(): number
  clear(): void
}

interface QueuedObservation {
  id: string
  data: CreateObservationInput
  createdAt: Date
  retryCount: number
}

// Sync strategy
async function syncOfflineQueue(queue: OfflineQueue): Promise<void> {
  const items = queue.observations.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )

  for (const item of items) {
    try {
      await logObservation(item.data)
      queue.remove(item.id)
    } catch (error) {
      item.retryCount++
      if (item.retryCount >= 3) {
        // Notify user of permanent failure
        notifyUser(`Failed to sync observation from ${item.createdAt}`)
      }
    }
  }
}
```

### Vet Assist Mode Error Handling

| Error Type                 | Handling Strategy                               | User Feedback                                          |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Decision tree not loaded   | Attempt reload, fallback to basic symptom list  | "Loading diagnostic data..."                           |
| Photo capture failed       | Retry once, offer manual file selection         | "Couldn't capture photo - try again"                   |
| Photo too large            | Auto-compress, warn if quality degraded         | "Compressing photo for upload..."                      |
| Queue storage full         | Remove oldest expired entries, warn user        | "Storage full - removing old pending diagnoses"        |
| AI analysis failed         | Keep in queue, retry with backoff               | "Analysis failed - will retry automatically"           |
| Vet escalation send failed | Queue for retry, offer alternative channel      | "Couldn't send - try WhatsApp instead?"                |
| Invalid symptom selection  | Highlight conflicting symptoms, suggest removal | "These symptoms rarely occur together - please verify" |

### Diagnosis Queue Recovery

```typescript
interface DiagnosisQueueRecovery {
  // Automatic recovery on app start
  async recoverQueue(): Promise<void> {
    const queue = await loadQueueFromIndexedDB()

    // Remove expired entries
    const expired = queue.filter(q => q.expiresAt < new Date())
    for (const entry of expired) {
      await removeFromQueue(entry.id)
      notifyUser(`Diagnosis from ${entry.queuedAt} expired and was removed`)
    }

    // Check connectivity and process if online
    if (navigator.onLine) {
      await processQueue()
    }
  }

  // Listen for connectivity changes
  setupConnectivityListener(): void {
    window.addEventListener('online', async () => {
      await processQueue()
    })
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across all valid inputs

### Property-Based Testing Configuration

- **Library**: fast-check for TypeScript
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: gemini-vision-assistant, Property {number}: {property_text}`

### Test Categories

#### 1. Context Building Tests (Property-Based)

```typescript
// Property 1: Farm Context Completeness
describe('buildFarmContext', () => {
  it('should include all required fields for any valid batch', () => {
    fc.assert(
      fc.property(arbitraryBatchId(), async (batchId) => {
        const context = await buildFarmContext(batchId)

        expect(context.batch).toBeDefined()
        expect(context.batch?.species).toBeTruthy()
        expect(context.batch?.ageInDays).toBeGreaterThanOrEqual(0)
        expect(context.batch?.currentQuantity).toBeGreaterThanOrEqual(0)
        expect(context.recentMortality).toBeDefined()
        expect(context.growthStandard).toBeDefined()
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 2. Analysis Structure Tests (Property-Based)

```typescript
// Property 2: Health Assessment Structure Validity
describe('HealthAssessment', () => {
  it('should have valid counts and explanations', () => {
    fc.assert(
      fc.property(arbitraryHealthAssessment(), (assessment) => {
        // Counts must sum correctly
        const totalAssessed =
          assessment.healthyCount + assessment.concerningCount
        expect(totalAssessed).toBeGreaterThan(0)

        // Every concern must have explanation
        for (const concern of assessment.concerns) {
          expect(concern.explanation).toBeTruthy()
          expect(concern.visualCues.length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Property 3: Weight Estimate Validity
describe('WeightEstimate', () => {
  it('should have valid confidence intervals', () => {
    fc.assert(
      fc.property(arbitraryWeightEstimate(), (estimate) => {
        expect(estimate.confidenceInterval.low).toBeLessThan(
          estimate.averageWeight,
        )
        expect(estimate.averageWeight).toBeLessThan(
          estimate.confidenceInterval.high,
        )
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 3. Session Management Tests (Property-Based)

```typescript
// Property 9: Single Active Session Constraint
describe('VisionSession', () => {
  it('should enforce single active session per user', () => {
    fc.assert(
      fc.property(arbitraryUserId(), async (userId) => {
        // Start first session
        const session1 = await startSession({ userId })
        expect(session1.status).toBe('active')

        // Attempt second session
        const session2 = await startSession({ userId })

        // Either session1 is ended or session2 fails
        const activeSessions = await getActiveSessions(userId)
        expect(activeSessions.length).toBeLessThanOrEqual(1)
      }),
      { numRuns: 100 },
    )
  })
})
```

#### 4. Integration Tests (Unit)

```typescript
describe('Vision Assistant Integration', () => {
  it('should create task from observation', async () => {
    const observation = createMockObservation({ severity: 'high' })
    const task = await createTaskFromObservation(observation)

    expect(task.title).toContain(observation.type)
    expect(task.batchId).toBe(observation.batchId)
  })

  it('should log to audit when observation saved', async () => {
    const observation = createMockObservation()
    await logObservation(observation)

    const auditLogs = await getAuditLogs({ entityId: observation.id })
    expect(auditLogs.length).toBe(1)
  })
})
```

#### 5. UI Component Tests (Unit)

```typescript
describe('VisionAssistant Component', () => {
  it('should request camera permission on mount', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue(true)
    render(<VisionAssistant onPermissionRequest={mockRequestPermission} />)

    expect(mockRequestPermission).toHaveBeenCalled()
  })

  it('should display connection status', () => {
    render(<VisionAssistant connectionStatus="connecting" />)

    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })
})
```

### Test Data Generators (Arbitraries)

```typescript
// Arbitrary generators for property-based tests
const arbitraryBatchId = () => fc.uuid()

const arbitraryHealthConcern = () =>
  fc.record({
    id: fc.uuid(),
    type: fc.constantFrom(
      'mobility',
      'feathering',
      'respiratory',
      'behavior',
      'lesion',
      'other',
    ),
    severity: fc.constantFrom('low', 'medium', 'high'),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    visualCues: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
      minLength: 1,
      maxLength: 5,
    }),
    suggestedAction: fc.string({ minLength: 10, maxLength: 100 }),
  })

const arbitraryHealthAssessment = () =>
  fc.record({
    overallStatus: fc.constantFrom('healthy', 'concerning', 'critical'),
    healthyCount: fc.nat({ max: 1000 }),
    concerningCount: fc.nat({ max: 100 }),
    concerns: fc.array(arbitraryHealthConcern(), { maxLength: 10 }),
    explanation: fc.string({ minLength: 20, maxLength: 500 }),
  })

const arbitraryWeightEstimate = () =>
  fc
    .record({
      averageWeight: fc.integer({ min: 100, max: 50000 }), // grams
      confidenceInterval: fc
        .record({
          low: fc.integer({ min: 50, max: 49000 }),
          high: fc.integer({ min: 150, max: 51000 }),
        })
        .filter((ci) => ci.low < ci.high),
      sampleSize: fc.integer({ min: 1, max: 100 }),
    })
    .map((est) => ({
      ...est,
      confidenceInterval: {
        low: Math.min(est.confidenceInterval.low, est.averageWeight - 10),
        high: Math.max(est.confidenceInterval.high, est.averageWeight + 10),
      },
    }))
```

### E2E Test Scenarios

1. **Happy Path**: Start session → Analyze flock → Detect concern → Create task → End session
2. **Offline Flow**: Start session → Lose connection → Queue observation → Reconnect → Sync
3. **Voice Flow**: Start with voice → Ask question → Receive audio response
4. **Multi-batch**: Switch between batches during session → Verify context updates

### Vet Assist Mode Test Scenarios

5. **Offline Triage**: Select symptoms → Get instant triage → View care protocol (no network)
6. **Photo Queue**: Capture photo offline → Queue for analysis → Reconnect → Get result
7. **Combined Diagnosis**: Select symptoms + capture photo → Get combined analysis
8. **Vet Escalation**: Complete diagnosis → Package for vet → Send via WhatsApp
9. **Recurring Detection**: Multiple diagnoses → Detect recurring condition → Alert user

### Vet Assist Mode Property Tests

```typescript
// Property 16: Decision Tree Offline Operation
describe('DecisionTreeEngine', () => {
  it('should return triage result without network in under 1 second', () => {
    fc.assert(
      fc.property(
        arbitrarySpecies(),
        arbitrarySymptomIds(),
        async (species, symptomIds) => {
          // Disable network
          const originalFetch = global.fetch
          global.fetch = () => Promise.reject(new Error('Network disabled'))

          const startTime = Date.now()
          const result = await decisionTreeEngine.evaluateSymptoms(
            species,
            symptomIds,
          )
          const duration = Date.now() - startTime

          global.fetch = originalFetch

          expect(duration).toBeLessThan(1000)
          expect(result.urgency).toBeDefined()
          expect(result.immediateActions.length).toBeGreaterThan(0)
          expect(result.possibleConditions.length).toBeGreaterThan(0)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 18: Photo Compression Validity
describe('PhotoDiagnosisManager', () => {
  it('should compress photos to under 100KB while maintaining quality', () => {
    fc.assert(
      fc.property(arbitraryPhoto(), async (photo) => {
        const compressed = await photoManager.compressPhoto(photo, 100)

        expect(compressed.sizeBytes).toBeLessThanOrEqual(100 * 1024)
        // Verify minimum dimension
        const dimensions = await getImageDimensions(compressed.base64Data)
        expect(
          Math.min(dimensions.width, dimensions.height),
        ).toBeGreaterThanOrEqual(480)
      }),
      { numRuns: 50 },
    )
  })
})

// Property 22: Dosage Calculation Accuracy
describe('CareProtocolManager', () => {
  it('should calculate dosage proportional to weight', () => {
    fc.assert(
      fc.property(
        arbitraryMedication(),
        fc.integer({ min: 100, max: 50000 }), // weight in grams
        (medication, weight) => {
          const dosage = careProtocolManager.calculateDosage(medication, weight)

          // Dosage should scale with weight
          const expectedAmount =
            (medication.dosageCalculation.baseAmount * (weight / 1000)) /
            medication.dosageCalculation.perWeightUnit

          expect(dosage.amount).toBeCloseTo(expectedAmount, 2)
          expect(dosage.unit).toBe(medication.dosageCalculation.unit)
          expect(dosage.instructions).toBeTruthy()
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 25: Medical Disclaimer Presence
describe('VetAssistMode', () => {
  it('should always display medical disclaimer with diagnosis results', () => {
    fc.assert(
      fc.property(arbitraryTriageResult(), (triageResult) => {
        const displayData = formatTriageForDisplay(triageResult)

        expect(displayData.disclaimer).toBeTruthy()
        expect(displayData.disclaimer).toContain('not a substitute')
        expect(displayData.disclaimer).toContain('veterinary care')
      }),
      { numRuns: 100 },
    )
  })
})
```

### Vet Assist Mode Test Data Generators

```typescript
const arbitrarySpecies = () =>
  fc.constantFrom(
    'broiler',
    'layer',
    'catfish',
    'tilapia',
    'cattle',
    'goat',
    'sheep',
  )

const arbitrarySymptomIds = () =>
  fc.array(fc.uuid(), { minLength: 1, maxLength: 10 })

const arbitraryPhoto = () =>
  fc.record({
    id: fc.uuid(),
    base64Data: fc.string({ minLength: 1000, maxLength: 500000 }),
    mimeType: fc.constantFrom('image/jpeg', 'image/png'),
    capturedAt: fc.date(),
    sizeBytes: fc.integer({ min: 10000, max: 5000000 }),
  })

const arbitraryMedication = () =>
  fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }),
    type: fc.constantFrom('over-the-counter', 'prescription'),
    dosageCalculation: fc.record({
      baseAmount: fc.float({ min: 0.1, max: 100 }),
      unit: fc.constantFrom('ml', 'mg', 'g'),
      perWeightUnit: fc.float({ min: 0.1, max: 10 }),
      frequency: fc.constantFrom('once daily', 'twice daily', 'every 8 hours'),
      duration: fc.constantFrom('3 days', '5 days', '7 days', '14 days'),
    }),
    administrationMethod: fc.constantFrom('oral', 'injection', 'topical'),
    warnings: fc.array(fc.string({ minLength: 10, maxLength: 100 }), {
      maxLength: 5,
    }),
  })

const arbitraryTriageResult = () =>
  fc.record({
    urgency: fc.constantFrom('critical', 'urgent', 'monitor', 'normal'),
    immediateActions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), {
      minLength: 1,
      maxLength: 5,
    }),
    possibleConditions: fc.array(
      fc.record({
        condition: arbitraryCondition(),
        confidence: fc.float({ min: 0, max: 1 }),
      }),
      { minLength: 1, maxLength: 5 },
    ),
    recommendedNextSteps: fc.array(fc.string(), { maxLength: 5 }),
    shouldEscalateToVet: fc.boolean(),
    disclaimer: fc.constant(
      'This is not a substitute for professional veterinary care.',
    ),
  })
```
