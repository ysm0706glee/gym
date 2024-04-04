import { List, Text } from "@mantine/core";
import { Link } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  return null;
}

export default function Home() {
  const LINKS = [
    {
      href: links.record,
      label: "Start Workout",
    },
    {
      href: links.menus,
      label: "Manage workout menus",
    },
    {
      href: links.chart,
      label: "View progress",
    },
  ];

  return (
    <div>
      <List style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {LINKS.map((link) => (
          <List.Item key={link.href}>
            <Link style={{ color: "#fff" }} to={link.href}>
              <Text size="xl">{link.label}</Text>
            </Link>
          </List.Item>
        ))}
      </List>
    </div>
  );
}
