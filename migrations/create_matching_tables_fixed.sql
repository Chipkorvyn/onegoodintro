-- Create potential_matches table for storing admin-generated matches
CREATE TABLE IF NOT EXISTS potential_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helper_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) DEFAULT 0.0,
  rationale TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure a helper can't be matched to the same request multiple times
  UNIQUE(helper_id, request_id)
);

-- Create confirmed_matches table for matches both users have accepted
CREATE TABLE IF NOT EXISTS confirmed_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  potential_match_id UUID NOT NULL REFERENCES potential_matches(id) ON DELETE CASCADE,
  seeker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helper_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  seeker_accepted BOOLEAN DEFAULT FALSE,
  helper_accepted BOOLEAN DEFAULT FALSE,
  seeker_accepted_at TIMESTAMP WITH TIME ZONE,
  helper_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Only one confirmed match per potential match
  UNIQUE(potential_match_id)
);

-- Create notifications table for email notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_potential_matches_status ON potential_matches(status);
CREATE INDEX IF NOT EXISTS idx_potential_matches_seeker ON potential_matches(seeker_id);
CREATE INDEX IF NOT EXISTS idx_potential_matches_helper ON potential_matches(helper_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_matches_seeker ON confirmed_matches(seeker_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_matches_helper ON confirmed_matches(helper_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);

-- Add row level security policies
ALTER TABLE potential_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmed_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin can see all potential matches
CREATE POLICY "Admin can view all potential matches" ON potential_matches
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert potential matches" ON potential_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update potential matches" ON potential_matches
  FOR UPDATE USING (true);

-- Users can see their own confirmed matches
CREATE POLICY "Users can view their confirmed matches" ON confirmed_matches
  FOR SELECT USING (seeker_id = auth.uid() OR helper_id = auth.uid());

CREATE POLICY "Users can update their acceptance" ON confirmed_matches
  FOR UPDATE USING (seeker_id = auth.uid() OR helper_id = auth.uid());

-- Users can see their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());