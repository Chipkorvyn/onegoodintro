-- Add mutual matching columns to potential_matches table
-- This extends the existing table without breaking current functionality

ALTER TABLE potential_matches 
ADD COLUMN IF NOT EXISTS user1_id TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS user2_id TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS match_type TEXT CHECK (match_type IN ('expertise_match', 'background_match')),
ADD COLUMN IF NOT EXISTS mutual_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS user1_gives TEXT,
ADD COLUMN IF NOT EXISTS user1_gets TEXT,
ADD COLUMN IF NOT EXISTS user2_gives TEXT,
ADD COLUMN IF NOT EXISTS user2_gets TEXT;

-- Make old columns nullable to support both old and new matching systems
ALTER TABLE potential_matches ALTER COLUMN seeker_id DROP NOT NULL;
ALTER TABLE potential_matches ALTER COLUMN helper_id DROP NOT NULL;
ALTER TABLE potential_matches ALTER COLUMN request_id DROP NOT NULL;

-- Add mutual acceptance columns to confirmed_matches
ALTER TABLE confirmed_matches
ADD COLUMN IF NOT EXISTS user1_id TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS user2_id TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS user1_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user2_accepted BOOLEAN DEFAULT FALSE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_potential_matches_user1 ON potential_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_potential_matches_user2 ON potential_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_potential_matches_mutual ON potential_matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_matches_user1 ON confirmed_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_matches_user2 ON confirmed_matches(user2_id);

-- Add constraint to prevent duplicate mutual matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_mutual_match 
ON potential_matches(LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
WHERE user1_id IS NOT NULL AND user2_id IS NOT NULL;