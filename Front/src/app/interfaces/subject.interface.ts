export interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Subject {
  _id?: string;
  user_id: string;
  userId?: string;
  name: string;
  credits: number;
  schedule: ScheduleItem[];
  end_date: Date;
}

// Interfaz para el modelo de Subject en los componentes
export interface SubjectModel extends Subject {
  id?: string;
}
