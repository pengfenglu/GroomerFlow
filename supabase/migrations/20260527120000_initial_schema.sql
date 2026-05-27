-- GetGroomerFlow initial schema (order per docs/GroomerFlow方案.md §7.1)

-- profiles (groomer_id = auth.users.id)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_name text not null,
  booking_slug text not null unique,
  bio text,
  avatar_url text,
  timezone text not null default 'America/Los_Angeles',
  subscription_plan text not null default 'trial'
    check (subscription_plan in ('trial', 'starter', 'pro', 'free')),
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  onboarding_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  breed text,
  age_years numeric(4, 1),
  temperament text,
  coat_notes text,
  allergies text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_time_order check (start_time < end_time)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  pet_id uuid not null references public.pets (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'completed', 'cancelled')),
  source text not null default 'staff'
    check (source in ('staff', 'public_booking')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_order check (starts_at < ends_at)
);

create table public.service_records (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  performed_at timestamptz not null default now(),
  service_id uuid references public.services (id) on delete set null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'day_before')),
  channel text not null default 'email' check (channel in ('email', 'sms')),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- indexes
create index clients_groomer_id_idx on public.clients (groomer_id);
create index pets_groomer_id_idx on public.pets (groomer_id);
create index pets_client_id_idx on public.pets (client_id);
create index services_groomer_id_idx on public.services (groomer_id);
create index availability_rules_groomer_id_idx on public.availability_rules (groomer_id);
create index appointments_groomer_id_starts_at_idx on public.appointments (groomer_id, starts_at);
create index appointments_groomer_status_idx on public.appointments (groomer_id, status);
create index service_records_pet_id_idx on public.service_records (pet_id);
create index reminder_logs_appointment_id_idx on public.reminder_logs (appointment_id);
create index profiles_booking_slug_idx on public.profiles (booking_slug);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger pets_updated_at before update on public.pets
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.appointments enable row level security;
alter table public.service_records enable row level security;
alter table public.reminder_logs enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- clients
create policy clients_all_own on public.clients
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- pets
create policy pets_all_own on public.pets
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- services
create policy services_all_own on public.services
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- availability_rules
create policy availability_rules_all_own on public.availability_rules
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- appointments (staff via authenticated user; public insert via service_role only)
create policy appointments_all_own on public.appointments
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- service_records
create policy service_records_all_own on public.service_records
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);

-- reminder_logs
create policy reminder_logs_all_own on public.reminder_logs
  for all using (auth.uid() = groomer_id) with check (auth.uid() = groomer_id);
