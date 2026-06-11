-- Public bucket for category circle images uploaded from the admin panel.

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read category images" on storage.objects;
create policy "public read category images"
on storage.objects for select
using (bucket_id = 'category-images');
