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
  AlertCircle
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
  inventors: [{ name: '', address: '', citizenship: '', email: '' }],
  dateOfConception: '',
  dateFirstDisclosed: '',
  priorArtNotes: '',
  competingProducts: '',
  academicPapers: '',
  existingPatents: '',
  commercialPlans: '',
  targetMarket: '',
  revenueModel: '',
  developmentNotes: '',
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

  const handlePrint = () => {
    window.print();
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

          {/* Claims */}
          <Section 
            title="9. Patent Claims" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Claim 1: Core System</h4>
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
                  <h4 className="font-semibold mb-2">Claim 2: Analysis Method</h4>
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
                  <h4 className="font-semibold mb-2">Claim 3: Health Status Calculation</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A method for calculating a family health status indicator comprising: 
                    retrieving behavioral metrics from a predetermined time period; applying 
                    weighted scoring to each metric category including meeting attendance, 
                    communication sentiment, financial patterns, and compliance indicators; 
                    combining weighted scores to produce a composite health score; mapping 
                    said composite score to a categorical status level; generating a human-readable 
                    status reason; and triggering appropriate notifications based on status changes.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 4: Real-Time Processing</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A real-time event processing system comprising: database triggers configured 
                    to invoke serverless functions upon data insertion; an event aggregation 
                    service that collects related events within a configurable time window; 
                    a pattern analysis queue that processes aggregated events through the AI engine; 
                    and a real-time subscription system that pushes analysis results to connected clients.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 5: Notification Orchestration</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A notification orchestration system comprising: rule evaluation logic that 
                    assesses pattern analysis results against configurable thresholds; user 
                    preference management for notification channel selection; urgency-based 
                    routing that directs notifications to appropriate delivery channels; 
                    and engagement tracking that monitors notification effectiveness.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Claim 6: Privacy-Preserving Architecture</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A privacy-preserving data architecture comprising: row-level security policies 
                    that restrict data access to authorized family members; encrypted storage for 
                    sensitive observation content; audit logging for all data access operations; 
                    and role-based access control distinguishing between family members, moderators, 
                    and system administrators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Prior Art Differentiation */}
          <Section 
            title="10. Prior Art Differentiation" 
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

          {/* Next Steps */}
          <Section 
            title="11. Recommended Next Steps" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>1</Badge>
                    <div>
                      <p className="font-medium">Prior Art Search</p>
                      <p className="text-sm text-muted-foreground">
                        Conduct comprehensive patent search in USPTO, EPO, and WIPO databases 
                        for related AI/ML behavioral analysis systems
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>2</Badge>
                    <div>
                      <p className="font-medium">Claims Refinement</p>
                      <p className="text-sm text-muted-foreground">
                        Work with patent attorney to refine claims based on prior art findings 
                        and maximize protection scope
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>3</Badge>
                    <div>
                      <p className="font-medium">Provisional Filing</p>
                      <p className="text-sm text-muted-foreground">
                        File provisional patent application to establish priority date while 
                        continuing development
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge>4</Badge>
                    <div>
                      <p className="font-medium">Documentation Enhancement</p>
                      <p className="text-sm text-muted-foreground">
                        Add implementation examples, edge cases, and additional embodiments 
                        to strengthen application
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

        </div>
      </ScrollArea>

      {/* Print Styles */}
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
          
          [data-state="closed"] > [data-radix-collapsible-content] {
            display: block !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatentDocumentation;
