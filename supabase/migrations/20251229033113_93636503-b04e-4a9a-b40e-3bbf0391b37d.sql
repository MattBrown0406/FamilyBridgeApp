-- Create table for payment pledges
CREATE TABLE public.financial_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_pledges ENABLE ROW LEVEL SECURITY;

-- Family members can view pledges for requests in their families
CREATE POLICY "Family members can view pledges"
ON public.financial_pledges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM financial_requests fr
    JOIN family_members fm ON fm.family_id = fr.family_id
    WHERE fr.id = financial_pledges.request_id
    AND fm.user_id = auth.uid()
  )
);

-- Family members can create pledges
CREATE POLICY "Family members can create pledges"
ON public.financial_pledges
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM financial_requests fr
    JOIN family_members fm ON fm.family_id = fr.family_id
    WHERE fr.id = financial_pledges.request_id
    AND fm.user_id = auth.uid()
  )
);

-- Users can delete their own pledges
CREATE POLICY "Users can delete own pledges"
ON public.financial_pledges
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to post message when financial request is created
CREATE OR REPLACE FUNCTION public.post_financial_request_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Get requester name
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  
  -- Insert a message about the financial request
  INSERT INTO messages (family_id, sender_id, content)
  VALUES (
    NEW.family_id,
    NEW.requester_id,
    '💰 **Financial Request** from ' || COALESCE(requester_name, 'a family member') || E'\n\n' ||
    '**Amount:** $' || NEW.amount || E'\n' ||
    '**Reason:** ' || NEW.reason || E'\n\n' ||
    'Please vote on this request and pledge to help if you can!'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for posting message
CREATE TRIGGER on_financial_request_created
  AFTER INSERT ON public.financial_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.post_financial_request_message();