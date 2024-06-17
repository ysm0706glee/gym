import { useDisclosure } from "@mantine/hooks";
import {
  Button,
  List,
  Text,
  TextInput,
  Modal,
  Textarea,
  Title,
  Group,
} from "@mantine/core";
import {
  type LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  json,
} from "@vercel/remix";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { links } from "~/lib/links";
import { useEffect } from "react";

const createSchema = z.object({
  exercise: z.string().min(1),
  memo: z.string().optional(),
});

const deleteSchema = z.object({
  exercisesId: z.string().transform((value) => parseInt(value, 10)),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const menuId = Number(params.id);
  if (!menuId) {
    return redirect(links.menus);
  }
  const { data: menu } = await supabaseClient
    .from("menus")
    .select("name, memo")
    .eq("id", menuId)
    .single();
  const { data: exercises, error } = await supabaseClient
    .from("menus_exercises")
    .select("exercises (id, name, memo)")
    .eq("menu_id", menuId);
  if (error) new Response("Not Found", { status: 404 });
  return { menu, exercises };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const body = await request.formData();
  const { _action, ...value } = Object.fromEntries(body);
  const menuId = Number(params.id);
  if (!menuId) return redirect(links.menus);
  if (_action === "create") {
    const parsed = createSchema.safeParse(value);
    if (!parsed.success) {
      return json({ status: "failed", error: parsed.error.format() });
    }
    const exerciseName = parsed.data.exercise;
    const insertData: {
      name: string;
      memo?: string;
    } = { name: exerciseName };
    const memo = parsed.data.memo;
    if (memo) {
      insertData.memo = memo;
    }
    const { data, error: exercisesError } = await supabaseClient
      .from("exercises")
      .insert(insertData)
      .select();
    if (exercisesError) {
      console.error(exercisesError.message);
      return json({ status: "failed" });
    }
    const exerciseId = data[0].id;
    const { error: menusExercisesError } = await supabaseClient
      .from("menus_exercises")
      .insert({
        menu_id: menuId,
        exercise_id: exerciseId,
      })
      .select();
    if (menusExercisesError) {
      console.error(menusExercisesError.message);
      return json({ status: "failed", error: menusExercisesError.message });
    }
    return json({ status: "success" });
  }
  if (_action === "delete") {
    const parsed = deleteSchema.safeParse(value);
    if (!parsed.success) {
      return json({ status: "failed", error: parsed.error.format() });
    }
    const exercisesId = Number(parsed.data.exercisesId);
    const { error } = await supabaseClient
      .from("menus_exercises")
      .delete()
      .eq("menu_id", menuId)
      .eq("exercise_id", exercisesId)
      .select();
    if (error) {
      console.error(error);
      return json({ status: "failed", error: error.message });
    }
    return json({ status: "success" });
  }
}

export default function Menu() {
  const { menu, exercises } = useLoaderData<typeof loader>();
  const actionResponse = useActionData<typeof action>();

  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (actionResponse?.status === "success") {
      close();
    }
  }, [actionResponse]);

  return (
    <div>
      <Title order={1}>{menu?.name}</Title>
      <Text size="sm" style={{ wordBreak: "break-all" }}>
        {menu?.memo}
      </Text>
      <List
        style={{
          paddingBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {exercises?.map((exercise) => (
          <List.Item key={exercise.exercises?.id}>
            <Form method="post">
              <Group justify="space-between">
                <Text>{exercise.exercises?.name}</Text>
                <input
                  type="hidden"
                  name="exercisesId"
                  value={exercise.exercises?.id}
                />
                <Button
                  type="submit"
                  name="_action"
                  value="delete"
                  variant="transparent"
                  color="red"
                >
                  ×
                </Button>
              </Group>
            </Form>
            <Text size="sm" style={{ wordBreak: "break-all" }}>
              {exercise.exercises?.memo}
            </Text>
          </List.Item>
        ))}
      </List>
      <Button variant="white" color="gray" onClick={open}>
        Add exercise
      </Button>
      <Modal opened={opened} onClose={close}>
        <Form
          method="post"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <TextInput
            name="exercise"
            label="exercise name"
            withAsterisk
            required
          />
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
