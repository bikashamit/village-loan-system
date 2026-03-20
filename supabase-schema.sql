-- ============================================
-- VILLAGE LOAN SYSTEM - SUPABASE SQL SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text not null,
  phone text not null,
  role text not null default 'investor' check (role in ('admin', 'investor')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (auth.role() = 'authenticated');

-- ============================================
-- CONTRIBUTIONS TABLE
-- ============================================
create table public.contributions (
  id uuid default uuid_generate_v4() primary key,
  investor_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  contribution_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.contributions enable row level security;

create policy "Contributions viewable by authenticated users"
  on public.contributions for select
  using (auth.role() = 'authenticated');

create policy "Admin can manage contributions"
  on public.contributions for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- BORROWERS TABLE
-- ============================================
create table public.borrowers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null,
  address text not null,
  is_group_member boolean default false,
  guarantor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.borrowers enable row level security;

create policy "Borrowers viewable by authenticated users"
  on public.borrowers for select
  using (auth.role() = 'authenticated');

create policy "Admin can manage borrowers"
  on public.borrowers for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- LOANS TABLE
-- ============================================
create table public.loans (
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

create policy "Loans viewable by authenticated users"
  on public.loans for select
  using (auth.role() = 'authenticated');

create policy "Admin can manage loans"
  on public.loans for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references public.loans(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Payments viewable by authenticated users"
  on public.payments for select
  using (auth.role() = 'authenticated');

create policy "Admin can manage payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- DISTRIBUTIONS TABLE
-- ============================================
create table public.distributions (
  id uuid default uuid_generate_v4() primary key,
  investor_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  distribution_date date not null,
  year integer not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.distributions enable row level security;

create policy "Distributions viewable by authenticated users"
  on public.distributions for select
  using (auth.role() = 'authenticated');

create policy "Admin can manage distributions"
  on public.distributions for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- STORAGE BUCKET FOR AVATARS
-- ============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'investor')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
