create table public.categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, name)
);

create unique index categories_user_kind_name_ci
  on public.categories (user_id, kind, lower(name));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (length(btrim(description)) > 0),
  amount bigint not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  category text not null check (length(btrim(category)) > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index transactions_user_date_id
  on public.transactions (user_id, date desc, id desc);

create table public.user_settings (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value text not null,
  primary key (user_id, key)
);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.user_settings enable row level security;

create policy "Users manage their own categories"
  on public.categories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own transactions"
  on public.transactions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own settings"
  on public.user_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.categories, public.transactions, public.user_settings
  to authenticated;
