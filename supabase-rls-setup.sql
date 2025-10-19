-- Enable Row Level Security with User Authentication
-- Run this SQL in your Supabase SQL Editor

-- First, drop the existing anonymous policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.todos;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.todos;

-- Create a hard-coded test user if it doesn't exist
-- This creates a user in the auth.users table
DO $$
DECLARE
  test_user_id uuid := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
BEGIN
  -- Check if user exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'test@tofu.app',
      '$2a$10$AbCdEfGhIjKlMnOpQrStUvWxYz0123456789', -- dummy hash
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Create RLS policies that check user_id

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

-- Make user_id NOT NULL for new rows
ALTER TABLE public.todos
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Optional: Update existing todos to have the test user_id
-- Uncomment this if you have existing todos without a user_id
-- UPDATE public.todos
-- SET user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
-- WHERE user_id IS NULL;
