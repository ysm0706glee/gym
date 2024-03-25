import { Button, List, Text, TextInput } from "@mantine/core";
import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
} from "@vercel/remix";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutMenus = await supabaseClient.from("workout_menus").select("*");
  return { workoutMenus: workoutMenus.data };
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const name = body.get("menu");
  if (typeof name !== "string") return;
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  const userId = user?.data.user?.id;
  if (!userId) return redirect("/login");
  const { data } = await supabaseClient
    .from("workout_menus")
    .insert({ name, user_id: userId })
    .select();
  return redirect(`/workout_menus/${data?.[0].id}`);
}

export default function WorkoutMenus() {
  const { workoutMenus } = useLoaderData<typeof loader>();

  return (
    <div>
      <Text style={{ paddingBottom: "1rem" }} size="lg">
        Workout Menus
      </Text>
      <List
        style={{
          paddingBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {workoutMenus?.map((workoutMenu) => (
          <List.Item key={workoutMenu.id}>
            <Link
              style={{ color: "#fff" }}
              to={`/workout_menus/${workoutMenu.id}`}
            >
              <Text>{workoutMenu.name}</Text>
            </Link>
          </List.Item>
        ))}
      </List>
      <Form
        method="post"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <TextInput name="menu" placeholder="menu name" />
        <Button type="submit" variant="white" color="gray">
          Add
        </Button>
      </Form>
    </div>
  );
}
