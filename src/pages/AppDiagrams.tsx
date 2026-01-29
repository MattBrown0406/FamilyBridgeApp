import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { 
  ArrowLeft, 
  Users, 
  Layers, 
  GitBranch, 
  Presentation,
  Heart,
  Shield,
  Brain,
  Calendar,
  DollarSign,
  MapPin,
  MessageSquare,
  FileText,
  Pill,
  TrendingUp,
  Building2,
  UserCheck,
  Bell,
  Database,
  Cloud,
  Smartphone
} from 'lucide-react';

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
    end

    style A fill:#e0f2fe
    style E fill:#dcfce7
    style N fill:#fef3c7
    style P fill:#f0abfc`;

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
    end

    style A fill:#ddd6fe
    style D fill:#dcfce7
    style J fill:#fef3c7
    style O fill:#f0abfc`;

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
    end

    style A fill:#e0f2fe
    style D fill:#dcfce7
    style M fill:#fef3c7
    style O fill:#bbf7d0`;

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
    end

    style A fill:#ddd6fe
    style E fill:#dcfce7
    style I fill:#fef3c7
    style O fill:#f0abfc`;

// ========== FEATURE OVERVIEW DIAGRAM ==========

const DIAGRAM_FEATURE_OVERVIEW = `graph TB
    subgraph "👨‍👩‍👧‍👦 Family Features"
        F1[💬 Secure Family Chat]
        F2[📅 Meeting Check-ins]
        F3[💰 Financial Requests]
        F4[📍 Location Sharing]
        F5[📋 Boundary Management]
        F6[😊 Emotional Check-ins]
    end

    subgraph "🤖 AI Intelligence - FIIS"
        AI1[🧠 Pattern Analysis]
        AI2[📊 Recovery Trajectory]
        AI3[📄 Document Analysis]
        AI4[💊 Medication Scanning]
        AI5[🔔 Smart Alerts]
    end

    subgraph "👨‍⚕️ Provider Tools"
        P1[📝 Clinical Notes]
        P2[💬 Team Messaging]
        P3[🔄 Care Transitions]
        P4[📈 Outcome Reports]
        P5[🏢 Organization Management]
    end

    subgraph "🔐 Security & Compliance"
        S1[📋 HIPAA Releases]
        S2[🔒 Row-Level Security]
        S3[📜 Audit Logging]
        S4[🔑 Role-Based Access]
    end

    F1 --> AI1
    F2 --> AI1
    F3 --> AI1
    F4 --> AI5
    F5 --> AI3
    F6 --> AI2

    AI1 --> P1
    AI2 --> P4
    AI5 --> P2
    AI3 --> P1

    P1 --> S3
    P2 --> S2
    P3 --> S3
    P4 --> S4

    style F1 fill:#bfdbfe
    style AI1 fill:#fef3c7
    style P1 fill:#ddd6fe
    style S1 fill:#fecaca`;

// ========== TECHNICAL ARCHITECTURE DIAGRAMS ==========

const DIAGRAM_SYSTEM_ARCHITECTURE = `graph TD
    subgraph "Client Layer"
        C1[📱 React PWA]
        C2[🖥️ Desktop Browser]
        C3[📲 Mobile Browser]
    end

    subgraph "API Gateway"
        A1[🔐 Supabase Auth]
        A2[⚡ Edge Functions]
        A3[🔄 Realtime Subscriptions]
    end

    subgraph "Business Logic"
        B1[👥 Family Management]
        B2[📊 FIIS Analysis Engine]
        B3[🔔 Notification Service]
        B4[💊 Medication Tracker]
        B5[🔄 Care Transitions]
    end

    subgraph "AI Services"
        AI1[🧠 Pattern Analysis<br/>Gemini/GPT]
        AI2[📄 Document Parser<br/>Vision API]
        AI3[💊 Label Scanner<br/>OCR + AI]
        AI4[😊 Sentiment Analysis]
    end

    subgraph "Data Layer"
        D1[(PostgreSQL<br/>Supabase)]
        D2[📁 File Storage]
        D3[🔐 Encrypted Secrets]
        D4[📊 Analytics]
    end

    C1 --> A1
    C2 --> A1
    C3 --> A1

    A1 --> A2
    A2 --> B1
    A2 --> B2
    A2 --> B3
    A2 --> B4
    A2 --> B5
    A1 --> A3

    B2 --> AI1
    B2 --> AI4
    B1 --> AI2
    B4 --> AI3

    B1 --> D1
    B2 --> D1
    B3 --> D1
    B4 --> D1
    B5 --> D1

    AI2 --> D2
    AI3 --> D2
    A1 --> D3
    B2 --> D4

    A3 --> C1

    style C1 fill:#bfdbfe
    style A2 fill:#bbf7d0
    style AI1 fill:#fef3c7
    style D1 fill:#ddd6fe`;

