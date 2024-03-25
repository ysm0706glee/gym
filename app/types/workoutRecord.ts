import { z } from "zod";

export type Record = {
  id?: number;
  sets: number;
  reps: number;
  weight: number;
};

export type WorkoutRecords = {
  [exerciseName: string]: {
    id: number;
    records: Record[];
  };
};

// FIXME: [exerciseName: string]: number | string;
export type Chart = {
  date: string;
  [exerciseName: string]: number | string;
};

export const FormDataEntrySchema = z.object({
  exercises_id: z.string(),
  sets: z.string(),
  type: z.union([z.literal("reps"), z.literal("weight")]),
  value: z.string(),
});

export type FormDataEntry = z.infer<typeof FormDataEntrySchema>;

export const ParsedFormDataSchema = z.object({
  workout_menus_id: z.number(),
  date: z.string(),
  exercises_id: z.number(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number(),
});

export type ParsedFormData = z.infer<typeof ParsedFormDataSchema>;
