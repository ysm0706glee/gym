import { Button, List, Text, TextInput } from "@mantine/core";
import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
} from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const { data: menus } = await supabaseClient.from("menus").select("*");
  return { menus };
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const name = body.get("menu");
  if (typeof name !== "string") return;
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  const userId = user?.data.user?.id;
  if (!userId) return redirect(links.login);
  const { data } = await supabaseClient
    .from("menus")
    .insert({ name, user_id: userId })
    .select();
  return redirect(`${links.menus}/${data?.[0].id}`);
}

export default function Menus() {
  const { menus } = useLoaderData<typeof loader>();

  return (
    <div>
      <Text style={{ paddingBottom: "1rem" }} size="lg">
        Workout Menus
      </Text>
      <List
        style={{
          paddingBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {menus?.map((menu) => (
          <List.Item key={menu.id}>
            <Link style={{ color: "#fff" }} to={`${links.menus}/${menu.id}`}>
              <Text>{menu.name}</Text>
            </Link>
          </List.Item>
        ))}
      </List>
      <Form
        method="post"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <TextInput name="menu" placeholder="menu name" />
        <Button type="submit" variant="white" color="gray">
          Add
        </Button>
      </Form>
    </div>
  );
}
