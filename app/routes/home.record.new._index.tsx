import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
} from "@vercel/remix";
import type { Database } from "~/types/supabase";
import type { WorkoutRecords } from "~/types/workoutRecord";
import { NumberInput, Button, Text } from "@mantine/core";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const url = new URL(request.url);
  const workoutMenuId = url.searchParams.get("workout_menu_id");
  if (!workoutMenuId) throw new Error("workout_menu_id must be defined");
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  const workoutRecords: WorkoutRecords = {};
  try {
    const { data, error } = await supabase
      .from("workout_menus_exercises")
      .select("exercises (id, name)")
      .eq("workout_menus_id", workoutMenuId);
    if (error) throw error;
    for (const workoutMenu of data) {
      if (workoutMenu.exercises) {
        const exerciseName = workoutMenu.exercises.name;
        workoutRecords[exerciseName] = {
          id: workoutMenu.exercises.id,
          records: [
            {
              sets: 1,
              reps: 8,
              // TODO: set default weight
              weight: 0,
            },
          ],
        };
      }
    }
  } catch (error) {
    console.error("Error fetching workout records:", error);
  }
  return { workoutRecords };
}

export async function action({ request }: ActionFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const url = new URL(request.url);
  const workoutMenuId = Number(url.searchParams.get("workout_menu_id"));
  if (!workoutMenuId) throw new Error("workout_menu_id must be defined");
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  const body = await request.formData();
  // TODO: validate
  const rawFormData = Object.fromEntries(body.entries());
  console.log("rawFormData: ", rawFormData);
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  const record: {
    workout_menus_id: number;
    date: string;
    exercises_id: number;
    sets: number;
    reps: number;
    weight: number;
  } = {
    workout_menus_id: workoutMenuId,
    date: formattedDate,
    exercises_id: 0,
    sets: 0,
    reps: 0,
    weight: 0,
  };
  // TODO: refactor
  for (const [key, value] of Object.entries(rawFormData)) {
    const [exercisesId, set, type] = key.split("-");
    if (type === "reps") {
      record.exercises_id = Number(exercisesId);
      record.sets = Number(set);
      record.reps = Number(value);
    }
    if (type === "weight") {
      record.weight = Number(value);
      const { error } = await supabase.from("workout_records").insert([record]);
      if (error) throw error;
      record.exercises_id = 0;
      record.sets = 0;
      record.reps = 0;
      record.weight = 0;
    }
  }
  return json({ message: "success" });
}

export default function WorkoutRecord() {
  const { workoutRecords } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const [workoutRecordsState, setWorkoutRecordsState] =
    useState(workoutRecords);

  const addRecord = (exerciseName: string) => {
    const currentRecords = workoutRecordsState[exerciseName];
    console.log("currentRecords: ", currentRecords);

    const nextSet = currentRecords.records.length + 1;
    // TODO: set default weight
    const defaultWeight = 0;
    const newRecord = {
      sets: nextSet,
      reps: 8,
      weight: defaultWeight,
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
    <div style={{ height: "100%" }}>
      {data?.message ? (
        <Text size="lg">Good job!</Text>
      ) : (
        <Form method="post">
          {Object.entries(workoutRecordsState).map(
            ([exerciseName, { id, records }]) => (
              <div key={id} style={{ marginBottom: "1rem" }}>
                <Text size="lg">{exerciseName}</Text>
                {records.map((record, index) => (
                  <div
                    key={`${record.id}-${index}`}
                    style={{ marginBottom: "1rem" }}
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
