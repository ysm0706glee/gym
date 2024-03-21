import { Radio, Text } from "@mantine/core";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import type { Database } from "~/types/supabase";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
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
  return { workoutMenus };
}

export default function Record() {
  const navigate = useNavigate();

  const { workoutMenus } = useLoaderData<typeof loader>();

  return (
    <div>
      <Text style={{ paddingBottom: "1rem" }} size="lg">
        Select work menu
      </Text>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {workoutMenus.data?.map((workoutMenu) => (
          <Radio
            key={workoutMenu.id}
            name="workoutMenu"
            label={workoutMenu.name}
            onChange={async () =>
              navigate(`/record/new?workout_menu_id=${workoutMenu.id}`)
            }
          />
        ))}
      </div>
    </div>
  );
}
