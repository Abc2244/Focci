import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import {
  WeeklyActivity,
  SubjectDistribution,
} from '../interfaces/stats.interface';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnInit {
  selectedPeriod: string = 'week';
  isLoading: boolean = true;
  stats: any = null;
  error: string | null = null;
  weeklyActivity: WeeklyActivity[] = [];
  subjectDistribution: SubjectDistribution[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  async segmentChanged(event: any) {
    this.selectedPeriod = event.detail.value;
    await this.loadStats();
  }

  async loadStats() {
    try {
      this.isLoading = true;
      this.error = null;

      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      this.apiService.getStats(userId, this.selectedPeriod).subscribe(
        (response: any) => {
          console.log('Estadísticas recibidas:', response);

          // Adaptar la respuesta a la estructura esperada por el componente
          this.stats = {
            tasksCreated: 0,
            tasksCompleted: 0,
            completionRate: 0,
            onTimeRate: 0,
            lateRate: 0,
            weeklyActivity: [],
            subjectDistribution: [],
          };

          // Si hay datos reales en la respuesta, intentar usarlos
          if (response.data && response.data.task_completion) {
            this.stats.tasksCreated = response.data.task_completion.total || 0;
            this.stats.tasksCompleted =
              response.data.task_completion.completed || 0;
            this.stats.completionRate =
              response.data.task_completion.percentage || 0;
          }

          // Datos de puntualidad
          if (response.data && response.data.punctuality) {
            // Usar directamente los valores del backend
            this.stats.onTimeRate = response.data.punctuality.on_time_rate || 0;
            this.stats.lateRate = response.data.punctuality.late_rate || 0;

            console.log(
              'Datos de puntualidad recibidos:',
              'A tiempo:',
              this.stats.onTimeRate,
              'Con retraso:',
              this.stats.lateRate
            );
          }

          // Actividad semanal
          if (response.data && response.data.weekly_activity) {
            this.weeklyActivity = response.data.weekly_activity;
          }

          // Distribución por materias
          if (response.data && response.data.subject_distribution) {
            this.subjectDistribution = response.data.subject_distribution;
          }

          this.isLoading = false;
        },
        (error) => {
          console.error('Error al cargar estadísticas:', error);
          this.error =
            'No se pudieron cargar las estadísticas. Por favor intenta más tarde.';
          this.stats = null;
          this.weeklyActivity = [];
          this.subjectDistribution = [];
          this.isLoading = false;
          this.toastService.showToast('Error al cargar estadísticas', 'error');
        }
      );
    } catch (error: any) {
      console.error('Error en loadStats:', error);
      this.error = error.message || 'Error desconocido';
      this.stats = null;
      this.weeklyActivity = [];
      this.subjectDistribution = [];
      this.isLoading = false;
      this.toastService.showToast('Error al cargar estadísticas', 'error');
    }
  }
}
