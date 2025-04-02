// Para tareas existentes (con _id)
export interface Task {
  _id?: string;
  user_id: string;
  subject_id: string;
  description: string;
  due_date: string;
  completed?: boolean;
  completed_date?: string;
  created_at?: string;
  // Nuevos campos
  task_type?: 'examen' | 'proyecto' | 'lectura' | 'general';
  priority?: number;
  estimated_time?: number;
  reminders?: string[];
}

// Para crear nuevas tareas (sin _id)
export interface CreateTaskDTO {
  user_id: string;
  subject_id: string;
  description: string;
  due_date: string;
  estimated_time?: number;
}

export interface TaskResponse {
  task_id: string;
  keywords?: string[];
  adjusted_priority: number;
  insistence_level: number;
  task_type: 'examen' | 'proyecto' | 'lectura' | 'general';
  reminders: string[];
  message?: string;
}
