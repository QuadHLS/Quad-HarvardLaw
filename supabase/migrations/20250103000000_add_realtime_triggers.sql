-- Migration: Add realtime broadcast triggers for posts and likes
-- Purpose: Replace postgres_changes with broadcast for better scalability
-- Affected tables: posts, likes

-- Create trigger function for posts table
create or replace function public.posts_broadcast_trigger()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'posts:' || coalesce(new.id, old.id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

-- Create trigger function for likes table
create or replace function public.likes_broadcast_trigger()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'likes:' || coalesce(new.id, old.id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

-- Create triggers for posts table
create trigger posts_broadcast_trigger
  after insert or update or delete on public.posts
  for each row execute function public.posts_broadcast_trigger();

-- Create triggers for likes table
create trigger likes_broadcast_trigger
  after insert or update or delete on public.likes
  for each row execute function public.likes_broadcast_trigger();

-- Add RLS policies for realtime.messages table
-- Allow authenticated users to read broadcast messages
create policy "authenticated_users_can_read_broadcasts" on realtime.messages
  for select
  to authenticated
  using (true);

-- Allow authenticated users to write broadcast messages
create policy "authenticated_users_can_write_broadcasts" on realtime.messages
  for insert
  to authenticated
  with check (true);
