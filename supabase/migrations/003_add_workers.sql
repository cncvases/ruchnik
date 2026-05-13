create table workers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  phone text,
  role text,
  notes text,
  telegram_username text,
  created_at timestamptz default now()
);

create index on workers (user_id);

alter table workers enable row level security;

create policy "workers_select" on workers for select using (user_id = current_user_id());
create policy "workers_insert" on workers for insert with check (user_id = current_user_id());
create policy "workers_update" on workers for update using (user_id = current_user_id());
create policy "workers_delete" on workers for delete using (user_id = current_user_id());
