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
  selectedPeriod: string = 'week';
  isLoading: boolean = true;
  stats: TaskStats | null = null;
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
        (stats) => {
          console.log('Estadísticas recibidas:', stats);
          this.stats = stats;
          this.weeklyActivity = stats.weeklyActivity || [];
          this.subjectDistribution = stats.subjectDistribution || [];
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
