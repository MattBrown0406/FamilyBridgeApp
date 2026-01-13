-- Enable RLS on activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view activation codes they have used
CREATE POLICY "Users can view their own used activation codes"
ON public.activation_codes
FOR SELECT
USING (used_by = auth.uid());

-- No insert/update/delete policies for regular users
-- These operations are handled by edge functions using service role key

-- Create a function to check if user is a super admin (Freedom Interventions owner)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = _user_id
      AND om.role = 'owner'
      AND o.name = 'Freedom Interventions'
  )
$$;

-- Super admins can view all activation codes for administrative purposes
CREATE POLICY "Super admins can view all activation codes"
ON public.activation_codes
FOR SELECT
USING (public.is_super_admin(auth.uid()));