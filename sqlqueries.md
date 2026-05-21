To make this work, you must run the following SQL in your Supabase SQL Editor to set up the storage bucket and metadata table:
-- 1. Create the 'documents' bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);
-- 2. Create RLS policies for the 'documents' bucket
create policy "Allow authenticated uploads"
on storage.objects for insert
with check (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Allow authenticated selects"
on storage.objects for select
using (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Allow authenticated deletes"
on storage.objects for delete
using (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
-- 3. Create attachments table for file metadata
create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_size int not null,
  mime_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 4. Enable RLS on attachments table
alter table public.attachments enable row level security;
create policy "Users can view their own attachments" on public.attachments
  for select using (auth.uid() = user_id);
create policy "Users can insert their own attachments" on public.attachments
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own attachments" on public.attachments
  for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- NEW: Profile avatar support & notifications
-- ═══════════════════════════════════════════════

-- 5. Add avatar_url + notification columns to profiles table
alter table public.profiles
add column if not exists avatar_url text,
add column if not exists notification_email boolean default true,
add column if not exists notification_browser boolean default true,
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 6. Create the 'avatars' bucket (public so profile pics load directly)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- 7. RLS policies for the 'avatars' bucket
create policy "Anyone can view avatars"
on storage.objects for select
using (
  bucket_id = 'avatars'
);

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 8. Update existing profiles with defaults
update public.profiles
set
  notification_email = true,
  notification_browser = true
where notification_email is null;

-- ═══════════════════════════════════════════════
-- NEW: Supabase MFA (Multi-Factor Authentication)
-- ═══════════════════════════════════════════════
--
-- MFA is configured in the Supabase Dashboard under:
-- Authentication > Multi-Factor Authentication > Enable
--
-- No additional SQL is needed for MFA.
-- The avatars bucket and profiles table are already set up above.
--
-- For MFA enrollment/unenrollment, the client-side supabase-js
-- MFA APIs are used directly:
--   supabase.auth.mfa.enroll()
--   supabase.auth.mfa.challenge()
--   supabase.auth.mfa.verify()
--   supabase.auth.mfa.unenroll()
--   supabase.auth.mfa.getAuthenticatorAssuranceLevel()