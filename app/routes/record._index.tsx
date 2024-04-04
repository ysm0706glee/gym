import { Radio, Text } from "@mantine/core";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const menus = await supabaseClient.from("menus").select("*");
  return { menus };
}

export default function Record() {
  const navigate = useNavigate();

  const { menus } = useLoaderData<typeof loader>();

  return (
    <div>
      <Text style={{ paddingBottom: "1rem" }} size="lg">
        Select work menu
      </Text>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {menus.data?.map((menu) => (
          <Radio
            key={menu.id}
            name="menu"
            label={menu.name}
            onChange={async () =>
              navigate(`${links.newRecord}/?menu_id=${menu.id}`)
            }
          />
        ))}
      </div>
    </div>
  );
}
