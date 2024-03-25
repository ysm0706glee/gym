import { Button } from "@mantine/core";
import { Form } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";

type Props = {
  supabase: SupabaseClient<Database>;
};

export default function Header(props: Props) {
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
      <Form action="/logout" method="post">
        <Button type="submit" variant="transparent" color="gray">
          log out
        </Button>
      </Form>
    </header>
  );
}
