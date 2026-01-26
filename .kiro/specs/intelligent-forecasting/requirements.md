# Requirements Document

## Introduction

The Intelligent Forecasting feature provides data-driven growth predictions and harvest planning for livestock batches. Building on the Reference Data Foundation (which provides breed-specific growth curves), this feature delivers visual growth tracking, deviation alerts, and accurate harvest date predictions. Farmers can see at a glance whether their batches are on track, behind, or ahead of expected growth, enabling proactive management decisions and optimal market timing.

## Glossary

- **ADG**: Average Daily Gain - the average weight increase per day, calculated from weight samples
- **Growth_Curve**: A line representing expected weight over time for a species/breed from growth_standards table
- **Performance_Index**: Ratio of actual weight to expected weight, expressed as a percentage
- **Deviation_Alert**: A notification triggered when a batch's performance deviates significantly from expected growth
- **Forecast_Card**: A UI component displaying growth projections and harvest predictions
- **Growth_Chart**: A visual chart comparing actual weight samples against the expected growth curve
- **Weight_Sample**: A recorded measurement of average livestock weight at a specific date
- **Harvest_Window**: The projected date range when livestock will reach target market weight
- **Batch**: A group of livestock acquired and managed together

## Requirements

### Requirement 1: Enhanced Forecast Calculation

**User Story:** As a farm manager, I want accurate growth forecasts based on my actual weight samples, so that I can plan harvests with confidence.

#### Acceptance Criteria

1. WHEN calculating projections for a batch with weight samples, THE Forecasting_System SHALL compute ADG from the two most recent weight samples
2. WHEN calculating projections for a batch with only one weight sample, THE Forecasting_System SHALL estimate ADG using the growth curve slope at the current age
3. WHEN calculating projections for a batch with no weight samples, THE Forecasting_System SHALL use the standard growth curve to estimate current weight based on age
4. THE Forecasting_System SHALL calculate Performance_Index as (actual_weight / expected_weight) \* 100
5. WHEN Performance_Index is between 95 and 105, THE Forecasting_System SHALL classify the batch as "on_track"
6. WHEN Performance_Index is below 95, THE Forecasting_System SHALL classify the batch as "behind"
7. WHEN Performance_Index is above 105, THE Forecasting_System SHALL classify the batch as "ahead"
8. THE Forecasting_System SHALL project harvest date by calculating days remaining to reach target weight using current ADG

### Requirement 2: Forecast Card Component

**User Story:** As a farm manager, I want to see a summary of my batch's growth performance at a glance, so that I can quickly assess batch health.

#### Acceptance Criteria

1. THE Forecast_Card SHALL display current estimated weight and expected weight for the batch's age
2. THE Forecast_Card SHALL display Performance_Index as a percentage with color coding (green for on_track, amber for behind, red for critical)
3. THE Forecast_Card SHALL display projected harvest date and days remaining to target weight
4. THE Forecast_Card SHALL display current ADG and expected ADG for comparison
5. THE Forecast_Card SHALL display a status indicator showing "On Track", "Behind Schedule", or "Ahead of Schedule"
6. THE Forecast_Card SHALL display estimated profit projection based on current trajectory
7. WHEN no weight samples exist, THE Forecast_Card SHALL show estimated values based on growth curve with a note indicating estimates are based on standard growth

### Requirement 3: Growth Chart Visualization

**User Story:** As a farm manager, I want to see my batch's growth compared to the expected curve, so that I can identify trends and take corrective action.

#### Acceptance Criteria

1. THE Growth_Chart SHALL display a line chart with days from acquisition on the X-axis
2. THE Growth_Chart SHALL display weight on the Y-axis using the user's preferred weight unit (kg or lbs)
3. THE Growth_Chart SHALL render the expected growth curve as a reference line from growth_standards
4. THE Growth_Chart SHALL render actual weight samples as data points connected by a line
5. THE Growth_Chart SHALL visually indicate deviation zones (±10% from expected) with shaded regions
6. WHEN hovering over a data point, THE Growth_Chart SHALL display a tooltip with date, actual weight, expected weight, and deviation percentage
7. THE Growth_Chart SHALL include a legend distinguishing expected curve from actual measurements

