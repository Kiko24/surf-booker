-- ============================================================
-- 0005_audit_logs.sql
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),

  school_id uuid references schools(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,

  action text not null,
  entity_type text not null,
  entity_id text,

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index audit_logs_school_id_idx on audit_logs(school_id);
create index audit_logs_user_id_idx on audit_logs(user_id);
create index audit_logs_action_idx on audit_logs(action);
create index audit_logs_created_at_idx on audit_logs(created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table audit_logs enable row level security;

-- No INSERT policy — apenas service_role (admin client) escreve.
-- Dono da escola pode ler.
create policy audit_logs_select_owner
  on audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = audit_logs.school_id
        and s.owner_user_id = auth.uid()
    )
  );
