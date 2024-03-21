import { Button, List, Text, TextInput } from "@mantine/core";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
} from "@vercel/remix";
import type { Database } from "~/types/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
  const user = await supabase.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutMenus = await supabase.from("workout_menus").select("*");
  return { workoutMenus: workoutMenus.data };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const body = await request.formData();
  const name = body.get("menu");
  if (typeof name !== "string") return;
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
  const user = await supabase.auth.getUser();
  const userId = user?.data.user?.id;
  if (!userId) return redirect("/login");
  const { data } = await supabase
    .from("workout_menus")
    .insert({ name, user_id: userId })
    .select();
  return redirect(`/workout_menus/${data?.[0].id}`);
};

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
