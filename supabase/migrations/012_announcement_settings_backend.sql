-- Store announcement-bar messages in a backend table instead of Storage.

create table if not exists site_settings (
  key text primary key,
  messages jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;

drop policy if exists "public read site settings" on site_settings;
create policy "public read site settings"
on site_settings for select
using (key = 'announcement');

drop policy if exists "service role manage site settings" on site_settings;
create policy "service role manage site settings"
on site_settings for all
using (true)
with check (true);

grant all on table site_settings to postgres, service_role;
grant select on table site_settings to anon, authenticated;

insert into site_settings (key, messages)
values (
  'announcement',
  jsonb_build_object(
    'shipping', 'Free shipping on orders over 700',
    'offer', 'Use code BAS10 for 10% off your first order',
    'whatsapp', 'Order on WhatsApp: +91 99999 99999'
  )
)
on conflict (key) do nothing;