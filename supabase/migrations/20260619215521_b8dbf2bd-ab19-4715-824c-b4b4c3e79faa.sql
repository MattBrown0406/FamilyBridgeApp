ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'message','financial_request','vote','member_joined','location_request','location_response',
  'overdue_checkout','handoff_request','handoff_accepted','handoff_declined','org_transfer_invite',
  'boundary_approved','boundary_rejected','boundary_proposed','boundary_acknowledged'
]));