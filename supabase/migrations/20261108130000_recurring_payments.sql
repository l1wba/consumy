create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  amount bigint not null check (amount > 0),
  category text not null check (length(btrim(category)) > 0),
  item_type text not null check (item_type in ('bill', 'subscription')),
  frequency text not null check (frequency in ('monthly', 'yearly')),
  due_day smallint not null check (due_day between 1 and 31),
  due_month smallint,
  start_date date not null,
  end_date date,
  cancelled_at date,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  check (
    (frequency = 'monthly' and due_month is null)
    or (frequency = 'yearly' and due_month is not null and due_month between 1 and 12)
  ),
  check (end_date is null or end_date >= start_date)
);

create index recurring_items_user_type
  on public.recurring_items (user_id, item_type, name);

create table public.recurring_payments (
  recurring_item_id uuid not null,
  user_id uuid not null,
  due_date date not null,
  transaction_id uuid references public.transactions (id) on delete set null,
  paid_at timestamptz not null default now(),
  primary key (recurring_item_id, due_date),
  foreign key (recurring_item_id, user_id)
    references public.recurring_items (id, user_id) on delete cascade
);

create unique index recurring_payments_transaction_id
  on public.recurring_payments (transaction_id)
  where transaction_id is not null;

alter table public.recurring_items enable row level security;
alter table public.recurring_payments enable row level security;

create policy "Users manage their own recurring items"
  on public.recurring_items
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read their own recurring payments"
  on public.recurring_payments
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.recurring_items
  to authenticated;

grant select
  on public.recurring_payments
  to authenticated;

create function public.mark_recurring_item_paid(
  p_item_id uuid,
  p_due_date date,
  p_paid_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.recurring_items%rowtype;
  v_transaction_id uuid;
  v_last_day integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_due_date is null or p_paid_date is null then
    raise exception 'Due date and payment date are required';
  end if;

  select *
    into v_item
    from public.recurring_items
    where id = p_item_id
      and user_id = auth.uid()
    for update;

  if not found then
    raise exception 'Recurring item not found';
  end if;

  if p_due_date < v_item.start_date
    or (v_item.end_date is not null and p_due_date > v_item.end_date)
    or (v_item.cancelled_at is not null and p_due_date >= v_item.cancelled_at) then
    raise exception 'This due date is not active for the recurring item';
  end if;

  v_last_day := extract(day from (
    date_trunc('month', p_due_date) + interval '1 month - 1 day'
  ));

  if v_item.frequency = 'monthly'
    and extract(day from p_due_date) <> least(v_item.due_day, v_last_day) then
    raise exception 'Invalid monthly due date';
  end if;

  if v_item.frequency = 'yearly'
    and (
      extract(month from p_due_date) <> v_item.due_month
      or extract(day from p_due_date) <> least(v_item.due_day, v_last_day)
    ) then
    raise exception 'Invalid yearly due date';
  end if;

  select transaction_id
    into v_transaction_id
    from public.recurring_payments
    where recurring_item_id = p_item_id
      and due_date = p_due_date;

  if found then
    return v_transaction_id;
  end if;

  insert into public.transactions (user_id, description, amount, kind, category, date)
  values (
    auth.uid(),
    v_item.name,
    v_item.amount,
    'expense',
    v_item.category,
    p_paid_date
  )
  returning id into v_transaction_id;

  insert into public.recurring_payments (
    recurring_item_id,
    user_id,
    due_date,
    transaction_id
  )
  values (p_item_id, auth.uid(), p_due_date, v_transaction_id);

  return v_transaction_id;
end;
$$;

revoke all on function public.mark_recurring_item_paid(uuid, date, date) from public;
grant execute on function public.mark_recurring_item_paid(uuid, date, date) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recurring_items'
    ) then
      alter publication supabase_realtime add table public.recurring_items;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recurring_payments'
    ) then
      alter publication supabase_realtime add table public.recurring_payments;
    end if;
  end if;
end;
$$;
