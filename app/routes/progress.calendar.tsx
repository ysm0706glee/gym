import { Tabs } from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import ProgressTab from "../components/progressTab";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { formateDate } from "~/lib/date";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const { data, error } = await supabaseClient
    .from("workout_records")
    .select("date");
  if (error) throw error;
  const workoutDates = Array.from(new Set(data?.map((data) => data.date)));
  return { workoutDates };
}

export default function Calendar() {
  const navigate = useNavigate();

  const { workoutDates } = useLoaderData<typeof loader>();

  const dayRenderer = (date: Date) => {
    const formattedDate = formateDate(date);
    if (workoutDates.includes(formattedDate)) {
      return <span>{date.getDate()}💪🏻</span>;
    }
  };

  return (
    <div>
      <ProgressTab defaultValue="calendar">
        <Tabs.Panel value="calendar">
          <DatePicker
            renderDay={dayRenderer}
            onChange={(newDate: DateValue) => {
              if (!newDate) return;
              const formattedDate = formateDate(newDate);
              navigate(`/records/?date=${formattedDate}`);
            }}
          />
        </Tabs.Panel>
      </ProgressTab>
    </div>
  );
}
