-- 0016_class_types_total_lessons.sql
-- Add total_lessons to class_types for standalone pack offerings

alter table class_types
  add column total_lessons int;

alter table class_types
  add constraint class_types_total_lessons_check
    check (total_lessons is null or total_lessons between 1 and 100);
