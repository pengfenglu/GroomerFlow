-- Route B: booking deposits (Stripe) + subscription event log + trial reminders

alter table public.profiles
  add column if not exists deposit_enabled boolean not null default false,
  add column if not exists deposit_cents integer not null default 2000
    check (deposit_cents >= 0 and deposit_cents <= 50000);

alter table public.appointments
  add column if not exists deposit_cents integer not null default 0
    check (deposit_cents >= 0),
  add column if not exists deposit_status text not null default 'none'
    check (deposit_status in ('none', 'pending', 'authorized', 'paid', 'failed', 'refunded')),
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists appointments_stripe_checkout_session_id_idx
  on public.appointments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.booking_pending (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  payload jsonb not null,
  stripe_checkout_session_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint booking_pending_time_order check (starts_at < ends_at)
);

create index if not exists booking_pending_groomer_starts_idx
  on public.booking_pending (groomer_id, starts_at)
  where status = 'pending';

create index if not exists booking_pending_expires_idx
  on public.booking_pending (expires_at)
  where status = 'pending';

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid references public.profiles (id) on delete set null,
  provider text not null default 'lemon_squeezy',
  event_name text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trial_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  groomer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('ending_soon', 'ended')),
  sent_at timestamptz not null default now(),
  unique (groomer_id, kind)
);

alter table public.booking_pending enable row level security;
alter table public.subscription_events enable row level security;
alter table public.trial_reminder_logs enable row level security;

-- Service role only (no policies): public booking uses service_role API routes.
