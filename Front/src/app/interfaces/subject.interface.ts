export interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Subject {
  _id?: string;
  name: string;
  credits: number;
  schedule: ScheduleItem[];
  userId: string;
}
