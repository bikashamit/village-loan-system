/**
 * GRAM NIDHI — ONE-CLICK SETUP SCRIPT
 * Run: node setup.js
 * Requires: Node.js 18+
 */

const SUPABASE_URL = 'https://risiadudlqtfatpaapov.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2lhZHVkbHF0ZmF0cGFhcG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAwODcyMCwiZXhwIjoyMDg5NTg0NzIwfQ.OwLEifrQ0SyhzT_qncIQZdbUBfVYX5Ne-tCz1ml3FV4'

const ADMIN_EMAIL = 'amit.gangaur@gmail.com'
const ADMIN_PASSWORD = 'bikashamit'
const ADMIN_NAME = 'Amit Gangaur'
const ADMIN_PHONE = ''

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
}

// Full SQL schema
const SQL_SCHEMA = `
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text not null,
  phone text not null default '',
  role text not null default 'investor' check (role in ('admin', 'investor')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = user_id);

drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles"
  on public.profiles for insert with check (auth.role() = 'authenticated');

create table if not exists public.contributions (
  id uuid default uuid_generate_v4() primary key,
  investor_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  contribution_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.contributions enable row level security;

drop policy if exists "Contributions viewable by authenticated users" on public.contributions;
create policy "Contributions viewable by authenticated users"
  on public.contributions for select using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage contributions" on public.contributions;
create policy "Admin can manage contributions"
  on public.contributions for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.borrowers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null default '',
  address text not null default '',
  is_group_member boolean default false,
  guarantor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.borrowers enable row level security;

drop policy if exists "Borrowers viewable by authenticated users" on public.borrowers;
create policy "Borrowers viewable by authenticated users"
  on public.borrowers for select using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage borrowers" on public.borrowers;
create policy "Admin can manage borrowers"
  on public.borrowers for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.loans (
  id uuid default uuid_generate_v4() primary key,
  borrower_id uuid references public.borrowers(id) on delete cascade not null,
  principal numeric(12,2) not null check (principal > 0),
  monthly_interest_rate numeric(5,2) not null check (monthly_interest_rate >= 0),
  borrow_date date not null,
  settlement_date date,
  status text not null default 'active' check (status in ('active', 'settled', 'partial')),
  notes text,
  created_at timestamptz default now()
);

alter table public.loans enable row level security;

drop policy if exists "Loans viewable by authenticated users" on public.loans;
create policy "Loans viewable by authenticated users"
  on public.loans for select using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage loans" on public.loans;
create policy "Admin can manage loans"
  on public.loans for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references public.loans(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

drop policy if exists "Payments viewable by authenticated users" on public.payments;
create policy "Payments viewable by authenticated users"
  on public.payments for select using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage payments" on public.payments;
create policy "Admin can manage payments"
  on public.payments for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

create table if not exists public.distributions (
  id uuid default uuid_generate_v4() primary key,
  investor_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  distribution_date date not null,
  year integer not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.distributions enable row level security;

drop policy if exists "Distributions viewable by authenticated users" on public.distributions;
create policy "Distributions viewable by authenticated users"
  on public.distributions for select using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage distributions" on public.distributions;
create policy "Admin can manage distributions"
  on public.distributions for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'investor')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  })
  // Use the pg endpoint instead
  const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  return res2
}

async function setupSchema() {
  console.log('\n📦 Setting up database schema...')
  
  // Split into individual statements and run via the SQL API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql: SQL_SCHEMA }),
  })
  
  if (!res.ok) {
    // Try direct postgres connection via supabase management API
    console.log('   ℹ️  Note: Schema must be run manually in Supabase SQL Editor.')
    console.log('   → Go to: https://supabase.com/dashboard/project/risiadudlqtfatpaapov/sql/new')
    console.log('   → Paste contents of supabase-schema.sql and click Run\n')
    return false
  }
  
  console.log('   ✅ Schema created successfully!')
  return true
}

async function createAdminUser() {
  console.log('👤 Creating admin account...')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  
  // Create user via Supabase Auth Admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
        phone: ADMIN_PHONE,
        role: 'admin',
      },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    if (data.message?.includes('already been registered') || data.code === 'email_exists') {
      console.log('   ℹ️  User already exists — skipping creation')
      // Try to get existing user
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, { headers })
      const listData = await listRes.json()
      const existingUser = listData.users?.[0]
      if (existingUser) {
        await ensureAdminRole(existingUser.id)
      }
      return
    }
    console.error('   ❌ Failed to create user:', data.message || data.error)
    return
  }

  console.log(`   ✅ Admin user created! ID: ${data.id}`)
  await ensureAdminRole(data.id)
}

async function ensureAdminRole(userId) {
  console.log('🔑 Setting admin role in profiles...')
  
  // Wait a moment for trigger to fire
  await new Promise(r => setTimeout(r, 1500))

  // Upsert profile with admin role
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      full_name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      role: 'admin',
    }),
  })

  if (res.ok || res.status === 201 || res.status === 200) {
    console.log('   ✅ Admin role set!')
  } else {
    // Try PATCH update
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role: 'admin', full_name: ADMIN_NAME }),
    })
    if (patchRes.ok) {
      console.log('   ✅ Admin role updated!')
    } else {
      const err = await patchRes.text()
      console.log('   ⚠️  Could not set role automatically. Run this SQL manually:')
      console.log(`   UPDATE profiles SET role = 'admin' WHERE user_id = '${userId}';`)
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║   GRAM NIDHI — Setup Script            ║')
  console.log('║   Village Loan Management System       ║')
  console.log('╚════════════════════════════════════════╝')

  await setupSchema()
  await createAdminUser()

  console.log('\n✅ Setup complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Next steps:')
  console.log('1. Push this folder to GitHub:')
  console.log('   git add . && git commit -m "Gram Nidhi initial commit" && git push')
  console.log('2. Go to vercel.com → New Project → Import village-loan-system')
  console.log('3. Add env vars in Vercel:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL = https://risiadudlqtfatpaapov.supabase.co')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  console.log('4. Click Deploy!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n🔐 Admin Login:\n   Email: ${ADMIN_EMAIL}\n   Password: ${ADMIN_PASSWORD}\n`)
}

main().catch(console.error)
