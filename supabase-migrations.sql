-- Migration: Add lists feature
-- This file contains the SQL commands to run in your Supabase SQL editor

-- 1. Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Add RLS (Row Level Security) policies for lists
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own non-default lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- 3. Add list_id column to todos table
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS list_id TEXT REFERENCES lists(id) ON DELETE CASCADE;

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS todos_list_id_idx ON todos(list_id);
CREATE INDEX IF NOT EXISTS lists_user_id_idx ON lists(user_id);

-- 5. Migration function to create default list for existing users and assign their todos
-- This will be handled in the application code when users first load the app after update
