import { createClient } from '@supabase/supabase-js';

/**
 * The FamilyBridge app's backend (the iPhone app's database), used only by the Practice billing pages so a
 * practice owner can sign in and pay for a plan the App Store can't sell. This is the publishable (anon) key —
 * public by design and shipped in every copy of the app; the database's row-level security protects all data.
 * The rest of this website still uses @/integrations/supabase (the previous web app's backend).
 */
const FAMILYBRIDGE_URL = 'https://iqyjgieixvctpcfhugvn.supabase.co';
const FAMILYBRIDGE_PUBLISHABLE_KEY =
  'sb_publishable_zcVEr-oNF-SUYO18TCd5eQ_g59vZryF';

export const familybridge = createClient(FAMILYBRIDGE_URL, FAMILYBRIDGE_PUBLISHABLE_KEY, {
  auth: { storageKey: 'familybridge-practice-billing', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
