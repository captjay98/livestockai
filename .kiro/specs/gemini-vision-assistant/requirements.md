# Requirements Document

## Introduction

This document specifies requirements for the Gemini Vision Assistant - a comprehensive AI-powered livestock assessment system for OpenLivestock Manager. The Vision Assistant operates in two complementary modes:

1. **Live Mode**: Real-time frame-by-frame video analysis using Gemini 3 Flash's standard API for continuous assessment, weight estimation, counting, and adaptive guidance through the phone camera.

2. **Vet Assist Mode**: Offline-capable diagnostic tool combining an embedded decision tree expert system for instant triage with optional AI-powered photo analysis for detailed diagnosis.

The Vision Assistant is designed for the "Real-Time Teacher" hackathon track, demonstrating not just object detection but true multimodal understanding with context-aware responses, actionable outputs, and adaptive teaching that explains reasoning to help farmers learn. The Vet Assist mode addresses the critical need for veterinary guidance in rural areas with limited connectivity and expensive/slow access to qualified veterinarians.

## Glossary

- **Vision_Assistant**: The comprehensive AI livestock assessment system with Live and Vet Assist modes
- **Live_Mode**: Real-time frame-by-frame video analysis mode using Gemini 3 Flash for continuous assessment
- **Vet_Assist_Mode**: Diagnostic mode combining offline decision tree with optional AI photo analysis
- **Gemini_3_Flash**: Google's fast multimodal model that processes images with low latency. Note: Gemini 3 models do NOT support the Live API (per [official docs](https://ai.google.dev/gemini-api/docs/models), January 2026), so frame-by-frame analysis via standard API is the only approach for real-time video.
- **Frame_Analysis**: Capturing individual video frames and sending them to Gemini 3 for analysis. This is the required approach since Gemini 3 models don't support the Live API.
- **Camera_Stream**: The continuous video feed from the user's device camera sent to the Vision Assistant
- **Health_Assessment**: An AI-generated evaluation of livestock health based on visual cues (feathering, mobility, behavior)
- **Weight_Estimation**: An AI-generated estimate of animal weight based on visual analysis and spatial understanding
- **Flock_Count**: An AI-generated count of animals visible in the camera frame with movement tracking
- **Behavior_Analysis**: Detection and interpretation of abnormal behavior patterns in livestock
- **Adaptive_Guidance**: Context-aware advice that considers batch data, history, and current observations
- **Vision_Session**: An active camera analysis session with frame-by-frame Gemini analysis
- **Observation_Log**: A record of significant findings captured during a Vision Session
- **Voice_Interface**: Hands-free audio input/output for farmer interaction during camera use
- **Farm_Context**: Batch data, growth curves, recent events, and benchmarks used to inform analysis
- **Visual_Overlay**: On-screen annotations highlighting detected animals, health concerns, or measurements
- **Decision_Tree**: An embedded expert system that provides instant offline triage based on symptom combinations
- **Symptom_Checklist**: A structured list of observable symptoms the farmer can select for decision tree analysis
- **Triage_Result**: The output of the decision tree including urgency level, immediate actions, and possible conditions
- **Photo_Diagnosis**: AI analysis of a single captured photo for detailed health assessment
- **Diagnosis_Queue**: Photos captured offline that are queued for AI analysis when connectivity is restored
- **Care_Protocol**: Step-by-step treatment or management instructions based on diagnosis
- **Vet_Escalation**: Option to share diagnosis with a human veterinarian for professional consultation

## Requirements

### Requirement 1: Camera Stream Integration

**User Story:** As a farmer, I want to point my phone camera at my livestock and get instant AI analysis, so that I can quickly assess my animals without manual data entry.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL request camera permissions when first accessed
2. WHEN camera access is granted, THE Vision_Assistant SHALL display a live camera preview
3. THE Vision_Assistant SHALL capture video frames at a minimum of 1 frame per second for analysis
4. THE Vision_Assistant SHALL support both rear and front-facing cameras with a toggle control
5. THE Vision_Assistant SHALL work in landscape and portrait orientations
6. IF camera access is denied, THEN THE Vision_Assistant SHALL display a clear message explaining why camera access is needed
7. THE Vision_Assistant SHALL minimize battery consumption by pausing analysis when the app is backgrounded

### Requirement 2: Gemini 3 Flash Frame Analysis

