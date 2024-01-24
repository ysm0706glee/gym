// TODO: refactor
export type WorkoutRecord = {
  id?: number;
  sets: number;
  reps: number;
  weight: number;
};

export type ExerciseRecord = {
  id: number;
  records: WorkoutRecord[];
};

export type WorkoutRecords = {
  [exerciseName: string]: ExerciseRecord;
};
