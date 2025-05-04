import { Component, OnInit, ViewChild } from '@angular/core';
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
import { IonModal } from '@ionic/angular';

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
  duration?: number;
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
  @ViewChild('reminderPlanModal') reminderPlanModal!: IonModal;
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
      // Obtener tareas pendientes del usuario
      const tasks = await firstValueFrom(
        this.apiService.getPendingTasks(this.userId)
      );

      // Filtrar tareas no vencidas
      const now = new Date();
      this.tasks = tasks.filter(
        (task) => !task.completed && new Date(task.due_date) >= now
      );

      console.log('📋 Tareas cargadas:', this.tasks.length);

      // Crear planes para cada tarea
      this.taskPlans = this.tasks.map((task) => ({
        task,
        availableSlots: [],
      }));

      // Buscar mejores horarios de estudio para cada tarea
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
      console.log('🔍 Iniciando búsqueda de mejores horarios de estudio');

      // Obtener el horario del usuario
      console.log('📅 Solicitando horario del usuario:', this.userId);
      const schedule = await firstValueFrom(
        this.scheduleService.getUserSchedule(this.userId)
      );
      console.log('📋 Horario obtenido:', schedule);
      console.log('📊 Número de elementos en el horario:', schedule.length);

      // Para cada tarea, encontrar los mejores horarios
      for (const plan of this.taskPlans) {
        console.log('🔄 Procesando tarea:', plan.task.description);

        // Calcular días hasta la fecha límite
        const daysUntilDue = this.getDaysUntilDue(plan.task.due_date);
        console.log('⏳ Días hasta la fecha límite:', daysUntilDue);

        // Si la fecha ya pasó, omitir esta tarea
        if (daysUntilDue < 0) {
          console.log('⚠️ Esta tarea ya venció, omitiendo...');
          continue;
        }

        // Determinar cuántos slots de estudio recomendar basado en la urgencia
        let slotsToRecommend = 1;
        if (daysUntilDue <= 3) {
          slotsToRecommend = 3; // Muy urgente
        } else if (daysUntilDue <= 7) {
          slotsToRecommend = 2; // Urgente
        }
        console.log('🎯 Slots a recomendar:', slotsToRecommend);

        // Encontrar slots libres en el horario
        const freeSlots: TimeSlot[] = [];
        const now = new Date();
        const dueDate = new Date(plan.task.due_date);

        console.log('🕒 Fecha actual:', now);
        console.log('📅 Fecha límite:', dueDate);

        // Horarios típicos de estudio (ampliados)
        const studyTimes = [
          { start: 7, end: 9 }, // Temprano en la mañana
          { start: 9, end: 12 }, // Mañana
          { start: 12, end: 14 }, // Mediodía
          { start: 14, end: 17 }, // Tarde
          { start: 17, end: 19 }, // Final de la tarde
          { start: 19, end: 22 }, // Noche
        ];

        // Buscar en los próximos días hasta la fecha límite
        for (let day = 0; day < Math.min(daysUntilDue, 7); day++) {
          const date = new Date(now);
          date.setDate(date.getDate() + day);
          console.log(`📆 Analizando día ${day + 1}:`, date.toDateString());

          for (const time of studyTimes) {
            const startTime = new Date(date);
            startTime.setHours(time.start, 0, 0);

            const endTime = new Date(date);
            endTime.setHours(time.end, 0, 0);

            console.log(
              `⏰ Evaluando horario: ${time.start}:00 - ${time.end}:00`
            );

            // Verificar si este horario está ocupado en el calendario
            const isOccupied = schedule.some((item) => {
              // Convertir las horas de string a Date
              const itemStartTime = new Date(item.startTime);
              const itemEndTime = new Date(item.endTime);

              // Verificar si es el mismo día de la semana
              const dayNames = [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ];
              const startDayName = dayNames[startTime.getDay()];

              // Solo considerar eventos del mismo día de la semana
              if (item.day.toLowerCase() !== startDayName) return false;

              // Comparar solo las horas y minutos para detectar conflictos
              const startTimeHours = startTime.getHours();
              const startTimeMinutes = startTime.getMinutes();
              const endTimeHours = endTime.getHours();
              const endTimeMinutes = endTime.getMinutes();

              const itemStartHours = itemStartTime.getHours();
              const itemStartMinutes = itemStartTime.getMinutes();
              const itemEndHours = itemEndTime.getHours();
              const itemEndMinutes = itemEndTime.getMinutes();

              // Verificar superposición de horarios
              const overlap =
                ((startTimeHours > itemStartHours ||
                  (startTimeHours === itemStartHours &&
                    startTimeMinutes >= itemStartMinutes)) &&
                  (startTimeHours < itemEndHours ||
                    (startTimeHours === itemEndHours &&
                      startTimeMinutes < itemEndMinutes))) ||
                ((endTimeHours > itemStartHours ||
                  (endTimeHours === itemStartHours &&
                    endTimeMinutes > itemStartMinutes)) &&
                  (endTimeHours < itemEndHours ||
                    (endTimeHours === itemEndHours &&
                      endTimeMinutes <= itemEndMinutes))) ||
                (startTimeHours <= itemStartHours &&
                  endTimeHours >= itemEndHours);

              if (overlap) {
                console.log('⚠️ Conflicto con evento:', item.title);
                console.log(
                  '   Evento:',
                  `${itemStartHours}:${itemStartMinutes}`,
                  '-',
                  `${itemEndHours}:${itemEndMinutes}`
                );
              }

              return overlap;
            });

            if (!isOccupied) {
              console.log('✅ Horario libre encontrado');
              freeSlots.push({
                start: startTime,
                end: endTime,
                isFree: true,
              });
            } else {
              console.log('❌ Horario ocupado');
            }
          }
        }

        console.log('🗓️ Total de slots libres encontrados:', freeSlots.length);

        // Ordenar por proximidad (los más cercanos primero)
        freeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Limitar a la cantidad recomendada
        plan.availableSlots = freeSlots.slice(0, slotsToRecommend);
        console.log(
          '📝 Slots recomendados para esta tarea:',
          plan.availableSlots
        );
      }
    } catch (error) {
      console.error('❌ Error encontrando mejores horarios:', error);
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

        // Usar el servicio para generar el plan de recordatorios
        const reminderPlan = this.smartAssistant.generateReminderPlanForTask(
          task,
          taskPriority,
          insistenceLevel
        );

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

      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        console.error('No se pudo obtener el ID del usuario');
        this.toastService.showToast(
          'Error: No se pudo identificar al usuario',
          'error'
        );
        return;
      }

      // Marcar el plan como aceptado
      this.currentReminderPlan.accepted = true;

      // Asegurarse de que los recordatorios tengan fechas reales basadas en la fecha límite
      if (this.selectedTask && this.currentReminderPlan.reminders) {
        const dueDate = new Date(this.selectedTask.due_date);

        // Convertir cada recordatorio a una fecha real
        this.currentReminderPlan.reminders.forEach((reminder) => {
          if (reminder.time) {
            // Convertir tiempo relativo a fecha real
            const date = this.calculateRelativeDate(dueDate, reminder.time);
            if (date) {
              reminder.date = date.toISOString();
            }
          }
        });
      }

      // Guardar una referencia al plan actual antes de limpiarlo
      const planToCreate = { ...this.currentReminderPlan };

      try {
        // Usar el servicio para crear los recordatorios
        await new Promise((resolve, reject) => {
          this.smartAssistant
            .createRemindersFromPlan(planToCreate, userId)
            .subscribe(
              (responses) => {
                console.log('Recordatorios creados:', responses);
                resolve(responses);
              },
              (error) => {
                console.error('Error al crear recordatorios:', error);
                reject(error);
              }
            );
        });

        // Cerrar el modal usando dismiss()
        await this.reminderPlanModal.dismiss();
        
        // Limpiar el estado
        this.showReminderPlanModal = false;
        this.currentReminderPlan = null;

        // Recargar los datos
        await this.loadData();

        this.toastService.showToast(
          'Plan de recordatorios aceptado correctamente',
          'success'
        );
      } catch (error) {
        this.toastService.showToast(
          'Error al crear los recordatorios',
          'error'
        );
        throw error;
      }
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
    if (!this.userId || !plan.task._id) return;

    console.log('🔄 Iniciando programación de sesión de estudio');
    console.log('📚 Tarea:', plan.task.description);
    console.log('⏰ Horario seleccionado:', slot.start, '-', slot.end);

    try {
      // Marcar este slot como seleccionado
      plan.selectedSlot = slot;

      // Crear un elemento en el horario
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

      console.log('📝 Elemento de horario a crear:', scheduleItem);

      const createdItem = await firstValueFrom(
        this.scheduleService.createScheduleItem(scheduleItem)
      );

      // Programar una notificación 30 minutos antes
      // Crear una nueva instancia de Date para no modificar el objeto original
      const notificationTime = new Date(slot.start.getTime());
      notificationTime.setMinutes(notificationTime.getMinutes() - 30);

      console.log(
        '✅ Recordatorio para sesión de estudio creado para:',
        notificationTime
      );

      // Crear un objeto de notificación con el formato correcto
      const notificationData = {
        title: `Recordatorio: ${plan.task.description}`,
        body: 'Tu sesión de estudio comienza en 30 minutos',
        scheduledTime: notificationTime.toISOString(),
        _id: `study_session_${plan.task._id}_${Date.now()}`, // ID único para la notificación
        task_id: plan.task._id,
        reminder_date: notificationTime.toISOString(),
      };

      await this.notificationsService.scheduleNotification(notificationData);

      // Mostrar confirmación
      this.toastService.showToast(
        'Sesión de estudio programada correctamente',
        'success'
      );

      // Recargar datos
      await this.loadData();
    } catch (error) {
      console.error('❌ Error programando sesión de estudio:', error);
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
    this.showTaskDetailsModal = false;
    this.selectedTask = null;
  }

  // Método para manejar el evento de refresh
  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  // Método para formatear la fecha
  formatDate(date: Date): string {
    // Obtener el nombre del día en español
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    // Obtener el día del mes
    const day = date.getDate();
    // Obtener el mes abreviado
    const month = date.toLocaleDateString('es-ES', { month: 'short' });

    // Capitalizar la primera letra del día
    const capitalizedDayName =
      dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // Retornar el formato: "Lun 15 May"
    return `${capitalizedDayName} ${day} ${month}`;
  }

  // Método para verificar si hay un recordatorio en un slot de tiempo específico
  hasReminderInTimeSlot(plan: TaskWithSlots, slot: TimeSlot): boolean {
    if (!plan.reminderPlan || !plan.reminderPlan.reminders) return false;

    return plan.reminderPlan.reminders.some((reminder) => {
      if (!reminder.date) return false;

      const reminderDate = new Date(reminder.date);
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      return reminderDate >= slotStart && reminderDate <= slotEnd;
    });
  }

  // Método para calcular la duración en minutos de un slot
  getDurationInMinutes(slot: TimeSlot): number {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  // Método para confirmar la programación con recordatorios
  async confirmScheduleWithReminders(plan: TaskWithSlots) {
    if (!plan.selectedSlot || !this.userId || !plan.task._id) return;

    try {
      // Primero programar la sesión de estudio
      await this.scheduleStudySession(plan, plan.selectedSlot);

      // Generar recordatorios para la sesión
      const sessionStart = new Date(plan.selectedSlot.start);
      const reminderTimes = [
        { minutes: 30, level: 3 },
        { minutes: 15, level: 4 },
        { minutes: 5, level: 5 },
      ];

      for (const { minutes, level } of reminderTimes) {
        const reminderTime = new Date(sessionStart.getTime() - minutes * 60000);
        const notificationData = {
          title: `Recordatorio de sesión de estudio`,
          body: `Tu sesión de estudio "${plan.task.description}" comienza en ${minutes} minutos`,
          scheduledTime: reminderTime.toISOString(),
          _id: `study_session_${plan.task._id}_${minutes}_${Date.now()}`,
          task_id: plan.task._id,
          reminder_date: reminderTime.toISOString(),
          priority: level,
        };

        await this.notificationsService.scheduleNotification(notificationData);
      }

      this.toastService.showToast(
        'Sesión programada con recordatorios',
        'success'
      );

      // Recargar los datos
      await this.loadData();
    } catch (error) {
      console.error('Error al programar sesión con recordatorios:', error);
      this.toastService.showToast(
        'Error al programar la sesión con recordatorios',
        'error'
      );
    }
  }
}
