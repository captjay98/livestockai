# Requirements Document

## Introduction

This document specifies requirements for the Farm Sentinel - an autonomous AI monitoring agent for OpenLivestock Manager. Farm Sentinel leverages Google Gemini 3's advanced capabilities to continuously monitor farm data streams, detect anomalies, reason about cause-and-effect relationships, and take corrective actions without human supervision.

Farm Sentinel is designed for the "Marathon Agent" hackathon track, demonstrating long-running autonomous operation over days/weeks, multi-day reasoning with context continuity using Thought Signatures, self-correction from feedback, and real autonomous actions that modify farm operations.

The key differentiator is that Farm Sentinel is NOT a chatbot - it runs autonomously without prompts, maintains context across sessions, learns from false positives, and takes real actions (creates tasks, sends alerts, modifies schedules).

## Glossary

- **Farm_Sentinel**: The autonomous AI monitoring agent that continuously watches farm data and takes corrective actions
- **Monitoring_Cycle**: A scheduled execution of the Sentinel that analyzes recent data and takes actions
- **Semantic_Memory**: Vector-based storage of thought embeddings in pgvector for context recall across sessions
- **Thought_Embedding**: A 768-dimensional vector representation of a monitoring cycle's analysis, stored for semantic search
- **Anomaly**: A deviation from expected patterns in farm metrics (mortality, feed consumption, growth rate, etc.)
- **Causal_Analysis**: The process of correlating anomalies with potential causes from historical events
- **Alert**: A notification sent to the farmer about detected issues requiring attention
- **Autonomous_Action**: An action taken by the Sentinel without human approval (within defined boundaries)
- **Feedback_Loop**: The mechanism by which farmer responses to alerts improve future detection accuracy
- **Threshold**: A configurable boundary that determines when a metric deviation triggers an alert
- **Baseline**: The expected normal range for a metric based on historical data and growth standards
- **Intervention**: A recommended or automated response to a detected anomaly
- **Sentinel_State**: The persistent state of the agent including learned thresholds and pending actions
- **Data_Stream**: Continuous flow of farm metrics (mortality, feed, weight, water quality) into the Sentinel
- **Correlation_Window**: The time period examined when searching for causal relationships (default: 7 days)
- **Confidence_Score**: A measure of certainty in an anomaly detection or causal analysis (0-1)
- **False_Positive**: An alert that the farmer marks as incorrect, used for threshold adjustment
- **Severity_Level**: Classification of anomaly urgency (low, medium, high, critical)
- **Context_Recall**: The process of finding similar past thoughts using vector similarity search

## Requirements

### Requirement 1: Continuous Data Monitoring

**User Story:** As a farmer, I want an AI that continuously monitors my farm data, so that problems are detected even when I'm not actively checking the app.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL collect and analyze mortality records from all active batches at each Monitoring_Cycle
2. THE Farm_Sentinel SHALL collect and analyze feed consumption records from all active batches at each Monitoring_Cycle
3. THE Farm_Sentinel SHALL collect and analyze weight sample data from all active batches at each Monitoring_Cycle
4. THE Farm_Sentinel SHALL collect and analyze water quality records for aquaculture batches at each Monitoring_Cycle
5. THE Farm_Sentinel SHALL run Monitoring_Cycles at configurable intervals (minimum: hourly, default: every 4 hours)
6. THE Farm_Sentinel SHALL process data from the last 24 hours in each Monitoring_Cycle
7. THE Farm_Sentinel SHALL maintain a rolling 7-day context window for pattern detection
8. WHEN a farm has no active batches, THE Farm_Sentinel SHALL skip monitoring for that farm

### Requirement 2: Anomaly Detection

**User Story:** As a farmer, I want the AI to detect unusual patterns in my farm data, so that I can address problems before they become serious.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL detect mortality rate increases that exceed the configured threshold above baseline
2. THE Farm_Sentinel SHALL detect feed consumption deviations (both increases and decreases) from expected patterns
3. THE Farm_Sentinel SHALL detect growth rate deviations from species-specific growth standards
4. THE Farm_Sentinel SHALL detect water quality parameter deviations (pH, temperature, dissolved oxygen, ammonia) for fish batches
5. WHEN an anomaly is detected, THE Farm_Sentinel SHALL assign a Severity_Level based on deviation magnitude
6. THE Farm_Sentinel SHALL calculate a Confidence_Score for each detected anomaly
7. THE Farm_Sentinel SHALL distinguish between single-day spikes and multi-day trends
8. THE Farm_Sentinel SHALL compare current metrics against both historical batch data and industry standards

### Requirement 3: Causal Reasoning and Correlation

**User Story:** As a farmer, I want the AI to explain why problems might be occurring, so that I can take the right corrective action.

#### Acceptance Criteria

