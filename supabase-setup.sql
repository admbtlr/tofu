-- Create the todos table
create table if not exists public.todos (
  id text primary key,
  title text not null,
  notes text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed boolean not null default false,
  user_id uuid references auth.users default null
);

-- Enable Row Level Security
alter table public.todos enable row level security;

-- Create policies for anonymous access (no auth required for now)
-- This allows anyone to read, insert, update, and delete todos
-- If you add authentication later, you can modify these policies

-- Policy: Allow anonymous users to view all todos
create policy "Allow anonymous read access"
  on public.todos
  for select
  to anon
  using (true);

-- Policy: Allow anonymous users to insert todos
create policy "Allow anonymous insert access"
  on public.todos
  for insert
  to anon
  with check (true);

-- Policy: Allow anonymous users to update todos
create policy "Allow anonymous update access"
  on public.todos
  for update
  to anon
  using (true)
  with check (true);

-- Policy: Allow anonymous users to delete todos
create policy "Allow anonymous delete access"
  on public.todos
  for delete
  to anon
  using (true);

-- Optional: Create an index on created_at for faster sorting
create index if not exists todos_created_at_idx on public.todos (created_at desc);

-- Optional: Create an index on completed for faster filtering
create index if not exists todos_completed_idx on public.todos (completed);

-- Enable realtime for the todos table
alter publication supabase_realtime add table public.todos;
