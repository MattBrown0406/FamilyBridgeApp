-- Add new appointment types to the meeting_type enum
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Therapy';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Medical';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Work';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Job Interview';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Court';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Probation';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Support Group';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Wellness';