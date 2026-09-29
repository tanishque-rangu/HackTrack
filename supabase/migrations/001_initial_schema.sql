-- Enable realtime for tables
create schema if not exists public;

-- Squads (Groups of users tracking hackathons)
create table public.squads (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Members
create table public.members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid references public.squads(id) on delete cascade not null,
  display_name text not null,
  created_at timestamptz default now()
);

-- Hackathons
create table public.hackathons (
  id text primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  platform text not null,
  format text not null,
  registration_deadline text,
  submission_deadline text,
  event_dates text not null,
  registration_link text not null,
  submission_link text not null,
  notes text,
  created_at timestamptz default now()
);

-- Units (Teams within a squad for a specific hackathon)
create table public.units (
  id uuid primary key default gen_random_uuid(),
  hackathon_id text references public.hackathons(id) on delete cascade not null,
  label text not null,
  created_at timestamptz default now()
);

-- Unit Members (mapping members to units)
create table public.unit_members (
  unit_id uuid references public.units(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  primary key (unit_id, member_id)
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete cascade not null,
  hackathon_id text references public.hackathons(id) on delete cascade not null,
  name text not null default 'New Project',
  description text,
  build_status text not null default 'Not Started',
  repo_link text,
  ppt_link text,
  demo_link text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Registrations (Registration tracking per member per hackathon)
create table public.registrations (
  hackathon_id text references public.hackathons(id) on delete cascade not null,
  member_name text not null,
  status text not null,
  primary key (hackathon_id, member_name)
);

-- Messages (Comm Link)
create table public.messages (
  id text primary key,
  hackathon_id text references public.hackathons(id) on delete cascade not null,
  sender text not null,
  text text not null,
  timestamp text not null,
  created_at timestamptz default now()
);

-- Add realtime configuration
alter publication supabase_realtime add table public.squads;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.hackathons;
alter publication supabase_realtime add table public.units;
alter publication supabase_realtime add table public.unit_members;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.messages;

-- Enable RLS and create permissive policies for MVP
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.squads FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.hackathons FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.units FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.unit_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.unit_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.projects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.messages FOR ALL USING (true) WITH CHECK (true);
