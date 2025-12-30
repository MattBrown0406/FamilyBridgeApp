-- Fix organizations BEFORE INSERT trigger to not overwrite created_by when it's already provided
CREATE OR REPLACE FUNCTION public.set_organization_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set created_by if the client didn't provide it
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;