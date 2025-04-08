import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
import { NotificationsService } from '../services/notifications.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

interface StudyRecommendation {
  taskId: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: number;
  urgencyLevel: 'baja' | 'media' | 'alta';
  estimatedTime?: number; // Añadido para el template
}

interface ReminderRecommendation {
  taskId: string;
  description: string;
  subject: string;
  recommendedInsistenceLevel: number;
  bestTimeToStudy: {
    start: string;
    end: string;
  };
}

@Component({
  selector: 'app-smart',
  templateUrl: './smart.page.html',
  styleUrls: ['./smart.page.scss'],
})
export class SmartPage implements OnInit {
  tasks: Task[] = [];
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map();
  isLoading = true;
  studyRecommendations: StudyRecommendation[] = [];
  reminderRecommendations: ReminderRecommendation[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      this.toastService.showToast('No se pudo identificar al usuario', 'error');
      this.isLoading = false;
      return;
    }

    try {
      // Cargar materias
      this.apiService.getUserSubjects(userId).subscribe(
        (subjects) => {
          this.subjects = subjects;
          // Crear mapa de ID a nombre para fácil acceso
          this.subjects.forEach((subject) => {
            this.subjectMap.set(subject._id, subject.name);
          });

          // Cargar tareas pendientes
          this.apiService.getPendingTasks(userId).subscribe(
            (tasks) => {
              this.tasks = tasks;
              this.generateRecommendations();

              // Cargar estadísticas de tiempo si están disponibles
              this.apiService.getTasksTimeStats(userId).subscribe(
                (timeStats) => {
                  // Mejorar recomendaciones con estadísticas de tiempo
                  this.enhanceRecommendationsWithTimeStats(timeStats);
                  this.isLoading = false;
                },
                (error) => {
                  console.error(
                    'Error al cargar estadísticas de tiempo:',
                    error
                  );
                  this.isLoading = false;
                }
              );
            },
            (error) => {
              console.error('Error al cargar tareas:', error);
              this.isLoading = false;
            }
          );
        },
        (error) => {
          console.error('Error al cargar materias:', error);
          this.isLoading = false;
        }
      );
    } catch (error) {
      console.error('Error general:', error);
      this.isLoading = false;
    }
  }

  generateRecommendations() {
    // Ordenar tareas por prioridad (mayor a menor)
    const sortedTasks = [...this.tasks].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });

    // Generar recomendaciones de estudio basadas en tareas prioritarias
    this.studyRecommendations = sortedTasks.slice(0, 5).map((task) => {
      const taskType = this.classifyTaskType(task.description);
      const priority = task.priority || 1;

      // Determinar nivel de urgencia basado en prioridad
      let urgencyLevel: 'baja' | 'media' | 'alta' = 'baja';
      if (priority >= 4) {
        urgencyLevel = 'alta';
      } else if (priority >= 2) {
        urgencyLevel = 'media';
      }

      return {
        taskId: task._id || '',
        description: task.description,
        subject: this.getSubjectName(task.subject_id),
        dueDate: task.due_date,
        priority: priority,
        urgencyLevel: urgencyLevel,
        estimatedTime: task.estimated_time || 30,
      };
    });

    // Generar recomendaciones de recordatorios
    this.reminderRecommendations = sortedTasks.slice(0, 3).map((task) => {
      const taskType = this.classifyTaskType(task.description);
      const bestTime = this.suggestBestTimeToStudy(taskType);

      return {
        taskId: task._id || '',
        description: task.description,
        subject: this.getSubjectName(task.subject_id),
        recommendedInsistenceLevel: Math.min((task.priority || 1) + 1, 5),
        bestTimeToStudy: bestTime,
      };
    });
  }

  enhanceRecommendationsWithTimeStats(timeStats: any) {
    // Si hay estadísticas de tiempo disponibles, mejorar las recomendaciones
    if (timeStats && timeStats.productiveHours) {
      // Ejemplo: Ajustar los mejores momentos para estudiar basado en horas productivas
      this.reminderRecommendations.forEach((rec, index) => {
        if (timeStats.productiveHours.morning && index === 0) {
          rec.bestTimeToStudy = { start: '9:00 AM', end: '12:00 PM' };
        } else if (timeStats.productiveHours.afternoon && index === 1) {
          rec.bestTimeToStudy = { start: '2:00 PM', end: '5:00 PM' };
        } else if (timeStats.productiveHours.evening && index === 2) {
          rec.bestTimeToStudy = { start: '7:00 PM', end: '10:00 PM' };
        }
      });
    }
  }

  classifyTaskType(taskDescription: string): string {
    const description = taskDescription.toLowerCase();

    if (
      description.includes('examen') ||
      description.includes('prueba') ||
      description.includes('test')
    ) {
      return 'examen';
    } else if (
      description.includes('proyecto') ||
      description.includes('trabajo')
    ) {
      return 'proyecto';
    } else if (
      description.includes('lectura') ||
      description.includes('leer') ||
      description.includes('libro')
    ) {
      return 'lectura';
    }

    return 'general';
  }

  suggestBestTimeToStudy(taskType: string): { start: string; end: string } {
    // Sugerencias basadas en el tipo de tarea
    switch (taskType) {
      case 'examen':
        // Mañana para exámenes (mayor concentración)
        return { start: '9:00 AM', end: '12:00 PM' };
      case 'proyecto':
        // Tarde para proyectos (creatividad)
        return { start: '3:00 PM', end: '6:00 PM' };
      case 'lectura':
        // Noche para lecturas (tranquilidad)
        return { start: '8:00 PM', end: '10:00 PM' };
      default:
        // Mediodía para tareas generales
        return { start: '12:00 PM', end: '3:00 PM' };
    }
  }

  getDaysUntil(dateString: string): number {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTimeForIndex(index: number): string {
    // Generar horarios escalonados para la planificación diaria
    const baseHour = 9; // Comenzar a las 9 AM
    const hour = baseHour + index * 2; // Cada tarea separada por 2 horas

    return `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  getSubjectName(subjectId: string): string {
    return this.subjectMap.get(subjectId) || 'Sin materia';
  }

  createReminder(taskId: string, insistenceLevel: number) {
    // Navegar a la página de recordatorios con parámetros
    this.router.navigate(['/reminders'], {
      queryParams: {
        taskId: taskId,
        insistenceLevel: insistenceLevel,
      },
    });

    this.toastService.showToast(
      'Navegando a la página de recordatorios para crear uno nuevo',
      'success'
    );
  }
}