**User Story:** As a farmer, I want real-time AI responses as I move my camera, so that I get immediate feedback without waiting for uploads.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL capture video frames at 1-2 FPS and send them to Gemini 3 Flash for analysis
2. THE Vision_Assistant SHALL send frames to the Gemini 3 Flash standard API with image input
3. THE Vision_Assistant SHALL receive and display AI responses within 2 seconds of frame capture
4. WHEN the API request fails, THE Vision_Assistant SHALL retry up to 3 times with exponential backoff
5. IF all retries fail, THEN THE Vision_Assistant SHALL notify the user and offer manual retry
6. THE Vision_Assistant SHALL display a connection status indicator (analyzing, idle, error)
7. THE Vision_Assistant SHALL gracefully handle API rate limits by reducing frame rate

### Requirement 3: Farm Context Integration

**User Story:** As a farmer, I want the AI to know about my specific batch when analyzing, so that its advice is relevant to my situation.

#### Acceptance Criteria

1. WHEN starting a Vision_Session, THE Vision_Assistant SHALL load the selected batch's data from the database
2. THE Vision_Assistant SHALL include batch species, age, current quantity, and growth targets in the AI context
3. THE Vision_Assistant SHALL include the batch's recent mortality records (last 7 days) in the AI context
4. THE Vision_Assistant SHALL include the batch's recent weight samples in the AI context
5. THE Vision_Assistant SHALL include relevant growth standards for the species in the AI context
6. THE Vision_Assistant SHALL allow users to select which batch they are inspecting before starting analysis
7. IF no batch is selected, THEN THE Vision_Assistant SHALL provide general analysis without batch-specific context

### Requirement 4: Live Health Assessment

**User Story:** As a farmer, I want the AI to identify sick animals in my flock, so that I can isolate and treat them early.

#### Acceptance Criteria

1. WHEN analyzing poultry, THE Vision_Assistant SHALL identify birds showing reduced mobility
2. WHEN analyzing poultry, THE Vision_Assistant SHALL identify birds with ruffled or abnormal feathering
3. WHEN analyzing poultry, THE Vision_Assistant SHALL identify birds showing respiratory distress signs
4. WHEN analyzing fish, THE Vision_Assistant SHALL identify fish showing abnormal swimming patterns
5. WHEN analyzing fish, THE Vision_Assistant SHALL identify fish with visible lesions or discoloration
6. WHEN health concerns are detected, THE Vision_Assistant SHALL highlight affected animals with Visual_Overlay
7. THE Vision_Assistant SHALL provide a count of healthy vs. concerning animals visible in frame
8. THE Vision_Assistant SHALL explain the visual cues that led to each health assessment

### Requirement 5: Weight Estimation

**User Story:** As a farmer, I want to estimate my animals' weight by pointing my camera at them, so that I can track growth without manual weighing.

#### Acceptance Criteria

1. WHEN analyzing livestock, THE Vision_Assistant SHALL estimate average weight of visible animals
2. THE Vision_Assistant SHALL provide weight estimates with confidence intervals (e.g., 800g ±50g)
3. THE Vision_Assistant SHALL compare estimated weight against the growth standard curve for the species
4. THE Vision_Assistant SHALL calculate estimated days to target harvest weight based on current growth rate
5. WHEN weight estimation is performed, THE Vision_Assistant SHALL offer to log the estimate as a weight sample
6. THE Vision_Assistant SHALL indicate when lighting or angle conditions may affect estimation accuracy
7. THE Vision_Assistant SHALL support weight estimation for poultry, fish, cattle, goats, and sheep

### Requirement 6: Flock Counting

**User Story:** As a farmer, I want to count my animals by scanning with my camera, so that I can verify my records without manual counting.

#### Acceptance Criteria

1. WHEN analyzing a group of animals, THE Vision_Assistant SHALL count visible animals in the frame
2. THE Vision_Assistant SHALL track animal movement to avoid double-counting as the camera pans
3. THE Vision_Assistant SHALL display a running count with Visual_Overlay markers on counted animals
4. THE Vision_Assistant SHALL provide a confidence level for the count based on visibility conditions
5. WHEN counting is complete, THE Vision_Assistant SHALL compare the count against the batch's recorded quantity
6. IF the count differs significantly from records, THE Vision_Assistant SHALL suggest possible explanations
7. THE Vision_Assistant SHALL support counting for all livestock types (poultry, fish, cattle, goats, sheep)

