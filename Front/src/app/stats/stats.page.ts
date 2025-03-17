import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import {
  TaskStats,
  WeeklyActivity,
  SubjectDistribution,
} from '../interfaces/stats.interface';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnInit {
  selectedPeriod: 'week' | 'month' | 'semester' = 'week';
  stats = {
    tasksCreated: 0,
    tasksCompleted: 0,
    completionRate: 0,
    onTimeRate: 0,
    averageCompletionDays: 0,
    lateTasksRate: 0,
  };
  weeklyActivity: WeeklyActivity[] = [];
  subjectDistribution: SubjectDistribution[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  ionViewWillEnter() {
    this.loadStats(); // Recargar cuando la página se vuelve a mostrar
  }

  segmentChanged(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadStats();
  }

  private async loadStats() {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      this.toastService.showToast(
        'No se pudo obtener el ID del usuario',
        'error'
      );
      this.isLoading = false;
      return;
    }

    try {
      const [tasksStats, completionStats, timeStats] = await Promise.all([
        this.apiService.getTasksStats(userId, this.selectedPeriod).toPromise(),
        this.apiService.getTasksCompletionStats(userId).toPromise(),
        this.apiService.getTasksTimeStats(userId).toPromise(),
      ]);

      this.stats = {
        tasksCreated: tasksStats.created || 0,
        tasksCompleted: tasksStats.completed || 0,
        completionRate: tasksStats.completionRate || 0,
        onTimeRate: completionStats.onTimeRate || 0,
        averageCompletionDays: timeStats.averageDays || 0,
        lateTasksRate: completionStats.lateRate || 0,
      };

      // Procesar datos de actividad semanal
      this.weeklyActivity = tasksStats.weeklyActivity || [];

      // Procesar distribución por materias
      this.subjectDistribution = tasksStats.subjectDistribution || [];

      console.log('Stats loaded:', this.stats); // Para debugging
    } catch (error) {
      console.error('Error loading stats:', error);
      this.toastService.showToast('Error al cargar las estadísticas', 'error');
    } finally {
      this.isLoading = false;
    }
  }
}
