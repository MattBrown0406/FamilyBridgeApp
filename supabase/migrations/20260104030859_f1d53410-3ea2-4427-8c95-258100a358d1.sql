-- Add account_number column to families
ALTER TABLE public.families 
ADD COLUMN account_number TEXT UNIQUE;

-- Create a function to generate unique account numbers
CREATE OR REPLACE FUNCTION public.generate_family_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_number TEXT;
  year_prefix TEXT;
  sequence_num INT;
BEGIN
  -- Format: FB-YYYY-XXXXX (e.g., FB-2026-00001)
  year_prefix := 'FB-' || EXTRACT(YEAR FROM NOW())::TEXT || '-';
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(account_number FROM 9) AS INT)
  ), 0) + 1
  INTO sequence_num
  FROM public.families
  WHERE account_number LIKE year_prefix || '%';
  
  -- Format with leading zeros
  new_account_number := year_prefix || LPAD(sequence_num::TEXT, 5, '0');
  
  NEW.account_number := new_account_number;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign account number on insert
CREATE TRIGGER set_family_account_number
BEFORE INSERT ON public.families
FOR EACH ROW
WHEN (NEW.account_number IS NULL)
EXECUTE FUNCTION public.generate_family_account_number();

-- Backfill existing families with account numbers
DO $$
DECLARE
  family_record RECORD;
  counter INT := 0;
BEGIN
  FOR family_record IN 
    SELECT id FROM public.families 
    WHERE account_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    counter := counter + 1;
    UPDATE public.families 
    SET account_number = 'FB-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = family_record.id;
  END LOOP;
END;
$$;

-- Make account_number NOT NULL after backfill
ALTER TABLE public.families 
ALTER COLUMN account_number SET NOT NULL;