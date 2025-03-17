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

      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('No user ID found');
      }

      const stats = await this.apiService
        .getStats(userId, this.selectedPeriod)
        .toPromise();

      if (stats) {
        this.stats = stats;
        this.weeklyActivity = stats.weeklyActivity;
        this.subjectDistribution = stats.subjectDistribution;
      } else {
        this.stats = null;
        this.weeklyActivity = [];
        this.subjectDistribution = [];
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      this.error =
        'No se pudieron cargar las estadísticas. Por favor intenta más tarde.';
      this.stats = null;
      this.weeklyActivity = [];
      this.subjectDistribution = [];
    } finally {
      this.isLoading = false;
    }
  }
}
