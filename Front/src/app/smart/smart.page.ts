import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ScheduleService, ScheduleItem } from '../services/schedule.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import {
  SmartAssistantService,
  ReminderPlan,
  ReminderSuggestion,
} from '../services/smart-assistant.service';
import { NotificationsService } from '../services/notifications.service';
import { firstValueFrom } from 'rxjs';

// Actualizar la interfaz ReminderSuggestion para incluir la propiedad date y timeFormat
interface ExtendedReminderSuggestion extends Omit<ReminderSuggestion, 'time'> {
  date?: string | null; // Permitir que date sea string, undefined o null
  time?: string; // Hacer que time sea opcional
}

// Actualizar la interfaz ReminderPlan para usar ExtendedReminderSuggestion
interface ExtendedReminderPlan extends Omit<ReminderPlan, 'reminders'> {
  reminders: ExtendedReminderSuggestion[];
  taskPriority?: number;
  insistenceLevel?: number;
}

// Definir interfaces necesarias
interface TimeSlot {
  start: Date;
  end: Date;
  isFree: boolean;
}

interface TaskWithSlots {
  task: Task;
  availableSlots: TimeSlot[];
  selectedSlot?: TimeSlot;
  reminderPlan?: ExtendedReminderPlan;
}

@Component({
  selector: 'app-smart',
  templateUrl: './smart.page.html',
  styleUrls: ['./smart.page.scss'],
})
export class SmartPage implements OnInit {
  isLoading = true;
  userId: string | null = null;
  tasks: Task[] = [];
  taskPlans: TaskWithSlots[] = [];
  selectedTask: Task | null = null;
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map();
  showReminderPlanModal = false;
  currentReminderPlan: ExtendedReminderPlan | null = null;
  reminderPlans: ExtendedReminderPlan[] = [];

  // Variable para controlar qué modal mostrar
  showTaskDetailsModal = false;

