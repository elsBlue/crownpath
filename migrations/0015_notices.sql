-- Guild update notices. Admin publishes; members read on the bell.
-- Reads are per-user so a fix-up edit does not ping again.

create table if not exists notices (
  id          text primary key,
  author_id   text not null,
  kind        text not null default 'catalog',
  title       text not null,
  body        text not null default '',
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint notices_kind_chk check (kind in ('catalog', 'scout', 'app'))
);
create index if not exists notices_live_idx on notices (published, created_at desc);

create table if not exists notice_reads (
  notice_id  text not null,
  user_id    text not null,
  read_at    timestamptz not null default now(),
  primary key (notice_id, user_id)
);
create index if not exists notice_reads_user_idx on notice_reads (user_id);
