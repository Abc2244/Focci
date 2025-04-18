import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ThemeService } from '../services/theme.service';
import {
  WeeklyActivity,
  SubjectDistribution,
} from '../interfaces/stats.interface';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnInit, OnDestroy {
  selectedPeriod: string = 'week';
  isLoading: boolean = true;
  stats: any = null;
  error: string | null = null;
  weeklyActivity: WeeklyActivity[] = [];
  subjectDistribution: SubjectDistribution[] = [];

  // Referencias a los gráficos
  punctualityChart: any = null;
  subjectChart: any = null;
  weeklyChart: any = null;

  // Suscripciones a los cambios de tema
  private themeSubscription: Subscription;
  private isDarkSubscription: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {
    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.colorTheme$.subscribe(() => {
      this.updateChartsColors();
    });

    this.isDarkSubscription = this.themeService.isDark$.subscribe(() => {
      this.updateChartsColors();
    });
  }

  ngOnInit() {
    this.loadStats();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.isDarkSubscription) {
      this.isDarkSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  // Método para obtener los colores del tema actual
  private getThemeColors() {
    const isDark = this.themeService.isDarkMode();
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--ion-color-primary')
      .trim();
    const primaryRgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--ion-color-primary-rgb')
      .trim();
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-text-color')
      .trim();
    const textColorMedium = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-text-color-medium')
      .trim();

    return {
      primary: primaryColor,
      primaryRgb,
      success: getComputedStyle(document.documentElement)
        .getPropertyValue('--ion-color-success')
        .trim(),
      danger: getComputedStyle(document.documentElement)
        .getPropertyValue('--ion-color-danger')
        .trim(),
      textColor,
      textColorMedium,
      gridColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    };
  }

  // Método para actualizar los colores de los gráficos
  private updateChartsColors() {
    const colors = this.getThemeColors();

    // Actualizar gráfico de puntualidad
    if (this.punctualityChart) {
      this.punctualityChart.data.datasets[0].backgroundColor = [
        colors.success,
        colors.danger,
      ];
      this.punctualityChart.options.plugins.legend.labels.color =
        colors.textColor;
      this.punctualityChart.update();
    }

    // Actualizar gráfico de distribución por materias
    if (this.subjectChart) {
      const baseColors = this.generateThemeColors(
        this.subjectDistribution.length
      );
      this.subjectChart.data.datasets[0].backgroundColor = baseColors;
      this.subjectChart.options.plugins.legend.labels.color = colors.textColor;
      this.subjectChart.update();
    }

    // Actualizar gráfico de actividad semanal
    if (this.weeklyChart) {
      this.weeklyChart.data.datasets[0].backgroundColor = `rgba(${colors.primaryRgb}, 0.7)`;
      this.weeklyChart.options.scales.x.grid.color = colors.gridColor;
      this.weeklyChart.options.scales.y.grid.color = colors.gridColor;
      this.weeklyChart.options.scales.x.ticks.color = colors.textColorMedium;
      this.weeklyChart.options.scales.y.ticks.color = colors.textColorMedium;
      this.weeklyChart.update();
    }
  }

  // Método para generar colores basados en el tema
  private generateThemeColors(count: number): string[] {
    const colors = this.getThemeColors();
    const baseHue = this.getHueFromColor(colors.primary);
    const baseRgb = this.hexToRgb(colors.primary);

    if (!baseRgb) return Array(count).fill(colors.primary);

    // Crear variaciones basadas en el color primario
    return Array.from({ length: count }, (_, i) => {
      // Calcular el desplazamiento del tono basado en el índice
      const hueShift = ((i * 25) % 60) - 30; // Variación de ±30 grados
      const newHue = (baseHue + hueShift + 360) % 360;

      // Ajustar saturación y luminosidad basado en el color primario
      const { h, s, l } = this.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

      // Mantener la saturación cerca del color primario pero con variaciones
      const saturation = Math.min(
        100,
        Math.max(60, s * 100 + ((i % 3) - 1) * 10)
      );

      // Variar la luminosidad para crear contraste manteniendo la coherencia
      const luminosity = Math.min(
        90,
        Math.max(40, l * 100 + (i % 2 ? 10 : -10))
      );

      return `hsl(${newHue}, ${saturation}%, ${luminosity}%)`;
    });
  }

  // Método auxiliar para convertir RGB a HSL
  private rgbToHsl(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s: s,
      l: l,
    };
  }

  // Método auxiliar para convertir color hex a RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Remover el # si existe
    hex = hex.replace('#', '');

    // Manejar formatos abreviados (ejemplo: #FFF)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private getHueFromColor(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const { h } = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return h;
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

          this.stats = {
            tasksCreated: 0,
            tasksCompleted: 0,
            completionRate: 0,
            onTimeRate: 0,
            lateRate: 0,
            weeklyActivity: [],
            subjectDistribution: [],
          };

          if (response.data && response.data.task_completion) {
            this.stats.tasksCreated = response.data.task_completion.total || 0;
            this.stats.tasksCompleted =
              response.data.task_completion.completed || 0;
            this.stats.completionRate =
              response.data.task_completion.percentage || 0;
          }

          if (response.data && response.data.punctuality) {
            this.stats.onTimeRate = response.data.punctuality.on_time_rate || 0;
            this.stats.lateRate = response.data.punctuality.late_rate || 0;

            setTimeout(() => {
              this.createPunctualityChart();
            }, 100);
          }

          if (response.data && response.data.weekly_activity) {
            this.weeklyActivity = response.data.weekly_activity;

            setTimeout(() => {
              this.createWeeklyActivityChart();
            }, 100);
          }

          if (response.data && response.data.subject_distribution) {
            this.subjectDistribution = response.data.subject_distribution;

            setTimeout(() => {
              this.createSubjectDistributionChart();
            }, 100);
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

  createPunctualityChart() {
    const canvas = document.getElementById(
      'punctualityChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.punctualityChart) {
      this.punctualityChart.destroy();
    }

    const colors = this.getThemeColors();

    this.punctualityChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['A tiempo', 'Con retraso'],
        datasets: [
          {
            data: [this.stats.onTimeRate, this.stats.lateRate],
            backgroundColor: [colors.success, colors.danger],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  }

  createSubjectDistributionChart() {
    const canvas = document.getElementById('subjectChart') as HTMLCanvasElement;
    if (!canvas || !this.subjectDistribution.length) return;

    if (this.subjectChart) {
      this.subjectChart.destroy();
    }

    const colors = this.getThemeColors();
    // Generar colores una vez y usarlos tanto para el gráfico como para la lista
    const chartColors = this.generateThemeColors(
      this.subjectDistribution.length
    );

    // Guardar los colores generados para usarlos en la lista
    this.subjectDistribution.forEach((subject, index) => {
      subject.color = chartColors[index];
    });

    this.subjectChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: this.subjectDistribution.map((subject) => subject.name),
        datasets: [
          {
            data: this.subjectDistribution.map((subject) => subject.percentage),
            backgroundColor: chartColors,
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: colors.primary,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            callbacks: {
              label: function (context: any) {
                return `${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });
  }

  createWeeklyActivityChart() {
    const canvas = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (!canvas || !this.weeklyActivity.length) return;

    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }

    const colors = this.getThemeColors();

    this.weeklyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.weeklyActivity.map((day) => day.day),
        datasets: [
          {
            label: 'Actividad',
            data: this.weeklyActivity.map((day) => day.percentage),
            backgroundColor: `rgba(${colors.primaryRgb}, 0.7)`,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: colors.gridColor,
            },
            ticks: {
              color: colors.textColorMedium,
            },
          },
          x: {
            grid: {
              color: colors.gridColor,
            },
            ticks: {
              color: colors.textColorMedium,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: colors.primary,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
          },
        },
      },
    });
  }

  // Método para obtener el color de una materia según su índice
  getSubjectColor(index: number): string {
    return (
      this.subjectDistribution[index]?.color || this.generateThemeColors(1)[0]
    );
  }
}
