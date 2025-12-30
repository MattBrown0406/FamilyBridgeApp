-- Create table for provider activation codes
CREATE TABLE public.activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  square_subscription_id TEXT,
  square_customer_id TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own used activation codes
CREATE POLICY "Users can view their own activation codes"
ON public.activation_codes
FOR SELECT
USING (used_by = auth.uid());

-- Policy: Allow insert from service role only (edge function)
-- No insert policy for authenticated users - codes are created via edge function

-- Create function to generate unique activation code
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i IN (4, 8) THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_activation_codes_updated_at
BEFORE UPDATE ON public.activation_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();