1. WHEN an anomaly is detected, THE Farm_Sentinel SHALL search for correlated events within the Correlation_Window
2. THE Farm_Sentinel SHALL correlate mortality spikes with recent feed batch changes
3. THE Farm_Sentinel SHALL correlate mortality spikes with recent vaccination events
4. THE Farm_Sentinel SHALL correlate mortality spikes with water quality changes for fish batches
5. THE Farm_Sentinel SHALL correlate growth rate changes with feed type or quantity changes
6. THE Farm_Sentinel SHALL identify patterns that match known disease signatures
7. THE Farm_Sentinel SHALL provide a ranked list of probable causes with confidence scores
8. THE Farm_Sentinel SHALL explain its reasoning in human-readable format

### Requirement 4: Context Continuity with Semantic Memory

**User Story:** As a farmer, I want the AI to remember what it was tracking across days, so that it can follow up on developing situations.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL generate a thought embedding at the end of each Monitoring_Cycle using Gemini's embeddings API
2. THE Farm_Sentinel SHALL store thought embeddings in Neon PostgreSQL using pgvector for semantic search
3. THE Farm_Sentinel SHALL recall similar historical context at the start of each Monitoring_Cycle using vector similarity search
4. THE Farm_Sentinel SHALL track anomaly progression across multiple days
5. THE Farm_Sentinel SHALL update hypotheses based on new data confirming or refuting them
6. THE Farm_Sentinel SHALL maintain context for at least 14 days of monitoring history
7. WHEN an anomaly resolves, THE Farm_Sentinel SHALL note the resolution and contributing factors
8. THE Farm_Sentinel SHALL reference previous observations when reporting on ongoing situations
9. THE Farm_Sentinel SHALL use cosine similarity to find the most relevant past thoughts for current analysis

### Requirement 5: Alert Generation

**User Story:** As a farmer, I want to receive timely alerts about problems, so that I can take action before losses increase.

#### Acceptance Criteria

1. WHEN an anomaly with Severity_Level high or critical is detected, THE Farm_Sentinel SHALL create an Alert immediately
2. WHEN an anomaly with Severity_Level medium persists for 2+ days, THE Farm_Sentinel SHALL create an Alert
3. THE Alert SHALL include: affected batch, anomaly type, severity, probable causes, and recommended actions
4. THE Farm_Sentinel SHALL use the existing notifications system to deliver Alerts
5. THE Farm_Sentinel SHALL avoid duplicate alerts for the same ongoing anomaly within 24 hours
6. THE Farm_Sentinel SHALL escalate alert severity if an anomaly worsens over time
7. THE Farm_Sentinel SHALL include relevant metrics and trends in the Alert message
8. WHEN multiple related anomalies are detected, THE Farm_Sentinel SHALL consolidate them into a single Alert

### Requirement 6: Autonomous Actions

**User Story:** As a farmer, I want the AI to take certain actions automatically, so that responses happen even when I'm unavailable.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL create tasks in the existing task system for recommended follow-up actions
2. THE Farm_Sentinel SHALL set task priority based on anomaly Severity_Level
3. THE Farm_Sentinel SHALL link created tasks to the relevant batch
4. WHEN a critical water quality issue is detected, THE Farm_Sentinel SHALL create an urgent task for immediate inspection
5. THE Farm_Sentinel SHALL log all autonomous actions to the audit_logs table
6. THE Farm_Sentinel SHALL NOT take actions that directly modify livestock records (mortality, sales) without human confirmation
7. THE Farm_Sentinel SHALL provide action recommendations that require human approval for high-impact changes
8. THE Farm_Sentinel SHALL track which recommended actions have been completed

### Requirement 7: Self-Correction and Learning

**User Story:** As a farmer, I want the AI to learn from my feedback, so that it stops sending false alarms and gets better over time.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL allow farmers to mark alerts as False_Positive
2. WHEN an alert is marked as False_Positive, THE Farm_Sentinel SHALL adjust the relevant threshold
3. THE Farm_Sentinel SHALL track false positive rates per anomaly type
4. THE Farm_Sentinel SHALL use different thinking levels based on anomaly complexity
5. WHEN a hypothesis is confirmed by subsequent data, THE Farm_Sentinel SHALL increase confidence in similar future detections
6. WHEN a hypothesis is refuted by subsequent data, THE Farm_Sentinel SHALL decrease confidence and adjust reasoning
7. THE Farm_Sentinel SHALL maintain per-farm threshold adjustments based on historical feedback
8. THE Farm_Sentinel SHALL report its learning progress in periodic summary reports

### Requirement 8: Sentinel State Persistence

**User Story:** As a farmer, I want the AI monitoring to survive system restarts, so that it doesn't lose track of ongoing situations.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL persist its state to the database after each Monitoring_Cycle
2. THE Sentinel_State SHALL include: thought signatures, learned thresholds, active anomalies, pending actions
3. THE Farm_Sentinel SHALL recover its state from the database on startup
4. THE Farm_Sentinel SHALL handle state corruption gracefully by resetting to defaults
5. THE Farm_Sentinel SHALL maintain separate state per farm
6. THE Farm_Sentinel SHALL archive old state data after 30 days
7. THE Farm_Sentinel SHALL allow manual state reset by administrators
8. THE Farm_Sentinel SHALL log state transitions for debugging

