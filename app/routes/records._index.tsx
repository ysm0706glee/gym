import { useLoaderData } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { List } from "@mantine/core";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { formateRecords } from "~/lib/records";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) throw new Error("date query parameter is required");
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const { data, error } = await supabaseClient
    .from("workout_records")
    .select("*, exercises (*)")
    .eq("date", date);
  if (error) throw error;
  const workoutRecords = formateRecords(data);
  return { workoutRecords };
}

export default function Records() {
  const { workoutRecords } = useLoaderData<typeof loader>();

  return (
    <div>
      <List style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(workoutRecords).map(([name, { id, records }]) => (
          <List.Item key={id}>
            {name}
            {records.map((record) => (
              <div key={record.id}>
                {record.sets}x{record.reps} {record.weight}kg
              </div>
            ))}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
