import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

interface CalendarDay {
  date: Date;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  events: any[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  // Datos del calendario
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Datos de usuario
  userId: string = '';
  isLoading: boolean = true;

  // Datos para mostrar
  subjects: any[] = [];
  tasks: any[] = [];
  reminders: any[] = [];

  // Eventos del día seleccionado
  selectedDayEvents: any[] = [];

  // Filtro de eventos
  eventFilter: string = 'all'; // 'all', 'class', 'task', 'reminder'

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.generateCalendar();
    this.loadUserData();
  }

  ionViewWillEnter() {
    // Este método se llama cada vez que la página está a punto de ser mostrada
    this.loadUserData(); // Recargar los datos del usuario
  }

  // Generar el calendario para el mes actual
  generateCalendar() {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Ajustar el día de la semana (0 = Lunes, 6 = Domingo)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth: false,
        isToday: this.isToday(date),
        hasEvents: false,
        events: [],
      });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth: true,
        isToday: this.isToday(date),
        hasEvents: false,
        events: [],
      });
    }

    // Días del mes siguiente para completar la última semana
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth: false,
        isToday: this.isToday(date),
        hasEvents: false,
        events: [],
      });
    }

    this.loadEventsForMonth();
  }

  // Verificar si una fecha es hoy
  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // Cargar datos del usuario
  loadUserData() {
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

    this.userId = userId;

    // Cargar materias
    this.apiService.getUserSubjects(this.userId).subscribe({
      next: (subjects) => {
        this.subjects = subjects;
        console.log('Materias cargadas:', subjects.length);

        // Cargar tareas
        this.apiService.getUserTasks(this.userId).subscribe({
          next: (tasks) => {
            this.tasks = tasks;
            console.log('Tareas cargadas:', tasks.length);

            // Cargar recordatorios
            this.apiService.getUpcomingReminders(this.userId).subscribe({
              next: (reminders) => {
                this.reminders = reminders;
                console.log(
                  'Recordatorios cargados:',
                  reminders.length,
                  reminders
                );
                this.updateCalendarEvents();
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Error al cargar recordatorios:', error);
                this.toastService.showToast(
                  'Error al cargar recordatorios',
                  'error'
                );
                this.isLoading = false;
              },
            });
          },
          error: (error) => {
            console.error('Error al cargar tareas:', error);
            this.toastService.showToast('Error al cargar tareas', 'error');
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error al cargar materias:', error);
        this.toastService.showToast('Error al cargar materias', 'error');
        this.isLoading = false;
      },
    });
  }

  // Actualizar eventos del calendario según el filtro seleccionado
  updateCalendarEvents() {
    // Limpiar eventos existentes
    this.calendarDays.forEach((day) => {
      day.hasEvents = false;
      day.events = [];
    });

    // Agregar clases al calendario
    if (this.eventFilter === 'all' || this.eventFilter === 'class') {
      this.subjects.forEach((subject) => {
        if (subject.schedule && subject.schedule.length > 0) {
          subject.schedule.forEach((scheduleItem: any) => {
            const dayOfWeek = this.getDayNumber(scheduleItem.day);

            this.calendarDays.forEach((day) => {
              if (day.date.getDay() === dayOfWeek) {
                day.hasEvents = true;
                day.events.push({
                  id: subject._id,
                  title: subject.name,
                  details: `Aula: ${subject.classroom || 'No especificada'}`,
                  time: this.ensureTimeFormat(scheduleItem.startTime),
                  type: 'class',
                  color: 'primary',
                  subjectId: subject._id,
                });
              }
            });
          });
        }
      });
    }

    // Agregar tareas al calendario si el filtro lo permite
    if (this.eventFilter === 'all' || this.eventFilter === 'task') {
      this.tasks.forEach((task) => {
        if (task.due_date) {
          const taskDate = new Date(task.due_date);

          this.calendarDays.forEach((day) => {
            if (
              day.date.getDate() === taskDate.getDate() &&
              day.date.getMonth() === taskDate.getMonth() &&
              day.date.getFullYear() === taskDate.getFullYear()
            ) {
              day.hasEvents = true;
              day.events.push({
                id: task._id,
                title: task.description,
                details: this.getSubjectName(task.subject_id),
                time: this.formatTime(task.due_date),
                type: 'task',
                color: 'warning',
                completed: task.completed,
              });
            }
          });
        }
      });
    }

    // Agregar recordatorios al calendario si el filtro lo permite
    if (this.eventFilter === 'all' || this.eventFilter === 'reminder') {
      console.log('Procesando recordatorios:', this.reminders);

      this.reminders.forEach((reminder) => {
        if (reminder.reminder_date) {
          const reminderDate = new Date(reminder.reminder_date);

          console.log('Recordatorio:', reminder._id, 'Fecha:', reminderDate);

          this.calendarDays.forEach((day) => {
            if (
              day.date.getDate() === reminderDate.getDate() &&
              day.date.getMonth() === reminderDate.getMonth() &&
              day.date.getFullYear() === reminderDate.getFullYear()
            ) {
              day.hasEvents = true;
              day.events.push({
                id: reminder._id,
                title: reminder.message || this.getTaskName(reminder.task_id),
                details: this.getTaskName(reminder.task_id),
                time: this.formatTime(reminder.reminder_date),
                type: 'reminder',
                color: 'tertiary',
                status: reminder.status,
              });
            }
          });
        }
      });
    }

    // Actualizar eventos del día seleccionado
    this.updateSelectedDayEvents();
  }

  // Asegurar que el tiempo tenga un formato válido
  private ensureTimeFormat(time: string): string {
    if (!time) return '00:00';
    if (time.includes('T')) {
      try {
        const date = new Date(time);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } catch (e) {
        return '00:00';
      }
    }
    return time;
  }

  // Actualizar eventos del día seleccionado
  updateSelectedDayEvents() {
    this.selectedDayEvents = [];

    const selectedDay = this.calendarDays.find(
      (day) =>
        day.date.getDate() === this.selectedDate.getDate() &&
        day.date.getMonth() === this.selectedDate.getMonth() &&
        day.date.getFullYear() === this.selectedDate.getFullYear()
    );

    if (selectedDay && selectedDay.events.length > 0) {
      this.selectedDayEvents = [...selectedDay.events];

      // Ordenar eventos por hora, manejando casos donde time puede ser undefined
      this.selectedDayEvents.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    }
  }

  // Convertir nombre del día a número (0 = Domingo, 1 = Lunes, etc.)
  getDayNumber(dayName: string): number {
    const days: { [key: string]: number } = {
      Domingo: 0,
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
    };
    return days[dayName] ?? -1;
  }

  // Cambiar el filtro de eventos
  changeEventFilter(filter: string) {
    this.eventFilter = filter;
    this.updateCalendarEvents();
  }

  // Seleccionar un día
  selectDay(day: CalendarDay) {
    this.selectedDate = new Date(day.date);
    this.updateSelectedDayEvents();
  }

  // Navegar al mes anterior
  prevMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
    this.updateCalendarEvents();
  }

  // Navegar al mes siguiente
  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
    this.updateCalendarEvents();
  }

  // Formatear fecha para mostrar el mes y año
  formatMonthYear(): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    return this.currentDate.toLocaleDateString('es-ES', options);
  }

  // Formatear hora
  formatTime(timeString: string): string {
    if (timeString.includes('T')) {
      try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      } catch (e) {
        return timeString;
      }
    }
    return timeString;
  }

  // Obtener nombre de materia
  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : 'Sin materia';
  }

  // Obtener nombre de tarea
  getTaskName(taskId: string): string {
    const task = this.tasks.find((t) => t._id === taskId);
    return task ? task.description : 'Sin tarea';
  }

  loadEventsForMonth() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastService.showToast(
        'Error: ID de usuario no encontrado',
        'error'
      );
      return;
    }

    // Cargar recordatorios
    this.apiService.getUpcomingReminders(userId).subscribe({
      next: (reminders) => {
        this.reminders = reminders;
        console.log('Recordatorios cargados:', reminders.length, reminders);
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Error al cargar recordatorios:', error);
        this.toastService.showToast('Error al cargar recordatorios', 'error');
      },
    });

    // Cargar tareas
    this.apiService.getUserTasks(userId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        console.log('Tareas cargadas:', tasks.length, tasks);
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Error al cargar tareas:', error);
        this.toastService.showToast('Error al cargar tareas', 'error');
      },
    });
  }

  updateCalendarWithEvents() {
    this.calendarDays.forEach((day) => {
      day.events = [
        ...this.tasks.filter((task) => this.isSameDay(task.due_date, day.date)),
        ...this.reminders.filter((reminder) =>
          this.isSameDay(reminder.reminder_date, day.date)
        ),
      ];
      day.hasEvents = day.events.length > 0;
    });
  }

  isSameDay(date1: any, date2: Date): boolean {
    const d1 = new Date(date1);
    return (
      d1.getFullYear() === date2.getFullYear() &&
      d1.getMonth() === date2.getMonth() &&
      d1.getDate() === date2.getDate()
    );
  }
}
