import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subject, ScheduleItem } from '../interfaces/subject.interface';
import { Task } from '../interfaces/task.interface';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  isToday,
  addWeeks,
  subWeeks,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  getDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Router } from '@angular/router';

interface DayHeader {
  name: string;
  shortName: string;
  date: string;
  isToday: boolean;
  fullDate: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  day: number;
  description?: string;
  location?: string;
  color: string;
  type: 'subject' | 'task' | 'custom' | 'reminder';
  subjectId?: string;
  taskId?: string;
  reminderId?: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
})
export class SchedulePage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('addEventModal') addEventModal!: IonModal;

  subjects: Subject[] = [];
  tasks: Task[] = [];
  reminders: any[] = [];
  events: CalendarEvent[] = [];
  isLoading = true;
  currentDate = new Date();
  daysOfWeek: DayHeader[] = [];
  eventForm: FormGroup;
  selectedEvent: CalendarEvent | null = null;
  isEditMode = false;
  eventColors = [
    { name: 'Azul', value: '#1976d2' },
    { name: 'Naranja', value: '#f57c00' },
    // Agrega más colores si es necesario
  ];
  timeSlots = Array.from({ length: 24 }, (_, i) => i);
  currentWeekLabel: string = '';
  currentView = 'schedule'; // 'calendar', 'schedule', 'week'

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      color: ['#1976d2'],
    });
  }

  ngOnInit() {
    this.loadData();
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
  }

  ionViewWillEnter() {
    // Este método se llama cada vez que la página está a punto de ser mostrada
    this.loadData(); // Recargar los datos
  }

  loadData() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.isLoading = true;

      // Usar Promise.all para manejar todas las peticiones en paralelo
      Promise.all([
        this.apiService.getUserSubjects(userId).toPromise(),
        this.apiService.getUserTasks(userId).toPromise(),
        this.apiService.getUpcomingReminders(userId).toPromise(),
      ])
        .then(([subjects, tasks, reminders]) => {
          this.subjects = subjects || [];
          this.tasks = tasks || [];
          this.reminders = reminders || [];

          // Actualizar todos los eventos una vez que tengamos los datos
          this.updateEventsForCurrentWeek();
          this.isLoading = false;
        })
        .catch((error) => {
          console.error('Error loading data:', error);
          this.toastService.showToast('Error al cargar los datos', 'error');
          this.isLoading = false;
        });
    } else {
      this.toastService.showToast('Usuario no autenticado', 'error');
      this.isLoading = false;
    }
  }

  processSubjectsToEvents() {
    this.events = []; // Limpiar eventos existentes

    if (this.subjects && this.subjects.length > 0) {
      this.subjects.forEach((subject) => {
        if (subject.schedule && subject.schedule.length > 0) {
          subject.schedule.forEach((scheduleItem: ScheduleItem) => {
            const dayMap: { [key: string]: number } = {
              Domingo: 6,
              Lunes: 0,
              Martes: 1,
              Miércoles: 2,
              Jueves: 3,
              Viernes: 4,
              Sábado: 5,
            };

            const day = dayMap[scheduleItem.day];
            if (day !== undefined) {
              const [startHour, startMinute] =
                scheduleItem.startTime.split(':');
              const [endHour, endMinute] = scheduleItem.endTime.split(':');

              const currentWeekDay = this.daysOfWeek[day].fullDate;

              const startTime = setMinutes(
                setHours(currentWeekDay, parseInt(startHour)),
                parseInt(startMinute)
              );

              const endTime = setMinutes(
                setHours(currentWeekDay, parseInt(endHour)),
                parseInt(endMinute)
              );

              this.events.push({
                id: `${subject._id}-${day}`,
                title: subject.name,
                startTime,
                endTime,
                day,
                description: `Materia: ${subject.name}`,
                color: '#1976d2',
                type: 'subject',
                subjectId: subject._id,
              });
            }
          });
        }
      });
    }
  }

  processTasksToEvents() {
    if (this.tasks && this.tasks.length > 0) {
      const weekStart = startOfWeek(this.currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(this.currentDate, { weekStartsOn: 1 });

      this.tasks.forEach((task) => {
        const taskDate = parseISO(task.due_date);

        if (taskDate >= weekStart && taskDate <= weekEnd) {
          const day = getDay(taskDate);

          this.events.push({
            id: task._id || '',
            title: task.description,
            startTime: taskDate,
            endTime: new Date(taskDate.getTime() + 60 * 60 * 1000),
            day: day === 0 ? 6 : day - 1,
            description: task.description,
            color: '#f57c00',
            type: 'task',
            taskId: task._id,
          });
        }
      });
    }
  }

  processRemindersToEvents() {
    if (this.reminders && this.reminders.length > 0) {
      const weekStart = startOfWeek(this.currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(this.currentDate, { weekStartsOn: 1 });

      this.reminders.forEach((reminder) => {
        const reminderDate = parseISO(reminder.reminder_date);

        if (reminderDate >= weekStart && reminderDate <= weekEnd) {
          const day = getDay(reminderDate);

          this.events.push({
            id: reminder._id || '',
            title: reminder.message,
            startTime: reminderDate,
            endTime: new Date(reminderDate.getTime() + 30 * 60 * 1000),
            day: day === 0 ? 6 : day - 1,
            description: `Recordatorio: ${reminder.message}`,
            color: '#9c27b0',
            type: 'reminder',
            reminderId: reminder._id,
          });
        }
      });
    }
  }

  updateEventsForCurrentWeek() {
    this.events = []; // Limpiar eventos existentes
    this.processSubjectsToEvents();
    this.processTasksToEvents();
    this.processRemindersToEvents();
  }

  updateDaysOfWeek() {
    const start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
    this.daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return {
        name: format(date, 'EEEE', { locale: es }),
        shortName: format(date, 'EEE', { locale: es }),
        date: format(date, 'd'),
        isToday: isToday(date),
        fullDate: date,
      };
    });

    // En lugar de llamar a loadData(), llamamos a procesar los eventos existentes
    this.updateEventsForCurrentWeek();
  }

  updateCurrentWeekLabel() {
    const start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(this.currentDate, { weekStartsOn: 1 });
    this.currentWeekLabel = `${format(start, 'd MMM', {
      locale: es,
    })} - ${format(end, 'd MMM', { locale: es })}`;
  }

  previousWeek() {
    this.currentDate = subWeeks(this.currentDate, 1);
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.loadData(); // Llamar a loadData solo una vez al cambiar de semana
  }

  nextWeek() {
    this.currentDate = addWeeks(this.currentDate, 1);
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.loadData(); // Llamar a loadData solo una vez al cambiar de semana
  }

  goToToday() {
    this.currentDate = new Date();
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.loadData(); // Llamar a loadData solo una vez al ir a hoy
  }

  formatHour(hour: number): string {
    return `${hour}:00`;
  }

  getEventStyle(event: CalendarEvent) {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    const top = startHour * 60 + startMinute;
    const height = endHour * 60 + endMinute - (startHour * 60 + startMinute);

    const left = (event.day / 7) * 100;
    const width = 100 / 7;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: event.color,
      opacity: event.type === 'reminder' ? '0.9' : '1',
      border: event.type === 'reminder' ? '2px dashed white' : 'none',
    };
  }

  onEventClick(event: CalendarEvent) {
    this.selectedEvent = event;
    this.modal.present();
  }

  openAddEventModal() {
    this.isEditMode = false;
    this.eventForm.reset();
    this.modal.present();
  }

  closeEventModal() {
    this.modal.dismiss();
  }

  closeAddEventModal() {
    this.modal.dismiss();
  }

  onSubmitEvent() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;
      const newEvent: CalendarEvent = {
        id: this.isEditMode ? this.selectedEvent!.id : new Date().toISOString(),
        title: formValue.title,
        startTime: new Date(formValue.startDate + 'T' + formValue.startTime),
        endTime: new Date(formValue.startDate + 'T' + formValue.endTime),
        day: getDay(new Date(formValue.startDate)),
        description: formValue.description,
        color: formValue.color,
        type: 'custom',
      };

      if (this.isEditMode) {
        const index = this.events.findIndex(
          (e) => e.id === this.selectedEvent!.id
        );
        this.events[index] = newEvent;
      } else {
        this.events.push(newEvent);
      }

      this.closeAddEventModal();
      this.updateEventsForCurrentWeek();
    }
  }

  editEvent() {
    if (this.selectedEvent) {
      this.isEditMode = true;
      this.eventForm.patchValue({
        title: this.selectedEvent.title,
        startDate: format(this.selectedEvent.startTime, 'yyyy-MM-dd'),
        startTime: format(this.selectedEvent.startTime, 'HH:mm'),
        endTime: format(this.selectedEvent.endTime, 'HH:mm'),
        description: this.selectedEvent.description,
        color: this.selectedEvent.color,
      });
      this.modal.present();
    }
  }

  deleteEvent() {
    if (this.selectedEvent) {
      this.events = this.events.filter((e) => e.id !== this.selectedEvent!.id);
      this.closeEventModal();
      this.updateEventsForCurrentWeek();
    }
  }

  // Nuevos métodos para filtrar eventos del día
  getDayTasks() {
    const today = new Date();
    return this.tasks.filter((task) => {
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    });
  }

  getDayReminders() {
    const today = new Date();
    return this.reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.reminder_date);
      return (
        reminderDate.getDate() === today.getDate() &&
        reminderDate.getMonth() === today.getMonth() &&
        reminderDate.getFullYear() === today.getFullYear()
      );
    });
  }

  // Formatear hora
  formatTime(timeString: string): string {
    if (timeString && timeString.includes('T')) {
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

  changeView(view: string) {
    this.currentView = view;
  }
}
