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
import { createChart, createSeries } from "~/lib/charts";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const menus = await supabaseClient.from("menus").select("*");
  return { menus };
}

export default function Chart() {
  const { menus } = useLoaderData<typeof loader>();

  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [charts, setChart] = useState<Chart[]>([]);
  const [series, setSeries] = useState<{ name: string; color: string }[]>([]);

  useEffect(() => {
    if (!selectedMenuId) return;
    const fetchWorkoutRecords = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("records")
          .select("date, weight, exercises (id, name)")
          .eq("menu_id", selectedMenuId)
          .order("date", { ascending: true });
        if (error) throw error;
        const charts = createChart(data);
        setChart(charts);
        const exerciseNames: Set<string> = new Set();
        data.forEach((record) => {
          const exercises = record.exercises;
          if (exercises) {
            exerciseNames.add(exercises.name);
          }
        });
        const series = createSeries(exerciseNames);
        setSeries(series);
      } catch (error) {
        console.error("Error fetching workout records:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkoutRecords();
  }, [supabase, selectedMenuId]);

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
            {menus.data?.map((menu) => (
              <Radio
                key={menu.id}
                name="workoutMenu"
                label={menu.name}
                checked={selectedMenuId === menu.id}
                onChange={async () => setSelectedMenuId(menu.id)}
              />
            ))}
          </div>
          {charts.length > 0 && series && !isLoading && (
            <LineChart
              h={300}
              data={charts}
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
