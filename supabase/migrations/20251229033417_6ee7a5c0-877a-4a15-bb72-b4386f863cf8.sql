-- Allow requesters to delete their own pending financial requests
CREATE POLICY "Requesters can delete own pending requests"
ON public.financial_requests
FOR DELETE
USING (auth.uid() = requester_id AND status = 'pending');