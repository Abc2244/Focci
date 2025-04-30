// Para tareas existentes (con _id)
export interface Task {
  _id?: string;
  user_id: string;
  subject_id: string;
  description: string;
  due_date: string;
  completed: boolean;
  completed_date?: string;
  created_at?: string;
  // Nuevos campos
  task_type?: string;
  priority?: number;
  estimated_time?: number;
  classification_confidence?: number;
  insistence_level?: number;
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
  task_type: string;
  reminders: string[];
  classification_confidence: number;
  message?: string;
}
