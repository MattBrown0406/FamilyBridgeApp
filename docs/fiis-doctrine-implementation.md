# FIIS Doctrine Implementation Model

This repo already had multiple FIIS prompt surfaces. This document turns the newly defined FamilyBridge / FIIS doctrine into implementation-ready scaffolding rather than a broad rewrite.

## What this model establishes

### 1) FamilyBridge philosophy
- Hybrid, but boundary-first
- Pattern detection is a major secondary role
- Anti-enabling
- Anti-chaos adaptation
- Clear communication over soothing ambiguity
- Family-system realism over isolated-event thinking

### 2) Tone doctrine
- Compassionate authority
- Leader, not boss
- Warm, steady, clear
- Strong on boundaries without sounding punishing
- Treat enabling / codependency as pain-avoidance, not stupidity
- Use reflective listening before correction when possible

### 3) Knowledge architecture

#### Core anchors
- Claudia Black
- Murray Bowen
- Harriet Lerner
- Edwin Friedman
- Pia Mellody
- Carl Rogers

#### Adaptive lenses
- Boundary / enabling
- Pattern detection / systems
- Recovery / relapse support
- Communication / de-escalation
- Resistance / change-readiness
- Attachment / emotional bond

#### Background philosophy
- John Bradshaw
- Johann Hari
- Don Miguel Ruiz
- Gabor Maté-style trauma/context insight when useful
- Jung-like pattern/meaning reflection when useful
- Big Book context when denial or lack of insight needs explanation

### 4) Guardrail doctrine
- FIIS is a coaching and pattern-recognition tool, not a clinician, lawyer, or emergency responder.
- No diagnosis.
- No treatment prescriptions.
- No legal advice.
- No emergency-response substitution.
- Escalation Level 4 must say: **"Call 911 first"** immediately, then direct the user to moderator/help.
- Clear moderator/interventionist triggers must exist for the 24-hour support layer.
- Boundary doctrine:
  - A boundary without a consequence is a request.
  - Emotional escalation is not a consequence.
  - Consequences should be real, proportionate, repeatable, and ideally communicated from calm clarity.

## Repo-native implementation choices

### Shared edge-function doctrine helper
Created `supabase/functions/_shared/fiis-doctrine.ts`.

This file centralizes:
- doctrine prompt blocks
- adaptive lens selection
- escalation-level assessment
- moderator/interventionist escalation triggers
- surface guardrail copy

This should be the starting point for any new FIIS edge function.

### Frontend doctrine scaffolding
Created:
- `src/lib/fiisDoctrine.ts`
- `src/components/FIISDoctrineNotice.tsx`

These provide consistent UI copy for:
- FIIS guardrails
- boundary doctrine
- escalation ladder

### Existing edge functions updated to consume doctrine
Prompt surfaces now have a shared doctrinal core instead of drifting independently.

## Recommended next implementation pass
1. Replace remaining hard-coded FIIS prompts with `_shared/fiis-doctrine.ts`.
2. Add structured response metadata for edge functions:
   - active lenses used
   - detected escalation level
   - whether moderator escalation was recommended
3. Add analytics for:
   - rate of Level 3/4 trigger detection
   - rate of moderator escalation recommendations
   - boundary/consequence recommendation patterns
4. Add boundary-quality validation in boundary creation UI:
   - clarity
   - measurability
   - enforceability
   - consequence realism
5. Add a dedicated moderator escalation CTA component if a response reaches Level 3 or 4.

## Non-goals of this pass
- No broad UI rewrites
- No data-model redesign
- No replacement of current AI providers
- No hidden clinical positioning beyond stated guardrails

## 2026 Implementation Status Update

As of April 2026, the doctrine has been operationalized across the platform:

### Shared runtime plumbing (live)
- `supabase/functions/_shared/fiis-doctrine.ts` — core anchors, lenses, escalation ladder, guardrails
- `supabase/functions/_shared/fiis-runtime.ts` — audience + mode + lens selection, plain-language surface toggle
- `supabase/functions/_shared/fiis-family-context.ts` — per-family context aggregation (sobriety, boundaries, emotional check-ins, meetings, messages, financial, coaching, medications, provider notes, aftercare, calibration patterns, feedback, values, goals)
- `supabase/functions/_shared/fiis-telemetry.ts` — runtime flags (helpful_rate, false_positive_rate, false_negative_rate, boundary_hold_rate) → guidance style + escalation level
- `supabase/functions/_shared/fiis-learning.ts` — Stage 1/2 learning context

### Edge functions consuming the shared runtime
- `live-coaching`, `screenshot-coaching`, `fiis-analyze`, `fiis-moderator-chat`, `communication-helper`

### New intelligence systems wired into the platform (2026)
- **Outcome Prediction Engine** (`calculate-outcome-predictions`) — strictly per-family, professional-restricted; `benchmark_opt_in` reserved for future cross-org benchmarking but intentionally not yet wired
- **Accountability Engine** (`calculate-accountability-scores`) — family + provider scores, system-alignment scoring, commitments, behavioral contracts, severity-tiered alerts
- **Post-Intervention Continuity Engine** (`/post-intervention`) — Accepted Treatment Path vs Family Recovery Mode (declined), shared continuity readiness scoring + handoff + re-auth-gated transition summaries
- **Provider Coordination System** (`/provider-coordination`) — multi-org cases, role-typed members, channel-typed messaging, tasks, AI insights, strict org isolation
- **AI Governance + Learning Layer** (`/ai-governance`, `/ai-learning-layer`, `/ai-learning-layer-stage-2`) — proposals → governance gates (signal stability + evidence strength + doctrine compliance + approval) → active adaptations modulating runtime
- **Structured Input Accountability + Reconciliation** (`/input-reconciliation`) — cross-source comparator, drift/contradiction detector, confidence-weighted reconciled truth feeding FIIS + Accountability Engine
- **Care Phase Lifecycle** — formalized state machine across Pre-Intervention → Intervention Readiness → Execution → clinical phases → Independent, with Reset and Re-Approach loops

### Boundary doctrine — fully enforced
- `src/lib/boundaryQuality.ts` validates clarity, measurability, enforceability, and consequence realism at boundary creation time
- `consequence_events` records (enforced / failed / violated) feed both FIIS pattern analysis and the Accountability Engine

