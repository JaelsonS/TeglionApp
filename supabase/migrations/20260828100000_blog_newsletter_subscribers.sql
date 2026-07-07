-- Newsletter do blog público TegLion
create table if not exists blog_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  audience text not null default 'blog',
  source text,
  locale text default 'pt-PT',
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (email, audience)
);

create index if not exists idx_blog_newsletter_email on blog_newsletter_subscribers (lower(email));

alter table blog_newsletter_subscribers enable row level security;
