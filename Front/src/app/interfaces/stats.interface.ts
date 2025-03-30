export interface TaskStats {
  created: number;
  completed: number;
  completionRate: number;
  onTimeRate: number;
  lateRate: number;
  tasksCompleted: number;
  tasksCreated: number;
  lateTasksRate: number;
  averageCompletionDays: number;
  weeklyActivity: WeeklyActivity[];
  subjectDistribution: SubjectDistribution[];
  averageDays?: number;
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
