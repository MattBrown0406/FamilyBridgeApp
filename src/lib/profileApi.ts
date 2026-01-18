import { supabase } from "@/integrations/supabase/client";

export type MinimalProfile = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
};

export async function fetchProfilesByIds(ids: string[]): Promise<MinimalProfile[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];

  const { data, error } = await supabase.functions.invoke("get-profiles", {
    body: { ids: unique },
  });

  if (error) throw error;
  return (data?.profiles ?? []) as MinimalProfile[];
}
