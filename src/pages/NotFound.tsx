import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <SEOHead title="Page not found | FamilyBridge" description="This page doesn't exist. Visit the FamilyBridge homepage." noIndex />
      <div className="text-center">
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl font-bold font-display">Page not found</h1>
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl text-muted-foreground">We couldn’t find that page.</p>
        <a href="/" className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