const DIAGRAM_DATA_FLOW = `sequenceDiagram
    participant U as 👤 User
    participant App as 📱 FamilyBridge App
    participant Auth as 🔐 Supabase Auth
    participant API as ⚡ Edge Functions
    participant AI as 🧠 AI Service
    participant DB as 🗄️ Database
    participant RT as 🔄 Realtime

    U->>App: Submit Observation
    App->>Auth: Verify JWT Token
    Auth-->>App: Token Valid

    App->>API: POST /fiis-analyze
    API->>DB: Fetch Family Context
    DB-->>API: Historical Data

    API->>AI: Analyze Patterns
    AI-->>API: Structured Insights

    API->>DB: Store Analysis
    DB-->>RT: Broadcast Update
    RT-->>App: Real-time Update

    App-->>U: Display Insights

    Note over API,AI: AI processing uses<br/>Gemini or GPT models

    Note over DB,RT: All changes trigger<br/>real-time subscriptions`;

const DIAGRAM_SECURITY_ARCHITECTURE = `graph TD
    subgraph "Authentication Layer"
        A1[🔐 JWT Tokens]
        A2[📧 Email/Password]
        A3[🔑 Magic Links]
    end

    subgraph "Authorization Layer"
        B1[👥 Row-Level Security]
        B2[🎭 Role-Based Access]
        B3[👨‍👩‍👧 Family Membership]
        B4[🏢 Organization Membership]
    end

    subgraph "Data Protection"
        C1[🔒 Encrypted at Rest]
        C2[🔐 Encrypted in Transit]
        C3[📋 HIPAA Compliance]
        C4[📜 Audit Logging]
    end

    subgraph "Access Patterns"
        D1[👤 Self - Own Data Only]
        D2[👨‍👩‍👧 Family - Shared Data]
        D3[👨‍⚕️ Moderator - Assigned Families]
        D4[🏢 Provider - Org Families]
        D5[👑 Super Admin - All Data]
    end

    A1 --> B1
    A2 --> A1
    A3 --> A1

    B1 --> B2
    B2 --> B3
    B2 --> B4

    B3 --> D1
    B3 --> D2
    B4 --> D3
    B4 --> D4
    B1 --> D5

    D1 --> C1
    D2 --> C1
    D3 --> C1
    D4 --> C1
    D5 --> C1

    C1 --> C2
    C2 --> C3
    C3 --> C4

    style A1 fill:#bbf7d0
    style B1 fill:#bfdbfe
    style C3 fill:#fecaca
    style D5 fill:#ddd6fe`;

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
    S4 --> O4

    style P1 fill:#fecaca
    style S1 fill:#bfdbfe
    style O4 fill:#bbf7d0`;

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
    U3 -.-> O4

    style FB fill:#3b82f6,color:#fff
    style U1 fill:#bfdbfe
    style U2 fill:#bbf7d0
    style U3 fill:#ddd6fe
    style O1 fill:#fef3c7
    style O2 fill:#fef3c7
    style O3 fill:#fef3c7
    style O4 fill:#fef3c7`;

const DIAGRAM_REVENUE_MODEL = `graph TD
    subgraph "B2C - Families"
        B2C1[💳 Family Subscription<br/>$19.99/month]
        B2C2[⏰ 24-Hour Moderator<br/>$200 one-time]
        B2C3[📱 App Store Purchase]
    end

    subgraph "B2B - Providers"
        B2B1[🏢 Organization License<br/>Per-seat pricing]
        B2B2[🏷️ White-Label Branding<br/>Custom domains]
        B2B3[📊 Analytics Dashboard<br/>Outcome reporting]
    end

    subgraph "Revenue Streams"
        R1[💰 Recurring Revenue]
        R2[💵 Transaction Revenue]
        R3[🏆 Enterprise Contracts]
    end

    B2C1 --> R1
    B2C2 --> R2
    B2C3 --> R1

    B2B1 --> R1
    B2B2 --> R3
    B2B3 --> R3

    style B2C1 fill:#bbf7d0
    style B2B1 fill:#bfdbfe
    style R1 fill:#fef3c7
    style R3 fill:#ddd6fe`;

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
    C4 -.->|Gap| D3

    style D1 fill:#fef3c7
    style M1 fill:#3b82f6,color:#fff
    style C1 fill:#fecaca
    style C2 fill:#fecaca
    style C3 fill:#fecaca
    style C4 fill:#fecaca`;

// ========== COMPONENT ==========

