-- Set category for existing services based on naming patterns
update class_types set category = 'aula'
where (name ilike '%aula%' or name ilike '%nível%' or name ilike '%nível 1%' or name ilike '%iniciantes%')
  and category is null;
