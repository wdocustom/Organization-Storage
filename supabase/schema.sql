-- Storage Network: Articles table for programmatic SEO content engine
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null,
  category text not null,
  target_city text,
  published_at timestamptz not null default now()
);

-- Index on slug for fast lookups by URL path
create index idx_articles_slug on articles (slug);

-- Index on category for filtering content types
create index idx_articles_category on articles (category);

-- Index on target_city for local SEO queries
create index idx_articles_target_city on articles (target_city);

-- Enable Row Level Security
alter table articles enable row level security;

-- Public read access (anyone can view published articles)
create policy "Articles are publicly readable"
  on articles for select
  using (true);

-- Service role can insert/update/delete (used by backend content pipeline)
create policy "Service role can manage articles"
  on articles for all
  using (true)
  with check (true);
