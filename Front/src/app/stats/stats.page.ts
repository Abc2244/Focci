import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import {
  WeeklyActivity,
  SubjectDistribution,
} from '../interfaces/stats.interface';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

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

  // Referencias a los gráficos
  punctualityChart: any = null;
  subjectChart: any = null;
  weeklyChart: any = null;

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

            // Crear gráfico de puntualidad
            setTimeout(() => {
              this.createPunctualityChart();
            }, 100);
          }

          // Actividad semanal
          if (response.data && response.data.weekly_activity) {
            this.weeklyActivity = response.data.weekly_activity;

            // Crear gráfico de actividad semanal
            setTimeout(() => {
              this.createWeeklyActivityChart();
            }, 100);
          }

          // Distribución por materias
          if (response.data && response.data.subject_distribution) {
            this.subjectDistribution = response.data.subject_distribution;

            // Crear gráfico de distribución por materias
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

  // Métodos para crear gráficos
  createPunctualityChart() {
    const canvas = document.getElementById(
      'punctualityChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir gráfico anterior si existe
    if (this.punctualityChart) {
      this.punctualityChart.destroy();
    }

    this.punctualityChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['A tiempo', 'Con retraso'],
        datasets: [
          {
            data: [this.stats.onTimeRate, this.stats.lateRate],
            backgroundColor: [
              'rgba(56, 128, 255, 0.8)',
              'rgba(235, 68, 90, 0.7)',
            ],
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
          },
        },
      },
    });
  }

  createSubjectDistributionChart() {
    const canvas = document.getElementById('subjectChart') as HTMLCanvasElement;
    if (!canvas || !this.subjectDistribution.length) return;

    // Destruir gráfico anterior si existe
    if (this.subjectChart) {
      this.subjectChart.destroy();
    }

    // Colores predefinidos para asegurar variedad (15 materias diferentes)
    const predefinedColors = [
      '#3880ff', // azul
      '#2dd36f', // verde
      '#eb445a', // rojo
      '#ffc409', // amarillo
      '#5260ff', // morado
      '#3dc2ff', // celeste
      '#f4a942', // naranja
      '#92949c', // gris
      '#11c1f3', // cyan
      '#b15dff', // violeta
      '#ff4961', // rosa
      '#7044ff', // índigo
      '#00e676', // verde claro
      '#ff9800', // naranja claro
      '#607d8b', // azul grisáceo
    ];

    // Asignar colores a cada materia
    const colors = this.subjectDistribution.map((subject, index) => {
      // Usar el color predefinido según el índice (para evitar colores repetidos)
      return this.adjustColorOpacity(
        predefinedColors[index % predefinedColors.length],
        0.8
      );
    });

    this.subjectChart = new Chart(canvas, {
      type: 'pie', // Usar gráfico de pastel
      data: {
        labels: this.subjectDistribution.map((subject) => subject.name),
        datasets: [
          {
            data: this.subjectDistribution.map((subject) => subject.percentage),
            backgroundColor: colors,
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
            display: false, // Ocultar la leyenda debajo del gráfico
          },
          tooltip: {
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

    // Destruir gráfico anterior si existe
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }

    this.weeklyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.weeklyActivity.map((day) => day.day),
        datasets: [
          {
            label: 'Actividad',
            data: this.weeklyActivity.map((day) => day.percentage),
            backgroundColor: 'rgba(56, 128, 255, 0.7)',
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
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  // Convertir colores de Ionic a valores hexadecimales
  getColorFromIonicColor(color: string): string {
    const colorMap: { [key: string]: string } = {
      primary: '#3880ff',
      secondary: '#3dc2ff',
      tertiary: '#5260ff',
      success: '#2dd36f',
      warning: '#ffc409',
      danger: '#eb445a',
      dark: '#222428',
      medium: '#92949c',
      light: '#f4f5f8',
    };

    // Si el color no está en el mapa o es undefined/null, usar un color por defecto
    if (
      !color ||
      (!(color in colorMap) &&
        !color.startsWith('#') &&
        !color.startsWith('rgb'))
    ) {
      return '#3880ff'; // Color primario por defecto
    }

    return colorMap[color] || color;
  }

  // Método para ajustar la opacidad de un color
  adjustColorOpacity(color: string, opacity: number): string {
    // Si es un color hexadecimal, convertirlo a rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // Si ya es rgba, ajustar la opacidad
    else if (color.startsWith('rgb')) {
      return color.replace(/rgba?\(([^)]+)\)/, (_, values) => {
        const parts = values.split(',');
        if (parts.length >= 3) {
          return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, ${opacity})`;
        }
        return color;
      });
    }
    return color;
  }

  // Método para obtener el color de una materia según su índice
  getSubjectColor(index: number): string {
    const predefinedColors = [
      '#3880ff', // azul
      '#2dd36f', // verde
      '#eb445a', // rojo
      '#ffc409', // amarillo
      '#5260ff', // morado
      '#3dc2ff', // celeste
      '#f4a942', // naranja
      '#92949c', // gris
      '#11c1f3', // cyan
      '#b15dff', // violeta
      '#ff4961', // rosa
      '#7044ff', // índigo
      '#00e676', // verde claro
      '#ff9800', // naranja claro
      '#607d8b', // azul grisáceo
    ];

    return predefinedColors[index % predefinedColors.length];
  }
}
