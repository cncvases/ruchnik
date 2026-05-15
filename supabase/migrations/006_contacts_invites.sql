-- Unified contacts table
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid references users(id) on delete cascade not null,
  linked_user_id uuid references users(id) on delete set null,
  name text not null,
  phone text,
  telegram_username text,
  notes text,
  is_client boolean not null default false,
  is_worker boolean not null default false,
  is_partner boolean not null default false,
  created_at timestamptz default now()
);

create index on contacts (owner_user_id);
create index on contacts (linked_user_id);

alter table contacts enable row level security;

create policy "contacts_owner" on contacts for all
  using (owner_user_id = current_user_id())
  with check (owner_user_id = current_user_id());

-- Invite codes
create table invites (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  creator_user_id uuid references users(id) on delete cascade not null,
  used_by_user_id uuid references users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table invites enable row level security;

create policy "invites_creator" on invites for all
  using (creator_user_id = current_user_id())
  with check (creator_user_id = current_user_id());

-- Anyone can read invite by code (to verify it)
create policy "invites_read_any" on invites for select using (true);
