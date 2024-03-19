import { List, Text } from "@mantine/core";
import { Link } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
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
    <div style={{ height: "100%" }}>
      <List>
        {LINKS.map((link) => (
          <List.Item key={link.href}>
            <Link to={link.href}>
              <Text size="xl">{link.label}</Text>
            </Link>
          </List.Item>
        ))}
      </List>
    </div>
  );
}
