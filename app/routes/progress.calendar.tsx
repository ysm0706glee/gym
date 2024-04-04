import { Tabs } from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import ProgressTab from "../components/progressTab";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { formateDate } from "~/lib/date";
import { links } from "~/lib/links";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const { data, error } = await supabaseClient.from("records").select("date");
  if (error) throw error;
  const recordDates = Array.from(new Set(data?.map((data) => data.date)));
  return { recordDates };
}

export default function Calendar() {
  const navigate = useNavigate();

  const { recordDates } = useLoaderData<typeof loader>();

  const dayRenderer = (date: Date) => {
    const formattedDate = formateDate(date);
    if (recordDates.includes(formattedDate)) {
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
              navigate(`${links.records}/?date=${formattedDate}`);
            }}
          />
        </Tabs.Panel>
      </ProgressTab>
    </div>
  );
}
