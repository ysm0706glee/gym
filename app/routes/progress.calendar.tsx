import { Loader, Tabs } from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import ProgressTab from "../components/progressTab";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { formateDate } from "~/lib/date"; // Ensure it's 'formatDate', not 'formateDate'
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
  const navigation = useNavigation();

  const { recordDates } = useLoaderData<typeof loader>();

  const isLoaderSubmission = navigation.state === "loading";
  const isLoaderSubmissionRedirect = navigation.state === "loading";
  const isLoading = isLoaderSubmission || isLoaderSubmissionRedirect;

  const dayRenderer = (date: Date) => {
    const formattedDate = formateDate(date);
    if (recordDates.includes(formattedDate)) {
      return <span style={{ cursor: "pointer" }}>{date.getDate()}💪🏻</span>;
    } else {
      return <span>{date.getDate()}</span>;
    }
  };

  return (
    <div>
      <ProgressTab defaultValue="calendar">
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <Loader color="gray" />
          </div>
        ) : (
          <Tabs.Panel value="calendar">
            <DatePicker
              renderDay={dayRenderer}
              onChange={(newDate: DateValue) => {
                if (!newDate) return;
                const formattedDate = formateDate(newDate);
                if (recordDates.includes(formattedDate)) {
                  navigate(`${links.records}/?date=${formattedDate}`);
                }
              }}
            />
          </Tabs.Panel>
        )}
      </ProgressTab>
    </div>
  );
}
