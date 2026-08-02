export type FamilyActionStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type FamilyActionPriority = 'low' | 'medium' | 'high';
export type DecisionResponse = 'acknowledged' | 'agree' | 'disagree' | 'needs_discussion';

export interface FamilyBoardMember {
  user_id: string;
  full_name: string;
}

export interface FamilyAction {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_at: string | null;
  priority: FamilyActionPriority;
  status: FamilyActionStatus;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyDecision {
  id: string;
  family_id: string;
  title: string;
  context: string | null;
  concerns: string | null;
  target_at: string | null;
  options: unknown[];
  selected_option: unknown | null;
  status: 'proposed' | 'decided' | 'archived';
  created_by: string;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyDecisionAcknowledgement {
  id: string;
  decision_id: string;
  user_id: string;
  acknowledgement: DecisionResponse;
  comment: string | null;
  acknowledged_at: string;
  updated_at: string;
}

export interface FamilyMeeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
}
