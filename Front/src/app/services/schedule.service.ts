import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    return this.getUserSchedule(userId).pipe(
      map((schedule) => {
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

        // Filtrar actividades de hoy
        const todayActivities = schedule.filter(
          (item) => item.day.toLowerCase() === dayOfWeek
        );

        // Convertir a slots ocupados
        const busySlots = todayActivities.map((activity) => {
          const [startHour, startMinute] = activity.startTime
            .split(':')
            .map(Number);
          const [endHour, endMinute] = activity.endTime.split(':').map(Number);

          const start = new Date(today);
          start.setHours(startHour, startMinute, 0, 0);

          const end = new Date(today);
          end.setHours(endHour, endMinute, 0, 0);

          return { start, end };
        });

        // Crear slots de 30 minutos para todo el día (8am a 10pm)
        const freeSlots: TimeSlot[] = [];

        for (let hour = 8; hour < 22; hour++) {
          for (let minute of [0, 30]) {
            const start = new Date(today);
            start.setHours(hour, minute, 0, 0);

            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);

            // Verificar si este slot está ocupado
            const isOccupied = busySlots.some(
              (busySlot) =>
                (start >= busySlot.start && start < busySlot.end) ||
                (end > busySlot.start && end <= busySlot.end) ||
                (start <= busySlot.start && end >= busySlot.end)
            );

            if (!isOccupied) {
              freeSlots.push({
                start,
                end,
                isFree: true,
              });
            }
          }
        }

        return freeSlots;
      })
    );
  }

  /**
   * Encuentra los mejores momentos para estudiar basados en el tipo de tarea
   */
  findBestStudyTimes(userId: string, taskType: string): Observable<TimeSlot[]> {
    return this.findFreeTimeSlots(userId).pipe(
      map((freeSlots) => {
        // Filtrar por las horas más adecuadas según el tipo de tarea
        return freeSlots.filter((slot) => {
          const hour = slot.start.getHours();

          switch (taskType.toLowerCase()) {
            case 'examen':
              // Mañana: mayor concentración
              return hour >= 8 && hour <= 12;
            case 'proyecto':
              // Tarde: más creatividad
              return hour >= 14 && hour <= 18;
            case 'lectura':
              // Noche: más tranquilidad
              return hour >= 19 && hour <= 22;
            default:
              // Cualquier momento libre está bien
              return true;
          }
        });
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
