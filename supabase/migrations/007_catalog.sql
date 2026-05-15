create table catalog_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(12,2),
  photos text[] default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index on catalog_items (user_id, is_active);

alter table catalog_items enable row level security;

create policy "catalog_owner" on catalog_items for all
  using (user_id = current_user_id())
  with check (user_id = current_user_id());

-- Contacts can read active catalog items of people they're connected to
create policy "catalog_contacts_read" on catalog_items for select
  using (
    is_active = true and
    user_id in (
      select owner_user_id from contacts where linked_user_id = current_user_id()
    )
  );
