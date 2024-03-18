import { Button, List, Text, TextInput } from "@mantine/core";
import {
  type ActionFunction,
  type LoaderFunctionArgs,
  redirect,
} from "@vercel/remix";
import { Form, useLoaderData } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import type { Database } from "~/types/supabase";
import WorkoutMenusModal from "~/components/modal";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  const workoutMenuId = params.id;
  if (!workoutMenuId) {
    return redirect("/workout_menus");
  }
  const { data: exercises, error } = await supabase
    .from("workout_menus_exercises")
    .select("exercises (id, name)")
    .eq("workout_menus_id", workoutMenuId);
  if (error) new Response("Not Found", { status: 404 });
  return { exercises };
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  const body = await request.formData();
  const { _action, ...value } = Object.fromEntries(body);
  const workoutMenuId = Number(params.id);
  if (!workoutMenuId) return redirect("/workout_menus");
  if (_action === "delete") {
    const exercisesId = Number(value.exercisesId);
    // only delete form workout_menus_exercises table not from exercises table
    const { data, error } = await supabase
      .from("workout_menus_exercises")
      .delete()
      .eq("workout_menus_id", workoutMenuId)
      .eq("exercises_id", exercisesId)
      .select();
    // TODO: handle error
    return null;
  }
  if (_action === "create") {
    const exerciseName = String(value.exercise);
    const { data: existingExercises } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", exerciseName)
      .single();
    let exerciseId: number | null = null;
    if (!existingExercises) {
      const { data: newExercise } = await supabase
        .from("exercises")
        .insert({ name: exerciseName })
        .select();
      if (!newExercise) return;
      exerciseId = newExercise[0].id;
    } else {
      exerciseId = existingExercises.id;
    }
    const { data, error } = await supabase
      .from("workout_menus_exercises")
      .insert({
        workout_menus_id: workoutMenuId,
        exercises_id: exerciseId,
      })
      .select();
    // TODO: handle error
    return null;
  }
};

const WorkoutMenu = () => {
  const { exercises } = useLoaderData<typeof loader>();

  return (
    <div style={{ height: "100%" }}>
      <Text size="lg">Workout Menu</Text>
      <List>
        {exercises?.map((exercise) => (
          <List.Item key={exercise.exercises?.id}>
            <Form
              method="post"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>{exercise.exercises?.name}</Text>
              <input
                type="hidden"
                name="exercisesId"
                value={exercise.exercises?.id}
              />
              <Button
                type="submit"
                name="_action"
                value="delete"
                variant="transparent"
                color="red"
              >
                ×
              </Button>
            </Form>
          </List.Item>
        ))}
      </List>
      <WorkoutMenusModal buttonMessage="add exercise">
        <Form
          method="post"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <TextInput name="exercise" placeholder="exercise name" />
          <Button
            type="submit"
            name="_action"
            value="create"
            variant="white"
            color="gray"
          >
            Add exercise
          </Button>
        </Form>
      </WorkoutMenusModal>
    </div>
  );
};

export default WorkoutMenu;
