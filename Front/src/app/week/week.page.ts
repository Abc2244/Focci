import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Task, CreateTaskDTO } from '../interfaces/task.interface';
import { Subject, ScheduleItem } from '../interfaces/subject.interface';
import { IonModal } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface WeekDay {
  name: string;
  number: number;
  date: Date;
}

interface EventItem {
  id: string;
  title: string;
  details: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'event';
  subjectId?: string;
  date?: Date;
  color: string;
}

type DayMap = {
  Lunes: number;
  Martes: number;
  Miércoles: number;
  Jueves: number;
  Viernes: number;
  Sábado: number;
  Domingo: number;
};

@Component({
  selector: 'app-week',
  templateUrl: './week.page.html',
  styleUrls: ['./week.page.scss'],
})
export class WeekPage implements OnInit {
  @ViewChild('taskModal') taskModal!: IonModal;
  @ViewChild('subjectModal') subjectModal!: IonModal;

  selectedDay: number = 0;
  weekDays: WeekDay[] = [];
  userId: string = '';
  isLoading = true;

  // Datos para mostrar
  morningEvents: EventItem[] = [];
  afternoonEvents: EventItem[] = [];
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  subjects: Subject[] = [];

  // Variables para modales
  showTaskModalFlag = false;
  showSubjectModalFlag = false;
  isEditingTask = false;
  isEditingSubject = false;
  currentTaskId: string | null = null;
  currentSubjectId: string | null = null;

  // Formularios
  taskForm: FormGroup;
  subjectForm: FormGroup;

  // Horarios para materias
  selectedScheduleItems: ScheduleItem[] = [];
  availableDays = [
    { value: 'Lunes' },
    { value: 'Martes' },
    { value: 'Miércoles' },
    { value: 'Jueves' },
    { value: 'Viernes' },
    { value: 'Sábado' },
    { value: 'Domingo' },
  ];

