-- Create messages table for simple chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES confirmed_matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster message retrieval by connection
CREATE INDEX IF NOT EXISTS idx_messages_connection_created 
ON messages(connection_id, created_at);

-- Create index for faster lookups by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages from connections they're part of
CREATE POLICY "Users can view messages from their connections" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM confirmed_matches 
      WHERE confirmed_matches.id = messages.connection_id 
      AND (
        confirmed_matches.user1_id = auth.jwt()->>'email' OR 
        confirmed_matches.user2_id = auth.jwt()->>'email' OR
        confirmed_matches.seeker_id = auth.jwt()->>'email' OR 
        confirmed_matches.helper_id = auth.jwt()->>'email'
      )
    )
  );

-- Users can only insert messages to connections they're part of
CREATE POLICY "Users can send messages to their connections" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.jwt()->>'email' AND
    EXISTS (
      SELECT 1 FROM confirmed_matches 
      WHERE confirmed_matches.id = messages.connection_id 
      AND (
        confirmed_matches.user1_id = auth.jwt()->>'email' OR 
        confirmed_matches.user2_id = auth.jwt()->>'email' OR
        confirmed_matches.seeker_id = auth.jwt()->>'email' OR 
        confirmed_matches.helper_id = auth.jwt()->>'email'
      )
    )
  );