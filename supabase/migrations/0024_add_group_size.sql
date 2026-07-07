alter table booking_groups add column group_size int not null default 1;

create index booking_groups_group_size_idx on booking_groups(group_size);