### Requirement 7: Behavior Analysis

**User Story:** As a farmer, I want the AI to detect abnormal behavior in my livestock, so that I can identify problems before they become serious.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL detect abnormal feeding behavior (not eating, aggressive feeding)
2. THE Vision_Assistant SHALL detect abnormal movement patterns (lethargy, circling, isolation)
3. THE Vision_Assistant SHALL detect signs of stress (huddling, panting, excessive vocalization)
4. WHEN abnormal behavior is detected, THE Vision_Assistant SHALL suggest possible causes based on Farm_Context
5. THE Vision_Assistant SHALL correlate observed behavior with recent events (feed changes, weather, vaccinations)
6. THE Vision_Assistant SHALL distinguish between individual animal issues and flock-wide patterns
7. THE Vision_Assistant SHALL provide severity ratings for detected behavioral anomalies (low, medium, high)

### Requirement 8: Adaptive Guidance and Teaching

**User Story:** As a farmer, I want the AI to explain its reasoning and teach me what to look for, so that I can learn to identify problems myself.

#### Acceptance Criteria

1. WHEN providing assessments, THE Vision_Assistant SHALL explain the visual cues that led to conclusions
2. THE Vision_Assistant SHALL provide educational context about common health issues for the species
3. THE Vision_Assistant SHALL suggest specific actions based on observations (isolate, monitor, treat, call vet)
4. THE Vision_Assistant SHALL adapt explanation detail based on user interaction patterns
5. WHEN asked follow-up questions, THE Vision_Assistant SHALL provide detailed explanations
6. THE Vision_Assistant SHALL reference industry best practices and growth benchmarks in guidance
7. THE Vision_Assistant SHALL offer to create tasks or reminders based on its recommendations

### Requirement 9: Voice Interface

**User Story:** As a farmer, I want to interact with the AI using voice commands, so that I can keep my hands free while working with animals.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL support voice input for commands and questions
2. THE Vision_Assistant SHALL provide audio responses that can be heard while viewing the camera
3. THE Vision_Assistant SHALL support commands: "start analysis", "stop", "count animals", "check health", "estimate weight"
4. THE Vision_Assistant SHALL support natural language questions about what it observes
5. THE Vision_Assistant SHALL provide visual feedback when voice input is being processed
6. IF voice recognition fails, THEN THE Vision_Assistant SHALL offer text input as fallback
7. THE Vision_Assistant SHALL allow users to disable voice features if preferred

### Requirement 10: Observation Logging

**User Story:** As a farmer, I want significant observations to be automatically logged, so that I have a record of what the AI found.

#### Acceptance Criteria

1. WHEN health concerns are detected with high confidence, THE Vision_Assistant SHALL offer to create an Observation_Log
2. THE Observation_Log SHALL include: timestamp, batch ID, observation type, description, and confidence score
3. THE Observation_Log SHALL include a screenshot of the relevant frame with Visual_Overlay
4. THE Vision_Assistant SHALL allow users to add notes to observations before saving
5. WHEN an observation is logged, THE Vision_Assistant SHALL create a notification if severity is high
6. THE Vision_Assistant SHALL integrate observations with the existing audit_logs system
7. THE Vision_Assistant SHALL allow users to review past observations from the batch detail page

### Requirement 11: Task Creation Integration

**User Story:** As a farmer, I want the AI to create tasks based on what it finds, so that I don't forget to follow up on issues.

#### Acceptance Criteria

1. WHEN the Vision_Assistant recommends an action, THE System SHALL offer to create a task
2. THE Vision_Assistant SHALL suggest appropriate task titles based on the observation
3. THE Vision_Assistant SHALL set task priority based on observation severity
4. THE Vision_Assistant SHALL link created tasks to the relevant batch
5. WHEN a task is created, THE Vision_Assistant SHALL confirm with the user before saving
6. THE Vision_Assistant SHALL use the existing tasks system for task creation
7. THE Vision_Assistant SHALL suggest task frequency (one-time, daily monitoring) based on issue type

### Requirement 12: Environmental Assessment

**User Story:** As a farmer, I want the AI to assess my farm environment, so that I can identify conditions that might affect my livestock.

#### Acceptance Criteria

