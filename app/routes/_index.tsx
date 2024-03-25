import { List, Text } from "@mantine/core";
import { Link } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  return null;
}

export default function Home() {
  const LINKS = [
    {
      href: "/record",
      label: "Start Workout",
    },
    {
      href: "/workout_menus",
      label: "Manage workout menus",
    },
    {
      href: "/progress/chart",
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
