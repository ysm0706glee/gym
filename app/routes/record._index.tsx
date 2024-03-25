import { Radio, Text } from "@mantine/core";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutMenus = await supabaseClient.from("workout_menus").select("*");
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