### Requirement 4: Average Daily Gain Calculation

**User Story:** As a farm manager, I want to know my batch's actual growth rate, so that I can compare it to breed standards and adjust management.

#### Acceptance Criteria

1. THE ADG_Calculator SHALL compute ADG as (weight_difference / days_between_samples) from the two most recent weight samples
2. WHEN only one weight sample exists, THE ADG_Calculator SHALL compute ADG as (current_weight - initial_weight) / days_since_acquisition
3. THE ADG_Calculator SHALL return expected ADG from the growth curve for the batch's current age
4. THE ADG_Calculator SHALL express ADG in grams per day for consistency
5. WHEN ADG is negative, THE ADG_Calculator SHALL flag this as an anomaly requiring investigation

### Requirement 5: Deviation Alerts

**User Story:** As a farm manager, I want to be notified when my batch falls behind or gets ahead of expected growth, so that I can take timely action.

#### Acceptance Criteria

1. WHEN a batch's Performance_Index falls below 90, THE Alert_System SHALL create a notification with type "growthDeviation" and severity "warning"
2. WHEN a batch's Performance_Index falls below 80, THE Alert_System SHALL create a notification with type "growthDeviation" and severity "critical"
3. WHEN a batch's Performance_Index exceeds 110, THE Alert_System SHALL create a notification with type "earlyHarvest" and severity "info"
4. THE Alert_System SHALL include actionable recommendations in the notification message based on deviation type
5. WHEN a behind-schedule alert is created, THE Alert_System SHALL suggest actions like "Increase protein feed" or "Check for disease"
6. WHEN an ahead-of-schedule alert is created, THE Alert_System SHALL suggest "Consider early harvest opportunity"
7. THE Alert_System SHALL link notifications to the batch detail page via actionUrl
8. THE Alert_System SHALL not create duplicate alerts for the same batch within 24 hours

### Requirement 6: Batch Detail Page Integration

**User Story:** As a farm manager, I want to see forecasting information prominently on my batch detail page, so that I can monitor growth without navigating elsewhere.

#### Acceptance Criteria

1. THE Batch_Detail_Page SHALL display the Forecast_Card in a prominent position above the tabs
2. THE Batch_Detail_Page SHALL include a "Growth" tab containing the Growth_Chart
3. THE Batch_Detail_Page SHALL display current weight, expected weight, and Performance_Index in the KPI section
4. WHEN the batch has no target weight set, THE Batch_Detail_Page SHALL prompt the user to set a target weight for forecasting

### Requirement 7: Dashboard Integration

**User Story:** As a farm manager, I want to see batches with growth deviations on my dashboard, so that I can prioritize attention to underperforming batches.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Batches Needing Attention" section showing batches with Performance_Index below 90 or above 110
2. THE Dashboard SHALL display upcoming harvest dates for active batches within the next 14 days
3. WHEN clicking a batch in the attention section, THE Dashboard SHALL navigate to the batch detail page
4. THE Dashboard SHALL show a maximum of 5 batches in the attention section, sorted by deviation severity

### Requirement 8: Server Functions for Forecasting

**User Story:** As a developer, I want API endpoints for forecasting data, so that the UI can fetch and display projections efficiently.

#### Acceptance Criteria

1. THE getEnhancedProjectionFn SHALL return current weight, expected weight, Performance_Index, ADG, expected ADG, projected harvest date, days remaining, and status
2. THE getGrowthChartDataFn SHALL return an array of data points containing day, expected weight, and actual weight (if sampled)
3. THE checkDeviationAlertsFn SHALL evaluate all active batches and create notifications for significant deviations
4. THE Server_Functions SHALL use dynamic imports for database access to support Cloudflare Workers
5. IF a batch has no growth standards available, THEN THE Server_Functions SHALL return null with an appropriate message
