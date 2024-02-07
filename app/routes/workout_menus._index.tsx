import { TextInput } from "@mantine/core";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
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
  const workoutMenus = await supabase.from("workout_menus").select("*");
  return { workoutMenus: workoutMenus.data };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
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
      <h1>Workout Menus</h1>
      <ul>
        {workoutMenus?.map((workoutMenu) => (
          <li key={workoutMenu.id}>
            <Link to={`/workout_menus/${workoutMenu.id}`}>
              <h2>{workoutMenu.name}</h2>
            </Link>
          </li>
        ))}
      </ul>
      <Form method="post">
        <TextInput name="menu" label="Menu name" />
        <button type="submit">Add Menu</button>
      </Form>
    </div>
  );
}