const DiagramCard = ({ 
  title, 
  description, 
  diagram, 
  icon: Icon 
}: { 
  title: string; 
  description: string; 
  diagram: string; 
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
        <MermaidDiagram chart={diagram} />
      </div>
    </CardContent>
  </Card>
);

const AppDiagrams = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('journeys');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">FamilyBridge Architecture & Diagrams</h1>
                <p className="text-sm text-muted-foreground">
                  Visual documentation of system design and user flows
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              <Brain className="h-3 w-3 mr-1" />
              Patent Pending
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="journeys" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              User Journeys
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Layers className="h-4 w-4 hidden sm:block" />
              Features
            </TabsTrigger>
            <TabsTrigger value="technical" className="gap-2">
              <GitBranch className="h-4 w-4 hidden sm:block" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="marketing" className="gap-2">
              <Presentation className="h-4 w-4 hidden sm:block" />
              Marketing
            </TabsTrigger>
          </TabsList>

          {/* User Journeys Tab */}
          <TabsContent value="journeys" className="space-y-6">
            <div className="grid gap-6">
              <DiagramCard
                title="Family Member Journey"
                description="How family members onboard, engage daily, and receive insights to support their loved one's recovery"
                diagram={DIAGRAM_FAMILY_MEMBER_JOURNEY}
                icon={Heart}
              />
              <DiagramCard
                title="Recovering Individual Journey"
                description="The path from joining a family group through daily accountability to celebrating recovery milestones"
                diagram={DIAGRAM_RECOVERING_INDIVIDUAL_JOURNEY}
                icon={TrendingUp}
              />
              <DiagramCard
                title="Professional Moderator Journey"
                description="How moderators are assigned, monitor families, use clinical tools, and coordinate care"
                diagram={DIAGRAM_MODERATOR_JOURNEY}
                icon={UserCheck}
              />
              <DiagramCard
                title="Provider Admin Journey"
                description="Organization setup, family management, clinical oversight, and outcome analytics"
                diagram={DIAGRAM_PROVIDER_ADMIN_JOURNEY}
                icon={Building2}
              />
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <DiagramCard
              title="Feature Overview"
              description="How FamilyBridge's family features, AI intelligence, provider tools, and security work together"
              diagram={DIAGRAM_FEATURE_OVERVIEW}
              icon={Layers}
            />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Family Chat</h3>
                </div>
                <p className="text-sm text-muted-foreground">Secure, moderated communication with content filtering and real-time updates</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Meeting Check-ins</h3>
                </div>
                <p className="text-sm text-muted-foreground">GPS-verified attendance with checkout reminders and liquor license proximity alerts</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Brain className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">FIIS Intelligence</h3>
                </div>
                <p className="text-sm text-muted-foreground">AI-powered pattern analysis with recovery trajectory tracking and actionable insights</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Pill className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Medication Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground">AI label scanning, dose logging, refill alerts, and compliance monitoring</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Financial Requests</h3>
                </div>
                <p className="text-sm text-muted-foreground">Transparent voting, pledge tracking, receipt uploads, and payment confirmation</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold">Location Sharing</h3>
                </div>
                <p className="text-sm text-muted-foreground">On-demand check-in requests with privacy controls and 30-day auto-expiration</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold">Document Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">AI extraction of boundaries from intervention letters with moderator review</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Shield className="h-5 w-5 text-pink-600" />
                  </div>
                  <h3 className="font-semibold">HIPAA Compliance</h3>
                </div>
                <p className="text-sm text-muted-foreground">Digital signature capture, audit logging, and encrypted storage for PHI</p>
              </Card>
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            <DiagramCard
              title="System Architecture"
              description="High-level view of the client, API, business logic, AI, and data layers"
              diagram={DIAGRAM_SYSTEM_ARCHITECTURE}
              icon={Cloud}
            />
            <DiagramCard
              title="Data Flow"
              description="Sequence diagram showing how user actions flow through the system"
              diagram={DIAGRAM_DATA_FLOW}
              icon={GitBranch}
            />
            <DiagramCard
              title="Security Architecture"
              description="Authentication, authorization, data protection, and access patterns"
              diagram={DIAGRAM_SECURITY_ARCHITECTURE}
              icon={Shield}
            />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-6">
            <DiagramCard
              title="Value Proposition"
              description="How FamilyBridge solves key problems in recovery support"
              diagram={DIAGRAM_VALUE_PROPOSITION}
              icon={TrendingUp}
            />
            <DiagramCard
              title="User Ecosystem"
              description="The interconnected network of families, recovering individuals, and providers"
              diagram={DIAGRAM_USER_ECOSYSTEM}
              icon={Users}
            />
            <DiagramCard
              title="Revenue Model"
              description="B2C family subscriptions and B2B provider licensing"
              diagram={DIAGRAM_REVENUE_MODEL}
              icon={DollarSign}
            />
            <DiagramCard
              title="Competitive Advantage"
              description="Unique differentiators that position FamilyBridge ahead of alternatives"
              diagram={DIAGRAM_COMPETITIVE_ADVANTAGE}
              icon={TrendingUp}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AppDiagrams;
