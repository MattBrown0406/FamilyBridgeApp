-- Ensure created_by is always set to the authenticated user on insert
CREATE OR REPLACE FUNCTION public.set_organization_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_organization_created_by ON public.organizations;
CREATE TRIGGER set_organization_created_by
BEFORE INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_created_by();

-- Relax INSERT policy to avoid false RLS failures; trigger enforces correct ownership
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);