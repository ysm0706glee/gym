import "@mantine/charts/styles.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import type { LoaderFunctionArgs } from "@vercel/remix";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { Database } from "./types/supabase";
import "./global.css";
import Header from "./components/header";
import { createSupabaseServerClient } from "./lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseClient } =
    createSupabaseServerClient(request);
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const user = await supabaseClient.auth.getUser();
  return {
    SUPABASE_ANON_KEY,
    SUPABASE_URL,
    session,
    user,
  };
}

export default function App() {
  const { SUPABASE_ANON_KEY, SUPABASE_URL, session, user } =
    useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  const [supabase] = useState(() =>
    createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  );

  const serverAccessToken = session?.access_token;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "INITIAL_SESSION" &&
        session?.access_token !== serverAccessToken
      ) {
        revalidate();
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [serverAccessToken, supabase, revalidate]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark">
          {user.data.user && <Header supabase={supabase} />}
          <main
            style={{
              height: "calc(100vh - 3rem)",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            <Outlet context={{ supabase }} />
          </main>
          <ScrollRestoration />
          <Scripts />
          <Analytics />
        </MantineProvider>
      </body>
    </html>
  );
}
