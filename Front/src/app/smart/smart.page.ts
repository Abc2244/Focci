import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
import { NotificationsService } from '../services/notifications.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { ScheduleService } from '../services/schedule.service';

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

interface TimeSlot {
  start: Date;
  end: Date;
  isFree: boolean;
}

interface StudyTimeRecommendation {
  timeSlot: TimeSlot;
  subject: string;
  reason: string;
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
  availableTimeSlots: TimeSlot[] = [];
  studyTimeRecommendations: StudyTimeRecommendation[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private router: Router,
    private toastService: ToastService,
    private scheduleService: ScheduleService
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
      // Obtener datos en paralelo para mejorar rendimiento
      const [subjects, tasks, timeStats, schedule] = await Promise.all([
        this.apiService.getUserSubjects(userId).toPromise(),
        this.apiService.getPendingTasks(userId).toPromise(),
        this.apiService.getTasksTimeStats(userId).toPromise(),
        this.scheduleService.getUserSchedule(userId).toPromise(),
      ]);

      // Inicializar arrays vacíos si los datos son undefined
      this.subjects = subjects || [];
      this.tasks = tasks || [];

      // Crear mapa de materias para acceso rápido
      this.createSubjectMap();

      // Encontrar espacios libres en el horario
      this.availableTimeSlots = this.findFreeTimeSlots(schedule || []);

      // Generar recomendaciones
      this.generateStudyRecommendations();
      this.generateReminderRecommendations();

      // Mejorar recomendaciones con estadísticas si están disponibles
      if (timeStats) this.enhanceRecommendationsWithTimeStats(timeStats);

      this.isLoading = false;
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toastService.showToast('Error cargando datos', 'error');
      this.isLoading = false;
    }
  }

  findFreeTimeSlots(scheduleItems: any[]): TimeSlot[] {
    const freeSlots: TimeSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Crear array de slots de 30 minutos para todo el día
    for (let hour = 8; hour < 22; hour++) {
      // 8 AM a 10 PM
      for (let minute of [0, 30]) {
        const start = new Date(today);
        start.setHours(hour, minute);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        const slot: TimeSlot = {
          start,
          end,
          isFree: true,
        };

        // Verificar si el slot coincide con alguna clase o actividad programada
        const isOccupied = scheduleItems.some((activity) => {
          // Convertir strings de tiempo a objetos Date para comparación
          const activityStart = this.getDateFromTimeString(
            activity.startTime,
            today
          );
          const activityEnd = this.getDateFromTimeString(
            activity.endTime,
            today
          );

          // Verificar si hay solapamiento
          return (
            (slot.start >= activityStart && slot.start < activityEnd) ||
            (slot.end > activityStart && slot.end <= activityEnd) ||
            (slot.start <= activityStart && slot.end >= activityEnd)
          );
        });

        if (!isOccupied) {
          freeSlots.push(slot);
        }
      }
    }

    return freeSlots;
  }

  // Método auxiliar para convertir strings de tiempo (HH:MM) a objetos Date
  private getDateFromTimeString(timeString: string, baseDate: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Método para clasificar el tipo de tarea basado en su descripción
  classifyTaskType(description: string): string {
    description = description.toLowerCase();

    if (
      description.includes('examen') ||
      description.includes('prueba') ||
      description.includes('test')
    ) {
      return 'examen';
    } else if (
      description.includes('proyecto') ||
      description.includes('trabajo') ||
      description.includes('informe')
    ) {
      return 'proyecto';
    } else if (
      description.includes('leer') ||
      description.includes('lectura') ||
      description.includes('libro')
    ) {
      return 'lectura';
    } else {
      return 'otro';
    }
  }

  // Método para generar recomendaciones de estudio
  generateStudyRecommendations() {
    // Ordenar tareas por prioridad
    const priorityTasks = [...this.tasks].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    // Asignar tareas a espacios libres considerando el tipo de tarea
    this.studyTimeRecommendations = [];

    priorityTasks.forEach((task) => {
      const taskType = this.classifyTaskType(task.description);
      const preferredTimeSlots = this.getPreferredTimeSlots(taskType);

      if (preferredTimeSlots.length > 0) {
        // Encontrar el mejor slot para esta tarea
        const bestSlot = preferredTimeSlots[0]; // Simplificado, podríamos usar algoritmos más complejos

        this.studyTimeRecommendations.push({
          timeSlot: bestSlot,
          subject: this.subjectMap.get(task.subject_id) || 'Sin materia',
          reason: this.getRecommendationReason(taskType, bestSlot),
        });

        // Eliminar este slot de los disponibles para evitar duplicados
        this.availableTimeSlots = this.availableTimeSlots.filter(
          (slot) => slot !== bestSlot
        );
      }
    });
  }

  // Método para obtener slots de tiempo preferidos según el tipo de tarea
  getPreferredTimeSlots(taskType: string): TimeSlot[] {
    // Filtrar espacios libres según el tipo de tarea
    return this.availableTimeSlots.filter((slot) => {
      const hour = slot.start.getHours();
      switch (taskType) {
        case 'examen':
          return hour >= 8 && hour <= 12; // Mañana para concentración
        case 'proyecto':
          return hour >= 14 && hour <= 18; // Tarde para creatividad
        case 'lectura':
          return hour >= 19; // Noche para lectura tranquila
        default:
          return true; // Cualquier momento para otras tareas
      }
    });
  }

  // Método para generar la razón de la recomendación
  getRecommendationReason(taskType: string, timeSlot: TimeSlot): string {
    const hour = timeSlot.start.getHours();
    if (hour < 12) {
      return 'Mayor concentración durante la mañana';
    } else if (hour < 18) {
      return 'Mejor momento para trabajo creativo';
    } else {
      return 'Ambiente tranquilo para lectura y revisión';
    }
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

  createSubjectMap() {
    this.subjects.forEach((subject) => {
      this.subjectMap.set(subject._id, subject.name);
    });
  }

  generateReminderRecommendations() {
    // Implementación del método para generar recomendaciones de recordatorio
  }
}
