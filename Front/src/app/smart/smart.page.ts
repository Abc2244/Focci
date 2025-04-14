import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ScheduleService } from '../services/schedule.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { SmartAssistantService } from '../services/smart-assistant.service';
import { firstValueFrom } from 'rxjs';

// Definir interfaces para las recomendaciones
interface StudyRecommendation {
  taskId: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: number;
  urgencyLevel: 'baja' | 'media' | 'alta';
  estimatedTime: number;
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
  reason: string;
}

// Interfaz para los horarios ideales
interface IdealTimeSlot {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  reason: string;
}

// Interfaz para la planificación sugerida
interface ScheduleSlot {
  description: string;
  details: string;
}

@Component({
  selector: 'app-smart',
  templateUrl: './smart.page.html',
  styleUrls: ['./smart.page.scss'],
})
export class SmartPage implements OnInit {
  isLoading = true;
  userId: string | null = null;
  studyRecommendations: StudyRecommendation[] = [];
  reminderRecommendations: ReminderRecommendation[] = [];
  idealTimeSlots: IdealTimeSlot[] = [];
  suggestedSchedule: ScheduleSlot[] = [];
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map(); // Mapa de ID a nombre de materia

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private router: Router,
    private toastService: ToastService,
    private smartAssistant: SmartAssistantService
  ) {}

  async ngOnInit() {
    this.userId = this.authService.getCurrentUserId();
    if (this.userId) {
      await this.loadData();
    }
  }

  async ionViewWillEnter() {
    this.userId = this.authService.getCurrentUserId();
    if (this.userId) {
      await this.loadData();
    }
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Cargar materias para tener los nombres
      await this.loadSubjects();

      // Generar recomendaciones
      await this.generateRecommendations();

      // Generar horarios ideales
      this.generateIdealTimeSlots();

      // Generar planificación sugerida
      this.generateSuggestedSchedule();
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.showToast('Error al cargar los datos', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loadSubjects() {
    if (!this.userId) return;

    try {
      // Obtener materias del usuario
      const subjects = await firstValueFrom(
        this.apiService.getUserSubjects(this.userId)
      );

      this.subjects = subjects || [];

      // Crear mapa de ID a nombre de materia
      this.subjectMap.clear();
      this.subjects.forEach((subject) => {
        if (subject._id) {
          this.subjectMap.set(subject._id, subject.name);
        }
      });
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.subjects = [];
    }
  }

  // Obtener el nombre de una materia por su ID
  getSubjectName(subjectId: string): string {
    // Primero buscar en el mapa de materias
    const name = this.subjectMap.get(subjectId);
    if (name) return name;

    // Si no se encuentra, buscar en la lista de materias
    const subject = this.subjects.find((s) => s._id === subjectId);
    if (subject) return subject.name;

    // Si no se encuentra, mostrar un nombre genérico con el ID acortado
    const shortId =
      subjectId.length > 4
        ? subjectId.substring(subjectId.length - 4)
        : subjectId;
    return `Materia ${shortId}`;
  }

  async generateRecommendations() {
    if (!this.userId) return;

    try {
      // Obtener tareas pendientes
      const tasks = await firstValueFrom(
        this.apiService.getPendingTasks(this.userId)
      );

      // Generar recomendaciones de estudio
      this.studyRecommendations = tasks
        .filter((task) => task.subject_id && !task.completed)
        .map((task) => ({
          taskId: task._id || '',
          description: task.description,
          subject: this.getSubjectName(task.subject_id || ''),
          dueDate: task.due_date || new Date().toISOString(),
          priority: task.priority || 1,
          urgencyLevel: this.getUrgencyLevel(task.due_date || ''),
          estimatedTime: task.estimated_time || 30,
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3); // Limitar a 3 recomendaciones

      // Generar recomendaciones de recordatorios
      this.reminderRecommendations = tasks
        .filter(
          (task) =>
            !task.completed && this.getDaysUntilDue(task.due_date || '') <= 7
        )
        .map((task) => ({
          taskId: task._id || '',
          description: task.description,
          subject: this.getSubjectName(task.subject_id || ''),
          recommendedInsistenceLevel: this.calculateInsistenceLevel(task),
          bestTimeToStudy: {
            start: '08:00',
            end: '10:00',
          },
          reason: 'Mayor concentración durante la mañana',
        }))
        .slice(0, 3); // Limitar a 3 recomendaciones
    } catch (error) {
      console.error('Error generating recommendations:', error);
      this.studyRecommendations = [];
      this.reminderRecommendations = [];
    }
  }

  generateIdealTimeSlots() {
    // Limpiar slots anteriores
    this.idealTimeSlots = [];

    // Generar slots ideales basados en las materias
    this.subjects.forEach((subject, index) => {
      if (subject._id) {
        const timeSlot = {
          subjectId: subject._id,
          subjectName: subject.name,
          startTime: `${8 + (index % 3) * 2}:00`,
          endTime: `${10 + (index % 3) * 2}:00`,
          reason:
            index % 2 === 0
              ? 'Mayor concentración durante la mañana'
              : 'Menos distracciones en este horario',
        };
        this.idealTimeSlots.push(timeSlot);
      }
    });
  }

  generateSuggestedSchedule() {
    // Limpiar horario anterior
    this.suggestedSchedule = [];

    // Usar las recomendaciones de estudio para generar un horario
    this.studyRecommendations.forEach((rec, index) => {
      this.suggestedSchedule.push({
        description: rec.description,
        details: `Tiempo recomendado: ${rec.estimatedTime} minutos`,
      });
    });
  }

  // Determinar el nivel de urgencia basado en la fecha de vencimiento
  getUrgencyLevel(dueDate: string): 'baja' | 'media' | 'alta' {
    const daysUntilDue = this.getDaysUntilDue(dueDate);

    if (daysUntilDue <= 2) return 'alta';
    if (daysUntilDue <= 5) return 'media';
    return 'baja';
  }

  // Calcular el nivel de insistencia recomendado para recordatorios
  calculateInsistenceLevel(task: Task): number {
    const daysUntilDue = this.getDaysUntilDue(task.due_date || '');
    const priority = task.priority || 1;

    // Fórmula simple: más prioridad y menos días = mayor insistencia
    let level = Math.min(5, Math.max(1, 6 - daysUntilDue + priority));

    return Math.round(level);
  }

  // Calcular días hasta la fecha de vencimiento
  getDaysUntilDue(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Asegurar que no sea negativo
  }

  // Método para crear un recordatorio
  createReminder(taskId: string, insistenceLevel: number) {
    // Aquí iría la lógica para crear un recordatorio
    console.log(
      `Creando recordatorio para tarea ${taskId} con nivel ${insistenceLevel}`
    );
    this.toastService.showToast('Recordatorio creado con éxito');
  }

  // Método para obtener la hora para un índice en la planificación
  getTimeForIndex(index: number): string {
    const baseHour = 9; // Hora de inicio (9:00 AM)
    const hour = baseHour + index;
    return `${hour}:00`;
  }

  // Método para refrescar los datos
  doRefresh(event: any) {
    this.loadData().then(() => {
      event.target.complete();
    });
  }
}
