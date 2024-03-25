import { Chart } from "~/types/workoutRecord";
import { colors } from "./colours";
import { z } from "zod";

const dataSchema = z.object({
  date: z.string(),
  weight: z.number(),
  exercises: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
});

type Data = z.infer<typeof dataSchema>;

export const createChartData = (data: Data[]) => {
  const charts: Chart[] = [];
  data.forEach((record) => {
    const { date, weight, exercises } = record;
    if (exercises) {
      const exerciseName = exercises.name;
      let existingEntry = charts.find((entry) => entry.date === date);
      if (!existingEntry) {
        existingEntry = { date, [exerciseName]: weight };
        charts.push(existingEntry);
      } else {
        if (
          !existingEntry[exerciseName] ||
          Number(existingEntry[exerciseName]) < weight
        ) {
          existingEntry[exerciseName] = weight;
        }
      }
    }
  });
  return charts;
};

export const createSeriesData = (exerciseNames: Set<string>) => {
  let colorIndex = 0;
  return Array.from(exerciseNames).map((name) => {
    const color = colors[colorIndex++ % colors.length];
    return { name, color };
  });
};
