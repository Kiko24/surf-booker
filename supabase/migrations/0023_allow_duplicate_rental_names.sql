-- ============================================================
-- Migration 0023: Allow duplicate names for aluguer class_types
--
-- The partial unique index class_types_unique_name_per_school_idx
-- prevents duplicate active names per school. But rental grouping
-- (same rental name, different durations/prices) requires allowing
-- duplicates for the "aluguer" category.
--
-- We modify the index to exclude rows where category = 'aluguer'.
-- Aula and pack services still enforce unique names.
-- ============================================================

drop index if exists class_types_unique_name_per_school_idx;

create unique index class_types_unique_name_per_school_idx
  on class_types(school_id, lower(btrim(name)))
  where is_active = true and (category is distinct from 'aluguer');
