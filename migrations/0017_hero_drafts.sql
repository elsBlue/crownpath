-- Journal ingest drafts + owner-only extractor key.

create table if not exists hero_drafts (
  id          text primary key,
  batch_date  text not null,
  hero_id     text not null,
  payload     jsonb not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint hero_drafts_status_chk check (status in ('pending', 'applied', 'skipped'))
);
create index if not exists hero_drafts_batch_idx on hero_drafts (batch_date, status);

create table if not exists owner_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
