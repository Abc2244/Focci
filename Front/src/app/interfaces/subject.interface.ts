export interface ScheduleItem {
  day: string; // Día de la semana (ej. "Lunes", "Martes", etc.)
  time: string; // Hora (ej. "4:00 PM", "8:00 AM", etc.)
}

export interface Subject {
  _id?: string; // MongoDB ID
  user_id: string;
  name: string;
  credits: number;
  schedule: ScheduleItem[];
}
