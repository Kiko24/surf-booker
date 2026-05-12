-- ============================================================
-- 0002_rls.sql
-- ============================================================

-- Activa RLS em todas as tabelas
alter table schools enable row level security;
alter table students enable row level security;
alter table school_students enable row level security;
alter table sessions enable row level security;
alter table booking_groups enable row level security;
alter table bookings enable row level security;
alter table packs enable row level security;
alter table pack_purchases enable row level security;
alter table waiver_versions enable row level security;
alter table waiver_acceptances enable row level security;

-- ============================================================
-- SCHOOLS
-- Dono só vê e edita a sua escola
-- ============================================================
create policy "Dono vê a sua escola"
  on schools for select
  using (owner_user_id = auth.uid());

create policy "Dono cria escola"
  on schools for insert
  with check (owner_user_id = auth.uid());

create policy "Dono edita a sua escola"
  on schools for update
  using (owner_user_id = auth.uid());

-- ============================================================
-- SESSIONS
-- Dono gere sessões da sua escola
-- Público pode ver sessões agendadas
-- ============================================================
create policy "Público vê sessões agendadas"
  on sessions for select
  using (status = 'scheduled');

create policy "Dono gere sessões da sua escola"
  on sessions for all
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKING_GROUPS
-- Dono vê reservas da sua escola
-- Aluno vê as suas próprias reservas
-- ============================================================
create policy "Dono vê booking groups da sua escola"
  on booking_groups for select
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

create policy "Aluno vê os seus booking groups"
  on booking_groups for select
  using (booked_by_student_id in (
    select id from students where auth_user_id = auth.uid()
  ));

create policy "Qualquer um pode criar booking group"
  on booking_groups for insert
  with check (true);

create policy "Dono cancela booking groups da sua escola"
  on booking_groups for update
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKINGS
-- Dono vê bookings da sua escola
-- Aluno vê os seus bookings
-- ============================================================
create policy "Dono vê bookings da sua escola"
  on bookings for select
  using (
    session_id in (
      select s.id from sessions s
      join schools sc on sc.id = s.school_id
      where sc.owner_user_id = auth.uid()
    )
  );

create policy "Aluno vê os seus bookings"
  on bookings for select
  using (
    student_id in (
      select id from students where auth_user_id = auth.uid()
    )
  );

create policy "Qualquer um pode criar booking"
  on bookings for insert
  with check (true);

create policy "Dono actualiza bookings da sua escola"
  on bookings for update
  using (
    session_id in (
      select s.id from sessions s
      join schools sc on sc.id = s.school_id
      where sc.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- STUDENTS
-- Aluno vê e edita o seu próprio perfil
-- Dono vê alunos da sua escola
-- ============================================================
create policy "Aluno vê o seu perfil"
  on students for select
  using (auth_user_id = auth.uid());

create policy "Aluno edita o seu perfil"
  on students for update
  using (auth_user_id = auth.uid());

create policy "Qualquer um pode criar student"
  on students for insert
  with check (true);

create policy "Dono vê alunos da sua escola"
  on students for select
  using (
    id in (
      select ss.student_id from school_students ss
      join schools sc on sc.id = ss.school_id
      where sc.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- SCHOOL_STUDENTS
-- ============================================================
create policy "Dono vê school_students da sua escola"
  on school_students for select
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

create policy "Qualquer um pode criar school_student"
  on school_students for insert
  with check (true);

-- ============================================================
-- PACKS
-- Público vê packs activos
-- Dono gere packs da sua escola
-- ============================================================
create policy "Público vê packs activos"
  on packs for select
  using (is_active = true);

create policy "Dono gere packs da sua escola"
  on packs for all
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- PACK_PURCHASES
-- Dono gere compras da sua escola
-- Aluno vê as suas compras
-- ============================================================
create policy "Dono gere pack purchases da sua escola"
  on pack_purchases for all
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

create policy "Aluno vê as suas pack purchases"
  on pack_purchases for select
  using (
    student_id in (
      select id from students where auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_VERSIONS
-- Público vê waivers activos
-- Dono gere waivers da sua escola
-- ============================================================
create policy "Público vê waiver versions activas"
  on waiver_versions for select
  using (is_active = true);

create policy "Dono gere waiver versions da sua escola"
  on waiver_versions for all
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_ACCEPTANCES
-- ============================================================
create policy "Aluno vê as suas aceitações"
  on waiver_acceptances for select
  using (
    student_id in (
      select id from students where auth_user_id = auth.uid()
    )
  );

create policy "Qualquer um pode criar waiver acceptance"
  on waiver_acceptances for insert
  with check (true);

create policy "Dono vê waiver acceptances da sua escola"
  on waiver_acceptances for select
  using (
    school_id in (
      select id from schools where owner_user_id = auth.uid()
    )
  );