import { Button } from "@mantine/core";
import { Form } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { links } from "~/lib/links";

export default function Header() {
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
      <Link to={links.home}>🏠</Link>
      <Form action="/logout" method="post">
        <Button type="submit" variant="transparent" color="gray">
          log out
        </Button>
      </Form>
    </header>
  );
}
