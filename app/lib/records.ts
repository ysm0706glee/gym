import {
  FormDataEntry,
  ParsedFormData,
  WorkoutRecords,
} from "~/types/workoutRecord";
import { Tables } from "../types/supabase";

export function parseFormData(
  formData: Map<string, FormDataEntry>,
  workoutMenuId: number,
  date: string
): ParsedFormData[] {
  const records: ParsedFormData[] = [];
  const tempRecords: { [key: string]: ParsedFormData } = {};
  formData.forEach((value) => {
    const { exercises_id, sets, type } = value;
    const recordKey = `${exercises_id}-${sets}`;
    if (!tempRecords[recordKey]) {
      tempRecords[recordKey] = {
        workout_menus_id: workoutMenuId,
        date,
        exercises_id: parseInt(exercises_id, 10),
        sets: parseInt(sets, 10),
        reps: 0,
        weight: 0,
      };
    }
    if (type === "reps") {
      tempRecords[recordKey].reps = Number(value.value);
    }
    if (type === "weight") {
      tempRecords[recordKey].weight = Number(value.value);
    }
  });
  for (const key in tempRecords) {
    records.push(tempRecords[key]);
  }
  return records;
}

type Data = Tables<"workout_records"> & {
  exercises: Tables<"exercises"> | null;
};

export function formateRecords(data: Data[]) {
  const workoutRecords: WorkoutRecords = {};
  data.forEach((record) => {
    const name = record.exercises?.name;
    if (name) {
      if (!workoutRecords[name]) {
        workoutRecords[name] = {
          id: record.exercises_id,
          records: [],
        };
      }
      workoutRecords[name].records.push({
        id: record.id,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
      });
    }
  });
  return workoutRecords;
}
