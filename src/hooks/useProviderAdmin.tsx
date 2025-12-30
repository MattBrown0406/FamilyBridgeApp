import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
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
  support_email: string | null;
  website_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff';
  joined_at: string;
}

interface OrganizationWithRole extends Organization {
  role: 'owner' | 'admin' | 'staff';
}

export const useProviderAdmin = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setIsProvider(false);
      setIsLoading(false);
      return;
    }

    try {
      // Get all organization memberships for the user
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setOrganizations([]);
        setIsProvider(false);
        setIsLoading(false);
        return;
      }

      // Get the organizations
      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) throw orgError;

      // Combine with roles
      const orgsWithRoles: OrganizationWithRole[] = (orgs || []).map(org => {
        const membership = memberships.find(m => m.organization_id === org.id);
        return {
          ...org,
          role: membership?.role || 'staff',
        } as OrganizationWithRole;
      });

      setOrganizations(orgsWithRoles);
      setIsProvider(orgsWithRoles.length > 0);
    } catch (err) {
      console.error('Error fetching provider organizations:', err);
      setOrganizations([]);
      setIsProvider(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const createOrganization = async (orgData: {
    subdomain: string;
    name: string;
    tagline?: string;
    support_email?: string;
    website_url?: string;
    phone?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    heading_font?: string;
    body_font?: string;
  }) => {
    if (!user) throw new Error('Must be logged in to create an organization');

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        ...orgData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchOrganizations();
    return data;
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) throw error;
    
    await fetchOrganizations();
    return data;
  };

  const uploadLogo = async (orgId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orgId}/logo.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(fileName);

    await updateOrganization(orgId, { logo_url: publicUrl });
    return publicUrl;
  };

  const uploadFavicon = async (orgId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orgId}/favicon.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(fileName);

    await updateOrganization(orgId, { favicon_url: publicUrl });
    return publicUrl;
  };

  return {
    organizations,
    isLoading,
    isProvider,
    createOrganization,
    updateOrganization,
    uploadLogo,
    uploadFavicon,
    refetch: fetchOrganizations,
  };
};
