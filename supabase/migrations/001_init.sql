-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (linked to Telegram)
create table users (
  id uuid primary key default uuid_generate_v4(),
  telegram_id bigint unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Clients (customers)
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  phone text,
  telegram_username text,
  notes text,
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#2481cc'
);

-- Subcategories
create table subcategories (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete cascade not null,
  name text not null
);

-- Tags
create table tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  color text not null default '#2481cc'
);

-- Records (income / expense entries)
create table records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null default current_date,
  description text,
  category_id uuid references categories(id) on delete set null,
  subcategory_id uuid references subcategories(id) on delete set null,
  payment_method text not null default 'cash' check (payment_method in ('card', 'cash', 'fop')),
  status text not null default 'paid' check (status in ('paid', 'pending')),
  dimensions jsonb,
  photos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Record ↔ Tag many-to-many
create table record_tags (
  record_id uuid references records(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (record_id, tag_id)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();

-- Indexes
create index on records (user_id, date desc);
create index on records (user_id, client_id);
create index on records (user_id, type);
create index on clients (user_id);
create index on categories (user_id, type);

-- RLS (Row Level Security)
alter table users enable row level security;
alter table clients enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table tags enable row level security;
alter table records enable row level security;
alter table record_tags enable row level security;

-- Users: see only own row
create policy "users_own" on users
  using (id = (select id from users where telegram_id = (current_setting('app.telegram_id', true))::bigint));

-- Helper: current user id
create or replace function current_user_id()
returns uuid language sql stable as $$
  select id from users where telegram_id = (current_setting('app.telegram_id', true))::bigint
$$;

-- Clients policies
create policy "clients_select" on clients for select using (user_id = current_user_id());
create policy "clients_insert" on clients for insert with check (user_id = current_user_id());
create policy "clients_update" on clients for update using (user_id = current_user_id());
create policy "clients_delete" on clients for delete using (user_id = current_user_id());

-- Categories policies
create policy "categories_select" on categories for select using (user_id = current_user_id());
create policy "categories_insert" on categories for insert with check (user_id = current_user_id());
create policy "categories_update" on categories for update using (user_id = current_user_id());
create policy "categories_delete" on categories for delete using (user_id = current_user_id());

-- Subcategories policies (via category)
create policy "subcategories_select" on subcategories for select
  using (category_id in (select id from categories where user_id = current_user_id()));
create policy "subcategories_insert" on subcategories for insert
  with check (category_id in (select id from categories where user_id = current_user_id()));
create policy "subcategories_update" on subcategories for update
  using (category_id in (select id from categories where user_id = current_user_id()));
create policy "subcategories_delete" on subcategories for delete
  using (category_id in (select id from categories where user_id = current_user_id()));

-- Tags policies
create policy "tags_select" on tags for select using (user_id = current_user_id());
create policy "tags_insert" on tags for insert with check (user_id = current_user_id());
create policy "tags_update" on tags for update using (user_id = current_user_id());
create policy "tags_delete" on tags for delete using (user_id = current_user_id());

-- Records policies
create policy "records_select" on records for select using (user_id = current_user_id());
create policy "records_insert" on records for insert with check (user_id = current_user_id());
create policy "records_update" on records for update using (user_id = current_user_id());
create policy "records_delete" on records for delete using (user_id = current_user_id());

-- Record tags policies
create policy "record_tags_select" on record_tags for select
  using (record_id in (select id from records where user_id = current_user_id()));
create policy "record_tags_insert" on record_tags for insert
  with check (record_id in (select id from records where user_id = current_user_id()));
create policy "record_tags_delete" on record_tags for delete
  using (record_id in (select id from records where user_id = current_user_id()));

-- Default categories seed (inserted per user via trigger or app)
