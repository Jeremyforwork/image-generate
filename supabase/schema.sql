-- Run this in Supabase SQL Editor to set up the database

-- Generation history table
create table if not exists generation_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_urls text[] not null,
  prompt text not null,
  options jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Index for fast user queries
create index if not exists idx_generation_history_user_id on generation_history(user_id);

-- Enable Row Level Security
alter table generation_history enable row level security;

-- Users can only read their own records
create policy "Users can view own history"
  on generation_history for select
  using (auth.uid() = user_id);

-- Users can insert their own records
create policy "Users can insert own history"
  on generation_history for insert
  with check (auth.uid() = user_id);

-- Users can delete their own records
create policy "Users can delete own history"
  on generation_history for delete
  using (auth.uid() = user_id);
