import { useLoaderData, Form, useActionData } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
  redirect,
} from "@vercel/remix";
import type { FormDataEntry, Records } from "~/types/workoutRecord";
import { NumberInput, Button, Text } from "@mantine/core";
import { useState } from "react";
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
  const records: Records = {};
  try {
    const { data, error } = await supabaseClient
      .from("menus_exercises")
      .select("exercises (id, name)")
      .eq("menu_id", menuId);
    if (error) throw error;
    for (const menu of data) {
      if (menu.exercises) {
        const exerciseId = menu.exercises.id;
        const exerciseName = menu.exercises.name;
        const { data: recordsData, error: recordsError } = await supabaseClient
          .from("records")
          .select("reps, weight")
          .eq("exercise_id", exerciseId)
          // .order("created_at", { ascending: false })
          .limit(1);
        if (recordsError) throw recordsError;
        const defaultReps = recordsData[0]?.reps || 8;
        // FIXME: default weight should be the last record's weight
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
      }
    }
  } catch (error) {
    console.error(error);
  }
  return { records };
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
  const { records } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const [recordsState, setRecordsState] = useState(records);

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

  return (
    <div>
      {data?.message ? (
        <Text size="lg">Good job!</Text>
      ) : (
        <Form method="post">
          {Object.entries(recordsState).map(
            ([exerciseName, { id, records }]) => (
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
                {records.map((record, index) => (
                  <div
                    key={`${record.id}-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <Text>{index + 1} sets</Text>
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
            <Button type="submit" variant="white" color="gray">
              Save
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
