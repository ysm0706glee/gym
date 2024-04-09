insert into auth.users (id, email, email_confirmed_at)
values
('123e4567-e89b-12d3-a456-426614174000', 'user1@example.com', '2024-03-26T08:00:00Z'),
('123e4567-e89b-12d3-a456-426614174001', 'user2@example.com', '2024-03-26T09:00:00Z'),
('123e4567-e89b-12d3-a456-426614174002', 'user3@example.com', '2024-03-26T10:00:00Z');

insert into exercises (name)
values
('Squat'),
('Deadlift'),
('Bench Press');

insert into menus (user_id, name)
values
('123e4567-e89b-12d3-a456-426614174000', 'Leg Day'),
('123e4567-e89b-12d3-a456-426614174001', 'Upper Body');

insert into menus_exercises (menu_id, exercise_id)
values
(1, 1),
(2, 3);

insert into records (menu_id, exercise_id, date, sets, reps, weight)
values
(1, 1, '2024-03-25', 5, 5, 100),
(2, 3, '2024-03-26', 4, 8, 80);
