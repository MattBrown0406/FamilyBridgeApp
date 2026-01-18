
-- Drop the old constraint and add an updated one with all notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'message'::text, 
  'financial_request'::text, 
  'vote'::text, 
  'member_joined'::text,
  'location_request'::text,
  'location_response'::text,
  'overdue_checkout'::text,
  'boundary_request'::text,
  'boundary_approved'::text,
  'paid_moderator_request'::text,
  'paid_moderator_activated'::text
]));
