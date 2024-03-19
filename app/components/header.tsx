import { Button } from "@mantine/core";
import { useNavigate } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";

type Props = {
  supabase: SupabaseClient<Database>;
};

export default function Header(props: Props) {
  const navigate = useNavigate();

  const logOut = async () => {
    await props.supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header
      style={{
        height: "3rem",
        borderBottom: "1px solid #fff",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Link to="/">🏠</Link>
      <Button variant="transparent" color="gray" onClick={logOut}>
        log out
      </Button>
    </header>
  );
}
