import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RevenueCatProvider } from "@/hooks/useRevenueCat";
import { OrganizationProvider } from "@/hooks/useOrganization";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import FamilyChat from "./pages/FamilyChat";
import Meetings from "./pages/Meetings";
import EnablingExercise from "./pages/EnablingExercise";
import Subscription from "./pages/Subscription";
import ProviderAdmin from "./pages/ProviderAdmin";
import ProviderPurchase from "./pages/ProviderPurchase";
import ProviderWorkspace from "./pages/ProviderWorkspace";
import ProviderCoordination from "./pages/ProviderCoordination";
import FamilyPurchase from "./pages/FamilyPurchase";
import FamilySetup from "./pages/FamilySetup";
import ModeratorPurchase from "./pages/ModeratorPurchase";
import SuperAdmin from "./pages/SuperAdmin";
import Demo from "./pages/Demo";
import DemoFamily from "./pages/DemoFamily";
import DemoProvider from "./pages/DemoProvider";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import SignHIPAA from "./pages/SignHIPAA";
import UpdatePayment from "./pages/UpdatePayment";
import InterventionReadiness from "./pages/InterventionReadiness";
import InterventionExecution from "./pages/InterventionExecution";
import AccountabilityEngine from "./pages/AccountabilityEngine";
import PostInterventionContinuity from "./pages/PostInterventionContinuity";
import OutcomePredictions from "./pages/OutcomePredictions";
import AILearningLayer from "./pages/AILearningLayer";
import AILearningLayerStage2 from "./pages/AILearningLayerStage2";
import AIGovernance from "./pages/AIGovernance";
import InputReconciliation from "./pages/InputReconciliation";
import FIISIntelligence from "./pages/features/FIISIntelligence";
import RecoveryTrajectory from "./pages/features/RecoveryTrajectory";
import DocumentAnalysis from "./pages/features/DocumentAnalysis";
import MedicationCompliance from "./pages/features/MedicationCompliance";
import FinancialCoordination from "./pages/features/FinancialCoordination";
import CareTransitions from "./pages/features/CareTransitions";
import ConversationCoaching from "./pages/features/ConversationCoaching";
import ScrollToTop from "./components/ScrollToTop";
import { usePlatform } from "@/hooks/usePlatform";

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
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
              <Route path="/family/:familyId" element={<FamilyChat />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/enabling-exercise" element={<EnablingExercise />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/provider-admin" element={<ProviderAdmin />} />
              <Route path="/provider-workspace" element={<ProviderWorkspace />} />
              <Route path="/provider-coordination" element={<ProviderCoordination />} />
              <Route path="/provider-purchase" element={<ProviderPurchase />} />
              <Route path="/family-purchase" element={<FamilyPurchase />} />
              <Route path="/family-setup" element={<FamilySetup />} />
              <Route path="/moderator-purchase" element={<ModeratorPurchase />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/demo/family" element={<DemoFamily />} />
              <Route path="/demo/provider" element={<DemoProvider />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
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
              <Route path="/features/fiis-intelligence" element={<FIISIntelligence />} />
              <Route path="/features/recovery-trajectory" element={<RecoveryTrajectory />} />
              <Route path="/features/document-analysis" element={<DocumentAnalysis />} />
              <Route path="/features/medication-compliance" element={<MedicationCompliance />} />
              <Route path="/features/financial-coordination" element={<FinancialCoordination />} />
              <Route path="/features/care-transitions" element={<CareTransitions />} />
              <Route path="/features/conversation-coaching" element={<ConversationCoaching />} />
              <Route
                path="/update-payment"
                element={paymentsWebOnly ? <Navigate to="/auth" replace /> : <UpdatePayment />}
              />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OrganizationProvider>
        </RevenueCatProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
