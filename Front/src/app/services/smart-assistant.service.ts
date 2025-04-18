import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../api.service';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { forkJoin } from 'rxjs';

// Actualizar la interfaz ReminderSuggestion para que sea compatible con ExtendedReminderSuggestion
export interface ReminderSuggestion {
  time?: string; // Hacer que time sea opcional
  level: number;
  description: string;
  date?: string | null; // Añadir date como opcional
}

export interface ReminderPlan {
  taskId: string;
  reminders: ReminderSuggestion[];
  accepted: boolean;
  taskPriority?: number;
  insistenceLevel?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SmartAssistantService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  // Obtener datos completos para la página del asistente inteligente
  getSmartAssistantData(userId: string, date?: string): Observable<any> {
    if (!userId) {
      console.warn(
        'No se proporcionó ID de usuario para getSmartAssistantData'
      );
      return of({
        recommendations: this.generateMockRecommendations(),
      });
    }

    console.log('Obteniendo datos del asistente para el usuario:', userId);

    // Como no existe getSmartRecommendations, usamos un observable simulado
    return of({
      recommendations: this.generateMockRecommendations(),
    });
  }

  // Obtener plan de estudio para hoy
  getTodayStudyPlan(userId: string): Observable<any> {
    const today = new Date().toISOString().split('T')[0];
    // Como no existe getStudyPlan, devolvemos datos de ejemplo
    return of({
      date: today,
      plan: this.generateMockStudyPlan(),
    });
  }

  // Obtener consejos de estudio personalizados
  getPersonalizedStudyTips(userId: string): Observable<any> {
    // Como no existe getStudyTips, devolvemos datos de ejemplo
    return of(this.generateMockStudyTips());
  }

  // Obtener tiempos óptimos de estudio
  getOptimalStudyTimesBySubject(userId: string): Observable<any> {
    // Como no existe getOptimalStudyTimes, devolvemos datos de ejemplo
    return of(this.generateMockOptimalTimes());
  }

  // Método para generar recomendaciones de ejemplo
  private generateMockRecommendations(): any[] {
    return [
      {
        title: 'Momento ideal para estudiar',
        text: 'Tu mejor momento para estudiar Programación Web es entre las 9:00 y 11:00.',
        icon: 'time-outline',
        priority: 'high',
      },
      {
        title: 'Tareas prioritarias',
        text: 'El proyecto final de Bases de Datos requiere tu atención inmediata.',
        icon: 'alert-circle-outline',
        priority: 'high',
      },
      {
        title: 'Mejora tu rendimiento',
        text: 'Has completado el 75% de tus tareas esta semana. ¡Sigue así!',
        icon: 'trending-up-outline',
        priority: 'medium',
      },
    ];
  }

  private generateMockStudyPlan(): any[] {
    return [
      { time: '09:00', subject: 'Programación Web', duration: 45 },
      { time: '10:00', subject: 'Descanso', duration: 15 },
      { time: '10:15', subject: 'Cálculo Diferencial', duration: 45 },
      { time: '11:15', subject: 'Descanso', duration: 15 },
      { time: '11:30', subject: 'Física Mecánica', duration: 45 },
    ];
  }

  private generateMockStudyTips(): any[] {
    return [
      {
        title: 'Técnica Pomodoro',
        description:
          'Estudia en bloques de 25 minutos con descansos de 5 minutos.',
      },
      {
        title: 'Hidratación',
        description: 'Beber suficiente agua mejora la concentración.',
      },
      {
        title: 'Ambiente de estudio',
        description: 'Busca un lugar tranquilo y bien iluminado.',
      },
    ];
  }

  private generateMockOptimalTimes(): any[] {
    return [
      {
        subject: 'Programación Web',
        bestTime: '09:00-11:00',
        reason: 'Mayor concentración',
      },
      {
        subject: 'Cálculo Diferencial',
        bestTime: '15:00-17:00',
        reason: 'Mejor rendimiento',
      },
      {
        subject: 'Física Mecánica',
        bestTime: '10:00-12:00',
        reason: 'Mayor retención',
      },
    ];
  }

  // Generar recordatorios inteligentes para una tarea
  generateSmartRemindersForTask(taskId: string): Observable<ReminderPlan> {
    console.log('Generando recordatorios para tarea:', taskId);

    // Usamos el sistema de prioridad del backend (1-5)
    return of({
      taskId: taskId,
      reminders: [
        {
          time: '1 día antes',
          level: 3, // Prioridad media
          description: 'Recordatorio: 1 día antes para completar la tarea.',
        },
        {
          time: '12 horas antes',
          level: 4, // Prioridad media-alta
          description: 'Recordatorio: 12 horas antes para completar la tarea.',
        },
        {
          time: '2 horas antes',
          level: 5, // Prioridad alta
          description: 'Recordatorio: 2 horas antes para completar la tarea.',
        },
      ],
      accepted: false,
      taskPriority: 3,
      insistenceLevel: 4,
    });
  }

