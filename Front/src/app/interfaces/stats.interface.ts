export interface TaskStats {
  tasksCreated: number;
  tasksCompleted: number;
  completionRate: number;
  onTimeRate: number;
  averageCompletionDays: number;
  lateTasksRate: number;
  weeklyActivity: WeeklyActivity[];
  subjectDistribution: SubjectDistribution[];
}

export interface WeeklyActivity {
  day: string;
  completedTasks: number;
  percentage: number;
}

export interface SubjectDistribution {
  name: string;
  percentage: number;
  color: string;
}
