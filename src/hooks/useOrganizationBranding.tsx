import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OrganizationBranding {
  id: string;
  name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  primary_foreground_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  foreground_color: string | null;
  heading_font: string | null;
  body_font: string | null;
}

// Helper to convert hex to HSL string for CSS variables
// If already in HSL format (e.g., "220 75% 45%"), return as-is
export const hexToHsl = (color: string): string => {
  if (!color) return "";
  
  // Check if already in HSL format (contains spaces and %)
  if (color.includes('%') || /^\d+\s+\d+/.test(color.trim())) {
    return color.trim();
  }
  
  // Otherwise convert from hex
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) return color; // Return as-is if not valid hex

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export function useOrganizationBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    if (!user) {
      setBranding(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get the user's organization membership
      const { data: orgMember, error: memberError } = await supabase
        .from("organization_members")
        .select(
          `
          organization_id,
          organizations (
            id,
            name,
            logo_url,
            favicon_url,
            primary_color,
            primary_foreground_color,
            secondary_color,
            accent_color,
            background_color,
            foreground_color,
            heading_font,
            body_font
          )
        `
        )
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (memberError) {
        console.error("Error fetching organization branding:", memberError);
        setBranding(null);
      } else if (orgMember?.organizations) {
        const org = orgMember.organizations as any;
        setBranding({
          id: org.id,
          name: org.name,
          logo_url: org.logo_url,
          favicon_url: org.favicon_url,
          primary_color: org.primary_color,
          primary_foreground_color: org.primary_foreground_color,
          secondary_color: org.secondary_color,
          accent_color: org.accent_color,
          background_color: org.background_color,
          foreground_color: org.foreground_color,
          heading_font: org.heading_font,
          body_font: org.body_font,
        });
      } else {
        setBranding(null);
      }
    } catch (error) {
      console.error("Error fetching organization branding:", error);
      setBranding(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Apply branding CSS variables to the document
  const applyBranding = useCallback(() => {
    if (!branding) return;

    const root = document.documentElement;

    if (branding.primary_color) {
      const primaryHsl = hexToHsl(branding.primary_color);
      root.style.setProperty("--primary", primaryHsl);
      // Also set sidebar-primary for consistent sidebar theming
      root.style.setProperty("--sidebar-primary", primaryHsl);
    }
    if (branding.primary_foreground_color) {
      const primaryFgHsl = hexToHsl(branding.primary_foreground_color);
      root.style.setProperty("--primary-foreground", primaryFgHsl);
      root.style.setProperty("--sidebar-primary-foreground", primaryFgHsl);
    }
    if (branding.secondary_color) {
      root.style.setProperty("--secondary", hexToHsl(branding.secondary_color));
    }
    if (branding.accent_color) {
      const accentHsl = hexToHsl(branding.accent_color);
      root.style.setProperty("--accent", accentHsl);
      root.style.setProperty("--sidebar-accent", accentHsl);
    }
    if (branding.background_color) {
      const bgHsl = hexToHsl(branding.background_color);
      root.style.setProperty("--background", bgHsl);
      root.style.setProperty("--sidebar-background", bgHsl);
    }
    if (branding.foreground_color) {
      const fgHsl = hexToHsl(branding.foreground_color);
      root.style.setProperty("--foreground", fgHsl);
      root.style.setProperty("--sidebar-foreground", fgHsl);
    }
    
    // Set ring color to match primary for focus states
    if (branding.primary_color) {
      root.style.setProperty("--ring", hexToHsl(branding.primary_color));
    }
  }, [branding]);

  // Reset branding CSS variables to defaults
  const resetBranding = useCallback(() => {
    const root = document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--background");
    root.style.removeProperty("--foreground");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-primary-foreground");
    root.style.removeProperty("--sidebar-accent");
    root.style.removeProperty("--sidebar-background");
    root.style.removeProperty("--sidebar-foreground");
  }, []);

  return {
    branding,
    isLoading,
    applyBranding,
    resetBranding,
    refetch: fetchBranding,
  };
}
