alter table
if exists public.exercises add created_at timestamptz default now();

alter table
if exists public.menus add created_at timestamptz default now();

alter table
if exists public.menus_exercises add created_at timestamptz default now();

alter table
if exists public.records add created_at timestamptz default now();
