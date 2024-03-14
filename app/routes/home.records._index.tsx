import { useLoaderData } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@vercel/remix";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { List } from "@mantine/core";
import type { Database } from "~/types/supabase";
import type { WorkoutRecords } from "~/types/workoutRecord";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) throw new Error("date query parameter is required");
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
  const { data, error } = await supabase
    .from("workout_records")
    .select("*, exercises (name)")
    .eq("date", date);
  if (error) throw error;
  const workoutRecords: WorkoutRecords = {};
  data?.forEach((record) => {
    const name = record.exercises?.name;
    if (name) {
      if (!workoutRecords[name]) {
        workoutRecords[name] = {
          id: record.exercises_id,
          records: [],
        };
      }
      workoutRecords[name].records.push({
        id: record.id,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
      });
    }
  });
  return { workoutRecords };
}

export default function Records() {
  const { workoutRecords } = useLoaderData<typeof loader>();

  return (
    <List>
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
  );
}
