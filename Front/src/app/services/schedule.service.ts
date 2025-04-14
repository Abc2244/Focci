import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ScheduleItem {
  _id: string;
  user_id: string;
  title: string;
  startTime: string;
  endTime: string;
  day: string;
  type: 'class' | 'activity' | 'personal';
  location?: string;
  color?: string;
  repeat?: boolean;
  subject_id?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isFree: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Obtiene el horario completo del usuario
   */
  getUserSchedule(userId: string): Observable<ScheduleItem[]> {
    return this.http
      .get<ScheduleItem[]>(`${this.apiUrl}/schedule/users/${userId}`)
      .pipe(
        catchError((error) => {
          console.error('Error obteniendo horario:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene las clases programadas para hoy
   */
  getTodayClasses(userId: string): Observable<ScheduleItem[]> {
    const today = new Date();
    const dayOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][today.getDay()];

    return this.getUserSchedule(userId).pipe(
      map((schedule) =>
        schedule.filter(
          (item) =>
            item.day.toLowerCase() === dayOfWeek && item.type === 'class'
        )
      )
    );
  }

  /**
   * Encuentra espacios libres en el horario del usuario para el día actual
   */
  findFreeTimeSlots(userId: string): Observable<TimeSlot[]> {
    if (!userId) {
      console.warn('No se proporcionó ID de usuario para findFreeTimeSlots');
      return of([]);
    }

    console.log('Buscando slots libres para el usuario:', userId);

    return this.http
      .get<any>(`${this.apiUrl}/schedule/users/${userId}/free-slots`)
      .pipe(
        tap((response) => console.log('Respuesta de free-slots:', response)),
        map((response) => {
          if (response && response.free_slots) {
            return response.free_slots.map((slot: any) => ({
              start: new Date(slot.start),
              end: new Date(slot.end),
              isFree: true,
              duration: slot.duration_minutes,
            }));
          }
          console.warn('No se encontraron slots libres en la respuesta');
          return [];
        }),
        catchError((error) => {
          console.error('Error obteniendo slots libres:', error);
          return of([]);
        })
      );
  }

  /**
   * Encuentra los mejores momentos para estudiar basados en el tipo de tarea y prioridad
   */
  findBestStudyTimes(
    userId: string,
    taskType: string,
    priority: number = 3
  ): Observable<TimeSlot[]> {
    console.log(
      'Buscando mejores horarios para tipo de tarea:',
      taskType,
      'con prioridad:',
      priority
    );

    return this.findFreeTimeSlots(userId).pipe(
      tap((slots) =>
        console.log('Total slots libres encontrados:', slots.length)
      ),
      map((freeSlots) => {
        // Filtrar por las horas más adecuadas según el tipo de tarea
        let filteredSlots = freeSlots.filter((slot) => {
          const hour = slot.start.getHours();

          // Normalizar el tipo de tarea a minúsculas y sin espacios
          const normalizedType = taskType.toLowerCase().trim();
          console.log(
            'Tipo de tarea normalizado:',
            normalizedType,
            'hora:',
            hour
          );

          switch (normalizedType) {
            case 'exam':
            case 'examen':
            case 'quiz':
              // Mañana: mayor concentración
              return hour >= 8 && hour <= 12;
            case 'project':
            case 'proyecto':
              // Tarde: más creatividad
              return hour >= 14 && hour <= 18;
            case 'reading':
            case 'lectura':
            case 'lab':
            case 'laboratorio':
              // Noche: más tranquilidad
              return hour >= 19 && hour <= 22;
            default:
              // Limitar a horas razonables (8am-8pm)
              return hour >= 8 && hour <= 20;
          }
        });

        // Ajustar según la prioridad
        if (priority >= 4) {
          // Para tareas de alta prioridad, preferir slots más tempranos
          filteredSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
        } else if (priority <= 2) {
          // Para tareas de baja prioridad, pueden ir en slots más tardíos
          filteredSlots.sort((a, b) => b.start.getTime() - a.start.getTime());
        }

        console.log(
          'Slots filtrados por tipo de tarea y prioridad:',
          filteredSlots.length
        );
        return filteredSlots;
      })
    );
  }

  /**
   * Crea un nuevo elemento en el horario
   */
  createScheduleItem(
    scheduleItem: Partial<ScheduleItem>
  ): Observable<ScheduleItem> {
    return this.http
      .post<ScheduleItem>(`${this.apiUrl}/schedule`, scheduleItem, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error creando elemento de horario:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza un elemento del horario
   */
  updateScheduleItem(
    itemId: string,
    scheduleItem: Partial<ScheduleItem>
  ): Observable<ScheduleItem> {
    return this.http.put<ScheduleItem>(
      `${this.apiUrl}/schedule/${itemId}`,
      scheduleItem,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Elimina un elemento del horario
   */
  deleteScheduleItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedule/${itemId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
}
