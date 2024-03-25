import { useLoaderData, Form, useActionData } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
  redirect,
} from "@vercel/remix";
import type { FormDataEntry, WorkoutRecords } from "~/types/workoutRecord";
import { NumberInput, Button, Text } from "@mantine/core";
import { useState } from "react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { parseFormData } from "~/lib/records";
import { formateDate } from "~/lib/date";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const workoutMenuId = Number(url.searchParams.get("workout_menu_id"));
  if (!workoutMenuId) throw new Error("workout_menu_id must be defined");
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) return redirect("/login");
  const workoutRecords: WorkoutRecords = {};
  try {
    const { data, error } = await supabaseClient
      .from("workout_menus_exercises")
      .select("exercises (id, name)")
      .eq("workout_menus_id", workoutMenuId);
    if (error) throw error;
    for (const workoutMenu of data) {
      if (workoutMenu.exercises) {
        const exerciseId = workoutMenu.exercises.id;
        const exerciseName = workoutMenu.exercises.name;
        const { data: recordsData, error: recordsError } = await supabaseClient
          .from("workout_records")
          .select("reps, weight")
          .eq("exercises_id", exerciseId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (recordsError) throw recordsError;
        const defaultReps = recordsData[0]?.reps || 8;
        const defaultWeight = recordsData[0]?.weight || 0;
        workoutRecords[exerciseName] = {
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
  return { workoutRecords };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const workoutMenuId = Number(url.searchParams.get("workout_menu_id"));
    if (!workoutMenuId) {
      throw new Error("Invalid workout_menu_id value");
    }
    const { supabaseClient } = createSupabaseServerClient(request);
    const body = await request.formData();
    const formData: Map<string, FormDataEntry> = new Map();
    const date = formateDate(new Date());
    for (const [key, rawValue] of body.entries()) {
      const [exercisesId, set, type] = key.split("-");
      const value = rawValue.toString();
      formData.set(key, {
        exercises_id: exercisesId,
        sets: set,
        type: type as "reps" | "weight",
        value,
      });
    }
    const records = parseFormData(formData, workoutMenuId, date);
    const { error } = await supabaseClient
      .from("workout_records")
      .insert(records);
    if (error) throw error;
    return json({ message: "success" });
  } catch (error) {
    console.error(error);
  }
}

export default function WorkoutRecord() {
  const { workoutRecords } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const [workoutRecordsState, setWorkoutRecordsState] =
    useState(workoutRecords);

  const addRecord = (exerciseName: string) => {
    const currentRecords = workoutRecordsState[exerciseName];
    const nextSet = currentRecords.records.length + 1;
    const previousReps = currentRecords.records.slice(-1)[0].reps;
    const previousWeight = currentRecords.records.slice(-1)[0].weight;
    const newRecord = {
      sets: nextSet,
      reps: previousReps,
      weight: previousWeight,
    };
    setWorkoutRecordsState({
      ...workoutRecordsState,
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
    value: number
  ) => {
    const currentRecords = workoutRecordsState[exerciseName];
    const updatedRecords = currentRecords.records.map((record, index) => {
      if (index === setId) {
        return { ...record, [field]: value };
      }
      return record;
    });
    setWorkoutRecordsState({
      ...workoutRecordsState,
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
          {Object.entries(workoutRecordsState).map(
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
                        updateRecord(exerciseName, index, "reps", Number(value))
                      }
                    />
                    <NumberInput
                      name={`${id}-${index + 1}-weight`}
                      label="Weight(kg)"
                      value={record.weight}
                      onChange={(value) =>
                        updateRecord(
                          exerciseName,
                          index,
                          "weight",
                          Number(value)
                        )
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
