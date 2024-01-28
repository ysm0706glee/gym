import { Button, NumberInput, Radio, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  createBrowserClient,
  createServerClient,
  parse,
  serialize,
} from "@supabase/ssr";
import { useEffect, useState } from "react";
import type { Database } from "~/types/supabase";
import type { WorkoutRecords } from "~/types/workoutRecord";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) {
    return redirect("/calendar");
  }
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
  const workoutMenus = await supabase.from("workout_menus").select("*");
  return { date, env, workoutMenus };
}

export default function WorkoutMenus() {
  const { date, env, workoutMenus } = useLoaderData<typeof loader>();

  const supabase = createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );

  const [selectedWorkMenuId, setSelectedWorkMenuId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecords>({});

  // TODO: refactor
  useEffect(() => {
    if (!selectedWorkMenuId) return;
    const fetchWorkoutRecords = async (workoutMenuId: number) => {
      setIsLoading(true);
      try {
        const { data: workoutRecordsData, error: workoutRecordsError } =
          await supabase
            .from("workout_records")
            .select(
              `
                id,
                date,
                sets,
                reps,
                weight,
                exercises (id, name),
                workout_menus_id
              `
            )
            .eq("workout_menus_id", workoutMenuId)
            .eq("date", date)
            .order("exercises_id", { ascending: true });
        if (workoutRecordsError) throw workoutRecordsError;
        const result: WorkoutRecords = {};
        for (const workoutRecord of workoutRecordsData) {
          if (workoutRecord.exercises) {
            const exerciseName = workoutRecord.exercises.name;
            if (!result[exerciseName]) {
              result[exerciseName] = {
                id: workoutRecord.exercises.id,
                records: [],
              };
            }
            result[exerciseName].records.push({
              id: workoutRecord.id,
              sets: workoutRecord.sets,
              reps: workoutRecord.reps,
              weight: workoutRecord.weight,
            });
          }
        }
        setWorkoutRecords(result);
      } catch (error) {
        console.error("Error fetching workout records:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkoutRecords(selectedWorkMenuId);
  }, [date, supabase, selectedWorkMenuId]);

  return (
    <div>
      <h1>Workout Menus</h1>
      {workoutMenus.data?.map((workoutMenu) => (
        <Radio
          key={workoutMenu.id}
          name="workoutMenu"
          label={workoutMenu.name}
          checked={selectedWorkMenuId === workoutMenu.id}
          onChange={async () => setSelectedWorkMenuId(workoutMenu.id)}
        />
      ))}
      {selectedWorkMenuId && !isLoading && (
        <WorkoutRecordForm
          date={date}
          selectedWorkMenuId={selectedWorkMenuId}
          workoutRecords={workoutRecords}
          setWorkoutRecords={setWorkoutRecords}
        />
      )}
    </div>
  );
}

type WorkoutRecordFormProps = {
  date: string;
  selectedWorkMenuId: number;
  workoutRecords: WorkoutRecords;
  setWorkoutRecords: React.Dispatch<React.SetStateAction<WorkoutRecords>>;
};

export function WorkoutRecordForm(props: WorkoutRecordFormProps) {
  const { env } = useLoaderData<typeof loader>();

  const supabase = createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );

  const form = useForm({
    initialValues: props.workoutRecords,
    validateInputOnChange: true,
  });

  const addRecord = (exercise: string) => {
    const currentRecords = form.values[exercise];
    const nextSetNumber = currentRecords.records.length + 1;
    const lastWeight = localStorage.getItem(`last_weight_${exercise}`);
    const defaultWeight = lastWeight ? parseInt(lastWeight, 10) : 0;
    const newRecord = {
      sets: nextSetNumber,
      reps: 10,
      weight: defaultWeight,
    };
    form.setFieldValue(exercise, {
      ...currentRecords,
      records: [...currentRecords.records, newRecord],
    });
  };

  const onSubmit = async (values: WorkoutRecords) => {
    if (Object.keys(form.errors).length) {
      // TODO: handle error
      return;
    }
    for (const exercise in values) {
      const exerciseRecords = values[exercise].records;
      // save last weight to localStorage
      if (exerciseRecords.length > 0) {
        const lastRecord = exerciseRecords[exerciseRecords.length - 1];
        localStorage.setItem(
          `last_weight_${exercise}`,
          String(lastRecord.weight)
        );
      }
      // TODO: refactor
      for (const record of values[exercise].records) {
        const { error } = await supabase.from("workout_records").upsert({
          id: record.id,
          workout_menus_id: props.selectedWorkMenuId,
          date: props.date,
          exercises_id: values[exercise].id,
          sets: record.sets,
          reps: record.reps,
          weight: record.weight,
        });
        if (error) {
          console.log("error: ", error);
        }
      }
    }
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      {Object.keys(form.values).map((exercise, index) => (
        <div key={`${exercise}-${index}`}>
          <h1>{exercise}</h1>
          {form.values[exercise].records.map((record, index) => (
            <div key={`${record.id}-${index}`}>
              <Title order={2}>{index + 1} sets</Title>
              <NumberInput
                {...form.getInputProps(`${exercise}.records.${index}.reps`)}
                label="Reps"
                min={0}
              />
              <NumberInput
                {...form.getInputProps(`${exercise}.records.${index}.weight`)}
                label="Weight(kg)"
                min={0}
              />
            </div>
          ))}
          <Button onClick={() => addRecord(exercise)}>Add Record</Button>
        </div>
      ))}
      <Button type="submit">Save</Button>
    </form>
  );
}
