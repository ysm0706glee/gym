create or replace function delete_menu(menuid integer)
returns void as $$
declare
    local_exercise_id integer;
begin
    -- step 1: delete records associated with the menu
    delete from records where menu_id = menuid;
    -- step 2: retrieve and delete menus_exercises associated with the menu
    for local_exercise_id in select exercise_id from menus_exercises where menu_id = menuid loop
        delete from menus_exercises where menu_id = menuid and exercise_id = local_exercise_id;
        -- step 3: check if the exercise is associated with any other menus. if not, delete it.
        if (select count(*) from menus_exercises where exercise_id = local_exercise_id) = 0 then
            delete from exercises where id = local_exercise_id;
        end if;
    end loop;
    -- step 4: delete the menu itself
    delete from menus where id = menuid;
exception when others then
    raise;
end;
$$ language plpgsql;
