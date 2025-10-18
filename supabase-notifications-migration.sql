-- Migration to add notification fields to todos table
-- Run this SQL in your Supabase SQL Editor after running supabase-setup.sql

-- Add notification columns to existing todos table
alter table public.todos
  add column if not exists notify_enabled boolean default false,
  add column if not exists notification_id text;

-- Add comment for documentation
comment on column public.todos.notify_enabled is 'Whether to send a notification when the todo is due';
comment on column public.todos.notification_id is 'ID of the scheduled notification in expo-notifications';
