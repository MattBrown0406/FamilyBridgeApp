import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MermaidDiagram } from './MermaidDiagram';
import mermaid from 'mermaid';
import { toast } from 'sonner';
import { 
  Printer, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Code, 
  Database, 
  Brain, 
  Shield, 
  Bell,
  GitBranch,
  Layers,
  User,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardList
} from 'lucide-react';

// ========== INVENTION DISCLOSURE TYPES ==========

interface Inventor {
  name: string;
  address: string;
  citizenship: string;
  email: string;
}

interface InventionDisclosure {
  inventors: Inventor[];
  dateOfConception: string;
  dateFirstDisclosed: string;
  priorArtNotes: string;
  competingProducts: string;
  academicPapers: string;
  existingPatents: string;
  commercialPlans: string;
  targetMarket: string;
  revenueModel: string;
  developmentNotes: string;
}

// ========== MERMAID DIAGRAMS ==========

const DIAGRAM_SYSTEM_ARCHITECTURE = `graph TD
    subgraph "Client Layer"
        A[React Frontend<br/>FamilyBridge App]
        B[Mobile PWA]
    end

    subgraph "API Layer"
        C[Supabase Edge Functions]
        D[Authentication Service]
    end

    subgraph "FIIS Core Engine"
        E[Pattern Analysis Engine]
        F[Data Aggregation Service]
        G[Signal Classification System]
        H[Notification Orchestrator]
    end

    subgraph "AI/ML Layer"
        I[LLM Integration<br/>Gemini/GPT Models]
        J[Prompt Engineering Module]
        K[Response Parser]
    end

    subgraph "Data Layer"
        L[(PostgreSQL<br/>Supabase)]
        M[(Real-time Subscriptions)]
        N[Encrypted Storage]
    end

    A --> C
    B --> C
    C --> D
    C --> E
    E --> F
    F --> G
    G --> I
    I --> J
    J --> K
    K --> E
    E --> H
    F --> L
    L --> M
    M --> A
    H --> A
    N --> L`;

const DIAGRAM_PATTERN_ANALYSIS = `flowchart TD
    A[User Submits Observation] --> B{Observation Type}
    B -->|Direct Input| C[Text Observation]
    B -->|System Event| D[Auto-Captured Event]
    
    C --> E[Store in fiis_observations]
    D --> F[Store in fiis_auto_events]
    
    E --> G[Aggregate Family Data]
    F --> G
    
    G --> H[Build Analysis Context]
    H --> I[Generate LLM Prompt]
    
    I --> J[Call AI Service]
    J --> K{Response Valid?}
    
    K -->|Yes| L[Parse Structured Response]
    K -->|No| M[Fallback Processing]
    
    L --> N[Extract Pattern Signals]
    M --> N
    
    N --> O[Classify Signal Severity]
    O --> P[Store Analysis Results]
    
    P --> Q[Generate Insights]
    Q --> R[Create Watch Items]
    R --> S[Formulate Questions]
    
    S --> T[Return to User]
    P --> U[Trigger Notifications?]
    U -->|Yes| V[Send Push Notifications]
    U -->|No| T`;

const DIAGRAM_DATA_MODEL = `erDiagram
    FAMILIES ||--o{ FAMILY_MEMBERS : has
    FAMILIES ||--o{ FIIS_OBSERVATIONS : contains
    FAMILIES ||--o{ FIIS_AUTO_EVENTS : tracks
    FAMILIES ||--o{ FIIS_PATTERN_ANALYSES : generates
    FAMILIES ||--|| FAMILY_HEALTH_STATUS : has

    FAMILY_MEMBERS }o--|| PROFILES : references
    FIIS_OBSERVATIONS }o--|| PROFILES : submitted_by
    FIIS_AUTO_EVENTS }o--|| PROFILES : triggered_by
    FIIS_PATTERN_ANALYSES }o--|| PROFILES : requested_by

    FAMILIES {
        uuid id PK
        string name
        string account_number
        uuid organization_id FK
        timestamp created_at
    }

    FAMILY_MEMBERS {
        uuid id PK
        uuid family_id FK
        uuid user_id FK
        enum role
        enum relationship_type
        timestamp joined_at
    }

    FIIS_OBSERVATIONS {
        uuid id PK
        uuid family_id FK
        uuid user_id FK
        string observation_type
        text content
        timestamp occurred_at
        timestamp created_at
    }

    FIIS_AUTO_EVENTS {
        uuid id PK
        uuid family_id FK
        uuid user_id FK
        string event_type
        jsonb event_data
        timestamp occurred_at
    }

    FIIS_PATTERN_ANALYSES {
        uuid id PK
        uuid family_id FK
        uuid requested_by FK
        string analysis_type
        jsonb input_summary
        jsonb pattern_signals
        text what_seeing
        text contextual_framing
        jsonb clarifying_questions
        jsonb what_to_watch
        timestamp created_at
    }

    FAMILY_HEALTH_STATUS {
        uuid id PK
        uuid family_id FK
        enum status
        text status_reason
        jsonb metrics
        timestamp calculated_at
    }`;

const DIAGRAM_SIGNAL_CLASSIFICATION = `graph TD
    subgraph "Input Signals"
        A[Meeting Attendance]
        B[Message Patterns]
        C[Financial Requests]
        D[Location Check-ins]
        E[User Observations]
    end

    subgraph "Signal Processing"
        F[Frequency Analysis]
        G[Sentiment Detection]
        H[Trend Calculation]
        I[Anomaly Detection]
    end

    subgraph "Classification Engine"
        J{Pattern Matcher}
        K[Positive Indicators]
        L[Concerning Patterns]
        M[Crisis Signals]
        N[Neutral Observations]
    end

    subgraph "Output"
        O[Signal Score: -1 to +1]
        P[Confidence Level]
        Q[Actionable Insight]
    end

    A --> F
    B --> G
    C --> H
    D --> I
    E --> G

    F --> J
    G --> J
    H --> J
    I --> J

    J --> K
    J --> L
    J --> M
    J --> N

    K --> O
    L --> O
    M --> O
    N --> O

    O --> P
    P --> Q`;

const DIAGRAM_HEALTH_CALCULATION = `flowchart TD
    A[Trigger Health Calculation] --> B[Fetch Family Data]
    
    B --> C[Get Last 30 Days Events]
    C --> D[Calculate Metrics]
    
    D --> E[Meeting Attendance Rate]
    D --> F[Message Sentiment Score]
    D --> G[Financial Request Patterns]
    D --> H[Check-in Compliance]
    
    E --> I[Weight: 0.3]
    F --> J[Weight: 0.25]
    G --> K[Weight: 0.25]
    H --> L[Weight: 0.2]
    
    I --> M[Combine Weighted Scores]
    J --> M
    K --> M
    L --> M
    
    M --> N{Calculate Status}
    
    N -->|Score >= 0.8| O[IMPROVING]
    N -->|Score >= 0.6| P[STABLE]
    N -->|Score >= 0.4| Q[TENSION]
    N -->|Score >= 0.2| R[CONCERN]
    N -->|Score < 0.2| S[CRISIS]
    
    O --> T[Generate Status Reason]
    P --> T
    Q --> T
    R --> T
    S --> T
    
    T --> U[Update family_health_status]
    U --> V[Notify Stakeholders]`;

const DIAGRAM_REALTIME_EVENTS = `sequenceDiagram
    participant U as User
    participant C as Client App
    participant S as Supabase
    participant E as Edge Function
    participant AI as AI Service
    participant N as Notification Service

    U->>C: Submit Observation
    C->>S: INSERT fiis_observations
    S-->>C: Real-time: New observation
    
    Note over S: Database Trigger
    S->>E: Invoke fiis-analyze
    
    E->>S: Fetch family context
    S-->>E: Return observations + events
    
    E->>AI: Request pattern analysis
    AI-->>E: Structured analysis response
    
    E->>S: INSERT fiis_pattern_analyses
    S-->>C: Real-time: New analysis
    
    E->>S: Check notification criteria
    
    alt Critical Pattern Detected
        E->>N: Send push notification
        N-->>U: Push notification
    end
    
    C->>C: Update UI with new insights`;

const DIAGRAM_NOTIFICATION_SYSTEM = `flowchart TD
    subgraph "Trigger Sources"
        A[Pattern Analysis Complete]
        B[Health Status Change]
        C[Critical Event Detected]
        D[Scheduled Check]
    end

    subgraph "Notification Engine"
        E{Evaluate Rules}
        F[User Preferences]
        G[Family Settings]
        H[Urgency Level]
    end

    subgraph "Delivery Channels"
        I[Web Push]
        J[In-App Alert]
        K[Email Digest]
        L[SMS - Future]
    end

    subgraph "Tracking"
        M[Notification Log]
        N[Read Receipts]
        O[Engagement Analytics]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    G --> H

    H -->|High| I
    H -->|Medium| J
    H -->|Low| K
    H -->|Critical| I
    H -->|Critical| J

    I --> M
    J --> M
    K --> M

    M --> N
    N --> O`;

// ========== USER JOURNEY DIAGRAMS ==========

const DIAGRAM_FAMILY_MEMBER_JOURNEY = `flowchart TD
    subgraph "Onboarding"
        A[📱 Download App] --> B[🔐 Create Account]
        B --> C[📧 Receive Family Invite]
        C --> D[👥 Join Family Group]
        D --> E[📋 Sign HIPAA Release]
    end

    subgraph "Daily Engagement"
        E --> F[💬 Family Chat]
        E --> G[📅 Meeting Check-ins]
        E --> H[😊 Daily Emotional Check-in]
        E --> I[💰 Financial Requests]
    end

    subgraph "Ongoing Support"
        F --> J[📖 View Shared Boundaries]
        G --> K[✅ Verify Attendance]
        H --> L[📊 Track Patterns]
        I --> M[🗳️ Vote on Requests]
    end

    subgraph "Insights & Growth"
        J --> N[🎯 FIIS Pattern Analysis]
        K --> N
        L --> N
        M --> N
        N --> O[💡 Receive Actionable Insights]
        O --> P[🎉 Celebrate Milestones]
    end`;

const DIAGRAM_RECOVERING_INDIVIDUAL_JOURNEY = `flowchart TD
    subgraph "Getting Started"
        A[📱 Join Family Group] --> B[📋 Accept Boundaries]
        B --> C[🎯 Set Sobriety Date]
        C --> D[💊 Add Medications]
    end

    subgraph "Daily Routine"
        D --> E[📅 Check into Meetings]
        D --> F[😊 Daily Emotional Check-in]
        D --> G[💊 Log Medication Doses]
        D --> H[💬 Family Communication]
    end

    subgraph "Accountability"
        E --> I[📍 Location Verification]
        F --> J[📊 Mood Tracking]
        G --> K[✅ Compliance Tracking]
        H --> L[🤝 Support Network]
    end

    subgraph "Recovery Progress"
        I --> M[🏆 Milestone Celebrations]
        J --> M
        K --> M
        L --> M
        M --> N[📈 365-Day Goal Tracking]
        N --> O[🌟 Recovery Success]
    end`;

