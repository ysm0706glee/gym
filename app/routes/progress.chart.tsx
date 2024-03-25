import { LineChart } from "@mantine/charts";
import { Tabs, Radio, Text } from "@mantine/core";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { useEffect, useState } from "react";
import ProgressTab from "../components/progressTab";
import type { Database } from "~/types/supabase";
import { Chart } from "~/types/workoutRecord";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { createChartData, createSeriesData } from "~/lib/chats";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutMenus = await supabaseClient.from("workout_menus").select("*");
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
  const [chartWorkoutRecord, setChartWorkoutRecord] = useState<Chart[]>([]);
  const [series, setSeries] = useState<{ name: string; color: string }[]>([]);

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
        const charts = createChartData(data);
        setChartWorkoutRecord(charts);
        const exerciseNames: Set<string> = new Set();
        data.forEach((record) => {
          const exercises = record.exercises;
          if (exercises) {
            exerciseNames.add(exercises.name);
          }
        });
        const series = createSeriesData(exerciseNames);
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
