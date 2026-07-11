alter table bookings
  add constraint bookings_session_id_fk
  foreign key (session_id)
  references sessions(id)
  on delete cascade;

