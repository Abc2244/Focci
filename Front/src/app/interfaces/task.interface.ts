// Para tareas existentes (con _id)
export interface Task {
  _id?: string;
  user_id: string;
  subject_id: string;
  description: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  completed_date?: string;
}

// Para crear nuevas tareas (sin _id)
export interface CreateTaskDTO {
  user_id: string;
  subject_id: string;
  description: string;
  due_date: string;
  completed?: boolean;
}
