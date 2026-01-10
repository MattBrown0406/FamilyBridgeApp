-- Remove the redundant restrictive policy for anon
-- Since all permissive policies now require 'authenticated' role,
-- anonymous users have no permissive policies to grant access anyway
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;