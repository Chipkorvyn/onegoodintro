-- Add acceptance timestamp columns for mutual matches
ALTER TABLE confirmed_matches 
ADD COLUMN IF NOT EXISTS user1_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user2_accepted_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have consistent timestamps if they were already accepted
UPDATE confirmed_matches 
SET user1_accepted_at = created_at 
WHERE user1_accepted = true AND user1_accepted_at IS NULL;

UPDATE confirmed_matches 
SET user2_accepted_at = created_at 
WHERE user2_accepted = true AND user2_accepted_at IS NULL;