1. WHEN analyzing video, THE Vision_Assistant SHALL assess visible lighting conditions
2. THE Vision_Assistant SHALL identify potential ventilation issues based on animal behavior
3. THE Vision_Assistant SHALL identify overcrowding if animal density appears excessive
4. THE Vision_Assistant SHALL assess water and feed station accessibility and cleanliness
5. WHEN environmental concerns are detected, THE Vision_Assistant SHALL explain the potential impact on livestock
6. THE Vision_Assistant SHALL suggest environmental improvements based on observations
7. FOR fish ponds, THE Vision_Assistant SHALL assess water clarity and surface conditions

### Requirement 13: Session Management

**User Story:** As a farmer, I want to start and stop analysis sessions easily, so that I can control when the AI is actively analyzing.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL provide clear start/stop controls for Vision_Sessions
2. WHEN a session ends, THE Vision_Assistant SHALL display a summary of observations made
3. THE Vision_Assistant SHALL track session duration and display it to the user
4. THE Vision_Assistant SHALL automatically end sessions after 10 minutes of inactivity
5. THE Vision_Assistant SHALL allow users to resume analysis after a pause
6. THE Vision_Assistant SHALL save session summaries for later review
7. THE Vision_Assistant SHALL limit concurrent sessions to one per user

### Requirement 14: Offline Graceful Degradation

**User Story:** As a farmer in a rural area, I want the app to handle poor connectivity gracefully, so that I can still use basic features.

#### Acceptance Criteria

1. WHEN connectivity is poor, THE Vision_Assistant SHALL reduce frame rate to maintain connection
2. WHEN connectivity is lost, THE Vision_Assistant SHALL queue observations for later sync
3. THE Vision_Assistant SHALL display clear connectivity status to the user
4. IF the Gemini API is unavailable, THEN THE Vision_Assistant SHALL offer to capture photos for later analysis
5. THE Vision_Assistant SHALL cache recent batch context data for offline reference
6. WHEN connectivity is restored, THE Vision_Assistant SHALL sync queued observations automatically
7. THE Vision_Assistant SHALL provide estimated data usage for users on limited plans

### Requirement 15: Privacy and Data Handling

**User Story:** As a farmer, I want my video data handled securely, so that my farm operations remain private.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL NOT store raw video data beyond the active session
2. THE Vision_Assistant SHALL only transmit video frames to the Gemini API, not to other services
3. THE Vision_Assistant SHALL display a privacy notice before first use explaining data handling
4. THE Vision_Assistant SHALL allow users to delete all observation logs and screenshots
5. THE Vision_Assistant SHALL NOT include identifiable human faces in logged screenshots
6. THE Vision_Assistant SHALL comply with the existing audit_logs privacy requirements
7. THE Vision_Assistant SHALL provide an option to disable screenshot capture in observations

---

## Vet Assist Mode Requirements

### Requirement 16: Mode Selection

**User Story:** As a farmer, I want to choose between live video analysis and quick photo diagnosis, so that I can use the right tool for my situation.

#### Acceptance Criteria

1. THE Vision_Assistant SHALL provide a clear mode selector between Live_Mode and Vet_Assist_Mode
2. THE Vision_Assistant SHALL remember the user's last used mode as default
3. WHEN in Vet_Assist_Mode, THE Vision_Assistant SHALL display a different UI optimized for photo capture and symptom selection
4. THE Vision_Assistant SHALL allow switching between modes without losing context
5. THE Vision_Assistant SHALL indicate which mode works offline (Vet_Assist_Mode decision tree)
6. IF connectivity is unavailable, THEN THE Vision_Assistant SHALL automatically suggest Vet_Assist_Mode
7. THE Vision_Assistant SHALL display mode-specific help text explaining capabilities

### Requirement 17: Offline Decision Tree Triage

**User Story:** As a farmer without internet access, I want instant guidance on sick animals, so that I can take immediate action without waiting for connectivity.

#### Acceptance Criteria

1. THE Vet_Assist_Mode SHALL include an embedded Decision_Tree that works completely offline
2. THE Decision_Tree SHALL cover common conditions for all supported species (poultry, fish, cattle, goats, sheep)
3. THE Decision_Tree SHALL present a Symptom_Checklist with species-appropriate symptoms
4. WHEN symptoms are selected, THE Decision_Tree SHALL provide a Triage_Result within 1 second
5. THE Triage_Result SHALL include: urgency level (critical/urgent/monitor), immediate actions, and possible conditions
6. THE Decision_Tree SHALL support at least 50 symptom combinations per species
7. THE Decision_Tree data SHALL be bundled with the app and updated via app updates
8. THE Decision_Tree SHALL NOT require any network requests to function

