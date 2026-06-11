/*
Seed Supabase with bundled mock JSON.
Run with: node scripts/seed_supabase.js
Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function loadEnv() {
  const root = path.join(__dirname, '..');
  // Match Next.js load order: .env then .env.local (local overrides).
  parseEnvFile(path.join(root, '.env'));
  parseEnvFile(path.join(root, '.env.local'));
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean);
    console.error(`Missing in .env or .env.local: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env.local and fill in your Supabase project URL and service_role key.');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const mockDir = path.join(__dirname, '..', 'src', 'lib', 'mock');
  const products = JSON.parse(fs.readFileSync(path.join(mockDir, 'products.json')));
  const categories = JSON.parse(fs.readFileSync(path.join(mockDir, 'categories.json')));
  const offers = JSON.parse(fs.readFileSync(path.join(mockDir, 'offers.json')));

  console.log('Seeding categories...');
  for (const c of categories) {
    await supabase.from('categories').upsert({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      sort_order: c.order,
    });
  }

  console.log('Seeding products...');
  for (const p of products) {
    const payload = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      category_label: p.categoryLabel,
      images: p.images || [],
      variants: p.variants || [],
      tags: p.tags || [],
      rating: p.rating || 0,
      review_count: p.reviewCount || 0,
      active: p.active !== false,
      badges: p.badges || [],
    };
    await supabase.from('products').upsert(payload);
  }

  console.log('Seeding offers...');
  for (const o of offers) {
    await supabase.from('offers').upsert({
      id: o.id,
      code: o.code,
      title: o.title,
      description: o.description,
      type: o.type,
      value: o.value || 0,
      min_subtotal: o.minSubtotal,
      active: o.active !== false,
      starts_at: o.startsAt,
      ends_at: o.endsAt,
    });
  }

  console.log('Seeding admin user (demo)...');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  await supabase.from('admins').upsert({ email: 'admin@bhaktanjaneyasweets.com', name: 'Store Admin', password_hash: hash });

  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
