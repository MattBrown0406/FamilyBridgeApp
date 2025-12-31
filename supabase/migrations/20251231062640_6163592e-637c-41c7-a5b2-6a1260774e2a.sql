-- Add Social appointment types to the meeting_type enum
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Date';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Friendly Gathering';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Group Event';
ALTER TYPE meeting_type ADD VALUE IF NOT EXISTS 'Family Event';