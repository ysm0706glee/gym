create table
exercises (
id bigint primary key generated always as identity,
name text not null
);

create policy
"enable all actions for authenticated users"
on "public"."exercises"
as permissive
for all
to authenticated
using (
    true
)
with check (
    true
);

create table
menus (
id bigint primary key generated always as identity,
user_id uuid references auth.users(id) not null,
name text not null
);

create policy
"enable all actions for users based on user_id"
on "public"."menus"
as permissive
for all
to authenticated
using (
    (auth.uid() = user_id)
)
with check (
    (auth.uid() = user_id)
);

create table
menus_exercises (
id bigint primary key generated always as identity,
menu_id bigint references menus(id) not null,
exercise_id bigint references exercises(id) not null
);

create policy
"enable all actions for users based on user_id"
on "public"."menus_exercises"
as permissive
for all
to authenticated
using (
    exists (
        select 1
        from public.menus m
        where m.id = menu_id and m.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.menus m
        where m.id = menu_id and m.user_id = auth.uid()
    )
);

create table
records (
id bigint primary key generated always as identity,
menu_id bigint references menus(id) not null,
exercise_id bigint references exercises(id) not null,
date date not null,
sets integer not null,
reps integer not null,
weight integer not null
);

create policy
"enable all actions for users based on user_id"
on
"public"."records"
as permissive
for all
to authenticated
using (
    exists (
        select 1
        from public.menus m
        where m.id = menu_id and m.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.menus m
        where m.id = menu_id and m.user_id = auth.uid()
    )
);
