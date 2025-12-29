-- Create family_boundaries table
CREATE TABLE public.family_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  target_user_id UUID, -- NULL means applies to all members
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boundary_acknowledgments table
CREATE TABLE public.boundary_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boundary_id UUID NOT NULL REFERENCES public.family_boundaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(boundary_id, user_id)
);

-- Enable RLS
ALTER TABLE public.family_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boundary_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Family members can view approved boundaries or their own pending ones
CREATE POLICY "Family members can view boundaries"
ON public.family_boundaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_boundaries.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Family members can create boundaries
CREATE POLICY "Family members can create boundaries"
ON public.family_boundaries
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_boundaries.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Moderators can update boundaries (approve/reject)
CREATE POLICY "Moderators can update boundaries"
ON public.family_boundaries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_boundaries.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
  )
);

-- Moderators can delete boundaries
CREATE POLICY "Moderators can delete boundaries"
ON public.family_boundaries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_boundaries.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
  )
);

-- Family members can view acknowledgments
CREATE POLICY "Family members can view acknowledgments"
ON public.boundary_acknowledgments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_boundaries fb
    JOIN family_members fm ON fm.family_id = fb.family_id
    WHERE fb.id = boundary_acknowledgments.boundary_id
    AND fm.user_id = auth.uid()
  )
);

-- Users can acknowledge boundaries
CREATE POLICY "Users can acknowledge boundaries"
ON public.boundary_acknowledgments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM family_boundaries fb
    JOIN family_members fm ON fm.family_id = fb.family_id
    WHERE fb.id = boundary_acknowledgments.boundary_id
    AND fm.user_id = auth.uid()
    AND fb.status = 'approved'
  )
);

-- Create function to notify moderator on boundary creation
CREATE OR REPLACE FUNCTION public.notify_moderator_on_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  moderator RECORD;
BEGIN
  SELECT full_name INTO creator_name FROM profiles WHERE id = NEW.created_by;
  
  -- Notify all moderators in the family
  FOR moderator IN 
    SELECT user_id FROM family_members 
    WHERE family_id = NEW.family_id 
    AND role = 'moderator'
    AND user_id != NEW.created_by
  LOOP
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      moderator.user_id,
      NEW.family_id,
      'boundary_request',
      'New Boundary Request',
      COALESCE(creator_name, 'A family member') || ' has proposed a new boundary that needs your approval.',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for boundary creation notification
CREATE TRIGGER notify_on_boundary_created
AFTER INSERT ON public.family_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.notify_moderator_on_boundary();

-- Create function to post message and notify on boundary approval
CREATE OR REPLACE FUNCTION public.notify_on_boundary_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  target_name TEXT;
  member RECORD;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    SELECT full_name INTO creator_name FROM profiles WHERE id = NEW.created_by;
    
    IF NEW.target_user_id IS NOT NULL THEN
      SELECT full_name INTO target_name FROM profiles WHERE id = NEW.target_user_id;
    END IF;
    
    -- Post message to family chat
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      NEW.family_id,
      NEW.approved_by,
      '📋 **New Boundary Approved**' || E'\n\n' ||
      '"' || NEW.content || '"' || E'\n\n' ||
      '_Proposed by ' || COALESCE(creator_name, 'a family member') || 
      CASE WHEN target_name IS NOT NULL THEN ' for ' || target_name ELSE '' END || 
      '. Please acknowledge this boundary below._'
    );
    
    -- Notify affected members
    FOR member IN 
      SELECT fm.user_id FROM family_members fm
      WHERE fm.family_id = NEW.family_id
      AND fm.user_id != NEW.approved_by
      AND (NEW.target_user_id IS NULL OR fm.user_id = NEW.target_user_id OR fm.user_id = NEW.created_by)
    LOOP
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        member.user_id,
        NEW.family_id,
        'boundary_approved',
        'Boundary Approved',
        'A new boundary has been approved and requires your acknowledgment.',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for boundary approval
CREATE TRIGGER notify_on_boundary_status_change
AFTER UPDATE ON public.family_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_boundary_approval();

-- Add updated_at trigger
CREATE TRIGGER update_family_boundaries_updated_at
BEFORE UPDATE ON public.family_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();