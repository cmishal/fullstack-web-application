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