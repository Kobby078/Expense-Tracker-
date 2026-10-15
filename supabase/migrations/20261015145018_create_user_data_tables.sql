-- Milestone 14B1: user-owned expenses, settings (budget), and categories with RLS.

-- Reusable updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  category text not null,
  amount numeric(12, 2) not null,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint expenses_name_nonblank check (char_length(trim(name)) > 0),
  constraint expenses_category_nonblank check (char_length(trim(category)) > 0),
  constraint expenses_amount_positive check (amount > 0)
);

create index expenses_user_id_date_desc_idx
  on public.expenses (user_id, date desc);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_settings (monthly budget)
-- ---------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid not null references auth.users (id) on delete cascade,
  monthly_budget numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id),
  constraint user_settings_monthly_budget_positive check (monthly_budget > 0)
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- name_key is derived in Postgres (trim, collapse whitespace, lowercase)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  name_key text generated always as (
    lower(trim(regexp_replace(name, '\s+', ' ', 'g')))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_nonblank check (char_length(trim(name)) > 0),
  constraint categories_user_id_name_key_unique unique (user_id, name_key)
);

create index categories_user_id_idx on public.categories (user_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants (defensive revoke first)
-- ---------------------------------------------------------------------------
revoke all on table public.expenses from anon, authenticated;
revoke all on table public.user_settings from anon, authenticated;
revoke all on table public.categories from anon, authenticated;

grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.user_settings enable row level security;
alter table public.categories enable row level security;

-- expenses policies
create policy expenses_select_own
  on public.expenses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy expenses_insert_own
  on public.expenses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy expenses_update_own
  on public.expenses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy expenses_delete_own
  on public.expenses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- user_settings policies
create policy user_settings_select_own
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy user_settings_insert_own
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_settings_update_own
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_settings_delete_own
  on public.user_settings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- categories policies
create policy categories_select_own
  on public.categories
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy categories_insert_own
  on public.categories
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy categories_update_own
  on public.categories
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy categories_delete_own
  on public.categories
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Atomic category rename (updates category row + matching expense strings)
-- SECURITY INVOKER so RLS still applies; scoped to auth.uid()
-- ---------------------------------------------------------------------------
create or replace function public.rename_user_category(
  p_category_id uuid,
  p_new_name text
)
returns public.categories
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old_name text;
  v_old_key text;
  v_new_name text;
  v_row public.categories;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_new_name := trim(regexp_replace(coalesce(p_new_name, ''), '\s+', ' ', 'g'));

  if char_length(v_new_name) = 0 then
    raise exception 'Enter a category name.';
  end if;

  select c.name, c.name_key
  into v_old_name, v_old_key
  from public.categories as c
  where c.id = p_category_id
    and c.user_id = v_uid
  for update;

  if not found then
    raise exception 'That category was not found.';
  end if;

  update public.categories as c
  set name = v_new_name
  where c.id = p_category_id
    and c.user_id = v_uid
  returning * into v_row;

  update public.expenses as e
  set category = v_new_name
  where e.user_id = v_uid
    and lower(trim(regexp_replace(e.category, '\s+', ' ', 'g'))) = v_old_key;

  return v_row;
exception
  when unique_violation then
    raise exception 'That category already exists.';
end;
$$;

revoke all on function public.rename_user_category(uuid, text) from public, anon;
grant execute on function public.rename_user_category(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Safe category delete (blocked when any expense uses the logical category)
-- ---------------------------------------------------------------------------
create or replace function public.delete_user_category(p_category_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name_key text;
  v_in_use integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select c.name_key
  into v_name_key
  from public.categories as c
  where c.id = p_category_id
    and c.user_id = v_uid
  for update;

  if not found then
    raise exception 'That category was not found.';
  end if;

  select count(*)::integer
  into v_in_use
  from public.expenses as e
  where e.user_id = v_uid
    and lower(trim(regexp_replace(e.category, '\s+', ' ', 'g'))) = v_name_key;

  if v_in_use > 0 then
    raise exception
      'This category is used by % expense(s). Edit those expenses to another category first.',
      v_in_use;
  end if;

  delete from public.categories as c
  where c.id = p_category_id
    and c.user_id = v_uid;
end;
$$;

revoke all on function public.delete_user_category(uuid) from public, anon;
grant execute on function public.delete_user_category(uuid) to authenticated;
