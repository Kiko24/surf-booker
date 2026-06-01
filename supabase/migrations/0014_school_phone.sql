-- 0014_school_phone.sql
-- Add phone column to schools

alter table schools add column phone text;
alter table schools add constraint schools_phone_check
  check (phone is null or char_length(btrim(phone)) >= 6);