### Requirement 18: Symptom Checklist Interface

**User Story:** As a farmer, I want to quickly select the symptoms I observe, so that I can get a diagnosis without typing.

#### Acceptance Criteria

1. THE Symptom_Checklist SHALL be organized by body system (respiratory, digestive, skin, behavior, etc.)
2. THE Symptom_Checklist SHALL use simple, farmer-friendly language (not medical jargon)
3. THE Symptom_Checklist SHALL include visual icons for each symptom category
4. THE Symptom_Checklist SHALL support multi-select for animals showing multiple symptoms
5. THE Symptom_Checklist SHALL show symptom descriptions with example photos when tapped
6. THE Symptom_Checklist SHALL filter symptoms based on selected species
7. THE Symptom_Checklist SHALL highlight "red flag" symptoms that indicate critical conditions

### Requirement 19: Photo Capture for Diagnosis

**User Story:** As a farmer, I want to take a photo of a sick animal for AI analysis, so that I can get a more detailed diagnosis than the symptom checklist alone.

#### Acceptance Criteria

1. THE Vet_Assist_Mode SHALL allow capturing a single photo for diagnosis
2. THE Photo_Diagnosis SHALL compress images to under 100KB for efficient transmission
3. THE Photo_Diagnosis SHALL support capturing multiple photos of the same animal (different angles)
4. WHEN online, THE Photo_Diagnosis SHALL send the photo to Gemini API for analysis
5. WHEN offline, THE Photo_Diagnosis SHALL queue photos in the Diagnosis_Queue for later analysis
6. THE Photo_Diagnosis SHALL combine photo analysis with selected symptoms for better accuracy
7. THE Photo_Diagnosis SHALL provide confidence scores for each possible condition identified

### Requirement 20: Diagnosis Queue and Store-Forward

**User Story:** As a farmer in an area with intermittent connectivity, I want my photos queued for analysis when I get signal, so that I don't lose my diagnostic requests.

#### Acceptance Criteria

1. THE Diagnosis_Queue SHALL store photos locally in IndexedDB when offline
2. THE Diagnosis_Queue SHALL display pending diagnoses with their capture time
3. WHEN connectivity is restored, THE Diagnosis_Queue SHALL automatically process pending photos
4. THE Diagnosis_Queue SHALL notify the user when queued diagnoses are complete
5. THE Diagnosis_Queue SHALL retain photos for up to 7 days if not processed
6. THE Diagnosis_Queue SHALL allow users to cancel pending diagnoses
7. THE Diagnosis_Queue SHALL show estimated data usage for pending uploads

### Requirement 21: Care Protocols and Treatment Guidance

**User Story:** As a farmer, I want step-by-step treatment instructions after diagnosis, so that I know exactly what to do.

#### Acceptance Criteria

1. WHEN a diagnosis is provided, THE Vet_Assist_Mode SHALL display a Care_Protocol
2. THE Care_Protocol SHALL include: immediate actions, medication recommendations, isolation guidance, and monitoring schedule
3. THE Care_Protocol SHALL be available offline (bundled with decision tree data)
4. THE Care_Protocol SHALL include dosage calculations based on estimated animal weight
5. THE Care_Protocol SHALL warn about medications that require veterinary prescription
6. THE Care_Protocol SHALL offer to create follow-up tasks for treatment schedules
7. THE Care_Protocol SHALL include "when to call a vet" criteria for each condition

### Requirement 22: Diagnosis History and Tracking

**User Story:** As a farmer, I want to track diagnoses over time, so that I can see patterns and share history with veterinarians.

#### Acceptance Criteria

1. THE Vet_Assist_Mode SHALL save all diagnoses to a Diagnosis_History
2. THE Diagnosis_History SHALL include: date, batch, symptoms selected, photos, AI analysis, and actions taken
3. THE Diagnosis_History SHALL be viewable from the batch detail page
4. THE Diagnosis_History SHALL support filtering by condition type and date range
5. THE Diagnosis_History SHALL generate a shareable PDF summary for vet consultations
6. THE Diagnosis_History SHALL integrate with Farm Sentinel for pattern detection
7. THE Diagnosis_History SHALL flag recurring conditions that may indicate systemic issues

