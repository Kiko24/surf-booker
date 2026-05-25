-- Add 'completed' status to sessions
alter table sessions
  drop constraint if exists sessions_status_check;

alter table sessions
  add constraint sessions_status_check
    check (status in ('scheduled', 'cancelled', 'completed'));

alter table sessions
  drop constraint if exists sessions_cancelled_state_check;

alter table sessions
  add constraint sessions_cancelled_state_check
    check (
      (status = 'scheduled' and cancelled_at is null)
      or
      (status = 'cancelled' and cancelled_at is not null)
      or
      (status = 'completed' and cancelled_at is null)
    );
