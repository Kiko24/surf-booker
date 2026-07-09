-- 0025_add_bookings_participants.sql
-- Multi-participant (one-time guest) booking support

-- ============================================================
-- 1. booking_groups: booked_by_student_id nullable
-- ============================================================
alter table booking_groups
  drop constraint if exists booking_groups_booked_by_school_student_fk;

alter table booking_groups
  alter column booked_by_student_id drop not null;

-- ============================================================
-- 2. bookings: add participants JSONB, make student_id nullable
-- ============================================================
alter table bookings
  add column participants jsonb;

-- Drop the UNIQUE (session_id, student_id) constraint and replace
-- with a partial unique index (only when student_id IS NOT NULL)
alter table bookings
  drop constraint if exists bookings_session_id_student_id_key;

create unique index bookings_session_student_unique_idx
  on bookings(session_id, student_id)
  where student_id is not null;

-- participants must be a JSON array when present
alter table bookings
  add constraint bookings_participants_check
    check (
      participants is null or jsonb_typeof(participants) = 'array'
    );

-- ============================================================
-- 3. RLS: update bookings INSERT/UPDATE policies to allow
--    bookings with null student_id (multi-participant guests)
-- ============================================================
drop policy if exists bookings_insert_owner on bookings;
create policy bookings_insert_owner
  on bookings for insert
  to authenticated
  with check (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
    and (
      bookings.student_id is null
      or (
        exists (
          select 1
          from booking_groups bg
          join school_students ss on ss.school_id = bg.school_id
          where bg.id = bookings.booking_group_id
            and bg.session_id = bookings.session_id
            and ss.student_id = bookings.student_id
        )
        and (
          bookings.payment_method = 'single'
          or exists (
            select 1
            from booking_groups bg
            join pack_purchases pp on pp.id = bookings.pack_purchase_id
            where bg.id = bookings.booking_group_id
              and bg.session_id = bookings.session_id
              and pp.school_id = bg.school_id
              and pp.student_id = bookings.student_id
              and pp.status = 'active'
              and pp.lessons_remaining > 0
          )
        )
      )
    )
  );

drop policy if exists bookings_update_owner on bookings;
create policy bookings_update_owner
  on bookings for update
  to authenticated
  using (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
    and (
      bookings.student_id is null
      or (
        exists (
          select 1
          from booking_groups bg
          join school_students ss on ss.school_id = bg.school_id
          where bg.id = bookings.booking_group_id
            and bg.session_id = bookings.session_id
            and ss.student_id = bookings.student_id
        )
        and (
          bookings.payment_method = 'single'
          or exists (
            select 1
            from booking_groups bg
            join pack_purchases pp on pp.id = bookings.pack_purchase_id
            where bg.id = bookings.booking_group_id
              and bg.session_id = bookings.session_id
              and pp.school_id = bg.school_id
              and pp.student_id = bookings.student_id
              and pp.status = 'active'
              and pp.lessons_remaining > 0
          )
        )
      )
    )
  );

-- ============================================================
-- 4. school_settings: add terms_url
-- ============================================================
alter table school_settings
  add column terms_url text;
