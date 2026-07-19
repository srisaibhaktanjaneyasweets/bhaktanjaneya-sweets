-- Admin-managed Instagram reel URLs. The storefront fetches each public
-- reel's current Open Graph thumbnail server-side before rendering the carousel.
create table if not exists public.instagram_reels (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  thumbnail_url text,
  thumbnail_path text,
  position smallint not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_reels_url_check check (
    url ~ '^https://(www[.])?instagram[.]com/reel/'
  )
);

create index if not exists instagram_reels_active_position_idx
  on public.instagram_reels (active, position);

-- The server-side API uses the Supabase service key; browsers have no direct
-- table access, so reel management remains restricted to authenticated admins.
alter table public.instagram_reels enable row level security;

insert into storage.buckets (id, name, public)
values ('instagram-reel-thumbnails', 'instagram-reel-thumbnails', true)
on conflict (id) do nothing;

create or replace function public.set_instagram_reels_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists instagram_reels_set_updated_at on public.instagram_reels;
create trigger instagram_reels_set_updated_at
before update on public.instagram_reels
for each row execute function public.set_instagram_reels_updated_at();

-- Preserve the currently featured reel when introducing this table.
insert into public.instagram_reels (url, position)
values (
  'https://www.instagram.com/reel/DV3fc6_Tqcc/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA==',
  0
)
on conflict (url) do nothing;
