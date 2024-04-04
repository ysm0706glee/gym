import { FormDataEntry, ParsedFormData, Records } from "~/types/workoutRecord";
import { Tables } from "../types/supabase";

export function parseFormData(
  formData: Map<string, FormDataEntry>,
  workoutMenuId: number,
  date: string
): ParsedFormData[] {
  const records: ParsedFormData[] = [];
  const tempRecords: { [key: string]: ParsedFormData } = {};
  formData.forEach((value) => {
    const { exercise_id, sets, type } = value;
    const recordKey = `${exercise_id}-${sets}`;
    if (!tempRecords[recordKey]) {
      tempRecords[recordKey] = {
        menu_id: workoutMenuId,
        date,
        exercise_id: parseInt(exercise_id, 10),
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

type Data = Tables<"records"> & {
  exercises: Tables<"exercises"> | null;
};

export function formateRecords(data: Data[]) {
  const records: Records = {};
  data.forEach((record) => {
    const name = record.exercises?.name;
    if (name) {
      if (!records[name]) {
        records[name] = {
          id: record.exercise_id,
          records: [],
        };
      }
      records[name].records.push({
        id: record.id,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
      });
    }
  });
  return records;
}
