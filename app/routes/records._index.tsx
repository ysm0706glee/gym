import { useLoaderData } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { List, Text } from "@mantine/core";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { formateRecords } from "~/lib/records";
import { links } from "~/lib/links";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) throw new Error("date query parameter is required");
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const { data, error } = await supabaseClient
    .from("records")
    .select("*, exercises (*), menus (id, name)")
    .eq("date", date);
  if (error) throw error;
  const menu = data[0].menus?.name;
  const records = formateRecords(data);
  return { menu, records };
}

export default function Records() {
  const { menu, records } = useLoaderData<typeof loader>();

  return (
    <div>
      <Text>{menu}</Text>
      <List style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(records).map(([name, { id, records }]) => (
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