### Requirement 9: Scheduled Execution

**User Story:** As a farmer, I want the AI to run automatically on a schedule, so that I don't have to manually trigger monitoring.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL be triggered by Cloudflare Workers Cron Triggers
2. THE Farm_Sentinel SHALL support configurable monitoring intervals per farm
3. THE Farm_Sentinel SHALL process all farms with active batches in each scheduled run
4. THE Farm_Sentinel SHALL complete processing within the Cloudflare Workers execution time limit
5. IF processing exceeds time limits, THE Farm_Sentinel SHALL queue remaining farms for the next cycle
6. THE Farm_Sentinel SHALL log execution metrics (duration, farms processed, anomalies detected)
7. THE Farm_Sentinel SHALL handle execution failures gracefully without losing state
8. THE Farm_Sentinel SHALL support manual triggering for testing and debugging

### Requirement 10: Dashboard and Visibility

**User Story:** As a farmer, I want to see what the AI is monitoring and thinking, so that I can trust its recommendations.

#### Acceptance Criteria

1. THE System SHALL provide a Sentinel dashboard showing current monitoring status
2. THE Dashboard SHALL display active anomalies being tracked with their severity and age
3. THE Dashboard SHALL show recent alerts and their resolution status
4. THE Dashboard SHALL display the Sentinel's current hypotheses and confidence levels
5. THE Dashboard SHALL show a timeline of Sentinel actions and observations
6. THE Dashboard SHALL allow farmers to view the reasoning behind specific alerts
7. THE Dashboard SHALL display threshold settings and allow adjustments
8. THE Dashboard SHALL show Sentinel health metrics (last run time, success rate)

### Requirement 11: Multi-Species Support

**User Story:** As a farmer with different livestock types, I want the AI to understand the specific needs of each species, so that monitoring is accurate for all my animals.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL apply species-specific mortality thresholds (poultry vs fish vs cattle)
2. THE Farm_Sentinel SHALL use species-specific growth standards for deviation detection
3. THE Farm_Sentinel SHALL recognize species-specific disease patterns
4. THE Farm_Sentinel SHALL apply appropriate water quality thresholds for different fish species
5. THE Farm_Sentinel SHALL adjust monitoring frequency based on species lifecycle stage
6. THE Farm_Sentinel SHALL provide species-appropriate recommendations in alerts
7. THE Farm_Sentinel SHALL support all livestock types in the system (poultry, fish, cattle, goats, sheep, bees)
8. THE Farm_Sentinel SHALL handle mixed-species farms with appropriate context separation

### Requirement 12: Integration with Existing Systems

**User Story:** As a farmer using OpenLivestock, I want the AI to work seamlessly with my existing data, so that I don't need to change how I record information.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL read data from existing database tables (batches, mortality_records, feed_records, weight_samples, water_quality)
2. THE Farm_Sentinel SHALL create notifications using the existing notifications table
3. THE Farm_Sentinel SHALL create tasks using the existing tasks table
4. THE Farm_Sentinel SHALL log actions using the existing audit_logs table
5. THE Farm_Sentinel SHALL respect user notification preferences from user_settings
6. THE Farm_Sentinel SHALL use growth_standards table for species benchmarks
7. THE Farm_Sentinel SHALL integrate with the existing authentication system for user context
8. THE Farm_Sentinel SHALL NOT require changes to existing data entry workflows

### Requirement 13: Performance and Reliability

**User Story:** As a farmer, I want the AI monitoring to be fast and reliable, so that I can trust it to catch problems in time.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL complete a Monitoring_Cycle for a single farm within 30 seconds
2. THE Farm_Sentinel SHALL handle API rate limits gracefully with exponential backoff
3. THE Farm_Sentinel SHALL continue monitoring other farms if one farm's analysis fails
4. THE Farm_Sentinel SHALL retry failed Gemini API calls up to 3 times
5. THE Farm_Sentinel SHALL log all errors with sufficient context for debugging
6. THE Farm_Sentinel SHALL maintain 99% uptime for scheduled monitoring cycles
7. THE Farm_Sentinel SHALL alert administrators if monitoring fails for 3 consecutive cycles
8. THE Farm_Sentinel SHALL optimize token usage to minimize API costs

### Requirement 14: Privacy and Security

**User Story:** As a farmer, I want my farm data to be handled securely, so that my business information remains private.

#### Acceptance Criteria

1. THE Farm_Sentinel SHALL only access data for farms the system is authorized to monitor
2. THE Farm_Sentinel SHALL NOT share farm data between different farm owners
3. THE Farm_Sentinel SHALL log all data access in audit_logs
4. THE Farm_Sentinel SHALL use secure API connections for Gemini API calls
5. THE Farm_Sentinel SHALL NOT store raw farm data in Gemini conversation history beyond the current session
6. THE Farm_Sentinel SHALL comply with existing data retention policies
7. THE Farm_Sentinel SHALL allow farm owners to opt out of AI monitoring
8. THE Farm_Sentinel SHALL provide data export for all Sentinel-generated insights
