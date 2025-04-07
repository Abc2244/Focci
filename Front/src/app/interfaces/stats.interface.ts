export interface TaskStats {
  tasksCreated: number;
  tasksCompleted: number;
  completionRate: number;
  onTimeRate: number;
  lateRate: number;
  weeklyActivity: WeeklyActivity[];
  subjectDistribution: SubjectDistribution[];
}

export interface WeeklyActivity {
  day: string;
  percentage: number;
}

export interface SubjectDistribution {
  name: string;
  color: string;
  percentage: number;
}
