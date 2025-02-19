import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';

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

  // Crear nueva tarea
  createTask(task: {
    user_id: string;
    subject_id: string;
    description: string;
    due_date: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks/`, task);
  }

  // Obtener tareas de un usuario
  getUserTasks(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}/tasks/`);
  }

  // Obtener tareas pendientes de un usuario
  getPendingTasks(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}/tasks/pending/`);
  }

  // Obtener tareas completadas de un usuario
  getCompletedTasks(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}/tasks/completed/`);
  }

  // Marcar tarea como completada
  completeTask(task_id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${task_id}/complete/`, {});
  }

  // Actualizar tarea
  updateTask(task_id: string, taskData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${task_id}/`, taskData);
  }

  // Eliminar tarea
  deleteTask(task_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${task_id}/`);
  }

  // Eliminar todas las tareas completadas de un usuario
  deleteCompletedTasks(user_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${user_id}/tasks/completed/`);
  }

  // -----------------------------------------
  // Materias
  // -----------------------------------------

  // Obtener materias de un usuario
  getUserSubjects(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}/subjects/`);
  }

  // Obtener tareas de una materia
  getTasksBySubject(subject_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/subjects/${subject_id}/tasks/`);
  }

  // Crear nueva materia
  createSubject(subject: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects/`, subject);
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
