import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import FamilyPurchase from "./pages/FamilyPurchase";
import FamilySetup from "./pages/FamilySetup";
import ModeratorPurchase from "./pages/ModeratorPurchase";
import SuperAdmin from "./pages/SuperAdmin";
import Demo from "./pages/Demo";
import DemoFamily from "./pages/DemoFamily";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import SignHIPAA from "./pages/SignHIPAA";
import UpdatePayment from "./pages/UpdatePayment";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
              <Route path="/provider-purchase" element={<ProviderPurchase />} />
              <Route path="/family-purchase" element={<FamilyPurchase />} />
              <Route path="/family-setup" element={<FamilySetup />} />
              <Route path="/moderator-purchase" element={<ModeratorPurchase />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/demo/family" element={<DemoFamily />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/sign-hipaa" element={<SignHIPAA />} />
              <Route path="/update-payment" element={<UpdatePayment />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OrganizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
