import { Outlet, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";
import Header from "../ui/header";

export default function Home() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  return (
    <div>
      <Header />
      <Outlet context={{ supabase }} />
    </div>
  );
}
