import { useLoaderData, Form, useActionData } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
  redirect,
} from "@vercel/remix";
import type { FormDataEntry, Records } from "~/types/workoutRecord";
import { useDisclosure } from "@mantine/hooks";
import { NumberInput, Button, Text, Modal } from "@mantine/core";
import { useRef, useState } from "react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { parseFormData } from "~/lib/records";
import { formateDate } from "~/lib/date";
import { links } from "~/lib/links";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const menuId = Number(url.searchParams.get("menu_id"));
  if (!menuId) throw new Error("menu_id must be defined");
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect(links.login);
  const { data: menu } = await supabaseClient
    .from("menus")
    .select("name, memo")
    .eq("id", menuId)
    .single();
  const records: Records = {};
  try {
    const { data, error } = await supabaseClient
      .from("menus_exercises")
      .select("exercises (id, name, memo)")
      .eq("menu_id", menuId);
    if (error) throw error;
    for (const menu of data) {
      if (menu.exercises) {
        const exerciseId = menu.exercises.id;
        const exerciseName = menu.exercises.name;
        const memo = menu.exercises.memo;
        const { data: recordsData, error: recordsError } = await supabaseClient
          .from("records")
          .select("sets, reps, weight")
          .eq("exercise_id", exerciseId)
          .order("created_at", { ascending: false })
          .order("sets", { ascending: false })
          .limit(1);
        if (recordsError) throw recordsError;
        const defaultReps = recordsData[0]?.reps || 8;
        const defaultWeight = recordsData[0]?.weight;
        records[exerciseName] = {
          id: exerciseId,
          records: [
            {
              sets: 1,
              reps: defaultReps,
              weight: defaultWeight,
            },
          ],
        };
        if (memo) {
          records[exerciseName].memo = memo;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return { menu, records };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const menuId = Number(url.searchParams.get("menu_id"));
    if (!menuId) {
      throw new Error("Invalid menu_id value");
    }
    const { supabaseClient } = createSupabaseServerClient(request);
    const body = await request.formData();
    const formData: Map<string, FormDataEntry> = new Map();
    const date = formateDate(new Date());
    for (const [key, rawValue] of body.entries()) {
      const [exerciseId, set, type] = key.split("-");
      const value = rawValue.toString();
      formData.set(key, {
        exercise_id: exerciseId,
        sets: set,
        type: type as "reps" | "weight",
        value,
      });
    }
    const records = parseFormData(formData, menuId, date);
    const { error } = await supabaseClient.from("records").insert(records);
    if (error) throw error;
    return json({ message: "success" });
  } catch (error) {
    console.error(error);
  }
}

export default function WorkoutRecord() {
  const { menu, records } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const formRef = useRef<HTMLFormElement>(null);

  const [recordsState, setRecordsState] = useState(records);

  const [opened, { open, close }] = useDisclosure(false);

  const addRecord = (exerciseName: string) => {
    const currentRecords = recordsState[exerciseName];
    const nextSet = currentRecords.records.length + 1;
    const previousReps = currentRecords.records.slice(-1)[0].reps;
    const previousWeight = currentRecords.records.slice(-1)[0].weight;
    const newRecord = {
      sets: nextSet,
      reps: previousReps,
      weight: previousWeight,
    };
    setRecordsState({
      ...recordsState,
      [exerciseName]: {
        ...currentRecords,
        records: [...currentRecords.records, newRecord],
      },
    });
  };

  const deleteRecord = (exerciseName: string, setId: number) => {
    const currentRecords = recordsState[exerciseName];
    const filteredRecords = currentRecords.records.filter(
      (_, index) => index !== setId
    );
    setRecordsState({
      ...recordsState,
      [exerciseName]: {
        ...currentRecords,
        records: filteredRecords,
      },
    });
  };

  const updateRecord = (
    exerciseName: string,
    setId: number,
    field: "reps" | "weight",
    value: string | number
  ) => {
    const currentRecords = recordsState[exerciseName];
    const updatedRecords = currentRecords.records.map((record, index) => {
      if (index === setId) {
        return { ...record, [field]: value };
      }
      return record;
    });
    setRecordsState({
      ...recordsState,
      [exerciseName]: {
        ...currentRecords,
        records: updatedRecords,
      },
    });
  };

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.submit();
      close();
    }
  };

  return (
    <div>
      {data?.message ? (
        <Text size="lg">Good job!</Text>
      ) : (
        <>
          <Text size="lg">{menu?.name}</Text>
          <Text size="sm">{menu?.memo}</Text>
          <Form method="post" ref={formRef}>
            {Object.entries(recordsState).map(
              ([exerciseName, { id, memo, records }]) => (
                <div
                  key={id}
                  style={{
                    marginBottom: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <Text size="lg">{exerciseName}</Text>
                  {memo ?? <Text size="sm">{memo}</Text>}
                  {records.map((record, index) => (
                    <div
                      key={`${record.id}-${index}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text>{index + 1} sets</Text>
                        <Button
                          variant="transparent"
                          color="red"
                          onClick={() => deleteRecord(exerciseName, index)}
                        >
                          ×
                        </Button>
                      </div>
                      <NumberInput
                        name={`${id}-${index + 1}-reps`}
                        label="Reps"
                        value={record.reps}
                        onChange={(value) =>
                          updateRecord(exerciseName, index, "reps", value)
                        }
                      />
                      <NumberInput
                        name={`${id}-${index + 1}-weight`}
                        label="Weight(kg)"
                        value={record.weight}
                        onChange={(value) =>
                          updateRecord(exerciseName, index, "weight", value)
                        }
                      />
                    </div>
                  ))}
                  <Button
                    variant="filled"
                    color="gray"
                    onClick={() => addRecord(exerciseName)}
                  >
                    Add Record
                  </Button>
                </div>
              )
            )}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button variant="white" color="gray" onClick={open}>
                Save
              </Button>
            </div>
            <Modal
              opened={opened}
              onClose={close}
              title="Are you sure you want to submit these records?"
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button variant="white" color="gray" onClick={handleSubmit}>
                  Yes
                </Button>
              </div>
            </Modal>
          </Form>
        </>
      )}
    </div>
  );
}