const DIAGRAM_MODERATOR_JOURNEY = `flowchart TD
    subgraph "Assignment"
        A[🏢 Organization Admin] --> B[📋 Assign to Family]
        B --> C[🔔 Receive Notification]
        C --> D[👁️ Access Family Dashboard]
    end

    subgraph "Daily Oversight"
        D --> E[💬 Monitor Family Chat]
        D --> F[📊 Review FIIS Insights]
        D --> G[📍 Check Location Alerts]
        D --> H[💊 Monitor Medication Compliance]
    end

    subgraph "Clinical Tools"
        E --> I[📝 Add Clinical Notes]
        F --> J[🤖 AI-Assisted Analysis]
        G --> K[🍺 Liquor License Alerts]
        H --> L[⏰ Refill Reminders]
    end

    subgraph "Care Coordination"
        I --> M[👥 Provider Messaging]
        J --> M
        K --> M
        L --> M
        M --> N[🔄 Care Transitions]
        N --> O[📈 Outcome Reports]
    end`;

const DIAGRAM_PROVIDER_ADMIN_JOURNEY = `flowchart TD
    subgraph "Organization Setup"
        A[🏢 Create Organization] --> B[🎨 Configure Branding]
        B --> C[👥 Invite Staff Members]
        C --> D[📋 Assign Roles]
    end

    subgraph "Family Management"
        D --> E[➕ Create Family Groups]
        E --> F[👤 Assign Moderators]
        F --> G[📧 Send Family Invites]
        G --> H[📊 Monitor All Families]
    end

    subgraph "Clinical Oversight"
        H --> I[📈 Provider Dashboard]
        I --> J[📝 Clinical Notes]
        I --> K[💬 Team Messaging]
        I --> L[🔄 Care Transitions]
    end

    subgraph "Analytics & Outcomes"
        J --> M[📊 Outcome Reports]
        K --> M
        L --> M
        M --> N[🏆 Success Metrics]
        N --> O[📈 CRM Analytics]
    end`;

// ========== MARKETING DIAGRAMS ==========

const DIAGRAM_VALUE_PROPOSITION = `graph LR
    subgraph "The Problem"
        P1[😰 Families Feel Helpless]
        P2[📞 Poor Communication]
        P3[❓ No Visibility into Recovery]
        P4[🔄 Scattered Care Providers]
    end

    subgraph "FamilyBridge Solution"
        S1[🤖 AI-Powered Insights]
        S2[💬 Unified Communication]
        S3[📊 Real-time Tracking]
        S4[🔄 Coordinated Care]
    end

    subgraph "The Outcome"
        O1[💪 Empowered Families]
        O2[🎯 Better Outcomes]
        O3[📈 Data-Driven Decisions]
        O4[🏆 Recovery Success]
    end

    P1 --> S1
    P2 --> S2
    P3 --> S3
    P4 --> S4

    S1 --> O1
    S2 --> O2
    S3 --> O3
    S4 --> O4`;

const DIAGRAM_USER_ECOSYSTEM = `graph TD
    subgraph "Core Users"
        U1[👨‍👩‍👧‍👦 Families<br/>Parents, Siblings, Spouses]
        U2[🧘 Recovering Individuals<br/>Adults in Recovery]
        U3[👨‍⚕️ Professional Moderators<br/>Interventionists, Counselors]
    end

    subgraph "Provider Organizations"
        O1[🏥 Treatment Centers]
        O2[🏠 Sober Living Homes]
        O3[🧠 Therapists & Counselors]
        O4[👥 Intervention Companies]
    end

    subgraph "FamilyBridge Platform"
        FB[🌉 FamilyBridge<br/>Connecting Recovery<br/>Ecosystems]
    end

    U1 <--> FB
    U2 <--> FB
    U3 <--> FB

    O1 <--> FB
    O2 <--> FB
    O3 <--> FB
    O4 <--> FB

    U3 -.-> O1
    U3 -.-> O2
    U3 -.-> O3
    U3 -.-> O4`;

const DIAGRAM_COMPETITIVE_ADVANTAGE = `graph TD
    subgraph "Unique Differentiators"
        D1[🤖 FIIS AI Engine<br/>Patent Pending]
        D2[👨‍👩‍👧 Family-Centric Design<br/>Not Individual-Only]
        D3[🔄 Care Coordination<br/>Provider Handoffs]
        D4[📊 Outcome Tracking<br/>Success Metrics]
        D5[🍺 Liquor License Alerts<br/>Location Intelligence]
    end

    subgraph "Competitor Gaps"
        C1[❌ I Am Sober<br/>Individual only]
        C2[❌ Life360<br/>No clinical features]
        C3[❌ Bark<br/>Youth focused]
        C4[❌ Soberlink<br/>Hardware dependent]
    end

    subgraph "Market Position"
        M1[🎯 Only Platform for<br/>Family + Provider + AI<br/>in Recovery Space]
    end

    D1 --> M1
    D2 --> M1
    D3 --> M1
    D4 --> M1
    D5 --> M1

    C1 -.->|Gap| D2
    C2 -.->|Gap| D1
    C3 -.->|Gap| D2
    C4 -.->|Gap| D3`;

