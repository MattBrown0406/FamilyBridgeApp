import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Public theming data only - sensitive contact info not exposed
interface OrganizationTheme {
  id: string;
  subdomain: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  primary_foreground_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  heading_font: string;
  body_font: string;
}

interface OrganizationContextType {
  organization: OrganizationTheme | null;
  isLoading: boolean;
  isWhiteLabeled: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isLoading: true,
  isWhiteLabeled: false,
  refetch: async () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

// Extract subdomain from current hostname
const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  
  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for subdomain in URL params for testing
    const params = new URLSearchParams(window.location.search);
    return params.get('org') || null;
  }
  
  // Handle preview domains (*.lovable.app)
  if (hostname.endsWith('.lovable.app')) {
    const parts = hostname.split('.');
    // Format: subdomain.project.lovable.app
    if (parts.length >= 4) {
      return parts[0];
    }
    return null;
  }
  
  // Handle custom domains
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
};

// Apply organization theme to CSS variables
const applyTheme = (org: OrganizationTheme) => {
  const root = document.documentElement;
  
  // Apply colors
  root.style.setProperty('--primary', org.primary_color);
  root.style.setProperty('--primary-foreground', org.primary_foreground_color);
  root.style.setProperty('--secondary', org.secondary_color);
  root.style.setProperty('--accent', org.accent_color);
  root.style.setProperty('--background', org.background_color);
  root.style.setProperty('--foreground', org.foreground_color);
  
  // Apply fonts dynamically
  if (org.heading_font && org.heading_font !== 'Playfair Display') {
    // Load custom heading font
    const headingFontUrl = `https://fonts.googleapis.com/css2?family=${org.heading_font.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
    if (!document.querySelector(`link[href="${headingFontUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = headingFontUrl;
      document.head.appendChild(link);
    }
    root.style.setProperty('--font-display', `"${org.heading_font}", Georgia, serif`);
  }
  
  if (org.body_font && org.body_font !== 'DM Sans') {
    // Load custom body font
    const bodyFontUrl = `https://fonts.googleapis.com/css2?family=${org.body_font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    if (!document.querySelector(`link[href="${bodyFontUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = bodyFontUrl;
      document.head.appendChild(link);
    }
    root.style.setProperty('--font-sans', `"${org.body_font}", system-ui, sans-serif`);
  }
  
  // Update favicon if provided
  if (org.favicon_url) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = org.favicon_url;
  }
  
  // Update page title
  document.title = org.name;
};

// Reset theme to defaults
const resetTheme = () => {
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--primary-foreground');
  root.style.removeProperty('--secondary');
  root.style.removeProperty('--accent');
  root.style.removeProperty('--background');
  root.style.removeProperty('--foreground');
  root.style.removeProperty('--font-display');
  root.style.removeProperty('--font-sans');
  document.title = 'FamilyBridge';
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrganizationTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganization = async () => {
    const subdomain = getSubdomain();
    
    if (!subdomain) {
      setOrganization(null);
      setIsLoading(false);
      resetTheme();
      return;
    }

    try {
      // Use the secure RPC function that only returns public theming data
      const { data, error } = await supabase
        .rpc('get_organization_public_theme', { _subdomain: subdomain });

      if (error || !data || data.length === 0) {
        setOrganization(null);
        resetTheme();
      } else {
        const orgData = data[0] as OrganizationTheme;
        setOrganization(orgData);
        applyTheme(orgData);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setOrganization(null);
      resetTheme();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const value = {
    organization,
    isLoading,
    isWhiteLabeled: !!organization,
    refetch: fetchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
