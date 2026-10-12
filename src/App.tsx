import { Toaster } from "@/components/ui/toaster";
import { CrisisHelpButton } from "@/components/CrisisHelpButton";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RevenueCatProvider } from "@/hooks/useRevenueCat";
import { OrganizationProvider } from "@/hooks/useOrganization";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import { LegacyRedirect } from "@/components/site/LegacyRedirect";
import NativePushInitializer from "./components/NativePushInitializer";
import { usePlatform } from "@/hooks/usePlatform";

// Every page except the homepage loads on demand, so visitors download only the page they open
// (the homepage used to ship the whole legacy web app in one 1.7 MB bundle).
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ModeratorDashboard = lazy(() => import("./pages/ModeratorDashboard"));
const FamilyChat = lazy(() => import("./pages/FamilyChat"));
const Meetings = lazy(() => import("./pages/Meetings"));
const EnablingExercise = lazy(() => import("./pages/EnablingExercise"));
const Subscription = lazy(() => import("./pages/Subscription"));
const ProviderAdmin = lazy(() => import("./pages/ProviderAdmin"));
const ProviderPurchase = lazy(() => import("./pages/ProviderPurchase"));
const ProviderWorkspace = lazy(() => import("./pages/ProviderWorkspace"));
const ProfessionalInvite = lazy(() => import("./pages/ProfessionalInvite"));
const ProfessionalFamilyWorkspace = lazy(() => import("./pages/ProfessionalFamilyWorkspace"));
const ProviderCoordination = lazy(() => import("./pages/ProviderCoordination"));
const FamilyPurchase = lazy(() => import("./pages/FamilyPurchase"));
const FamilySetup = lazy(() => import("./pages/FamilySetup"));
const JoinFamily = lazy(() => import("./pages/JoinFamily"));
const ForProviders = lazy(() => import("./pages/ForProviders"));
const ModeratorPurchase = lazy(() => import("./pages/ModeratorPurchase"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoFamily = lazy(() => import("./pages/DemoFamily"));
const DemoProvider = lazy(() => import("./pages/DemoProvider"));
const NativeHome = lazy(() => import("./pages/NativeHome"));
const Support = lazy(() => import("./pages/Support"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Eula = lazy(() => import("./pages/Eula"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SignHIPAA = lazy(() => import("./pages/SignHIPAA"));
const UpdatePayment = lazy(() => import("./pages/UpdatePayment"));
const InterventionReadiness = lazy(() => import("./pages/InterventionReadiness"));
const InterventionExecution = lazy(() => import("./pages/InterventionExecution"));
const AccountabilityEngine = lazy(() => import("./pages/AccountabilityEngine"));
const PostInterventionContinuity = lazy(() => import("./pages/PostInterventionContinuity"));
const OutcomePredictions = lazy(() => import("./pages/OutcomePredictions"));
const AILearningLayer = lazy(() => import("./pages/AILearningLayer"));
const AILearningLayerStage2 = lazy(() => import("./pages/AILearningLayerStage2"));
const AIGovernance = lazy(() => import("./pages/AIGovernance"));
const InputReconciliation = lazy(() => import("./pages/InputReconciliation"));
const FIISIntelligence = lazy(() => import("./pages/features/FIISIntelligence"));
const RecoveryTrajectory = lazy(() => import("./pages/features/RecoveryTrajectory"));
const DocumentAnalysis = lazy(() => import("./pages/features/DocumentAnalysis"));
const MedicationCompliance = lazy(() => import("./pages/features/MedicationCompliance"));
const FinancialCoordination = lazy(() => import("./pages/features/FinancialCoordination"));
const CareTransitions = lazy(() => import("./pages/features/CareTransitions"));
const ConversationCoaching = lazy(() => import("./pages/features/ConversationCoaching"));
const ProviderOutcomes = lazy(() => import("./pages/features/ProviderOutcomes"));
const InterventionOutcomes = lazy(() => import("./pages/features/InterventionOutcomes"));
const FIISGuidance = lazy(() => import("./pages/features/FIISGuidance"));
const PracticeBilling = lazy(() => import("./pages/PracticeBilling"));
const PracticeBillingComplete = lazy(() => import("./pages/PracticeBillingComplete"));
const StaticPage = lazy(() => import("./components/site/StaticPage"));

const queryClient = new QueryClient();

const App = () => {
  const { isNative, isIOS } = usePlatform();
  const paymentsWebOnly = isNative && isIOS;

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RevenueCatProvider>
          <OrganizationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <NativePushInitializer />
              <CrisisHelpButton />
              <main>
              <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
              <Routes>
              <Route path="/" element={isNative ? <NativeHome /> : <Index />} />
              <Route path="/auth" element={<LegacyRedirect to="/#download" legacy={<Auth />} />} />
              <Route path="/dashboard" element={<LegacyRedirect to="/#download" legacy={<Dashboard />} />} />
              <Route path="/moderator-dashboard" element={<LegacyRedirect to="/practice-billing" legacy={<ModeratorDashboard />} />} />
              <Route path="/family/:familyId" element={<FamilyChat />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/enabling-exercise" element={<EnablingExercise />} />
              <Route
                path="/subscription"
                element={paymentsWebOnly ? <Navigate to="/family-purchase" replace /> : <Subscription />}
              />
              <Route path="/provider-admin" element={<LegacyRedirect to="/practice-billing" legacy={<ProviderAdmin />} />} />
              <Route path="/provider-workspace" element={<LegacyRedirect to="/practice-billing" legacy={<ProviderWorkspace />} />} />
              <Route path="/professional-invite" element={<ProfessionalInvite />} />
              <Route path="/professional-family/:familyId" element={<ProfessionalFamilyWorkspace />} />
              <Route path="/provider-coordination" element={<ProviderCoordination />} />
              <Route path="/provider-purchase" element={<LegacyRedirect to="/for-providers" legacy={<ProviderPurchase />} />} />
              <Route path="/family-purchase" element={<LegacyRedirect to="/#pricing" legacy={<FamilyPurchase />} />} />
              <Route path="/family-setup" element={<FamilySetup />} />
              <Route path="/join" element={<LegacyRedirect to="/#download" legacy={<JoinFamily />} />} />
              <Route path="/join-family" element={<LegacyRedirect to="/#download" legacy={<JoinFamily />} />} />
              <Route path="/for-providers" element={<ForProviders />} />
              <Route path="/moderator-purchase" element={<ModeratorPurchase />} />
              <Route path="/super-admin" element={<LegacyRedirect to="/" legacy={<SuperAdmin />} />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/demo/family" element={<DemoFamily />} />
              <Route path="/demo/provider" element={<DemoProvider />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/eula" element={<Eula />} />
              <Route path="/practice-billing" element={<PracticeBilling />} />
              <Route path="/practice-billing/complete" element={<PracticeBillingComplete />} />
              <Route path="/sign-hipaa" element={<SignHIPAA />} />
              <Route path="/intervention-readiness" element={<InterventionReadiness />} />
              <Route path="/intervention-execution" element={<InterventionExecution />} />
              <Route path="/post-intervention" element={<PostInterventionContinuity />} />
              <Route path="/accountability-engine" element={<AccountabilityEngine />} />
              <Route path="/outcome-predictions" element={<OutcomePredictions />} />
              <Route path="/ai-learning" element={<AILearningLayer />} />
              <Route path="/ai-learning/stage-2" element={<AILearningLayerStage2 />} />
              <Route path="/ai-learning/governance" element={<AIGovernance />} />
              <Route path="/input-reconciliation" element={<InputReconciliation />} />
              {/* The previous web app's feature pages described features it no longer has; they point to the current pages. */}
              <Route path="/features/fiis-intelligence" element={<LegacyRedirect to="/#insights" legacy={<FIISIntelligence />} />} />
              <Route path="/features/recovery-trajectory" element={<LegacyRedirect to="/for-providers" legacy={<RecoveryTrajectory />} />} />
              <Route path="/features/document-analysis" element={<LegacyRedirect to="/#features" legacy={<DocumentAnalysis />} />} />
              <Route path="/features/medication-compliance" element={<LegacyRedirect to="/#features" legacy={<MedicationCompliance />} />} />
              <Route path="/features/financial-coordination" element={<LegacyRedirect to="/#features" legacy={<FinancialCoordination />} />} />
              <Route path="/features/care-transitions" element={<LegacyRedirect to="/for-providers" legacy={<CareTransitions />} />} />
              <Route path="/features/conversation-coaching" element={<LegacyRedirect to="/#features" legacy={<ConversationCoaching />} />} />
              <Route path="/features/provider-outcomes" element={<ProviderOutcomes />} />
              <Route path="/features/intervention-outcomes" element={<InterventionOutcomes />} />
              <Route path="/features/fiis-guidance" element={<FIISGuidance />} />
              <Route
                path="/update-payment"
                element={paymentsWebOnly ? <Navigate to="/auth" replace /> : <UpdatePayment />}
              />
              {/* The blog is static pages built by scripts/blog; the host serves them directly. */}
              <Route path="/blog/*" element={<StaticPage />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </main>
            </BrowserRouter>
          </OrganizationProvider>
        </RevenueCatProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
