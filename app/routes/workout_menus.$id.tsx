import { Button, List, Text, TextInput } from "@mantine/core";
import {
  type LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  json,
} from "@vercel/remix";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { createSupabaseServerClient } from "~/lib/supabase.server";

const createSchema = z.object({
  exercise: z.string(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutMenuId = Number(params.id);
  if (!workoutMenuId) {
    return redirect("/workout_menus");
  }
  const { data: workoutMenu } = await supabaseClient
    .from("workout_menus")
    .select("name")
    .eq("id", workoutMenuId)
    .single();
  const { data: exercises, error } = await supabaseClient
    .from("workout_menus_exercises")
    .select("exercises (id, name)")
    .eq("workout_menus_id", workoutMenuId);
  if (error) new Response("Not Found", { status: 404 });
  return { workoutMenu, exercises };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  const body = await request.formData();
  const { _action, ...value } = Object.fromEntries(body);
  const url = new URL(request.url);
  const workoutMenuId = Number(params.id);
  if (!workoutMenuId) return redirect("/workout_menus");
  if (_action === "delete") {
    const exercisesId = Number(value.exercisesId);
    // only delete form workout_menus_exercises table not from exercises table
    const { error } = await supabaseClient
      .from("workout_menus_exercises")
      .delete()
      .eq("workout_menus_id", workoutMenuId)
      .eq("exercises_id", exercisesId)
      .select();
    if (error) {
      return json({ error }, { headers });
    }
    return null;
  }
  if (_action === "create") {
    const parsed = createSchema.safeParse(value);
    if (!parsed.success) {
      return json({ error: parsed.error.format() });
    }
    const exerciseName = parsed.data.exercise;
    const { data: existingExercises } = await supabaseClient
      .from("exercises")
      .select("id")
      .eq("name", exerciseName)
      .single();
    let exerciseId: number | null = null;
    if (!existingExercises) {
      const { data: newExercise } = await supabaseClient
        .from("exercises")
        .insert({ name: exerciseName })
        .select();
      if (!newExercise) return;
      exerciseId = newExercise[0].id;
    } else {
      exerciseId = existingExercises.id;
    }
    const { error } = await supabaseClient
      .from("workout_menus_exercises")
      .insert({
        workout_menus_id: workoutMenuId,
        exercises_id: exerciseId,
      })
      .select();
    if (error) {
      return json({ error }, { headers });
    }
    return null;
  }
}

const WorkoutMenu = () => {
  const { workoutMenu, exercises } = useLoaderData<typeof loader>();
  const actionResponse = useActionData<typeof action>();

  return (
    <div>
      <Text style={{ paddingBottom: "1rem" }} size="lg">
        {workoutMenu?.name}
      </Text>
      <List
        style={{
          paddingBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
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
      {actionResponse?.error && <Text>Failed</Text>}
    </div>
  );
};

export default WorkoutMenu;
