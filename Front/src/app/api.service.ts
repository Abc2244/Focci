import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, CreateTaskDTO } from './interfaces/task.interface';
import { environment } from '../environments/environment';

// Interfaces basadas en los modelos del backend
interface Subject {
  _id?: string;
  user_id: string;
  name: string;
  credits: number;
  schedule: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // -----------------------------------------
  // Autenticación
  // -----------------------------------------

  // Iniciar sesión
  loginUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login/`, data);
  }

  // Registrar usuario
  registerUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }

  // Actualizar contraseña
  updatePassword(user_id: string, passwordData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${user_id}/update-password/`,
      passwordData
    );
  }

  // Eliminar usuario
  deleteUser(user_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${user_id}/`);
  }

  // Limpiar datos del usuario (tareas y recordatorios)
  deleteUserData(user_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${user_id}/clean/`);
  }

  // -----------------------------------------
  // Tareas
  // -----------------------------------------

  createTask(task: CreateTaskDTO): Observable<any> {
    const taskData = {
      ...task,
      completed: false,
    };
    return this.http.post(`${this.apiUrl}/tasks/`, taskData);
  }

  getUserTasks(user_id: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/users/${user_id}/tasks/`);
  }

  getPendingTasks(user_id: string): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/users/${user_id}/tasks/pending/`
    );
  }

  getCompletedTasks(user_id: string): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/users/${user_id}/tasks/completed/`
    );
  }

  completeTask(task_id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${task_id}/complete/`, {});
  }

  updateTask(task_id: string, taskData: Partial<Task>): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${task_id}/`, taskData);
  }

  deleteTask(task_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${task_id}/`);
  }

  deleteCompletedTasks(user_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${user_id}/tasks/completed/`);
  }

  uncompleteTask(task_id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${task_id}/uncomplete/`, {});
  }

  // -----------------------------------------
  // Materias
  // -----------------------------------------

  getUserSubjects(user_id: string): Observable<Subject[]> {
    return this.http.get<Subject[]>(
      `${this.apiUrl}/users/${user_id}/subjects/`
    );
  }

  getTasksBySubject(subject_id: string): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/subjects/${subject_id}/tasks/`
    );
  }

  createSubject(subject: Subject): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects/`, subject);
  }

  updateSubject(
    subject_id: string,
    subjectData: Partial<Subject>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/subjects/${subject_id}/`, subjectData);
  }

  deleteSubject(subject_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${subject_id}/`);
  }

  // -----------------------------------------
  // Recordatorios
  // -----------------------------------------

  // Crear un nuevo recordatorio
  createReminder(reminder: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reminders/`, reminder);
  }

  // Obtener recordatorios de una tarea
  getRemindersByTask(task_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/${task_id}/reminders/`);
  }

  // Obtener recordatorios próximos de un usuario
  getUpcomingReminders(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}/reminders/upcoming/`);
  }

  // Obtener recordatorios por prioridad
  getRemindersByPriority(user_id: string, level: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/users/${user_id}/reminders/priority/${level}/`
    );
  }

  // Actualizar un recordatorio
  updateReminder(reminder_id: string, reminderData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/reminders/${reminder_id}/`,
      reminderData
    );
  }

  // Eliminar un recordatorio
  deleteReminder(reminder_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reminders/${reminder_id}/`);
  }
}
