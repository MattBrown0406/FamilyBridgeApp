-- Drop the old policy and create a new one that prevents rescinding once votes exist
DROP POLICY IF EXISTS "Requesters can delete own pending requests" ON public.financial_requests;

-- Create a function to check if a request has any votes
CREATE OR REPLACE FUNCTION public.request_has_no_votes(_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.financial_votes
    WHERE request_id = _request_id
  )
$$;

-- Recreate policy - only allow delete if no votes exist
CREATE POLICY "Requesters can delete own pending requests with no votes"
ON public.financial_requests
FOR DELETE
USING (
  auth.uid() = requester_id 
  AND status = 'pending' 
  AND public.request_has_no_votes(id)
);