  /**
   * Crea recordatorios basados en un plan
   * @param plan Plan de recordatorios
   * @param userId ID del usuario
   * @returns Observable con los resultados de la creación de recordatorios
   */
  createRemindersFromPlan(
    plan: ReminderPlan,
    userId: string
  ): Observable<any[]> {
    if (!plan || !plan.reminders || plan.reminders.length === 0) {
      console.warn('Plan de recordatorios vacío o sin recordatorios');
      return of([]);
    }

    console.log('Creando recordatorios para el plan:', plan);

    // Crear un array de observables para cada recordatorio
    const reminderObservables = plan.reminders.map((reminder) => {
      // Si el recordatorio ya tiene una fecha calculada, usarla
      if (reminder.date) {
        const reminderData = {
          user_id: userId,
          task_id: plan.taskId,
          reminder_date: reminder.date,
          message: reminder.description,
          priority: plan.taskPriority || 3,
          status: 'pendiente',
          insistence_level: plan.insistenceLevel || 1,
        };
        return this.apiService.createReminder(reminderData);
      }

      // Si no tiene fecha pero tiene tiempo relativo, calcularlo
      else if (reminder.time) {
        let reminderDate = new Date();
        const timeStr = reminder.time;

        if (timeStr.includes('semana')) {
          const weeks = parseInt(timeStr.split(' ')[0]);
          reminderDate.setDate(reminderDate.getDate() + weeks * 7);
        } else if (timeStr.includes('día')) {
          const days = parseInt(timeStr.split(' ')[0]);
          reminderDate.setDate(reminderDate.getDate() + days);
        } else if (timeStr.includes('hora')) {
          const hours = parseInt(timeStr.split(' ')[0]);
          reminderDate.setHours(reminderDate.getHours() + hours);
        }

        // Crear el recordatorio
        const reminderData = {
          user_id: userId,
          task_id: plan.taskId,
          reminder_date: reminderDate.toISOString(),
          message: reminder.description,
          priority: plan.taskPriority || 3,
          status: 'pendiente',
          insistence_level: plan.insistenceLevel || 1,
        };

        return this.apiService.createReminder(reminderData);
      }

      // Si no tiene ni fecha ni tiempo, omitir
      console.warn('Recordatorio sin tiempo definido, omitiendo');
      return of(null);
    });

    // Filtrar los nulos y combinar todos los observables
    return forkJoin(
      reminderObservables.filter((obs) => obs !== null) as Observable<any>[]
    );
  }

  /**
   * Actualiza el estado de un plan de recordatorios
   * @param taskId ID de la tarea
   * @param accepted Estado de aceptación
   * @returns Observable con el resultado de la actualización
   */
  updateReminderPlanStatus(taskId: string, accepted: boolean): Observable<any> {
    // Aquí podrías hacer una llamada a la API si tuvieras un endpoint para esto
    console.log(
      `Actualizando estado del plan para tarea ${taskId} a ${
        accepted ? 'aceptado' : 'rechazado'
      }`
    );
    return of({ success: true, taskId, accepted });
  }

  /**
   * Genera un plan de recordatorios para una tarea
   * @param task Tarea
   * @param taskPriority Prioridad de la tarea
   * @param insistenceLevel Nivel de insistencia
   * @returns Plan de recordatorios generado
   */
  generateReminderPlanForTask(
    task: any,
    taskPriority: number = 3,
    insistenceLevel: number = 1
  ): ReminderPlan {
    // Verificar que la tarea tenga una fecha de vencimiento
    if (!task.due_date) {
      console.warn('La tarea no tiene fecha de vencimiento definida');
      return {
        taskId: task._id || '',
        accepted: false,
        taskPriority,
        insistenceLevel,
        reminders: [],
      };
    }

    const dueDate = new Date(task.due_date);

    // Generar plan de recordatorios
    const reminderPlan: ReminderPlan = {
      taskId: task._id || '',
      accepted: false,
      taskPriority,
      insistenceLevel,
      reminders: [],
    };

    // Generar recordatorios basados en la prioridad e insistencia
    if (taskPriority >= 4 || insistenceLevel >= 4) {
      // Alta prioridad o insistencia: más recordatorios
      reminderPlan.reminders = [
        {
          time: '1 semana antes',
          description: `Recuerda que tienes que completar: ${task.description}`,
          level: 3,
          date: this.calculateRelativeDateString(dueDate, -7),
        },
        {
          time: '3 días antes',
          description: `No olvides tu tarea: ${task.description}`,
          level: 4,
          date: this.calculateRelativeDateString(dueDate, -3),
        },
        {
          time: '1 día antes',
          description: `¡Mañana vence tu tarea: ${task.description}!`,
          level: 5,
          date: this.calculateRelativeDateString(dueDate, -1),
        },
      ];
    } else if (taskPriority >= 3 || insistenceLevel >= 2) {
      // Prioridad media: recordatorios moderados
      reminderPlan.reminders = [
        {
          time: '3 días antes',
          description: `Recuerda tu tarea: ${task.description}`,
          level: 3,
          date: this.calculateRelativeDateString(dueDate, -3),
        },
        {
          time: '1 día antes',
          description: `Mañana vence tu tarea: ${task.description}`,
          level: 4,
          date: this.calculateRelativeDateString(dueDate, -1),
        },
      ];
    } else {
      // Baja prioridad: pocos recordatorios
      reminderPlan.reminders = [
        {
          time: '1 día antes',
          description: `Mañana vence tu tarea: ${task.description}`,
          level: 3,
          date: this.calculateRelativeDateString(dueDate, -1),
        },
      ];
    }

    return reminderPlan;
  }

  // Método auxiliar para calcular fechas relativas a una fecha base
  private calculateRelativeDateString(
    baseDate: Date,
    daysOffset: number
  ): string | null {
    if (!baseDate) return null;

    const result = new Date(baseDate);
    result.setDate(result.getDate() + daysOffset);
    return result.toISOString();
  }
}
