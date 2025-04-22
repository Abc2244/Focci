import { Component, OnInit, ViewChild } from '@angular/core';
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
  isToday,
  addWeeks,
  subWeeks,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  getDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

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
  @ViewChild('eventModal') eventModal!: IonModal;
  presentingElement: Element | null = null;

  subjects: Subject[] = [];
  tasks: Task[] = [];
  reminders: any[] = [];
  events: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  isLoading = true;
  currentDate = new Date();
  daysOfWeek: DayHeader[] = [];
  currentWeekLabel: string = '';
  currentView = 'calendar'; // Cambiado de 'schedule' a 'calendar'
  timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7am to 11pm

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.presentingElement = document.querySelector('.ion-page');
  }

  ionViewWillEnter() {
    this.loadData();
    this.presentingElement = document.querySelector('.ion-page');
    this.currentView = 'calendar'; // Asegurar que la vista sea calendar al entrar
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.presentingElement = document.querySelector('.ion-page');
    }, 100);
  }

  loadData() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.isLoading = true;

      Promise.all([
        this.apiService.getUserSubjects(userId).toPromise().catch(() => []),
        this.apiService.getUserTasks(userId).toPromise().catch(() => []),
        this.apiService.getUpcomingReminders(userId).toPromise().catch(() => [])
      ])
        .then(([subjects, tasks, reminders]) => {
          this.subjects = subjects || [];
          this.tasks = tasks || [];
          this.reminders = reminders || [];
          
          console.log('Materias cargadas:', this.subjects.length);
          console.log('Tareas cargadas:', this.tasks.length);
          console.log('Recordatorios cargados:', this.reminders.length);
          
          this.updateEventsForCurrentWeek();
        })
        .catch((error) => {
          console.warn('No se encontraron datos para mostrar');
          // Inicializar arrays vacíos en caso de error
          this.subjects = [];
          this.tasks = [];
          this.reminders = [];
          this.updateEventsForCurrentWeek();
        })
        .finally(() => {
          this.isLoading = false;
        });
    } else {
      console.warn('Usuario no autenticado');
      this.isLoading = false;
    }
  }

  processSubjectsToEvents() {
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
              const [startHour, startMinute] = scheduleItem.startTime.split(':');
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
    this.events = [];
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
    this.loadData();
  }

  nextWeek() {
    this.currentDate = addWeeks(this.currentDate, 1);
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.loadData();
  }

  goToToday() {
    this.currentDate = new Date();
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
    this.loadData();
  }

  formatHour(hour: number): string {
    const hour12 = hour > 12 ? hour - 12 : hour;
    const amPm = hour >= 12 ? 'PM' : 'AM';
    return `${hour12}:00 ${amPm}`;
  }

  getEventStyle(event: CalendarEvent) {
    const startHour = getHours(event.startTime);
    const startMinute = getMinutes(event.startTime);
    const endHour = getHours(event.endTime);
    const endMinute = getMinutes(event.endTime);

    const hourOffset = startHour - 7;
    const minuteOffset = startMinute / 60;
    const top = Math.max(0, (hourOffset + minuteOffset) * 60);

    let durationHours = (endHour - startHour) + ((endMinute - startMinute) / 60);
    durationHours = Math.max(durationHours, 0.5);
    
    const height = Math.min(durationHours * 60, 960 - top);

    const dayWidth = (100 / 7) - 2;
    const left = event.day * (100 / 7) + 1;
    const width = dayWidth;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`,
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: event.color,
      zIndex: event.type === 'subject' ? 2 : 3,
    };
  }

  changeView(view: string) {
    this.currentView = view;
  }

  onEventClick(event: CalendarEvent) {
    this.selectedEvent = event;
    this.eventModal.present();
  }

  closeEventModal() {
    this.eventModal.dismiss();
    this.selectedEvent = null;
  }

  getEventTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      subject: 'school',
      task: 'checkbox',
      reminder: 'alarm',
      custom: 'calendar',
    };
    return icons[type] || 'calendar';
  }

  getEventTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      subject: 'Materia',
      task: 'Tarea',
      reminder: 'Recordatorio',
      custom: 'Evento',
    };
    return labels[type] || 'Evento';
  }
}
