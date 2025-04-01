import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SmartAssistantService {
  constructor(private apiService: ApiService) {}

  // Obtener datos completos para la página del asistente inteligente
  getSmartAssistantData(userId: string, date?: string): Observable<any> {
    // Combinamos varias llamadas para construir un dashboard completo
    return this.apiService.getSmartRecommendations(userId).pipe(
      map((recommendations) => {
        // Procesamos las recomendaciones para hacerlas más amigables
        return {
          recommendations: this.formatRecommendations(recommendations),
          // Aquí podemos añadir más datos según necesitemos
        };
      })
    );
  }

  // Obtener plan de estudio para hoy
  getTodayStudyPlan(userId: string): Observable<any> {
    const today = new Date().toISOString().split('T')[0];
    return this.apiService.getStudyPlan(userId, today);
  }

  // Obtener consejos de estudio personalizados
  getPersonalizedStudyTips(userId: string): Observable<any> {
    return this.apiService.getStudyTips(userId);
  }

  // Obtener tiempos óptimos de estudio
  getOptimalStudyTimesBySubject(userId: string): Observable<any> {
    return this.apiService.getOptimalStudyTimes(userId);
  }

  // Método para transformar las recomendaciones en un formato más amigable
  private formatRecommendations(rawRecommendations: any): any[] {
    // Aquí procesamos los datos crudos del API para presentarlos mejor
    if (!rawRecommendations || !rawRecommendations.items) {
      return [];
    }

    return rawRecommendations.items.map((item: any) => {
      return {
        title: this.getRecommendationTitle(item.type),
        text: item.message,
        icon: this.getRecommendationIcon(item.type),
        priority: item.priority || 'medium',
      };
    });
  }

  private getRecommendationTitle(type: string): string {
    const titles: { [key: string]: string } = {
      study_time: 'Momento ideal para estudiar',
      priority_task: 'Tareas prioritarias',
      performance: 'Mejora tu rendimiento',
      deadline: 'Próximos vencimientos',
      rest: 'Recuerda descansar',
    };

    return titles[type] || 'Recomendación';
  }

  private getRecommendationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      study_time: 'time-outline',
      priority_task: 'alert-circle-outline',
      performance: 'trending-up-outline',
      deadline: 'calendar-outline',
      rest: 'cafe-outline',
    };

    return icons[type] || 'information-circle-outline';
  }

  // Generar recordatorios inteligentes para una tarea
  generateSmartRemindersForTask(taskId: string): Observable<any> {
    return this.apiService.generateSmartReminders(taskId);
  }
}
