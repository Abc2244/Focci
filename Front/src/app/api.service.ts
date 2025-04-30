import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Task, CreateTaskDTO, TaskResponse } from './interfaces/task.interface';
import { Subject } from './interfaces/subject.interface';
import { environment } from '../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { TaskStats } from './interfaces/stats.interface';

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

  createTask(taskData: CreateTaskDTO): Observable<TaskResponse> {
    console.log('Creating task with data:', taskData);
    return this.http
      .post<TaskResponse>(`${this.apiUrl}/tasks`, taskData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => console.log('Task creation response:', response)),
        catchError((error) => {
          console.error('Error creating task:', error);
          return throwError(
            () => new Error(error.error?.detail || 'Error al crear la tarea')
          );
        })
      );
  }

  getUserTasks(user_id: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiUrl}/users/${user_id}/tasks/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((tasks) => console.log('Retrieved tasks:', tasks)),
        catchError(this.handleError)
      );
  }

  getPendingTasks(user_id: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiUrl}/users/${user_id}/tasks/pending/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
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
    return this.http
      .put(`${this.apiUrl}/tasks/${task_id}/`, taskData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  deleteTask(task_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${task_id}/`).pipe(
      tap(response => console.log('Task deletion response:', response)),
      catchError(this.handleError)
    );
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

  getUserSubjects(userId: string): Observable<Subject[]> {
    return this.http
      .get<Subject[]>(`${this.apiUrl}/users/${userId}/subjects`)
      .pipe(catchError(this.handleError));
  }

  getTasksBySubject(subject_id: string): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/subjects/${subject_id}/tasks/`
    );
  }

  createSubject(subjectData: any): Observable<any> {
    console.log('API createSubject called with:', subjectData);
    // Transformamos userId a user_id para el backend
    if (subjectData.userId && !subjectData.user_id) {
      subjectData.user_id = subjectData.userId;
      delete subjectData.userId;
    }
    
    // Aseguramos que el user_id esté en el objeto
    if (!subjectData.user_id) {
      const token = localStorage.getItem('token');
      const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      if (tokenData && tokenData.id) {
        subjectData.user_id = tokenData.id;
      }
    }
    
    console.log('Enviando datos al backend:', subjectData);
    return this.http
      .post(`${this.apiUrl}/subjects`, subjectData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  updateSubject(
    subject_id: string,
    subjectData: Partial<Subject>
  ): Observable<any> {
    console.log('API updateSubject called with:', subject_id, subjectData);
    
    // Creamos una copia para no modificar el objeto original
    const dataToSend: any = {...subjectData};
    
    // Transformamos userId a user_id para el backend
    if (dataToSend.userId && !dataToSend.user_id) {
      dataToSend.user_id = dataToSend.userId;
      delete dataToSend.userId;
    }
    
    // Aseguramos que el user_id esté en el objeto
    if (!dataToSend.user_id) {
      const token = localStorage.getItem('token');
      const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      if (tokenData && tokenData.id) {
        dataToSend.user_id = tokenData.id;
      }
    }
    
    console.log('Enviando datos al backend:', dataToSend);
    return this.http
      .put(`${this.apiUrl}/subjects/${subject_id}/`, dataToSend, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  deleteSubject(subject_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${subject_id}/`).pipe(
      tap(response => console.log('Subject deletion response:', response)),
      catchError(this.handleError)
    );
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
  getUpcomingReminders(userId: string): Observable<any[]> {
    const url = `${this.apiUrl}/users/${userId}/reminders/upcoming/`;
    console.log('Fetching upcoming reminders from:', url);
    return this.http.get<any[]>(url).pipe(
      tap((reminders) =>
        console.log('Received reminders from API:', reminders)
      ),
      catchError((error) => {
        console.error('Error fetching reminders:', error);
        return throwError(error);
      })
    );
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

  // Add this method to fetch tasks
  getTasks(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/tasks`);
  }

  getUserProfile(userId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/users/${userId}/profile/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  updateUserProfile(userId: string, profileData: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/users/${userId}/`, profileData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getUserReminders(userId: string) {
    return this.http
      .get<any[]>(`${this.apiUrl}/users/${userId}/reminders`)
      .pipe(catchError(this.handleError));
  }

  // Limpiar todos los datos del usuario
  cleanAllUserData(userId: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/users/${userId}/clean-all/`)
      .pipe(catchError(this.handleError));
  }

  // Crear datos de prueba (opcional, si quieres hacerlo desde el frontend)
  createTestData(userId: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/users/${userId}/create-test-data/`, {})
      .pipe(catchError(this.handleError));
  }

  // Obtener estadísticas de tareas
  getStats(userId: string, period: string): Observable<TaskStats> {
    return this.http
      .get<TaskStats>(`${this.apiUrl}/stats/users/${userId}/stats/${period}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getTasksCompletionStats(userId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/stats/users/${userId}/completion`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Obtener estadísticas de tiempo
  getTasksTimeStats(userId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/stats/users/${userId}/time`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Actualizar el estado de un recordatorio
  updateReminderStatus(reminder_id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reminders/${reminder_id}/status/`, {
      status: status,
    });
  }

  // Agregar este método para obtener espacios libres en el horario
  getFreeTimeSlots(userId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/schedule/users/${userId}/free-slots`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Obtener una tarea por su ID
  getTaskById(taskId: string): Observable<TaskResponse> {
    return this.http
      .get<TaskResponse>(`${this.apiUrl}/tasks/${taskId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((task) => console.log('Retrieved task:', task)),
        catchError(this.handleError)
      );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      console.error('Error del cliente:', error.error.message);
    } else {
      // Error del lado del servidor
      console.error(
        `Código de error ${error.status}, ` + `mensaje: ${error.error.message}`
      );
    }
    // Retorna un observable con un mensaje de error
    return throwError(error.message || 'Error en el servidor');
  }
}