  // Propiedades necesarias para el template
  idealTimeSlots: any[] = [];
  suggestedSchedule: any[] = [];
  reminderRecommendations: any[] = [];
  studyRecommendations: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private router: Router,
    private toastService: ToastService,
    private smartAssistant: SmartAssistantService,
    private notificationsService: NotificationsService
  ) {}

  async ngOnInit() {
    this.userId = this.authService.getCurrentUserId();
    if (this.userId) {
      await this.loadData();
    }
  }

  async loadData() {
    this.isLoading = true;
    try {
      await this.loadSubjects();
      await this.loadTasks();
      await this.generateReminderPlans();
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

  // Método para obtener el nombre de una materia por su ID
  getSubjectName(subjectId: string): string {
    return this.subjectMap.get(subjectId) || 'Materia desconocida';
  }

  // Método para obtener el icono según el tipo de tarea
  getTaskIcon(taskType: string | undefined): string {
    switch (taskType) {
      case 'examen':
        return 'document-text-outline';
      case 'proyecto':
        return 'construct-outline';
      case 'lectura':
        return 'book-outline';
      default:
        return 'checkbox-outline';
    }
  }

  async loadTasks() {
    if (!this.userId) return;

    try {
      const tasks = await firstValueFrom(
        this.apiService.getPendingTasks(this.userId)
      );
      this.tasks = tasks.filter((task) => !task.completed);

      // Inicializar los planes de tareas
      this.taskPlans = this.tasks.map((task) => ({
        task,
        availableSlots: [],
      }));

      // Encontrar los mejores horarios para estudiar
      await this.findBestStudyTimes();
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = [];
      this.taskPlans = [];
    }
  }

  async findBestStudyTimes() {
    if (!this.userId) return;

    try {
      // Obtener el horario del usuario
      const schedule = await firstValueFrom(
        this.scheduleService.getUserSchedule(this.userId)
      );

      // Para cada tarea, encontrar los mejores horarios
      for (const plan of this.taskPlans) {
        // Calcular días hasta la fecha límite
        const daysUntilDue = this.getDaysUntilDue(plan.task.due_date);

        // Determinar cuántos slots de estudio recomendar basado en la urgencia
        let slotsToRecommend = 1;
        if (daysUntilDue <= 3) {
          slotsToRecommend = 3; // Muy urgente
        } else if (daysUntilDue <= 7) {
          slotsToRecommend = 2; // Urgente
        }

        // Encontrar slots libres en el horario
        const freeSlots: TimeSlot[] = [];
        const now = new Date();
        const dueDate = new Date(plan.task.due_date);

        // Buscar en los próximos días hasta la fecha límite
        for (let day = 0; day < Math.min(daysUntilDue, 7); day++) {
          const date = new Date(now);
          date.setDate(date.getDate() + day);

          // Horarios típicos de estudio (mañana, tarde, noche)
          const studyTimes = [
            { start: 9, end: 12 }, // Mañana
            { start: 14, end: 17 }, // Tarde
            { start: 19, end: 22 }, // Noche
          ];

          for (const time of studyTimes) {
            const startTime = new Date(date);
            startTime.setHours(time.start, 0, 0);

            const endTime = new Date(date);
            endTime.setHours(time.end, 0, 0);

            // Verificar si este horario está ocupado en el calendario
            const isOccupied = schedule.some((item) => {
              const itemStart = new Date(item.startTime);
              const itemEnd = new Date(item.endTime);
              return (
                startTime.getDate() === itemStart.getDate() &&
                ((startTime >= itemStart && startTime < itemEnd) ||
                  (endTime > itemStart && endTime <= itemEnd) ||
                  (startTime <= itemStart && endTime >= itemEnd))
              );
            });

            if (!isOccupied) {
              freeSlots.push({
                start: startTime,
                end: endTime,
                isFree: true,
              });
            }
          }
        }

        // Asignar los mejores slots a la tarea
        plan.availableSlots = freeSlots.slice(0, slotsToRecommend);
      }
    } catch (error) {
      console.error('Error finding best study times:', error);
    }
  }

  async generateReminderPlans() {
    if (!this.userId || this.tasks.length === 0) return;

    try {
      this.reminderPlans = [];

      // Generar planes de recordatorios para cada tarea
      for (const task of this.tasks) {
        // Determinar la prioridad de la tarea basada en la fecha límite
        const daysUntilDue = this.getDaysUntilDue(task.due_date);
        let taskPriority = 3; // Prioridad media por defecto

        if (daysUntilDue <= 2) {
          taskPriority = 5; // Alta prioridad
        } else if (daysUntilDue <= 5) {
          taskPriority = 4; // Prioridad media-alta
        } else if (daysUntilDue >= 14) {
          taskPriority = 2; // Prioridad baja
        }

        // Determinar el nivel de insistencia basado en el tipo de tarea
        let insistenceLevel = 1; // Nivel bajo por defecto
        if (task.task_type === 'examen') {
          insistenceLevel = 5; // Nivel alto para exámenes
        } else if (task.task_type === 'proyecto') {
          insistenceLevel = 3; // Nivel medio para proyectos
        }

        // Generar plan de recordatorios
        const reminderPlan: ExtendedReminderPlan = {
          taskId: task._id || '',
          accepted: false,
          taskPriority,
          insistenceLevel,
          reminders: [],
        };

        // Generar recordatorios basados en la prioridad e insistencia
        if (taskPriority >= 4 || insistenceLevel >= 4) {
          // Alta prioridad o insistencia: más recordatorios
          reminderPlan.reminders = [
            {
              time: '1 semana antes',
              description: `Recuerda que tienes que completar: ${task.description}`,
              level: 3,
            },
            {
              time: '3 días antes',
              description: `No olvides tu tarea: ${task.description}`,
              level: 4,
            },
            {
              time: '1 día antes',
              description: `¡Mañana vence tu tarea: ${task.description}!`,
              level: 5,
            },
          ];
        } else if (taskPriority >= 3 || insistenceLevel >= 2) {
          // Prioridad media: recordatorios moderados
          reminderPlan.reminders = [
            {
              time: '3 días antes',
              description: `Recuerda tu tarea: ${task.description}`,
              level: 3,
            },
            {
              time: '1 día antes',
              description: `Mañana vence tu tarea: ${task.description}`,
              level: 4,
            },
          ];
        } else {
          // Baja prioridad: pocos recordatorios
          reminderPlan.reminders = [
            {
              time: '1 día antes',
              description: `Mañana vence tu tarea: ${task.description}`,
              level: 3,
            },
          ];
        }

        // Ajustar los niveles de los recordatorios según la prioridad e insistencia
        reminderPlan.reminders = reminderPlan.reminders.map((reminder) => {
          // Ajustar el nivel según la prioridad e insistencia
          let adjustedLevel = reminder.level;

          // Si la tarea es de alta prioridad, aumentar el nivel
          if (reminderPlan.taskPriority && reminderPlan.taskPriority >= 4) {
            adjustedLevel = Math.min(5, adjustedLevel + 1);
          }

          // Si la tarea tiene alta insistencia, aumentar el nivel
          if (
            reminderPlan.insistenceLevel &&
            reminderPlan.insistenceLevel >= 4
          ) {
            adjustedLevel = Math.min(5, adjustedLevel + 1);
          }

          // Añadir fecha al recordatorio basado en el tiempo relativo
          const dueDate = new Date(task.due_date);
          let reminderDate = new Date(dueDate);

          // Verificar que la fecha de vencimiento es válida
          if (isNaN(dueDate.getTime())) {
            console.error('Fecha de vencimiento inválida:', task.due_date);
            return {
              ...reminder,
              level: adjustedLevel,
              date: undefined, // Usar undefined en lugar de null
            };
          }

          // Convertir el tiempo relativo (ej: "1 día antes") a una fecha real
          try {
            if (reminder.time && reminder.time.includes('semana')) {
              const weeks = parseInt(reminder.time.split(' ')[0]);
              reminderDate.setDate(dueDate.getDate() - weeks * 7);
            } else if (reminder.time && reminder.time.includes('día')) {
              const days = parseInt(reminder.time.split(' ')[0]);
              reminderDate.setDate(dueDate.getDate() - days);
            } else if (reminder.time && reminder.time.includes('hora')) {
              const hours = parseInt(reminder.time.split(' ')[0]);
              reminderDate.setHours(dueDate.getHours() - hours);
            }

            // Verificar que la fecha calculada es válida
            if (isNaN(reminderDate.getTime())) {
              console.error(
                'Fecha de recordatorio calculada inválida para:',
                reminder.time
              );
              return {
                ...reminder,
                level: adjustedLevel,
                date: undefined, // Usar undefined en lugar de null
              };
            }

            return {
              ...reminder,
              level: adjustedLevel,
              date: reminderDate.toISOString(), // Añadir la fecha calculada
            };
          } catch (error) {
            console.error(
              'Error al calcular la fecha del recordatorio:',
              error
            );
            return {
              ...reminder,
              level: adjustedLevel,
              date: undefined, // Usar undefined en lugar de null
            };
          }
        });

        // Guardar el plan de recordatorios
        this.reminderPlans.push(reminderPlan);

        // Asignar el plan a la tarea correspondiente
        const taskPlan = this.taskPlans.find(
          (plan) => plan.task._id === task._id
        );
        if (taskPlan) {
          taskPlan.reminderPlan = reminderPlan;
        }
      }
    } catch (error) {
      console.error('Error generating reminder plan:', error);
    }
  }

  // Método para mostrar el plan de recordatorios
  showReminderPlan(plan: TaskWithSlots) {
    if (plan.reminderPlan) {
      this.currentReminderPlan = plan.reminderPlan;
      this.showReminderPlanModal = true;
      // No establecer selectedTask para evitar que se abra el modal de detalles
    }
  }

  // Método para cancelar el plan de recordatorios
  cancelReminderPlan() {
    this.showReminderPlanModal = false;
    this.currentReminderPlan = null;
  }

  // Función para calcular la fecha basada en un formato relativo
  private calculateRelativeDate(
    baseDate: Date,
    timeFormat: string
  ): Date | null {
    try {
      // Crear una copia de la fecha base para no modificar la original
      const result = new Date(baseDate.getTime());

      // Patrones para formatos relativos
      const weekPattern = /(\d+)\s+semana(s)?\s+(antes|después)/i;
      const dayPattern = /(\d+)\s+día(s)?\s+(antes|después)/i;
      const hourPattern = /(\d+)\s+hora(s)?\s+(antes|después)/i;

      // Comprobar si es un formato de semanas
      const weekMatch = timeFormat.match(weekPattern);
      if (weekMatch) {
        const weeks = parseInt(weekMatch[1], 10);
        const direction = weekMatch[3].toLowerCase() === 'antes' ? -1 : 1;
        result.setDate(result.getDate() + direction * weeks * 7);
        return result;
      }

      // Comprobar si es un formato de días
      const dayMatch = timeFormat.match(dayPattern);
      if (dayMatch) {
        const days = parseInt(dayMatch[1], 10);
        const direction = dayMatch[3].toLowerCase() === 'antes' ? -1 : 1;
        result.setDate(result.getDate() + direction * days);
        return result;
      }

      // Comprobar si es un formato de horas
      const hourMatch = timeFormat.match(hourPattern);
      if (hourMatch) {
        const hours = parseInt(hourMatch[1], 10);
        const direction = hourMatch[3].toLowerCase() === 'antes' ? -1 : 1;
        result.setHours(result.getHours() + direction * hours);
        return result;
      }

      // Si no coincide con ningún patrón, registrar el error y devolver null
      console.error('Formato de tiempo no reconocido:', timeFormat);
      return null;
    } catch (error) {
      console.error('Error al calcular fecha relativa:', error);
      return null;
    }
  }

  async acceptReminderPlan() {
    try {
      if (!this.currentReminderPlan) {
        console.error('No hay plan de recordatorios seleccionado');
        return;
      }

      // Marcar el plan como aceptado
      this.currentReminderPlan.accepted = true;

      // Crear recordatorios basados en el plan
      for (const reminder of this.currentReminderPlan.reminders) {
        // Verificar si reminder.time existe
        if (!reminder.time) {
          console.warn('Recordatorio sin tiempo definido, omitiendo');
          continue;
        }

        let reminderDate = new Date();
        const timeStr = reminder.time;

        if (timeStr.includes('semana')) {
          const weeks = parseInt(timeStr.split(' ')[0]);
          reminderDate.setDate(reminderDate.getDate() + weeks * 7);
        } else if (timeStr.includes('día')) {
          const days = parseInt(timeStr.split(' ')[0]);
          reminderDate.setDate(reminderDate.getDate() + days);
        } else if (timeStr.includes('hora')) {
          const hours = parseInt(timeStr.split(' ')[0]);
          reminderDate.setHours(reminderDate.getHours() + hours);
        }

        // Crear el recordatorio
        const reminderData = {
          user_id: this.authService.getCurrentUserId(),
          task_id: this.currentReminderPlan.taskId,
          reminder_date: reminderDate.toISOString(),
          message: reminder.description,
          priority: this.currentReminderPlan.taskPriority || 3,
          status: 'pendiente',
          insistence_level: this.currentReminderPlan.insistenceLevel || 1,
        };

        // Guardar el recordatorio
        this.apiService.createReminder(reminderData).subscribe(
          (response) => {
            console.log('Recordatorio creado:', response);
          },
          (error: any) => {
            console.error('Error al crear recordatorio:', error);
          }
        );
      }

      // No intentar actualizar el plan en la base de datos, ya que parece que la API no soporta esta operación
      // o el endpoint está mal configurado

      // Cerrar el modal
      this.showReminderPlanModal = false;

      // Recargar los planes
      this.loadData();

      this.toastService.showToast(
        'Plan de recordatorios aceptado correctamente',
        'success'
      );
    } catch (error) {
      console.error('Error al aceptar el plan de recordatorios:', error);
      this.toastService.showToast(
        'Error al aceptar el plan de recordatorios',
        'error'
      );
    }
  }

  // Método para calcular días hasta la fecha de entrega
  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Método para formatear un rango de tiempo
  formatTimeRange(start: Date, end: Date): string {
    const formatTime = (date: Date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  // Método para programar una sesión de estudio
  async scheduleStudySession(plan: TaskWithSlots, slot: TimeSlot) {
    if (!this.userId) return;

    try {
      const scheduleItem: Partial<ScheduleItem> = {
        user_id: this.userId,
        title: `Estudiar: ${plan.task.description}`,
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString(),
        day: slot.start.toLocaleDateString('es-ES', { weekday: 'long' }),
        type: 'personal',
        subject_id: plan.task.subject_id,
        color: '#4caf50', // Verde para sesiones de estudio
      };

      await firstValueFrom(
        this.scheduleService.createScheduleItem(scheduleItem)
      );

      this.toastService.showToast(
        'Sesión de estudio programada correctamente',
        'success'
      );

      // Recargar datos para actualizar la UI
      await this.loadData();
    } catch (error) {
      console.error('Error scheduling study session:', error);
      this.toastService.showToast(
        'Error al programar la sesión de estudio',
        'error'
      );
    }
  }

  // Método para ver detalles de una tarea
  viewTaskDetails(task: Task) {
    this.selectedTask = task;
    this.showTaskDetailsModal = true;
    // Asegurarse de que el modal de recordatorios no esté abierto
    this.showReminderPlanModal = false;
  }

  // Método para cerrar el modal de detalles
  closeTaskDetails() {
    this.selectedTask = null;
    this.showTaskDetailsModal = false;
  }

  // Método para manejar el evento de refresh
  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }
}
