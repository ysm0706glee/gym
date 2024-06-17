import { useDisclosure } from "@mantine/hooks";
import {
  Button,
  List,
  Text,
  TextInput,
  Textarea,
  Modal,
  Group,
} from "@mantine/core";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@vercel/remix";
import { z } from "zod";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

const createSchema = z.object({
  menu: z.string().min(1),
  memo: z.string().optional(),
});

const deleteSchema = z.object({
  menuId: z.string().transform((value) => parseInt(value, 10)),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const { data: menus } = await supabaseClient.from("menus").select("*");
  return { menus };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const body = await request.formData();
  const { _action, ...value } = Object.fromEntries(body);
  if (_action === "create") {
    const parsed = createSchema.safeParse(value);
    if (!parsed.success) {
      console.error(parsed.error.format());
      return json({ status: "failed" });
    }
    const userId = user.data.user?.id;
    const name = parsed.data.menu;
    const insertData: {
      name: string;
      memo?: string;
      user_id: string;
    } = { name, user_id: userId };
    const memo = parsed.data.memo;
    if (memo) {
      insertData.memo = memo;
    }
    const { data, error } = await supabaseClient
      .from("menus")
      .insert(insertData)
      .select();
    if (error) throw new Error(error.message);
    return redirect(`${links.menus}/${data[0].id}`);
  }
  if (_action === "delete") {
    const parsed = deleteSchema.safeParse(value);
    if (!parsed.success) {
      console.error(parsed.error.format());
      return json({ status: "failed" });
    }
    const menuId = parsed.data.menuId;
    const { error } = await supabaseClient.rpc("delete_menu", {
      menuid: menuId,
    });
    if (error) {
      console.error(error);
      return json({ status: "failed" });
    }
    return json({ status: "success" });
  }
}

export default function Menus() {
  const { menus } = useLoaderData<typeof loader>();

  const actionResponse = useActionData<typeof action>();

  const [opened, { open, close }] = useDisclosure(false);

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
            <Group justify="space-between">
              <Link style={{ color: "#fff" }} to={`${links.menus}/${menu.id}`}>
                <Text>{menu.name}</Text>
                <Text size="sm" style={{ wordBreak: "break-all" }}>
                  {menu.memo}
                </Text>
              </Link>
              <Form method="post">
                <input type="hidden" name="menuId" value={menu.id} />
                <Button
                  type="submit"
                  name="_action"
                  value="delete"
                  variant="transparent"
                  color="red"
                >
                  ×
                </Button>
              </Form>
            </Group>
          </List.Item>
        ))}
      </List>
      <Button variant="white" color="gray" onClick={open}>
        Add menu
      </Button>
      <Modal opened={opened} onClose={close}>
        <Form
          method="post"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <TextInput name="menu" label="menu name" withAsterisk required />
          <Textarea name="memo" label="memo" />
          <Button
            type="submit"
            name="_action"
            value="create"
            variant="white"
            color="gray"
          >
            Add
          </Button>
        </Form>
      </Modal>
      {actionResponse?.status === "failed" && <Text>Failed</Text>}
    </div>
  );
}
