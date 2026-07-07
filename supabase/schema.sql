-- Umpire Map - Supabase Schema
-- Einmalig im Supabase SQL-Editor eines NEUEN Projekts ausfuehren
-- (Dashboard -> SQL Editor -> New query -> einfuegen -> Run).

-- ============================================================
-- Tabelle: leagues
-- ============================================================
create table if not exists public.leagues (
  id text primary key,
  name text not null,
  acronym text,
  classification text,
  sport text,
  updated_at timestamptz not null default now()
);

-- Falls die Tabelle schon aus einer aelteren Version existiert und die
-- sport-Spalte noch fehlt:
alter table public.leagues add column if not exists sport text;

-- ============================================================
-- Tabelle: venues
-- ============================================================
create table if not exists public.venues (
  id bigint generated always as identity primary key,
  address_key text not null unique,
  name text,
  street text,
  postal_code text,
  city text,
  lat double precision,
  lng double precision,
  geocoded_at timestamptz
);

-- ============================================================
-- Tabelle: matches
-- ============================================================
create table if not exists public.matches (
  id bigint primary key,
  match_id text,
  time timestamptz,
  state text,
  human_state text,
  home_runs integer,
  away_runs integer,
  home_team_name text,
  away_team_name text,
  league_id text references public.leagues (id) on delete set null,
  league_name text,
  league_sport text,
  venue_id bigint references public.venues (id) on delete set null,
  umpire_assignments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.matches add column if not exists league_sport text;

create index if not exists matches_time_idx on public.matches (time);
create index if not exists matches_league_id_idx on public.matches (league_id);
create index if not exists matches_venue_id_idx on public.matches (venue_id);
create index if not exists leagues_sport_idx on public.leagues (sport);

-- ============================================================
-- Row Level Security: Frontend liest nur (anon key), Sync-Job schreibt
-- ausschliesslich mit dem Service-Role-Key (der RLS ohnehin umgeht).
-- ============================================================
alter table public.leagues enable row level security;
alter table public.venues enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Public read access" on public.leagues;
create policy "Public read access" on public.leagues
  for select using (true);

drop policy if exists "Public read access" on public.venues;
create policy "Public read access" on public.venues
  for select using (true);

drop policy if exists "Public read access" on public.matches;
create policy "Public read access" on public.matches
  for select using (true);

-- Kein INSERT/UPDATE/DELETE ueber den anon key: es existieren bewusst keine
-- entsprechenden Policies. Der Sync-Job nutzt den Service-Role-Key, der RLS
-- immer umgeht - daher braucht er keine eigene Policy.