### Requirement 23: Veterinarian Escalation

**User Story:** As a farmer, I want to easily share my diagnosis with a real veterinarian, so that I can get professional help when needed.

#### Acceptance Criteria

1. THE Vet_Assist_Mode SHALL provide a Vet_Escalation option for serious conditions
2. THE Vet_Escalation SHALL package diagnosis data (symptoms, photos, AI analysis) into a shareable format
3. THE Vet_Escalation SHALL support sharing via WhatsApp, email, or SMS
4. THE Vet_Escalation SHALL include farm location for vet visit coordination
5. THE Vet_Escalation SHALL integrate with Extension Worker Mode for government vet referrals
6. THE Vet_Escalation SHALL track escalation status (sent, viewed, responded)
7. THE Vet_Escalation SHALL display a clear disclaimer that AI diagnosis is not a substitute for professional veterinary care

### Requirement 24: Decision Tree Data Management

**User Story:** As a developer, I want the decision tree data to be maintainable and extensible, so that we can add new conditions and improve accuracy over time.

#### Acceptance Criteria

1. THE Decision_Tree data SHALL be stored in a structured JSON format
2. THE Decision_Tree SHALL support versioning for data updates
3. THE Decision_Tree SHALL include source references for each condition (veterinary literature)
4. THE Decision_Tree SHALL support regional variations (diseases common in specific areas)
5. THE Decision_Tree SHALL be testable with property-based tests for consistency
6. THE Decision_Tree SHALL log anonymized usage data for accuracy improvement (with user consent)
7. THE Decision_Tree SHALL support A/B testing of different diagnostic paths

### Requirement 25: Integration with Farm Sentinel

**User Story:** As a farmer, I want my diagnoses to inform the autonomous monitoring system, so that it can detect disease outbreaks early.

#### Acceptance Criteria

1. WHEN a diagnosis is recorded, THE Vet_Assist_Mode SHALL notify Farm Sentinel
2. THE Farm Sentinel SHALL correlate diagnoses with mortality and behavior data
3. THE Farm Sentinel SHALL alert if multiple animals show similar symptoms (outbreak detection)
4. THE Farm Sentinel SHALL track diagnosis accuracy over time (predicted vs actual outcomes)
5. THE Farm Sentinel SHALL use diagnosis patterns to improve anomaly detection thresholds
6. THE Farm Sentinel SHALL generate "disease risk" scores based on recent diagnoses
7. THE Farm Sentinel SHALL recommend preventive measures based on diagnosis trends

### Requirement 26: Integration with Farm Optimizer

**User Story:** As a farmer, I want health issues to inform optimization strategies, so that I can prevent future problems.

#### Acceptance Criteria

1. THE Farm Optimizer SHALL include diagnosis data in performance analysis
2. THE Farm Optimizer SHALL correlate health issues with environmental factors (feed, housing, weather)
3. THE Farm Optimizer SHALL generate strategies to reduce disease incidence
4. THE Farm Optimizer SHALL backtest health-related strategies against historical diagnosis data
5. THE Farm Optimizer SHALL calculate ROI of preventive measures (vaccination, biosecurity)
6. THE Farm Optimizer SHALL recommend infrastructure improvements based on recurring health issues
7. THE Farm Optimizer SHALL track the effectiveness of implemented health strategies

### Requirement 27: Medical Disclaimer and Safety

**User Story:** As a farmer, I want clear guidance on the limitations of AI diagnosis, so that I don't rely on it for critical decisions without professional consultation.

#### Acceptance Criteria

1. THE Vet_Assist_Mode SHALL display a prominent disclaimer that it is NOT a substitute for veterinary care
2. THE Vet_Assist_Mode SHALL recommend professional consultation for all critical/urgent diagnoses
3. THE Vet_Assist_Mode SHALL NOT recommend prescription medications without vet consultation
4. THE Vet_Assist_Mode SHALL log all diagnoses for liability and audit purposes
5. THE Vet_Assist_Mode SHALL provide emergency vet contact information based on user location
6. THE Vet_Assist_Mode SHALL refuse to diagnose if symptoms indicate zoonotic disease risk
7. THE Vet_Assist_Mode SHALL include confidence levels and explicitly state uncertainty
