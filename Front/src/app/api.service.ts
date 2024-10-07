import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:8000'; // Asegúrate de que esta URL apunte a tu backend

  constructor(private http: HttpClient) {}

  // -----------------------------------------
  // Funciones existentes
  // -----------------------------------------

  // Enviar un nuevo recordatorio al backend
  crearRecordatorio(recordatorio: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear_recordatorio/`, recordatorio);
  }

  // Obtener recomendaciones basadas en un recordatorio
  obtenerRecomendaciones(recordatorio: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/obtener_recomendaciones/`, recordatorio);
  }

  // -----------------------------------------
  // Nuevas funciones para tareas y completado
  // -----------------------------------------

  // Crear una nueva tarea con prioridad y fecha de entrega


  createTask(task: { 
    user_id: string, 
    subject_id: string, 
    description: string, 
    due_date: string, 
    difficulty: number 
}): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-task`, task);
}

  // Marcar una tarea como completada
  completeTask(task_id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/complete-task`, { task_id });
  }
}
