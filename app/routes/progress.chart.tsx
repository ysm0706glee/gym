import { LineChart } from "@mantine/charts";
import { Tabs, Radio, Text } from "@mantine/core";
import { useLoaderData, useOutletContext, useNavigate } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { useEffect, useState } from "react";
import ProgressTab from "../components/progressTab";
import type { Database } from "~/types/supabase";
import { ChartWorkoutRecord, ExerciseCount } from "~/types/workoutRecord";

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

export default function Chart() {
  const { workoutMenus } = useLoaderData<typeof loader>();

  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const [selectedWorkMenuId, setSelectedWorkMenuId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [chartWorkoutRecord, setChartWorkoutRecord] = useState<
    ChartWorkoutRecord[]
  >([]);
  const [series, setSeries] = useState<{ name: string; color: string }[]>([]);

  // TODO: refactor
  useEffect(() => {
    if (!selectedWorkMenuId) return;
    const fetchWorkoutRecords = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("workout_records")
          .select("date, weight, exercises (id, name)")
          .eq("workout_menus_id", selectedWorkMenuId)
          .order("date", { ascending: true });
        if (error) throw error;
        const exerciseCounts: ExerciseCount = {};
        const result: ChartWorkoutRecord[] = data.reduce(
          (accumulator: ChartWorkoutRecord[], currentValue) => {
            if (currentValue.exercises) {
              const exerciseName = currentValue.exercises.name;
              const { date, weight } = currentValue;
              // Initialize or update the exerciseCounts for averaging
              if (!exerciseCounts[date]) {
                exerciseCounts[date] = {
                  [exerciseName]: { totalWeight: weight, count: 1 },
                };
              } else if (!exerciseCounts[date][exerciseName]) {
                exerciseCounts[date][exerciseName] = {
                  totalWeight: weight,
                  count: 1,
                };
              } else {
                exerciseCounts[date][exerciseName].totalWeight += weight;
                exerciseCounts[date][exerciseName].count += 1;
              }
              // Find or create the entry in the accumulator
              let existingEntry = accumulator.find(
                (entry) => entry.date === date
              );
              if (!existingEntry) {
                existingEntry = { date, [exerciseName]: weight };
                accumulator.push(existingEntry);
              }
              // Update the entry with the current average for the exercise
              existingEntry[exerciseName] =
                exerciseCounts[date][exerciseName].totalWeight /
                exerciseCounts[date][exerciseName].count;
            }
            return accumulator;
          },
          []
        );
        setChartWorkoutRecord(result);
        // TODO: change color
        const series = Object.keys(result[0])
          .filter((key) => key !== "date")
          .map((name) => ({ name, color: "indigo.6" }));
        setSeries(series);
      } catch (error) {
        console.error("Error fetching workout records:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkoutRecords();
  }, [supabase, selectedWorkMenuId]);
  return (
    <div>
      <ProgressTab defaultValue="chart">
        <Tabs.Panel value="chart">
          <Text style={{ paddingBottom: "1rem" }} size="xl">
            Select work menu
          </Text>
          <div
            style={{
              paddingBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {workoutMenus.data?.map((workoutMenu) => (
              <Radio
                key={workoutMenu.id}
                name="workoutMenu"
                label={workoutMenu.name}
                checked={selectedWorkMenuId === workoutMenu.id}
                onChange={async () => setSelectedWorkMenuId(workoutMenu.id)}
              />
            ))}
          </div>
          {chartWorkoutRecord.length > 0 && series && !isLoading && (
            <LineChart
              h={300}
              data={chartWorkoutRecord}
              dataKey="date"
              series={series}
              curveType="linear"
            />
          )}
        </Tabs.Panel>
      </ProgressTab>
    </div>
  );
}
