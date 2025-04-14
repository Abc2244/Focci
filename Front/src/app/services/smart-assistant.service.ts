import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../api.service';
import { map } from 'rxjs/operators';

// Definir la interfaz ReminderPlan
export interface ReminderSuggestion {
  time: string;
  level: number;
  description: string;
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
  constructor(private apiService: ApiService) {}

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
}
