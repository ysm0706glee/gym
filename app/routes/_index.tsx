import { List, Text, Loader } from "@mantine/core";
import { Link, useNavigation } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

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
] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  return null;
}

export default function Home() {
  const navigation = useNavigation();

  const isLoaderSubmission = navigation.state === "loading";
  const isLoaderSubmissionRedirect = navigation.state === "loading";
  const isLoading = isLoaderSubmission || isLoaderSubmissionRedirect;

  return (
    <div
      style={{
        height: "100%",
      }}
    >
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
        <List style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {LINKS.map((link) => (
            <List.Item key={link.href}>
              <Link style={{ color: "#fff" }} to={link.href}>
                <Text size="xl">{link.label}</Text>
              </Link>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
}