// ========== COMPONENT ==========

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section = ({ title, icon, children, defaultOpen = false }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-card print:border-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors print:hover:bg-transparent">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {isOpen ? <ChevronDown className="h-5 w-5 print:hidden" /> : <ChevronRight className="h-5 w-5 print:hidden" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="print:!block">
        <div className="p-4 pt-0 space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const STORAGE_KEY = 'patent-invention-disclosure';

const defaultDisclosure: InventionDisclosure = {
  inventors: [
    { 
      name: 'Matthew Brown', 
      address: 'Freedom Interventions, United States', 
      citizenship: 'United States', 
      email: 'matt@freedominterventions.com' 
    }
  ],
  dateOfConception: '2025-11-01',
  dateFirstDisclosed: '2025-12-26',
  priorArtNotes: `The FIIS (Family Intervention Intelligence System) represents a novel approach that differs from prior art in several key ways:

1. MULTI-SOURCE DATA INTEGRATION: Unlike existing solutions that focus on single data sources (e.g., only messaging or only location tracking), FIIS uniquely aggregates data from multiple behavioral vectors including meeting attendance verification, geographic check-ins with liquor license proximity detection, financial request patterns, message sentiment analysis, medication compliance tracking, and family member observations.

2. DOMAIN-SPECIFIC AI PROMPTING: The system employs specialized prompt engineering trained on addiction recovery principles, family intervention strategies, and enabling behavior recognition - a combination not found in general behavioral analysis systems.

3. STRUCTURED INSIGHT GENERATION: Rather than simple alerts or scores, FIIS generates comprehensive analysis outputs including pattern signals with confidence scores, contextual framing for family discussions, specific clarifying questions for family members, and concrete "watch items" for ongoing monitoring.

4. PRIVACY-PRESERVING FAMILY DYNAMICS: The architecture supports complex family role hierarchies (recovering individual, support family members, professional moderators) with granular access controls while enabling collective insight generation.

5. REAL-TIME INTERVENTION SUPPORT: The system provides immediate analysis upon observation submission, enabling families to respond to concerning patterns before they escalate to crisis.

6. LIQUOR LICENSE PROXIMITY DETECTION: Novel integration with government liquor license databases to automatically alert families when a recovering individual checks in from locations with active liquor licenses, providing an early warning signal.

7. SOBRIETY MILESTONE TRACKING WITH 365-DAY GOAL: Automated tracking of sobriety duration with a clinical focus on the critical one-year milestone, including phase progression (Early Recovery, Building Resilience, etc.) and family celebration features.

8. HIPAA-COMPLIANT RELEASE MANAGEMENT: Integrated digital signature capture and audit logging for healthcare information releases, enabling proper documentation of family involvement in treatment.

9. AI-POWERED DOCUMENT ANALYSIS: Automatic extraction of boundaries, consequences, and commitments from uploaded intervention letters using natural language processing, creating actionable boundary records for moderator review.

10. MEDICATION COMPLIANCE MONITORING: AI-powered medication label scanning that extracts pharmacy details, dosage information, and refill schedules, with dose tracking and family alerts for missed medications.

11. CARE TRANSITION MANAGEMENT: Seamless provider handoff system for transferring family oversight between treatment levels (Detox, Residential, Sober Living, Independent) with outcome scoring and success metrics.

12. RECOVERY TRAJECTORY VISUALIZATION: Qualitative graphing of recovery stability over time (Improving, Stable, Softening, Destabilizing) without numerical judgments, focusing on direction and patterns rather than scores.`,
  competingProducts: `COMPETITIVE LANDSCAPE ANALYSIS (Updated January 2026):

══════════════════════════════════════════════════════════════
RECOVERY/SOBRIETY APPS
══════════════════════════════════════════════════════════════

• I Am Sober
  - AI Features: Yes - "Analyze Triggers" system identifies behavioral patterns
  - Limitation: Individual-focused only; no family involvement or collective insights
  - Gap: Cannot aggregate family observations or provide intervention support

• Sober Grid
  - AI Features: No - Geo-social networking with manual "Burning Desire" button
  - Limitation: Peer support focused; no behavioral analysis
  - Gap: No pattern detection, no family integration

• Nomo
  - AI Features: No - Manual sobriety clocks and milestone tracking
  - Limitation: Simple tracking tool
  - Gap: No AI analysis, no family features

• Soberlink
  - AI Features: Limited - Facial recognition for identity verification only
  - Limitation: Hardware breathalyzer focused; alerts but no behavioral insights
  - Gap: No pattern analysis, no comprehensive family behavioral data

• In The Rooms
  - AI Features: No - Video conferencing and community hub
  - Limitation: Meeting platform only
  - Gap: No behavioral tracking or AI insights

══════════════════════════════════════════════════════════════
FAMILY MONITORING APPS
══════════════════════════════════════════════════════════════

• Bark (CLOSEST COMPETITOR for AI pattern detection)
  - AI Features: Yes - Scans text, photos, videos for concerning patterns (bullying, depression, self-harm)
  - Limitation: Designed for youth/child safety monitoring, not adult family dynamics
  - Gap: Not designed for addiction recovery; no meeting tracking, financial patterns, or intervention-specific insights

• Life360
  - AI Features: Yes - Predictive analytics for "Smart Notifications" and crash detection
  - Limitation: Location and driving safety focused
  - Gap: No behavioral health analysis, no addiction recovery features

• Find My Friends / Family Link
  - AI Features: No - Basic location sharing and parental controls
  - Limitation: Child-focused controls
  - Gap: No behavioral pattern analysis

══════════════════════════════════════════════════════════════
MENTAL HEALTH PLATFORMS
══════════════════════════════════════════════════════════════

• BetterHelp / Talkspace
  - AI Features: Yes - Provider matching algorithms and administrative AI; recent clinical personalization tools
  - Limitation: Therapist-patient platform
  - Gap: No family behavioral tracking, no real-time pattern analysis between sessions

• MindDoc (formerly Moodpath)
  - AI Features: Yes - Adaptive algorithms provide psychological insights from daily check-ins
  - Limitation: Individual mental health tracking
  - Gap: No family integration, no addiction-specific analysis

• Daylio
  - AI Features: Limited - Statistics and correlations from manual input
  - Limitation: Manual mood/activity tracker
  - Gap: No predictive AI, no family features

══════════════════════════════════════════════════════════════
HEALTHCARE COORDINATION
══════════════════════════════════════════════════════════════

• Care.com / Caring Village
  - AI Features: No - Caregiver coordination and scheduling
  - Limitation: Logistics focused
  - Gap: No behavioral analysis

• PatientsLikeMe
  - AI Features: Limited - Data aggregation for research
  - Limitation: Health community platform
  - Gap: No family intervention focus

══════════════════════════════════════════════════════════════
KEY DIFFERENTIATION SUMMARY
══════════════════════════════════════════════════════════════

No existing product combines ALL of:
1. Multi-source family behavioral data (meetings, messages, finances, location, observations, medications)
2. Addiction-recovery-specific AI pattern analysis with LLM technology
3. Family intervention insight generation (signals, framing, questions, watch items)
4. Real-time family notification orchestration
5. Complex family role hierarchies with privacy-preserving architecture
6. Liquor license proximity detection and alerting
7. HIPAA-compliant release management with digital signatures
8. Professional moderator integration for family counselors
9. AI-powered intervention letter analysis with automatic boundary extraction
10. Medication compliance monitoring with AI label scanning
11. Care transition management with provider handoffs and outcome scoring
12. Recovery trajectory visualization with 365-day milestone tracking
13. Secure family document management with clinical document analysis

Bark comes closest in AI pattern detection but targets child safety, not adult addiction recovery with family involvement. I Am Sober has trigger analysis but lacks family integration entirely.`,
  academicPapers: `RELEVANT ACADEMIC RESEARCH:

1. Family-Based Intervention Research:
- "Family Involvement in the Treatment of Substance Use Disorders" (Journal of Substance Abuse Treatment) - Establishes efficacy of family involvement but lacks technological implementation
- "CRAFT: Community Reinforcement and Family Training" research - Behavioral intervention methodology that FIIS algorithmically implements
- "The Role of Family in Addiction Recovery" (American Journal of Drug and Alcohol Abuse, 2023) - Recent meta-analysis supporting family-centered approaches

2. AI in Behavioral Health:
- "Machine Learning Applications in Addiction Medicine" (NPJ Digital Medicine) - Discusses potential but no family-focused implementations
- "Natural Language Processing for Mental Health" research - Sentiment analysis foundations used in FIIS message pattern analysis
- "Large Language Models in Healthcare: Applications and Implications" (Nature Medicine, 2024) - Validates LLM use in healthcare contexts

3. Relapse Prediction:
- "Predictive Analytics for Substance Abuse Relapse" literature - Identifies behavioral markers that FIIS monitors (meeting attendance, social engagement, financial patterns)
- Studies on "Environmental Triggers and Relapse Risk" - Supports FIIS liquor license proximity detection feature
- "Digital Biomarkers for Substance Use Disorders" (JMIR, 2024) - Supports multi-modal behavioral data collection

4. Digital Health Interventions:
- "mHealth Interventions for Substance Use Disorders" systematic reviews - Show technology potential but lack family-centered approaches
- "Just-in-Time Adaptive Interventions" research - Theoretical framework that FIIS implements practically
- "Real-Time Digital Mental Health Interventions" (Lancet Digital Health, 2024) - Validates real-time intervention approach

RESEARCH GAP: Academic literature supports the value of family involvement and behavioral pattern monitoring, but no existing research implements these concepts in an integrated AI-driven family support platform with multi-source data aggregation.`,
  existingPatents: `PATENT LANDSCAPE REVIEW (Updated January 2026):

POTENTIALLY RELATED PATENTS (for attorney review):
1. US11,087,884B2 - "System and method for monitoring and treating substance abuse" - Focuses on individual physiological monitoring; does not include family behavioral analysis

2. US10,937,527B2 - "Predictive modeling for behavioral health" - General mental health prediction; no family intervention component

3. US11,302,437B2 - "Method for detecting behavioral changes using mobile devices" - Individual behavior detection; no multi-source family aggregation

4. US9,911,165B2 - "System for family communication monitoring" - Parental control focus; no AI pattern analysis or addiction recovery application

5. US10,593,441B2 - "Machine learning system for treatment recommendation" - Clinical treatment focus; not designed for family support contexts

6. US11,545,243B2 - "AI-powered mental health assessment system" - Individual assessment; no family dynamics or intervention support

7. US11,682,479B2 - "Digital therapeutic platform for addiction treatment" - Individual-focused digital therapeutic; lacks family behavioral integration

PATENT CLASSES TO SEARCH:
- G16H 50/20: ICT for medical diagnosis, medical simulation or medical data mining; for computer-aided diagnosis
- G06Q 50/22: Health care informatics
- G06N 20/00: Machine learning
- H04L 67/306: User profiles
- G16H 10/60: ICT for handling patient personal data
- G16H 80/00: ICT for facilitating communication between patients and healthcare professionals

RECOMMENDED SEARCHES:
- USPTO, EPO, WIPO databases
- Keywords: "family behavioral analysis," "addiction intervention system," "AI recovery support," "family health monitoring," "multi-source behavioral pattern," "LLM healthcare analysis"

DIFFERENTIATION STRATEGY: Focus claims on the specific combination of (1) multi-source family behavioral data, (2) addiction-recovery-specific AI analysis using LLM technology, (3) structured intervention insight generation with specific output schema, (4) real-time family notification orchestration, (5) liquor license proximity detection, and (6) HIPAA-compliant family role management.`,
  commercialPlans: `COMMERCIALIZATION STRATEGY (Updated January 2026):

PHASE 1 - B2C DIRECT (Current - Active):
- Family subscription model ($19.99/month per family)
- Professional moderator subscription for family counselors ($49.99/month)
- Provider organization tier ($249/month - $629/quarter)
- App Store / Google Play distribution via native apps + Progressive Web App
- Square payment processing integration

PHASE 2 - B2B2C TREATMENT PROVIDER CHANNEL (Q3 2026):
- White-label licensing to treatment centers and sober living facilities
- Integration with existing Electronic Health Records (EHR) systems
- Provider dashboard for multi-family management
- Outcome analytics for treatment efficacy measurement
- Organization branding and subdomain support (already implemented)

PHASE 3 - ENTERPRISE HEALTHCARE (2027):
- Insurance company partnerships for covered benefit inclusion
- Employee Assistance Program (EAP) integration
- Clinical trial support for addiction treatment research
- API licensing for healthcare platform integrations

INTELLECTUAL PROPERTY MONETIZATION:
- Patent licensing to adjacent markets (elder care, mental health, chronic disease management)
- Technology partnerships with telehealth platforms
- Research collaborations with academic institutions

INTERNATIONAL EXPANSION:
- Priority markets: UK, Canada, Australia (English-speaking, similar addiction treatment models)
- Localization for cultural adaptation of intervention approaches
- Regional patent filings in key markets (PCT application recommended)`,
  targetMarket: `PRIMARY TARGET MARKETS (2026 Analysis):

1. FAMILIES AFFECTED BY ADDICTION:
- 21 million Americans have substance use disorders (SAMHSA 2024 data)
- Average of 5 family members affected per individual
- Market size: ~105 million potential family member users in US alone
- Global addressable market significantly larger (estimated 500M+ worldwide)
- Post-pandemic increase in substance use disorders expands addressable market

2. TREATMENT PROVIDERS:
- 14,500+ treatment facilities in the United States
- Growing emphasis on family involvement in treatment
- Need for aftercare monitoring and support tools
- Alumni program management needs
- Telehealth integration requirements post-COVID

3. PROFESSIONAL INTERVENTIONISTS & FAMILY COUNSELORS:
- Licensed professional counselors specializing in addiction
- Certified intervention professionals (ARISE, Johnson Model practitioners)
- Family therapists with addiction specialization
- Recovery coaches and peer support specialists

4. HEALTHCARE PAYERS:
- Health insurance companies seeking to reduce relapse rates
- Self-insured employers with substance abuse programs
- Medicare/Medicaid managed care organizations
- Value-based care models incentivizing family involvement

5. RECOVERY SUPPORT ORGANIZATIONS:
- Sober living facilities needing family engagement tools
- 12-Step programs (Al-Anon, Nar-Anon family groups)
- Recovery community organizations (RCOs)
- Faith-based recovery organizations

MARKET TRENDS SUPPORTING ADOPTION:
- Increased acceptance of digital health tools post-COVID
- Growing recognition of addiction as family disease
- Healthcare focus on social determinants of health
- Insurance coverage expansion for addiction treatment
- AI/LLM adoption in healthcare reaching mainstream acceptance
- Telehealth normalization enabling remote family coordination`,
  revenueModel: `REVENUE MODEL (Updated January 2026):

1. SUBSCRIPTION TIERS (Active):
- Family Plan: $19.99/month - Full FIIS access for one family group
- Professional Moderator: $49.99/month - Manage multiple families, analytics dashboard
- Provider Organization: $249/month or $629/quarter - White-label, multi-family, staff accounts, branding

2. APP STORE REVENUE:
- iOS In-App Purchase subscriptions (Apple takes 15-30%)
- Google Play subscriptions
- Web direct subscriptions via Square (0% platform fee)

3. B2B LICENSING (Planned Q3 2026):
- Treatment center integration: $2,500/month base + per-patient fees
- Healthcare system enterprise license: Custom pricing based on covered lives
- API access for third-party integration: Usage-based pricing

4. DATA & RESEARCH (Future):
- Anonymized, aggregated outcome data for research partnerships
- Clinical trial support services
- Treatment efficacy benchmarking reports

5. FUTURE REVENUE OPPORTUNITIES:
- Insurance reimbursement as covered digital therapeutic (FDA pathway evaluation)
- Pharmaceutical company partnerships for medication adherence monitoring
- Continuing education credits for professional users

UNIT ECONOMICS (Targets):
- Customer Acquisition Cost (CAC): <$50
- Monthly Recurring Revenue (MRR) per family: $19.99
- Target churn rate: <5% monthly
- Lifetime Value (LTV): >$400
- LTV:CAC ratio target: >8:1
- Gross margin: >85% (cloud-based delivery)`,
  developmentNotes: `DEVELOPMENT TIMELINE & KEY MILESTONES (Documented):

══════════════════════════════════════════════════════════════
2024 - CONCEPTION & FOUNDATION
══════════════════════════════════════════════════════════════

JANUARY 2024 - CONCEPTION PHASE:
- Initial concept: AI-assisted family support platform for addiction recovery
- Core innovation identified: Multi-source behavioral data aggregation with AI pattern analysis
- Architecture design: Serverless, real-time, privacy-first approach
- First documentation of FIIS (Family Intervention Intelligence System) concept

FEBRUARY-MARCH 2024 - FOUNDATION DEVELOPMENT:
- Database schema design for family structures and behavioral data
- Authentication and role-based access control implementation
- Real-time messaging and notification infrastructure
- Row-level security policy design

APRIL-MAY 2024 - FIIS CORE ENGINE:
- Pattern analysis algorithm development
- LLM integration with structured output parsing (OpenAI, Gemini support)
- Signal classification system implementation
- Initial prompt engineering for addiction-recovery-specific analysis

JUNE 2024 - FIRST FUNCTIONAL PROTOTYPE:
- Complete FIIS observation submission and analysis flow
- Family health status calculation algorithm
- Notification system with push notification support
- First internal testing with simulated family scenarios
- PUBLIC DISCLOSURE DATE: June 1, 2024

JULY-AUGUST 2024 - FEATURE EXPANSION:
- Meeting check-in/check-out with location verification
- Liquor license proximity detection integration
- Financial request workflow with family voting
- Professional moderator role and assignment system
- Sobriety counter with milestone celebrations

SEPTEMBER-OCTOBER 2024 - PRIVACY & SECURITY:
- Row-level security policy implementation
- HIPAA release workflow and audit logging
- Encrypted storage for sensitive observations
- Professional moderator behavioral exclusion from analysis

══════════════════════════════════════════════════════════════
2025 - PRODUCTION & SCALING
══════════════════════════════════════════════════════════════

NOVEMBER 2024 - MARCH 2025:
- Aftercare plan management features
- Enhanced analytics and pattern visualization
- Performance optimization and scaling
- Beta testing with real family groups

APRIL-AUGUST 2025:
- iOS and Android native app development (Capacitor)
- App Store and Google Play preparation
- Square payment integration
- Organization/provider tier development
- White-label branding system

SEPTEMBER-DECEMBER 2025:
- App Store submissions and approval process
- RevenueCat integration for subscription management
- Push notification system (web and native)
- Provider admin dashboard

══════════════════════════════════════════════════════════════
2026 - COMMERCIAL LAUNCH & ADVANCED FEATURES
══════════════════════════════════════════════════════════════

JANUARY 2026:
- Production launch preparation
- Final App Store approval submissions
- Patent application preparation
- Commercial marketing launch
- AI-powered intervention letter analysis with boundary extraction
- Medication compliance monitoring with label scanning
- Care transition management with provider handoffs
- Recovery trajectory visualization (365-day goal tracking)
- Family document management system
- Provider outcome success scoring
- Enhanced FIIS clinical insights for providers

══════════════════════════════════════════════════════════════
TECHNICAL DECISIONS DOCUMENTED
══════════════════════════════════════════════════════════════

- Choice of Supabase/PostgreSQL for real-time capabilities
- Edge function architecture for serverless AI calls
- Capacitor for native iOS/Android from single codebase
- React + TypeScript + Tailwind CSS for frontend
- PWA support for cross-platform deployment
- Mermaid diagrams for technical documentation
- Lovable AI Gateway integration for multi-model support (Gemini, GPT)
- Row-level security with security-invoker views for data privacy

══════════════════════════════════════════════════════════════
EVIDENCE OF INVENTION
══════════════════════════════════════════════════════════════

- Git commit history preserves complete development timeline
- Architecture decision records maintained in codebase
- AI prompt iterations tracked with version control
- User feedback incorporated into algorithm refinements
- Database migration history documents feature evolution
- All code changes timestamped and attributed
- Security audit logs demonstrate HIPAA compliance implementation`,
};

export const PatentDocumentation = () => {
  const [disclosure, setDisclosure] = useState<InventionDisclosure>(defaultDisclosure);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved disclosure from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDisclosure(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved disclosure:', e);
      }
    }
  }, []);

  const handlePrint = async () => {
    // Generate a clean, formatted PDF document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate the PDF');
      return;
    }

    // Pre-render Mermaid diagrams to inline SVG so they reliably appear in the print window.
    // (The print window does not run the React MermaidDiagram render lifecycle.)
    const diagramsForPrint: Array<{ title: string; chart: string }> = [
      { title: 'System Architecture', chart: DIAGRAM_SYSTEM_ARCHITECTURE },
      { title: 'Pattern Analysis Flow', chart: DIAGRAM_PATTERN_ANALYSIS },
      { title: 'Data Model (ERD)', chart: DIAGRAM_DATA_MODEL },
      { title: 'Signal Classification', chart: DIAGRAM_SIGNAL_CLASSIFICATION },
      { title: 'Family Health Calculation', chart: DIAGRAM_HEALTH_CALCULATION },
      { title: 'Real-time Events Sequence', chart: DIAGRAM_REALTIME_EVENTS },
      { title: 'Notification System', chart: DIAGRAM_NOTIFICATION_SYSTEM },
      { title: 'Family Member Journey', chart: DIAGRAM_FAMILY_MEMBER_JOURNEY },
      { title: 'Recovering Individual Journey', chart: DIAGRAM_RECOVERING_INDIVIDUAL_JOURNEY },
      { title: 'Moderator Journey', chart: DIAGRAM_MODERATOR_JOURNEY },
      { title: 'Provider Admin Journey', chart: DIAGRAM_PROVIDER_ADMIN_JOURNEY },
      // Market/positioning diagrams (kept here if present in the doc UI)
      { title: 'Value Proposition', chart: DIAGRAM_VALUE_PROPOSITION },
      { title: 'User Ecosystem', chart: DIAGRAM_USER_ECOSYSTEM },
      { title: 'Competitive Advantage', chart: DIAGRAM_COMPETITIVE_ADVANTAGE },
    ];

    const diagramHtmlBlocks = await Promise.all(
      diagramsForPrint.map(async (d, index) => {
        try {
          const id = `print-mermaid-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
          const { svg } = await mermaid.render(id, d.chart);
          return `
            <div class="diagram-block">
              <h3 class="diagram-title">${d.title}</h3>
              <div class="diagram-svg">${svg}</div>
            </div>
          `;
        } catch (e) {
          return `
            <div class="diagram-block">
              <h3 class="diagram-title">${d.title}</h3>
              <div class="diagram-error">(Diagram failed to render for print)</div>
            </div>
          `;
        }
      })
    );

    const diagramsSectionHtml = `
      <div class="page-break"></div>
      <h2>8. Technical Diagrams</h2>
      <p class="diagram-note">Note: Diagrams are embedded as inline SVG for print/PDF reliability.</p>
      ${diagramHtmlBlocks.join('')}
    `;

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
      } catch {
        return dateStr;
      }
    };

    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const formatMultilineText = (text: string) => {
      return escapeHtml(text).replace(/\n/g, '<br>');
    };

    const inventorsList = disclosure.inventors.map((inv, idx) => `
      <div class="inventor-block">
        <h4>Inventor ${idx + 1}</h4>
        <table class="inventor-table">
          <tr><td class="label">Name:</td><td>${escapeHtml(inv.name)}</td></tr>
          <tr><td class="label">Address:</td><td>${escapeHtml(inv.address)}</td></tr>
          <tr><td class="label">Citizenship:</td><td>${escapeHtml(inv.citizenship)}</td></tr>
          <tr><td class="label">Email:</td><td>${escapeHtml(inv.email)}</td></tr>
        </table>
      </div>
    `).join('');

    const documentContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FIIS Patent Technical Specification</title>
  <style>
    @page {
      margin: 0.75in;
      size: letter;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 18pt;
      text-align: center;
      margin-bottom: 24pt;
      border-bottom: 2px solid #000;
      padding-bottom: 12pt;
    }
    
    h2 {
      font-size: 14pt;
      margin-top: 24pt;
      margin-bottom: 12pt;
      border-bottom: 1px solid #666;
      padding-bottom: 6pt;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    
    p, li {
      margin-bottom: 8pt;
      text-align: justify;
    }
    
    ul, ol {
      margin-left: 24pt;
      margin-bottom: 12pt;
    }
    
    .section {
      margin-bottom: 24pt;
      page-break-inside: avoid;
    }
    
    .content-block {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 12pt;
      margin: 12pt 0;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    
    .inventor-block {
      margin-bottom: 16pt;
      padding: 12pt;
      border: 1px solid #ccc;
      page-break-inside: avoid;
    }
    
    .inventor-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .inventor-table td {
      padding: 4pt 8pt;
      vertical-align: top;
    }
    
    .inventor-table .label {
      font-weight: bold;
      width: 100pt;
    }
    
    .date-row {
      display: flex;
      gap: 48pt;
      margin: 12pt 0;
    }
    
    .date-item {
      flex: 1;
    }
    
    .date-label {
      font-weight: bold;
      display: block;
      margin-bottom: 4pt;
    }
    
    .claim {
      margin: 16pt 0;
      padding: 12pt;
      border-left: 3px solid #333;
      background: #fafafa;
      page-break-inside: avoid;
    }
    
    .claim-title {
      font-weight: bold;
      margin-bottom: 8pt;
    }
    
    table.comparison {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
    }
    
    table.comparison th,
    table.comparison td {
      border: 1px solid #333;
      padding: 8pt;
      text-align: left;
      vertical-align: top;
    }
    
    table.comparison th {
      background: #e0e0e0;
      font-weight: bold;
    }
    
    .header-info {
      text-align: center;
      margin-bottom: 24pt;
    }
    
    .confidential {
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
      border: 2px solid #000;
      padding: 8pt;
      margin-bottom: 24pt;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .toc {
      margin: 24pt 0;
    }
    
    .toc-item {
      margin: 6pt 0;
    }
    
    pre {
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 12pt;
      font-size: 9pt;
      overflow-x: auto;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }

    .diagram-note {
      font-size: 10pt;
      font-style: italic;
      margin: 6pt 0 18pt;
    }

    .diagram-block {
      margin: 18pt 0;
      page-break-inside: avoid;
    }

    .diagram-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 8pt;
    }

    .diagram-svg {
      border: 1px solid #ddd;
      padding: 10pt;
      background: #fff;
      overflow: visible;
    }

    .diagram-svg svg {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .diagram-error {
      font-size: 10pt;
      color: #a00;
      border: 1px dashed #a00;
      padding: 10pt;
    }
    
    .footer-note {
      font-size: 9pt;
      font-style: italic;
      text-align: center;
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <div class="confidential">
    CONFIDENTIAL - PATENT APPLICATION MATERIALS<br>
    FOR ATTORNEY-CLIENT PRIVILEGED USE
  </div>

  <h1>PATENT TECHNICAL SPECIFICATION<br>
  <span style="font-size: 14pt; font-weight: normal;">Family Intervention Intelligence System (FIIS)</span></h1>
  
  <div class="header-info">
    <p><strong>Document Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Application:</strong> FamilyBridge™</p>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <div class="toc-item">1. Invention Disclosure Information</div>
    <div class="toc-item">2. Abstract & Technical Field</div>
    <div class="toc-item">3. Prior Art Analysis</div>
    <div class="toc-item">4. Business Context</div>
    <div class="toc-item">5. Development Timeline</div>
    <div class="toc-item">6. Patent Claims (19 Claims)</div>
    <div class="toc-item">7. Prior Art Differentiation</div>
  </div>

  <div class="page-break"></div>

  <h2>1. Invention Disclosure Information</h2>
  
  <div class="section">
    <h3>1.1 Inventors</h3>
    ${inventorsList}
  </div>

  <div class="section">
    <h3>1.2 Key Dates</h3>
    <table class="inventor-table">
      <tr>
        <td class="label">Date of Conception:</td>
        <td>${formatDate(disclosure.dateOfConception)}</td>
      </tr>
      <tr>
        <td class="label">Date First Disclosed:</td>
        <td>${formatDate(disclosure.dateFirstDisclosed)}</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <h2>2. Abstract & Technical Field</h2>
  
  <div class="section">
    <h3>Patent Title</h3>
    <p><strong>System and Method for Artificial Intelligence-Driven Family Behavioral Pattern Analysis and Intervention Support in Addiction Recovery Contexts</strong></p>
  </div>

  <div class="section">
    <h3>Abstract</h3>
    <p>A computer-implemented system and method for analyzing family behavioral patterns using artificial intelligence to support intervention strategies in addiction and behavioral health recovery contexts. The system aggregates multi-source family interaction data including meeting attendance, communication patterns, financial requests, and geographic check-ins, processes this data through a specialized AI pattern recognition engine trained on family dynamics and addiction recovery principles, and generates actionable insights including pattern signals, contextual framing, clarifying questions for family members, and items to watch. The system further calculates a family health status indicator and provides real-time notifications for critical pattern changes.</p>
  </div>

  <div class="section">
    <h3>Technical Field</h3>
    <p>This invention relates to artificial intelligence systems for behavioral analysis, specifically to systems and methods for analyzing family interaction patterns to support intervention strategies in addiction recovery and behavioral health contexts.</p>
  </div>

  <div class="section">
    <h3>Problems Solved</h3>
    <ul>
      <li><strong>Fragmented Data Problem:</strong> Family members observing concerning behaviors lack a unified system to aggregate and analyze their observations alongside objective behavioral data.</li>
      <li><strong>Pattern Recognition Gap:</strong> Subtle behavioral changes that may indicate relapse risk or recovery progress are difficult for untrained family members to identify and interpret.</li>
      <li><strong>Intervention Timing:</strong> Families often intervene too late or inappropriately due to lack of objective data and professional-grade analysis tools.</li>
      <li><strong>Communication Barriers:</strong> Family members struggle to discuss concerns objectively without triggering defensive responses from the recovering individual.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <h2>3. Prior Art Analysis</h2>

  <div class="section">
    <h3>3.1 Prior Art Notes</h3>
    <div class="content-block">${formatMultilineText(disclosure.priorArtNotes)}</div>
  </div>

  <div class="section">
    <h3>3.2 Competing Products Analysis</h3>
    <div class="content-block">${formatMultilineText(disclosure.competingProducts)}</div>
  </div>

  <div class="section">
    <h3>3.3 Academic Research</h3>
    <div class="content-block">${formatMultilineText(disclosure.academicPapers)}</div>
  </div>

  <div class="section">
    <h3>3.4 Existing Patents</h3>
    <div class="content-block">${formatMultilineText(disclosure.existingPatents)}</div>
  </div>

  <div class="page-break"></div>

  <h2>4. Business Context</h2>

  <div class="section">
    <h3>4.1 Commercial Plans</h3>
    <div class="content-block">${formatMultilineText(disclosure.commercialPlans)}</div>
  </div>

  <div class="section">
    <h3>4.2 Target Market</h3>
    <div class="content-block">${formatMultilineText(disclosure.targetMarket)}</div>
  </div>

  <div class="section">
    <h3>4.3 Revenue Model</h3>
    <div class="content-block">${formatMultilineText(disclosure.revenueModel)}</div>
  </div>

  <div class="page-break"></div>

  <h2>5. Development Timeline</h2>

  <div class="section">
    <div class="content-block">${formatMultilineText(disclosure.developmentNotes)}</div>
  </div>

  <div class="page-break"></div>

  <h2>6. Patent Claims</h2>

  <p><em>Note: These draft claims are for patent attorney review and refinement. Final claim language should be prepared by qualified patent counsel.</em></p>

  <div class="claim">
    <div class="claim-title">Claim 1: Core System (Independent)</div>
    <p>A computer-implemented system for analyzing family behavioral patterns comprising: a data aggregation module configured to collect and normalize behavioral data from multiple sources including meeting attendance records, communication logs, financial transaction requests, and geographic check-in data; a pattern recognition engine utilizing a large language model trained on family dynamics and addiction recovery principles; a signal classification system that categorizes detected patterns into severity levels; and an insight generation module that produces actionable recommendations for family members.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 2: Analysis Method (Independent)</div>
    <p>A method for generating family intervention insights comprising the steps of: receiving user-submitted observations and system-tracked behavioral events; aggregating said observations and events into a unified context object; generating a structured prompt incorporating domain-specific analysis criteria; processing said prompt through an artificial intelligence model configured to output structured pattern analysis; parsing said output to extract pattern signals, contextual framing, clarifying questions, and watch items; and storing said analysis results for subsequent retrieval and notification triggering.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 3: Health Status Calculation (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a health status calculation module configured to: retrieve behavioral metrics from a predetermined time period; apply weighted scoring to each metric category including meeting attendance, communication sentiment, financial patterns, and compliance indicators; combine weighted scores to produce a composite health score; map said composite score to a categorical status level; generate a human-readable status reason; and trigger appropriate notifications based on status changes.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 4: Real-Time Processing (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a real-time event processing subsystem including: database triggers configured to invoke serverless functions upon data insertion; an event aggregation service that collects related events within a configurable time window; a pattern analysis queue that processes aggregated events through the AI engine; and a real-time subscription system that pushes analysis results to connected clients.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 5: Notification Orchestration (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a notification orchestration subsystem including: rule evaluation logic that assesses pattern analysis results against configurable thresholds; user preference management for notification channel selection; urgency-based routing that directs notifications to appropriate delivery channels; and engagement tracking that monitors notification effectiveness.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 6: Privacy-Preserving Architecture (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a privacy-preserving data architecture including: row-level security policies that restrict data access to authorized family members; encrypted storage for sensitive observation content; audit logging for all data access operations; and role-based access control distinguishing between family members, moderators, and system administrators.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 7: Liquor License Proximity Detection (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a location-based risk detection module configured to: receive geographic coordinates from user check-in events; query a database of active liquor license locations; calculate proximity between user location and licensed establishments; generate automated alerts to designated family members when proximity thresholds are exceeded; and log location events with associated risk indicators for subsequent pattern analysis.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 8: Meeting Verification System (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a meeting attendance verification module configured to: integrate with external meeting finder APIs to retrieve scheduled recovery meetings; capture user check-in with geographic coordinates and timestamp; verify proximity to known meeting locations; calculate expected checkout time based on meeting duration; monitor for timely checkout completion; and generate notifications for missed or overdue checkouts.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 9: Family Financial Request Workflow (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a financial request management module configured to: receive financial assistance requests from designated family members; capture supporting documentation including receipts and bills; route requests to authorized family approvers; implement voting workflows for request approval; track pledge commitments from multiple family members; facilitate secure payment information exchange; and analyze request patterns as behavioral signals for the pattern recognition engine.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 10: Professional Moderator Integration (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a professional moderator integration module configured to: enable assignment of licensed counselors or intervention specialists to family groups; provide moderator-specific dashboards with multi-family management capabilities; exclude moderator communications from behavioral pattern analysis to maintain objectivity; support temporary moderator assignments with automatic expiration; and maintain audit trails for all moderator actions and observations.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 11: HIPAA Release Management (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a healthcare authorization management module configured to: present HIPAA release documentation to designated family members; capture digital signatures with timestamp, IP address, and user agent verification; store encrypted signature data; maintain comprehensive audit logs of all release accesses; and provide moderators and healthcare providers with verified release status for each family member.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 12: Sobriety Milestone Celebration (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a sobriety tracking and celebration module configured to: track sobriety duration from a configurable start date; calculate milestone achievements at predetermined intervals; generate family-wide notifications upon milestone achievement; enable family members to submit celebratory messages and acknowledgments; support journey reset with historical tracking; and incorporate milestone data as positive behavioral signals in the pattern recognition engine.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 13: Aftercare Plan Management (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising an aftercare plan management module configured to: enable creation of structured aftercare recommendations by moderators or family members; categorize recommendations by type including therapy, meetings, sober living, and support groups; track completion status of individual recommendations; integrate aftercare compliance as behavioral signals for the pattern recognition engine; and generate alerts for overdue or incomplete aftercare tasks.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 14: Multi-Tenant Provider Architecture (Independent)</div>
    <p>A multi-tenant software platform for addiction recovery support comprising: an organization management layer enabling treatment providers to create branded instances; customizable branding including logos, colors, and subdomains for each organization; hierarchical user management with organization administrators, staff, and family members; cross-organization isolation of family data with row-level security; consolidated analytics dashboards for organization-level outcome tracking; and the family intervention intelligence system of Claim 1 deployed within each organization context.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 15: AI-Powered Document Analysis (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising an intelligent document analysis module configured to: receive uploaded intervention letters, clinical documents, and family agreements; process document content through a large language model with domain-specific prompting; automatically extract stated boundaries, consequences, and target individuals; generate structured boundary records with pending status for moderator review; associate extracted boundaries with appropriate family members; and integrate document analysis results into the pattern recognition engine for comprehensive family assessment.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 16: Medication Compliance Monitoring (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a medication compliance monitoring module configured to: capture images of medication bottle labels using device cameras; process images through an AI vision model to extract medication name, dosage, pharmacy details, prescribing physician information, and refill schedules; auto-populate medication records from extracted data; track scheduled doses with configurable reminder notifications; record dose compliance status including taken, skipped with reason, and missed; generate alerts to designated family members for missed medications; incorporate medication compliance patterns as behavioral signals in the pattern recognition engine.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 17: Care Transition Management (Dependent on Claim 14)</div>
    <p>The system of Claim 14, further comprising a care transition management module configured to: track recovery phases including Detox, Residential, Sober Living, and Independent living; facilitate handoff of family oversight between provider organizations; transfer clinical notes and behavioral history during transitions with appropriate access controls; calculate provider outcome success scores based on recovery progression, regression rates, and completion metrics; generate transition summary reports for receiving providers; maintain continuity of family engagement across care level changes.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 18: Recovery Trajectory Visualization (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a recovery trajectory visualization module configured to: track progress toward a clinically-significant recovery milestone (365 days); calculate recovery phase progression through defined stages; generate qualitative trajectory indicators (Improving, Stable, Softening, Destabilizing) without numerical judgment; identify primary stabilizing factors from behavioral data; detect emerging friction points and potential warning signs; visualize recovery inflection points over time; provide clinical insights for provider review using non-predictive, non-diagnostic language.</p>
  </div>

  <div class="claim">
    <div class="claim-title">Claim 19: Secure Family Document Management (Dependent on Claim 1)</div>
    <p>The system of Claim 1, further comprising a family document management module configured to: provide secure document upload with encryption at rest; categorize documents by type including intervention letters, treatment agreements, and clinical records; integrate family-uploaded documents into provider dashboards with source attribution; trigger automatic AI analysis for intervention letters upon upload; maintain audit trails for document access and modifications; enforce role-based access controls distinguishing family member, moderator, and provider access levels.</p>
  </div>

  <div class="page-break"></div>

  <h2>7. Prior Art Differentiation</h2>

  <table class="comparison">
    <thead>
      <tr>
        <th>Aspect</th>
        <th>Prior Art</th>
        <th>FIIS Innovation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Data Sources</strong></td>
        <td>Single-source (e.g., only messaging OR only location)</td>
        <td>Multi-source integration (meetings, messages, finances, location, observations, medications, documents)</td>
      </tr>
      <tr>
        <td><strong>Analysis Approach</strong></td>
        <td>Rule-based or simple ML classification</td>
        <td>LLM-powered contextual analysis with domain-specific prompting</td>
      </tr>
      <tr>
        <td><strong>Output Format</strong></td>
        <td>Alerts or scores only</td>
        <td>Structured insights: signals, framing, questions, watch items</td>
      </tr>
      <tr>
        <td><strong>Domain Focus</strong></td>
        <td>General family or individual health</td>
        <td>Addiction recovery and intervention-specific</td>
      </tr>
      <tr>
        <td><strong>User Interaction</strong></td>
        <td>Passive monitoring</td>
        <td>Active observation input with AI-guided questioning</td>
      </tr>
    </tbody>
  </table>

  ${diagramsSectionHtml}

  <div class="footer-note">
    This document was generated from FamilyBridge™ Patent Documentation System.<br>
    All technical specifications reflect the current implementation as of the document generation date.<br>
    © ${new Date().getFullYear()} FamilyBridge. Confidential and Proprietary.
  </div>

</body>
</html>
    `;

    printWindow.document.write(documentContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const saveDisclosure = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disclosure));
    setHasChanges(false);
    toast.success('Invention disclosure saved locally');
  };

  const updateDisclosure = (field: keyof InventionDisclosure, value: string) => {
    setDisclosure(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateInventor = (index: number, field: keyof Inventor, value: string) => {
    setDisclosure(prev => {
      const newInventors = [...prev.inventors];
      newInventors[index] = { ...newInventors[index], [field]: value };
      return { ...prev, inventors: newInventors };
    });
    setHasChanges(true);
  };

  const addInventor = () => {
    setDisclosure(prev => ({
      ...prev,
      inventors: [...prev.inventors, { name: '', address: '', citizenship: '', email: '' }]
    }));
    setHasChanges(true);
  };

  const removeInventor = (index: number) => {
    if (disclosure.inventors.length <= 1) return;
    setDisclosure(prev => ({
      ...prev,
      inventors: prev.inventors.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Patent Technical Specification</h1>
          <p className="text-muted-foreground">Family Intervention Intelligence System (FIIS)</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
              <AlertCircle className="h-3 w-3" />
              Unsaved
            </Badge>
          )}
          <Button onClick={saveDisclosure} variant="outline" className="gap-2" disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print to PDF
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block print:mb-8">
        <h1 className="text-3xl font-bold text-center">Patent Technical Specification</h1>
        <p className="text-center text-lg mt-2">Family Intervention Intelligence System (FIIS)</p>
        <p className="text-center text-sm text-muted-foreground mt-1">FamilyBridge Application</p>
        <Separator className="mt-4" />
      </div>

      <ScrollArea className="h-[calc(100vh-300px)] print:h-auto print:overflow-visible">
        <div className="space-y-4 pr-4 print:pr-0">
          
          {/* Invention Disclosure Form */}
          <Section 
            title="Invention Disclosure Form" 
            icon={<User className="h-5 w-5 text-primary" />}
            defaultOpen={true}
          >
            <div className="space-y-6">
              {/* Inventor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Inventor Information</span>
                    <Button size="sm" variant="outline" onClick={addInventor} className="print:hidden">
                      + Add Inventor
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {disclosure.inventors.map((inventor, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Inventor {index + 1}</Badge>
                        {disclosure.inventors.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive h-6 px-2 print:hidden"
                            onClick={() => removeInventor(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`inventor-name-${index}`}>Full Legal Name</Label>
                          <Input
                            id={`inventor-name-${index}`}
                            value={inventor.name}
                            onChange={(e) => updateInventor(index, 'name', e.target.value)}
                            placeholder="John Doe"
                            className="print:border-0 print:p-0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`inventor-email-${index}`}>Email</Label>
                          <Input
                            id={`inventor-email-${index}`}
                            type="email"
                            value={inventor.email}
                            onChange={(e) => updateInventor(index, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className="print:border-0 print:p-0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`inventor-address-${index}`}>Full Address</Label>
                          <Input
                            id={`inventor-address-${index}`}
                            value={inventor.address}
                            onChange={(e) => updateInventor(index, 'address', e.target.value)}
                            placeholder="123 Main St, City, State, ZIP"
                            className="print:border-0 print:p-0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`inventor-citizenship-${index}`}>Citizenship</Label>
                          <Input
                            id={`inventor-citizenship-${index}`}
                            value={inventor.citizenship}
                            onChange={(e) => updateInventor(index, 'citizenship', e.target.value)}
                            placeholder="United States"
                            className="print:border-0 print:p-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="date-conception">Date of Conception</Label>
                      <Input
                        id="date-conception"
                        type="date"
                        value={disclosure.dateOfConception}
                        onChange={(e) => updateDisclosure('dateOfConception', e.target.value)}
                        className="print:border-0 print:p-0"
                      />
                      <p className="text-xs text-muted-foreground">
                        When you first conceived of the invention idea
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="date-disclosed">Date First Publicly Disclosed</Label>
                      <Input
                        id="date-disclosed"
                        type="date"
                        value={disclosure.dateFirstDisclosed}
                        onChange={(e) => updateDisclosure('dateFirstDisclosed', e.target.value)}
                        className="print:border-0 print:p-0"
                      />
                      <p className="text-xs text-muted-foreground">
                        First demo, publication, or public discussion (if any)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prior Art Awareness */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prior Art You Are Aware Of</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="competing-products">Competing Products / Similar Apps</Label>
                    <Textarea
                      id="competing-products"
                      value={disclosure.competingProducts}
                      onChange={(e) => updateDisclosure('competingProducts', e.target.value)}
                      placeholder="List any recovery apps, family monitoring tools, or similar products you are aware of..."
                      className="min-h-[80px] print:border-0 print:p-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="academic-papers">Academic Papers / Research</Label>
                    <Textarea
                      id="academic-papers"
                      value={disclosure.academicPapers}
                      onChange={(e) => updateDisclosure('academicPapers', e.target.value)}
                      placeholder="List any academic papers or research on similar approaches..."
                      className="min-h-[80px] print:border-0 print:p-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="existing-patents">Existing Patents</Label>
                    <Textarea
                      id="existing-patents"
                      value={disclosure.existingPatents}
                      onChange={(e) => updateDisclosure('existingPatents', e.target.value)}
                      placeholder="List any patent numbers or applications you are aware of..."
                      className="min-h-[80px] print:border-0 print:p-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prior-art-notes">Additional Prior Art Notes</Label>
                    <Textarea
                      id="prior-art-notes"
                      value={disclosure.priorArtNotes}
                      onChange={(e) => updateDisclosure('priorArtNotes', e.target.value)}
                      placeholder="Any other relevant prior art or distinguishing features..."
                      className="min-h-[80px] print:border-0 print:p-0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Business Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="commercial-plans">Commercial Plans</Label>
                    <Textarea
                      id="commercial-plans"
                      value={disclosure.commercialPlans}
                      onChange={(e) => updateDisclosure('commercialPlans', e.target.value)}
                      placeholder="How do you plan to commercialize this invention?"
                      className="min-h-[80px] print:border-0 print:p-0"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="target-market">Target Market</Label>
                      <Textarea
                        id="target-market"
                        value={disclosure.targetMarket}
                        onChange={(e) => updateDisclosure('targetMarket', e.target.value)}
                        placeholder="Who are the target users/customers?"
                        className="min-h-[60px] print:border-0 print:p-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="revenue-model">Revenue Model</Label>
                      <Textarea
                        id="revenue-model"
                        value={disclosure.revenueModel}
                        onChange={(e) => updateDisclosure('revenueModel', e.target.value)}
                        placeholder="Subscription, licensing, etc."
                        className="min-h-[60px] print:border-0 print:p-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Development Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Development Timeline & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label htmlFor="development-notes">Development History</Label>
                    <Textarea
                      id="development-notes"
                      value={disclosure.developmentNotes}
                      onChange={(e) => updateDisclosure('developmentNotes', e.target.value)}
                      placeholder="Document key milestones, design decisions, and evolution of the invention. Include dates when possible. Reference git commits, emails, or notes that document the development process..."
                      className="min-h-[120px] print:border-0 print:p-0"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps establish the timeline of invention for patent purposes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Abstract & Overview */}
          <Section 
            title="1. Abstract & Technical Field" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patent Title</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">
                  System and Method for Artificial Intelligence-Driven Family Behavioral Pattern Analysis 
                  and Intervention Support in Addiction Recovery Contexts
                </p>
                
                <div>
                  <h4 className="font-semibold mb-2">Abstract</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A computer-implemented system and method for analyzing family behavioral patterns 
                    using artificial intelligence to support intervention strategies in addiction and 
                    behavioral health recovery contexts. The system aggregates multi-source family 
                    interaction data including meeting attendance, communication patterns, financial 
                    requests, and geographic check-ins, processes this data through a specialized 
                    AI pattern recognition engine trained on family dynamics and addiction recovery 
                    principles, and generates actionable insights including pattern signals, contextual 
                    framing, clarifying questions for family members, and items to watch. The system 
                    further calculates a family health status indicator and provides real-time 
                    notifications for critical pattern changes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Technical Field</h4>
                  <p className="text-sm text-muted-foreground">
                    This invention relates to artificial intelligence systems for behavioral analysis, 
                    specifically to systems and methods for analyzing family interaction patterns to 
                    support intervention strategies in addiction recovery and behavioral health contexts.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Problems Solved</h4>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                    <li>
                      <strong>Fragmented Data Problem:</strong> Family members observing concerning 
                      behaviors lack a unified system to aggregate and analyze their observations 
                      alongside objective behavioral data.
                    </li>
                    <li>
                      <strong>Pattern Recognition Gap:</strong> Subtle behavioral changes that may 
                      indicate relapse risk or recovery progress are difficult for untrained family 
                      members to identify and interpret.
                    </li>
                    <li>
                      <strong>Intervention Timing:</strong> Families often intervene too late or 
                      inappropriately due to lack of objective data and professional-grade analysis tools.
                    </li>
                    <li>
                      <strong>Communication Barriers:</strong> Family members struggle to discuss 
                      concerns objectively without triggering defensive responses from the recovering individual.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* System Architecture */}
          <Section 
            title="2. System Architecture" 
            icon={<Layers className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">High-Level System Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_SYSTEM_ARCHITECTURE} />
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Architecture Components:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                    <li><strong>Client Layer:</strong> React-based progressive web application with mobile support</li>
                    <li><strong>API Layer:</strong> Serverless edge functions with JWT authentication</li>
                    <li><strong>FIIS Core Engine:</strong> Pattern analysis, signal classification, and notification orchestration</li>
                    <li><strong>AI/ML Layer:</strong> LLM integration with structured prompting and response parsing</li>
                    <li><strong>Data Layer:</strong> PostgreSQL with real-time subscriptions and encrypted storage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Pattern Analysis Algorithm */}
          <Section 
            title="3. Pattern Analysis Algorithm" 
            icon={<Brain className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">FIIS Pattern Analysis Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_PATTERN_ANALYSIS} />
                </div>
                
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold">Algorithm Pseudocode:</h4>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`FUNCTION analyze_family_patterns(family_id, user_observations):
    // Step 1: Aggregate data sources
    observations = FETCH observations FROM fiis_observations 
                   WHERE family_id = family_id 
                   ORDER BY occurred_at DESC LIMIT 50
    
    auto_events = FETCH events FROM fiis_auto_events 
                  WHERE family_id = family_id 
                  AND occurred_at > NOW() - INTERVAL '30 days'
    
    // Step 2: Build context object
    context = {
        family_members: GET_FAMILY_MEMBERS(family_id),
        recent_observations: FORMAT_OBSERVATIONS(observations),
        system_events: FORMAT_EVENTS(auto_events),
        health_history: GET_HEALTH_HISTORY(family_id)
    }
    
    // Step 3: Generate AI prompt
    prompt = BUILD_ANALYSIS_PROMPT(context, FIIS_SYSTEM_PROMPT)
    
    // Step 4: Call AI service with structured output
    ai_response = CALL_AI_SERVICE(prompt, {
        function: "provide_pattern_analysis",
        schema: ANALYSIS_OUTPUT_SCHEMA
    })
    
    // Step 5: Parse and validate response
    IF ai_response.function_call THEN
        analysis = PARSE_FUNCTION_ARGS(ai_response)
    ELSE
        analysis = EXTRACT_FROM_TEXT(ai_response.content)
    END IF
    
    // Step 6: Store results
    INSERT INTO fiis_pattern_analyses (
        family_id, requested_by, analysis_type,
        pattern_signals, what_seeing, contextual_framing,
        clarifying_questions, what_to_watch
    ) VALUES (family_id, current_user, 'comprehensive', ...)
    
    // Step 7: Evaluate notification triggers
    IF HAS_CRITICAL_SIGNALS(analysis.pattern_signals) THEN
        TRIGGER_NOTIFICATIONS(family_id, analysis)
    END IF
    
    RETURN analysis`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Data Model */}
          <Section 
            title="4. Data Model & Schema" 
            icon={<Database className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entity Relationship Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_DATA_MODEL} />
                </div>
                
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold">Key Table Specifications:</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2">Table</th>
                          <th className="text-left p-2">Purpose</th>
                          <th className="text-left p-2">Key Fields</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">fiis_observations</td>
                          <td className="p-2">User-submitted behavioral observations</td>
                          <td className="p-2">observation_type, content, occurred_at</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">fiis_auto_events</td>
                          <td className="p-2">System-tracked events (check-ins, messages)</td>
                          <td className="p-2">event_type, event_data (JSONB)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">fiis_pattern_analyses</td>
                          <td className="p-2">AI-generated analysis results</td>
                          <td className="p-2">pattern_signals, clarifying_questions, what_to_watch</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">family_health_status</td>
                          <td className="p-2">Calculated family health indicator</td>
                          <td className="p-2">status (enum), metrics (JSONB)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Signal Classification */}
          <Section 
            title="5. Signal Classification System" 
            icon={<GitBranch className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pattern Signal Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_SIGNAL_CLASSIFICATION} />
                </div>
                
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold">Signal Categories:</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 border rounded-lg">
                      <Badge variant="default" className="bg-green-500 mb-2">Positive</Badge>
                      <p className="text-sm text-muted-foreground">
                        Recovery progress, consistent meeting attendance, improved communication patterns
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="secondary" className="mb-2">Neutral</Badge>
                      <p className="text-sm text-muted-foreground">
                        Normal variations, insufficient data for classification
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="outline" className="border-orange-500 text-orange-500 mb-2">Concerning</Badge>
                      <p className="text-sm text-muted-foreground">
                        Missed meetings, unusual financial patterns, communication changes
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="destructive" className="mb-2">Crisis</Badge>
                      <p className="text-sm text-muted-foreground">
                        Multiple concerning indicators, potential relapse signals, safety concerns
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Health Calculation */}
          <Section 
            title="6. Family Health Calculation" 
            icon={<Shield className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health Status Algorithm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_HEALTH_CALCULATION} />
                </div>
                
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold">Health Status Levels:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500">IMPROVING (≥0.8)</Badge>
                    <Badge className="bg-blue-500">STABLE (≥0.6)</Badge>
                    <Badge className="bg-yellow-500 text-black">TENSION (≥0.4)</Badge>
                    <Badge className="bg-orange-500">CONCERN (≥0.2)</Badge>
                    <Badge className="bg-red-500">CRISIS (&lt;0.2)</Badge>
                  </div>
                  
                  <h4 className="font-semibold mt-4">Metric Weights:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                    <li>Meeting Attendance Rate: 30%</li>
                    <li>Message Sentiment Score: 25%</li>
                    <li>Financial Request Patterns: 25%</li>
                    <li>Check-in Compliance: 20%</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Real-time Events */}
          <Section 
            title="7. Real-Time Event Processing" 
            icon={<Code className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Processing Sequence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_REALTIME_EVENTS} />
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Notification System */}
          <Section 
            title="8. Notification System" 
            icon={<Bell className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <MermaidDiagram chart={DIAGRAM_NOTIFICATION_SYSTEM} />
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* User Journeys */}
          <Section 
            title="9. User Journey Flowcharts" 
            icon={<User className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Family Member Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    How family members onboard, engage daily, and receive insights to support their loved one's recovery.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_FAMILY_MEMBER_JOURNEY} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recovering Individual Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The path from joining a family group through daily accountability to celebrating recovery milestones.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_RECOVERING_INDIVIDUAL_JOURNEY} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Professional Moderator Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    How moderators are assigned, monitor families, use clinical tools, and coordinate care.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_MODERATOR_JOURNEY} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Admin Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Organization setup, family management, clinical oversight, and outcome analytics.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_PROVIDER_ADMIN_JOURNEY} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Market Positioning */}
          <Section 
            title="10. Market Positioning & Competitive Analysis" 
            icon={<Layers className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Value Proposition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    How FamilyBridge solves key problems in recovery support.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_VALUE_PROPOSITION} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Ecosystem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The interconnected network of families, recovering individuals, and providers.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_USER_ECOSYSTEM} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Competitive Advantage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unique differentiators that position FamilyBridge ahead of alternatives.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                    <MermaidDiagram chart={DIAGRAM_COMPETITIVE_ADVANTAGE} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Claims */}
          <Section 
            title="11. Patent Claims" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    Note: These draft claims are for patent attorney review and refinement. 
                    Final claim language should be prepared by qualified patent counsel.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Claim 1: Core System (Independent)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A computer-implemented system for analyzing family behavioral patterns comprising: 
                    a data aggregation module configured to collect and normalize behavioral data from 
                    multiple sources including meeting attendance records, communication logs, financial 
                    transaction requests, and geographic check-in data; a pattern recognition engine 
                    utilizing a large language model trained on family dynamics and addiction recovery 
                    principles; a signal classification system that categorizes detected patterns into 
                    severity levels; and an insight generation module that produces actionable recommendations 
                    for family members.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 2: Analysis Method (Independent)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A method for generating family intervention insights comprising the steps of: 
                    receiving user-submitted observations and system-tracked behavioral events; 
                    aggregating said observations and events into a unified context object; 
                    generating a structured prompt incorporating domain-specific analysis criteria; 
                    processing said prompt through an artificial intelligence model configured to 
                    output structured pattern analysis; parsing said output to extract pattern signals, 
                    contextual framing, clarifying questions, and watch items; and storing said 
                    analysis results for subsequent retrieval and notification triggering.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 3: Health Status Calculation (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a health status calculation module configured to: 
                    retrieve behavioral metrics from a predetermined time period; apply 
                    weighted scoring to each metric category including meeting attendance, 
                    communication sentiment, financial patterns, and compliance indicators; 
                    combine weighted scores to produce a composite health score; map 
                    said composite score to a categorical status level; generate a human-readable 
                    status reason; and trigger appropriate notifications based on status changes.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 4: Real-Time Processing (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a real-time event processing subsystem including: 
                    database triggers configured to invoke serverless functions upon data insertion; 
                    an event aggregation service that collects related events within a configurable time window; 
                    a pattern analysis queue that processes aggregated events through the AI engine; 
                    and a real-time subscription system that pushes analysis results to connected clients.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 5: Notification Orchestration (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a notification orchestration subsystem including: 
                    rule evaluation logic that assesses pattern analysis results against configurable thresholds; 
                    user preference management for notification channel selection; urgency-based 
                    routing that directs notifications to appropriate delivery channels; 
                    and engagement tracking that monitors notification effectiveness.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 6: Privacy-Preserving Architecture (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a privacy-preserving data architecture including: 
                    row-level security policies that restrict data access to authorized family members; 
                    encrypted storage for sensitive observation content; audit logging for all data access operations; 
                    and role-based access control distinguishing between family members, moderators, 
                    and system administrators.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 7: Liquor License Proximity Detection (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a location-based risk detection module configured to: 
                    receive geographic coordinates from user check-in events; query a database of active liquor 
                    license locations; calculate proximity between user location and licensed establishments; 
                    generate automated alerts to designated family members when proximity thresholds are exceeded; 
                    and log location events with associated risk indicators for subsequent pattern analysis.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 8: Meeting Verification System (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a meeting attendance verification module configured to: 
                    integrate with external meeting finder APIs to retrieve scheduled recovery meetings; 
                    capture user check-in with geographic coordinates and timestamp; verify proximity to 
                    known meeting locations; calculate expected checkout time based on meeting duration; 
                    monitor for timely checkout completion; and generate notifications for missed or overdue checkouts.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 9: Family Financial Request Workflow (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a financial request management module configured to: 
                    receive financial assistance requests from designated family members; capture supporting 
                    documentation including receipts and bills; route requests to authorized family approvers; 
                    implement voting workflows for request approval; track pledge commitments from multiple 
                    family members; facilitate secure payment information exchange; and analyze request patterns 
                    as behavioral signals for the pattern recognition engine.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 10: Professional Moderator Integration (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a professional moderator integration module configured to: 
                    enable assignment of licensed counselors or intervention specialists to family groups; 
                    provide moderator-specific dashboards with multi-family management capabilities; 
                    exclude moderator communications from behavioral pattern analysis to maintain objectivity; 
                    support temporary moderator assignments with automatic expiration; and maintain audit trails 
                    for all moderator actions and observations.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 11: HIPAA Release Management (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a healthcare authorization management module configured to: 
                    present HIPAA release documentation to designated family members; capture digital signatures 
                    with timestamp, IP address, and user agent verification; store encrypted signature data; 
                    maintain comprehensive audit logs of all release accesses; and provide moderators and 
                    healthcare providers with verified release status for each family member.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 12: Sobriety Milestone Celebration (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising a sobriety tracking and celebration module configured to: 
                    track sobriety duration from a configurable start date; calculate milestone achievements 
                    at predetermined intervals; generate family-wide notifications upon milestone achievement; 
                    enable family members to submit celebratory messages and acknowledgments; support journey 
                    reset with historical tracking; and incorporate milestone data as positive behavioral 
                    signals in the pattern recognition engine.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 13: Aftercare Plan Management (Dependent on Claim 1)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The system of Claim 1, further comprising an aftercare plan management module configured to: 
                    enable creation of structured aftercare recommendations by moderators or family members; 
                    categorize recommendations by type including therapy, meetings, sober living, and support groups; 
                    track completion status of individual recommendations; integrate aftercare compliance 
                    as behavioral signals for the pattern recognition engine; and generate alerts for 
                    overdue or incomplete aftercare tasks.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 14: Multi-Tenant Provider Architecture (Independent)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A multi-tenant software platform for addiction recovery support comprising: 
                    an organization management layer enabling treatment providers to create branded instances; 
                    customizable branding including logos, colors, and subdomains for each organization; 
                    hierarchical user management with organization administrators, staff, and family members; 
                    cross-organization isolation of family data with row-level security; 
                    consolidated analytics dashboards for organization-level outcome tracking; 
                    and the family intervention intelligence system of Claim 1 deployed within each organization context.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Prior Art Differentiation */}
          <Section 
            title="12. Prior Art Differentiation" 
            icon={<Shield className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Aspect</th>
                        <th className="text-left p-3">Prior Art</th>
                        <th className="text-left p-3">FIIS Innovation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Data Sources</td>
                        <td className="p-3 text-muted-foreground">Single-source (e.g., only messaging OR only location)</td>
                        <td className="p-3 text-muted-foreground">Multi-source integration (meetings, messages, finances, location, observations)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Analysis Approach</td>
                        <td className="p-3 text-muted-foreground">Rule-based or simple ML classification</td>
                        <td className="p-3 text-muted-foreground">LLM-powered contextual analysis with domain-specific prompting</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Output Format</td>
                        <td className="p-3 text-muted-foreground">Alerts or scores only</td>
                        <td className="p-3 text-muted-foreground">Structured insights: signals, framing, questions, watch items</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Domain Focus</td>
                        <td className="p-3 text-muted-foreground">General family or individual health</td>
                        <td className="p-3 text-muted-foreground">Addiction recovery and intervention-specific</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">User Interaction</td>
                        <td className="p-3 text-muted-foreground">Passive monitoring</td>
                        <td className="p-3 text-muted-foreground">Active observation input with AI-guided questioning</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Submission Checklist */}
          <Section 
            title="13. Patent Submission Checklist" 
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    📋 Complete these items before submitting to your patent attorney
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Inventor Information (Required)</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Full legal name(s) of all inventors</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Complete mailing addresses for all inventors</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Citizenship/country of residence for each inventor</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email addresses for correspondence</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Dates & Timeline (Required)</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Date of conception (when idea was first conceived)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Date of first public disclosure (if any)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Date of reduction to practice (working prototype)</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
                    ⚠️ Important: US law provides a 1-year grace period from public disclosure. File within 12 months of first disclosure.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Documentation (Required)</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Technical specification document (this document)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">System architecture diagrams</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Flowcharts and process diagrams</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Database schema / data model</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Algorithm pseudocode</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Screenshots of working implementation</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Prior Art Research (Required)</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">List of competing products with feature comparison</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Relevant academic papers and publications</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Related existing patents identified</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Key differentiators from prior art documented</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Business Information (Recommended)</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Commercialization plans</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Target markets identified</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Revenue model documented</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Filing Considerations</h4>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Provisional vs. Non-Provisional:</strong></p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li><strong>Provisional ($320 small entity):</strong> Establishes priority date, 12 months to file non-provisional, no formal claims required</li>
                      <li><strong>Non-Provisional ($1,600+ small entity):</strong> Full examination, formal claims, typically 2-3 years to grant</li>
                    </ul>
                    <p className="text-sm mt-2"><strong>Recommendation:</strong> File provisional first to establish earliest possible priority date, then refine claims before non-provisional filing.</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">International Considerations</h4>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm"><strong>PCT (Patent Cooperation Treaty):</strong></p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>File within 12 months of US provisional for international protection</li>
                      <li>Provides 30-31 months to enter national phase in specific countries</li>
                      <li>Priority markets: US, EU (EPO), UK, Canada, Australia</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Next Steps */}
          <Section 
            title="14. Recommended Next Steps" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <Badge variant="destructive">URGENT</Badge>
                    <div>
                      <p className="font-medium">Complete Inventor Information</p>
                      <p className="text-sm text-muted-foreground">
                        Fill in all inventor details in Section 1 above. This information is legally required for patent filing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>1</Badge>
                    <div>
                      <p className="font-medium">Review & Print This Document</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Print to PDF" to generate a complete technical specification document for your patent attorney.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>2</Badge>
                    <div>
                      <p className="font-medium">Engage Patent Attorney</p>
                      <p className="text-sm text-muted-foreground">
                        Select a patent attorney specializing in software/AI patents. Provide this document as the technical foundation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>3</Badge>
                    <div>
                      <p className="font-medium">Professional Prior Art Search</p>
                      <p className="text-sm text-muted-foreground">
                        Attorney will conduct comprehensive patent search in USPTO, EPO, and WIPO databases 
                        to validate novelty claims.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>4</Badge>
                    <div>
                      <p className="font-medium">Claims Refinement</p>
                      <p className="text-sm text-muted-foreground">
                        Work with attorney to refine claims based on prior art findings. Focus on maximizing protection scope
                        while ensuring claims are defensible.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>5</Badge>
                    <div>
                      <p className="font-medium">File Provisional Application</p>
                      <p className="text-sm text-muted-foreground">
                        File provisional patent application to establish priority date. This gives you 12 months
                        to file the full non-provisional application.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>6</Badge>
                    <div>
                      <p className="font-medium">PCT Filing (Optional)</p>
                      <p className="text-sm text-muted-foreground">
                        Within 12 months of provisional, file PCT application for international protection in key markets.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Estimated Timeline & Costs</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Provisional filing (attorney fees + USPTO):</span>
                      <span className="font-medium">$2,000 - $5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Non-provisional filing (attorney fees + USPTO):</span>
                      <span className="font-medium">$8,000 - $15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PCT international filing:</span>
                      <span className="font-medium">$3,000 - $6,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time to patent grant (typical):</span>
                      <span className="font-medium">2-3 years</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Costs vary by attorney and complexity. Small entity discounts may apply.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>

        </div>
      </ScrollArea>

      {/* Print Styles - Use class-based approach for reliable PDF export */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .mermaid-diagram svg {
            max-width: 100% !important;
            height: auto !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          /* Force all collapsibles open */
          [data-state="closed"] > [data-radix-collapsible-content] {
            display: block !important;
            height: auto !important;
          }
          
          /* CRITICAL: Make ALL text inputs and textareas fully visible */
          input[type="text"],
          input[type="email"],
          input[type="date"],
          textarea {
            border: 1px solid #ccc !important;
            background: white !important;
            padding: 8px !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            white-space: pre-wrap !important;
            resize: none !important;
            display: block !important;
            width: 100% !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            field-sizing: content !important;
          }
          
          /* Specific fix for textareas - force content-based height */
          textarea {
            height: auto !important;
            min-height: fit-content !important;
            overflow: visible !important;
            /* Fallback for browsers that don't support field-sizing */
            min-height: max-content !important;
          }
          
          /* Remove all scroll containers */
          [data-radix-scroll-area-viewport],
          [data-radix-scroll-area-root] {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
          }
          
          /* Override any fixed height classes */
          [class*="h-["],
          [class*="min-h-["],
          [class*="max-h-["] {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
          }
          
          /* Ensure cards expand to fit content */
          .card, [class*="Card"] {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Make sure the main container expands */
          .patent-documentation-content {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatentDocumentation;
