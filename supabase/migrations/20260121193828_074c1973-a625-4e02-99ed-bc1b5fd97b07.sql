-- Create trigger to auto-generate family account numbers on insert
CREATE TRIGGER trigger_generate_family_account_number
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_family_account_number();

-- Also add a default value to the column to prevent insert failures
-- The trigger will override this with the properly formatted account number
ALTER TABLE public.families 
  ALTER COLUMN account_number SET DEFAULT 'GENERATING';