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

export type ChartWorkoutRecord = {
  date: string;
  [key: string]: string | number;
};

export type ExerciseCount = {
  [date: string]: {
    [exerciseName: string]: {
      totalWeight: number;
      count: number;
    };
  };
};
