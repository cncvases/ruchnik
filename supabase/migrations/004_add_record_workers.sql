create table record_workers (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references records(id) on delete cascade not null,
  worker_id uuid references workers(id) on delete cascade not null,
  amount_paid numeric(12,2) not null check (amount_paid >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  unique (record_id, worker_id)
);

create index on record_workers (record_id);
create index on record_workers (worker_id);

alter table record_workers enable row level security;

-- Майстер бачить всі призначення своїх записів
create policy "record_workers_master_select" on record_workers for select
  using (record_id in (select id from records where user_id = current_user_id()));

create policy "record_workers_master_insert" on record_workers for insert
  with check (record_id in (select id from records where user_id = current_user_id()));

create policy "record_workers_master_update" on record_workers for update
  using (record_id in (select id from records where user_id = current_user_id()));

create policy "record_workers_master_delete" on record_workers for delete
  using (record_id in (select id from records where user_id = current_user_id()));

-- Працівник бачить тільки свої призначення
create policy "record_workers_worker_select" on record_workers for select
  using (worker_id in (select id from workers where user_id = current_user_id()));

-- Працівник може оновити статус (підтвердити)
create policy "record_workers_worker_update" on record_workers for update
  using (worker_id in (select id from workers where user_id = current_user_id()));

-- Дозволити працівнику читати батьківський запис (тільки поля title, photos, dimensions, date)
create policy "records_worker_select" on records for select
  using (id in (
    select record_id from record_workers
    where worker_id in (select id from workers where user_id = current_user_id())
  ));
