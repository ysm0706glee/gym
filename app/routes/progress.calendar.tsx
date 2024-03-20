import { Tabs } from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import ProgressTab from "../components/progressTab";
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
  const { data, error } = await supabase.from("workout_records").select("date");
  if (error) throw error;
  const workoutDates = Array.from(new Set(data?.map((data) => data.date)));
  return { workoutDates };
}

export default function Calendar() {
  const navigate = useNavigate();

  const { workoutDates } = useLoaderData<typeof loader>();

  const dayRenderer = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    if (workoutDates.includes(formattedDate)) {
      return <span>{date.getDate()}💪🏻</span>;
    }
  };

  return (
    <div style={{ height: "100%" }}>
      <ProgressTab defaultValue="calendar">
        <Tabs.Panel value="calendar">
          <DatePicker
            renderDay={dayRenderer}
            onChange={(newDate: DateValue) => {
              if (!newDate) return;
              const year = newDate.getFullYear();
              const month = (newDate.getMonth() + 1)
                .toString()
                .padStart(2, "0");
              const day = newDate.getDate().toString().padStart(2, "0");
              const formattedDate = `${year}-${month}-${day}`;
              navigate(`/records/?date=${formattedDate}`);
            }}
          />
        </Tabs.Panel>
      </ProgressTab>
    </div>
  );
}
