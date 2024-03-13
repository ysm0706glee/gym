import { Button } from "@mantine/core";
import { useNavigate, useOutletContext } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";

export default function Header() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const navigate = useNavigate();

  const logOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header>
      <Link to="/home">Home</Link>
      <Button onClick={logOut}>log out</Button>
    </header>
  );
}