  // Fecha mínima para tareas (hoy)
  minDate: string = new Date().toISOString();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private formBuilder: FormBuilder
  ) {
    // Inicializar formularios
    this.taskForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      subject_id: ['', [Validators.required]],
      due_date: [this.minDate, [Validators.required]],
    });

    this.subjectForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      credits: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.setupWeekDays();
    this.loadUserData();
  }

  ionViewWillEnter() {
    // Este método se llama cada vez que la página está a punto de ser mostrada
    this.loadUserData(); // Recargar los datos del usuario
  }

  setupWeekDays() {
    this.weekDays = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, ...

    // Crear array con los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + i);

      // Nombres de los días en español
      const dayNames = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];

      this.weekDays.push({
        name: dayNames[date.getDay()],
        number: date.getDate(),
        date: date,
      });
    }

    // Seleccionar el día actual por defecto
    const todayIndex = this.weekDays.findIndex(
      (day) =>
        day.date.getDate() === today.getDate() &&
        day.date.getMonth() === today.getMonth() &&
        day.date.getFullYear() === today.getFullYear()
    );

    if (todayIndex !== -1) {
      this.selectedDay = todayIndex;
    }
  }

  async loadUserData() {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      this.toastService.showToast(
        'Error: ID de usuario no encontrado',
        'error'
      );
      this.isLoading = false;
      return;
    }

    try {
      // Cargar materias primero
      const subjects = await firstValueFrom(
        this.apiService.getUserSubjects(userId)
      );
      this.subjects = subjects || [];
      this.generateEventsFromSubjects(this.subjects);

      // Cargar todas las tareas
      const tasks = await firstValueFrom(this.apiService.getUserTasks(userId));
      this.tasks = tasks || [];
      this.filterTasksForSelectedDay(); // Filtrar tareas para el día seleccionado

      // Cargar recordatorios
      try {
        const reminders = await firstValueFrom(
          this.apiService.getUserReminders(userId)
        );
        // Procesar recordatorios si es necesario
      } catch (reminderError) {
        console.warn('No se pudieron cargar los recordatorios:', reminderError);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.showToast(
        'Error al cargar los datos. Por favor, intente más tarde',
        'error'
      );
    } finally {
      this.isLoading = false;
    }
  }

  selectDay(index: number) {
    this.selectedDay = index;
    this.filterTasksForSelectedDay();
    this.generateEventsFromSubjects(this.subjects); // Regenerar eventos para el día seleccionado
  }

  filterTasksForSelectedDay() {
    if (!this.tasks || this.tasks.length === 0) {
      this.filteredTasks = [];
      return;
    }

    const selectedDate = new Date(this.weekDays[this.selectedDay].date);
    this.filteredTasks = this.tasks
      .filter((task) => {
        const taskDate = new Date(task.due_date);
        return (
          taskDate.getFullYear() === selectedDate.getFullYear() &&
          taskDate.getMonth() === selectedDate.getMonth() &&
          taskDate.getDate() === selectedDate.getDate()
        );
      })
      .map((task, index) => ({
        ...task,
        color: this.getEventColor('task', index),
      }));

    // Ordenar las tareas filtradas por la hora de entrega
    this.filteredTasks.sort((a, b) => {
      const timeA = new Date(a.due_date).getTime();
      const timeB = new Date(b.due_date).getTime();
      return timeA - timeB;
    });

    // Debug para verificar el filtrado
    console.log('Fecha seleccionada:', selectedDate);
    console.log('Tareas filtradas:', this.filteredTasks);
  }

  generateEventsFromSubjects(subjects: Subject[]): void {
    // Limpiar eventos existentes
    this.morningEvents = [];
    this.afternoonEvents = [];

    const selectedDate = this.weekDays[this.selectedDay].date;
    const selectedDayNumber = selectedDate.getDay();

    subjects.forEach((subject, index) => {
      if (subject.schedule && Array.isArray(subject.schedule)) {
        subject.schedule.forEach((scheduleItem) => {
          if (
            !scheduleItem ||
            !scheduleItem.day ||
            !scheduleItem.startTime ||
            !scheduleItem.endTime
          )
            return;

          const scheduleDayNumber = this.getDayNumber(scheduleItem.day);

          if (scheduleDayNumber === selectedDayNumber) {
            const event: EventItem = {
              id: `${subject._id}-${scheduleDayNumber}`,
              title: subject.name,
              details: `${scheduleItem.day} - Créditos: ${subject.credits}`,
              startTime: this.ensureTimeFormat(scheduleItem.startTime),
              endTime: this.ensureTimeFormat(scheduleItem.endTime),
              type: 'class',
              subjectId: subject._id,
              color: this.getEventColor('subject', index),
            };

            this.morningEvents.push(event);
          }
        });
      }
    });

    // Ordenar eventos por hora
    this.morningEvents.sort((a, b) =>
      this.compareTime(a.startTime, b.startTime)
    );
  }

  private getDayNumber(day: string): number {
    // Mapeo correcto de días en español a números
    // donde Lunes es 1, Martes es 2, etc.
    const dayMap: { [key: string]: number } = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 0,
    };
    return dayMap[day] ?? -1;
  }

  private ensureTimeFormat(time: string): string {
    if (!time) return '00:00';

    try {
      // Si ya está en formato HH:mm, retornarlo
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        if (hours && minutes) {
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
      }

      // Si es una fecha ISO, convertirla
      if (time.includes('T')) {
        const date = new Date(time);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }

      return '00:00';
    } catch (e) {
      console.error('Error al formatear tiempo:', e);
      return '00:00';
    }
  }

  getSubjectName(subjectId: string): string | null {
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : null;
  }

  async completeTask(taskId: string | undefined) {
    if (!taskId) return;

    const task = this.tasks.find((t) => t._id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.apiService.completeTask(taskId).subscribe({
        next: () => {
          this.toastService.showToast('Tarea completada', 'success');
          this.loadUserData(); // Refrescar datos
        },
        error: (error) => {
          console.error('Error al completar tarea:', error);
          this.toastService.showToast('Error al completar la tarea', 'error');
        },
      });
    }
  }

  // Funciones para el modal de tareas
  showTaskModal() {
    this.isEditingTask = false;
    this.currentTaskId = null;
    this.taskForm.reset();
    this.taskForm.patchValue({
      due_date: this.minDate,
    });
    this.showTaskModalFlag = true;
  }

  dismissTaskModal() {
    this.showTaskModalFlag = false;
    this.taskForm.reset();
    this.currentTaskId = null;
  }

  saveTask() {
    if (this.taskForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.showToast(
          'Error: No se encontró ID de usuario',
          'error'
        );
        return;
      }

      const formData = this.taskForm.value;
      const taskData = {
        user_id: userId,
        description: formData.description,
        subject_id: formData.subject_id,
        due_date: new Date(formData.due_date).toISOString(),
        completed: false,
      };

      this.apiService.createTask(taskData).subscribe({
        next: async () => {
          this.toastService.showToast('Tarea creada con éxito', 'success');
          this.dismissTaskModal();
          await this.loadUserData();
        },
        error: (error) => {
          console.error('Error al crear tarea:', error);
          this.toastService.showToast(
            'Error al crear la tarea. Por favor, intente nuevamente',
            'error'
          );
        },
      });
    }
  }

  // Funciones para el modal de materias
  showSubjectModal() {
    this.isEditingSubject = false;
    this.currentSubjectId = null;
    this.subjectForm.reset();
    this.selectedScheduleItems = [];
    this.showSubjectModalFlag = true;
  }

  dismissSubjectModal() {
    this.showSubjectModalFlag = false;
    this.subjectForm.reset();
    this.selectedScheduleItems = [];
    this.currentSubjectId = null;
  }

  addScheduleItem() {
    this.selectedScheduleItems.push({
      day: 'Lunes',
      startTime: '08:00',
      endTime: '09:00',
    });
  }

  removeScheduleItem(index: number) {
    this.selectedScheduleItems.splice(index, 1);
  }

  updateScheduleDay(index: number, day: string) {
    if (index >= 0 && index < this.selectedScheduleItems.length) {
      this.selectedScheduleItems[index].day = day;
      // Ordenar los horarios después de cambiar un día
      this.selectedScheduleItems = this.sortScheduleByDay(
        this.selectedScheduleItems
      );
    }
  }

  updateScheduleTime(
    index: number,
    value: string | string[] | null,
    field: 'startTime' | 'endTime'
  ) {
    if (value && typeof value === 'string') {
      this.selectedScheduleItems[index][field] = value;
    }
  }

  sortScheduleByDay(scheduleItems: ScheduleItem[]): ScheduleItem[] {
    const dayOrder: { [key: string]: number } = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Jueves: 3,
      Viernes: 4,
      Sábado: 5,
      Domingo: 6,
    };

    return [...scheduleItems].sort((a, b) => {
      // First sort by day
      const dayDiff = dayOrder[a.day] - dayOrder[b.day];
      if (dayDiff !== 0) return dayDiff;

      // If same day, sort by startTime
      return a.startTime.localeCompare(b.startTime);
    });
  }

  saveSubject() {
    if (this.subjectForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.showToast(
          'Error: No se encontró ID de usuario',
          'error'
        );
        return;
      }

      const formData = this.subjectForm.value;
      const subjectData = {
        user_id: userId,
        name: formData.name,
        credits: parseInt(formData.credits || '0'),
        schedule: this.selectedScheduleItems,
      };

      this.apiService.createSubject(subjectData).subscribe({
        next: async (response) => {
          this.toastService.showToast('Materia creada con éxito', 'success');
          this.dismissSubjectModal();
          await this.loadUserData(); // Recargar todos los datos
        },
        error: (error) => {
          console.error('Error al crear materia:', error);
          this.toastService.showToast('Error al crear la materia', 'error');
        },
      });
    } else {
      this.toastService.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';

    try {
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      // Si ya está en formato HH:mm, retornarlo formateado
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return timeString;
    }
  }

  getDayEvents(): EventItem[] {
    return this.morningEvents.sort((a, b) =>
      this.compareTime(a.startTime, b.startTime)
    );
  }

  private compareTime(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    if (h1 !== h2) return h1 - h2;
    return m1 - m2;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getEventColor(type: string, index: number = 0): string {
    const colors = {
      subject: {
        base: 'var(--ion-color-primary)',
        variants: [
          'var(--ion-color-primary)',
          'var(--ion-color-primary-shade)',
          'var(--ion-color-primary-tint)',
        ],
      },
      task: {
        base: 'var(--ion-color-secondary)',
        variants: [
          'var(--ion-color-secondary)',
          'var(--ion-color-secondary-shade)',
          'var(--ion-color-secondary-tint)',
        ],
      },
    };

    const colorSet = type === 'subject' ? colors.subject : colors.task;
    return colorSet.variants[index % colorSet.variants.length];
  }
}
