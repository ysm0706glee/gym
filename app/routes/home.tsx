import { Outlet, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";
import Header from "../components/header";

export default function Home() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  return (
    <>
      <Header />
      <main
        style={{
          height: "calc(100vh - 3rem)",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        <Outlet context={{ supabase }} />
      </main>
    </>
  );
}
