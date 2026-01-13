# OpenLivestock Manager - Strategic Roadmap

This document outlines the strategic direction for future feature development, focusing on high-impact capabilities that solve critical challenges for farmers in developing regions.

## 🚀 Phase 1: The "Connected Farmer" (Existing Scope)

_Offline-first record keeping, basic financials, and inventory management._ (Current Status: **Beta**)

---

## 🌟 Phase 2: The "Smart Ecosystem" (Upcoming Features)

The following 5 features have been identified as high-priority differentiators.

### 1. 🤖 AI Veterinary Assistant ("Dr. AI")

**Problem:** Access to qualified veterinarians is expensive and slow in rural areas, leading to preventable livestock mortality.
**Solution:** A hybrid "Store-and-Forward" AI diagnostic tool.

**Technical Implementation:**

- **Offline Tier:** precise "Decision Tree" expert system embedded in the client for instant triage (e.g., "White droppings" + "Shivering" = "Isolate immediately").
- **Online Tier:** Integration with Multimodal LLMs (Gemini Pro Vision / GPT-4o).
- **Workflow:** Farmer snaps photo -> App compresses (<100KB) -> Server analysis -> Returns confidence score & care advice.
- **Safety:** Strict "Not a medical diagnosis" disclaimers and optional escalation to a human vet (see Feature #5).

### 2. 💰 Financial "Credit-Readiness" Passport

**Problem:** Smallholder farmers are "unbankable" because they lack verifiable records, locking them out of capital for expansion.
**Solution:** One-click generation of a cryptographically verifiable financial report.

**Technical Implementation:**

- **Metrics Engine:** Aggregates mortality risk, Feed Conversion Ratio (FCR), and historical cash flow.
- **Verification:** Server generates a signed PDF containing a unique QR Code.
- **Trust Chain:** Bank loan officer scans QR -> Redirects to `openlivestock.com/verify/{hash}` -> Confirms the paper record matches the immutable server data.

### 3. 🌐 Offline-First Marketplace

**Problem:** Middlemen exploit pricing opacity; farmers struggle to find buyers at harvest time.
**Solution:** A localized listing service that works with intermittent connectivity.

**Technical Implementation:**

- **Intent System:** Farmers create "Future Listings" (e.g., "500 Broilers ready Jan 20") stored locally in IndexedDB.
- **Privacy Fuzzing:** Location stored as precise lat/long but exposed via API as general region (e.g., "Kaduna South") to prevent theft.
- **Sync Architecture:** Background sync pushes listings to a public table when connectivity is available.
- **Schema Dependency:** Requires migration to add `latitude` (decimal) and `longitude` (decimal) to `farms` table.

### 4. 📡 IoT Sensor Hub

**Problem:** Environmental fluctuations (temp/humidity) can wipe out entire batches overnight; manual checking is unreliable.
**Solution:** A developer-friendly API for low-cost hardware execution.

**Technical Implementation:**

- **Ingestion API:** Lightweight endpoint (`POST /api/v1/sensors/ingest`) accepting JSON payloads from ESP32/Arduino devices.
- **Auth:** Standard API Key authentication manageable via User Settings.
- **Alerting Engine:** Background jobs monitor thresholds (e.g., `if temp > 32°C`) and trigger push notifications to the farmer's mobile app.

### 5. 👨‍🌾 Extension Worker Mode (B2B/Gov Layer)

**Problem:** Government agents and NGO workers manage hundreds of farmers using inefficient paper notebooks.
**Solution:** A multi-tenant "Super User" interface for remote monitoring and management.

**Technical Implementation:**

- **Observer Pattern:** "Agent" users have no farm data but merely "Observe" linked farms.
- **Linked Accounts:** OAuth-style handshake where a Farmer acts as the "Resource Owner" granting scope-limited access to an Agent.
- **Remote Triage:** Agents can view aggregated mortality/growth charts across their entire district to spot disease outbreaks early.
- **Digital Prescriptions:** "Visit Records" created by Agents sync directly to the farmer's specific "Vet Visits" tab for compliance tracking.

---

### 6. 🧪 Feed Formulation Calculator

**Problem:** Commercial feed accounts for 70% of production costs. Farmers can save ~30% by milling their own feed but lack the mathematical expertise to balance nutrients correctly.
**Solution:** A linear-programming solver engine for cost-optimized nutrition.

**Technical Implementation:**

- **Ingredient Database:** Local DB of common ingredients (Maize, Soya, Fishmeal) with their nutritional profiles (Protein%, Energy, Calcium, Cost/kg).
- **The Solver:** A client-side algorithm (Simplex method) that accepts constraints ("I need 21% Protein, Energy > 3000kcal") and available ingredients.
- **Output:** Exact mixing ratio (e.g., "60% Maize, 25% Soya, 15% Premix") optimized for the lowest possible cost.

### 7. 👥 Digital Foreman (Staff Management)

**Problem:** Absentee farm owners suffer huge losses due to staff theft, negligence, or "ghost inventory" reporting.
**Solution:** Granular permission system and audit trails for farm hands.

**Technical Implementation:**

- **Role-Based Access Control (RBAC):** New roles like `Staff` (Can log mortality/feed, Cannot see financials) and `Manager` (Can see reports, Cannot delete batches).
- **GPS-Fenced Clocking:** Staff can only "Clock In" when their device GPS is actually within the Farm geofence.
- **Attributable Actions:** Every record (e.g., "5 dead birds") is tagged with the `user_id` of the staff member who reported it, creating accountability.
- **Inventory Audit:** "Blind Count" mode where staff enter what they count, and the system flags discrepancies against expected stock.
- **Schema Dependency:** Requires migration to add `latitude` (decimal) and `longitude` (decimal) to `farms` table for geofencing.

### 8. 🔄 Offline Data Sync Engine (V2)

**Problem:** Basic PWA caching allows viewing, but editing offline creates conflict risks (e.g., two staff editing the same batch).
**Solution:** A robust "Conflict-Free Replicated Data Type" (CRDT) inspired sync engine.

**Technical Implementation:**

- **Mutation Queue:** Offline actions (create batch, log mortality) stored in IndexedDB as a "Queue".
- **Replication Protocol:** When online, the queue replays against the server.
- **Conflict Resolution:** "Last Write Wins" or smart merging for simultaneous edits.
- **Background Sync:** Leveraging the Service Worker Background Sync API to retry failed uploads automatically.

### 9. 🛡️ Automated Quality Pipeline

**Problem:** As features grow, manual testing becomes impossible, creating regression risks.
**Solution:** Full End-to-End (E2E) testing suite running on every commit.

**Technical Implementation:**

- **Playwright Suite:** Automated browser tests that click through "Onboarding", "Create Batch", and "Sale" flows.
- **Visual Regression:** Comparing screenshots of the dashboard pixel-by-pixel to catch CSS breaks.
- **CI/CD Integration:** GitHub Actions blocking merges if the "Critical Path" is broken.

### 10. 📈 Intelligent Forecasting Models

**Problem:** Farmers guess harvest dates based on gut feeling, often missing peak market windows.
**Solution:** Data-driven predictions using standard growth curves.

**Technical Implementation:**

- **Growth Standards:** DB tables with "Target Weight by Day" for Broilers, Catfish, etc. (Partially implemented).
- **Deviation Alerting:** "Your batch is 10% below target weight -> Increase protein feed."
- **Harvest Date Prediction:** "Based on current ADG (Average Daily Gain), birds will hit 2.5kg on Feb 14th."
