-- Enable Row Level Security with Real User Authentication
-- Run this SQL in your Supabase SQL Editor

-- First, drop the existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.todos;
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can create own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

-- Make sure RLS is enabled
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that check user_id against auth.uid()

-- Policy: Users can only view their own todos
CREATE POLICY "Users can view own todos"
  ON public.todos
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert todos with their own user_id
CREATE POLICY "Users can create own todos"
  ON public.todos
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own todos
CREATE POLICY "Users can update own todos"
  ON public.todos
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own todos
CREATE POLICY "Users can delete own todos"
  ON public.todos
  FOR DELETE
  USING (user_id = auth.uid());

-- Set default user_id to the authenticated user
ALTER TABLE public.todos
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Optional: If you had a test user from development, you can remove it
-- DELETE FROM auth.users WHERE email = 'test@tofu.app';

-- Note: Email confirmation settings
-- By default, Supabase requires email confirmation for new signups.
-- To disable this for development (NOT recommended for production):
-- Go to Authentication > Settings in Supabase Dashboard
-- Disable "Enable email confirmations"
