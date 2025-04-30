import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
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

@Component({
  selector: 'app-week',
  templateUrl: './week.page.html',
  styleUrls: ['./week.page.scss'],
})
export class WeekPage implements OnInit {
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.setupWeekDays();
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  setupWeekDays() {
    this.weekDays = [];
    const today = new Date();
    const currentDay = today.getDay();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + i);

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
      const subjects = await firstValueFrom(
        this.apiService.getUserSubjects(userId)
      ).catch(() => [] as Subject[]);
      this.subjects = subjects.map(s => ({...s, userId: s.user_id}));
      this.generateEventsFromSubjects(this.subjects);

      const tasks = await firstValueFrom(
        this.apiService.getUserTasks(userId)
      ).catch(() => []);
      this.tasks = tasks || [];
      this.filterTasksForSelectedDay();

      const reminders = await firstValueFrom(
        this.apiService.getUserReminders(userId)
      ).catch(() => []);
    } catch (error) {
      console.warn('No se encontraron datos para mostrar');
    } finally {
      this.isLoading = false;
    }
  }

  selectDay(index: number) {
    this.selectedDay = index;
    this.filterTasksForSelectedDay();
    this.generateEventsFromSubjects(this.subjects);
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

    this.filteredTasks.sort((a, b) => {
      const timeA = new Date(a.due_date).getTime();
      const timeB = new Date(b.due_date).getTime();
      return timeA - timeB;
    });
  }

  generateEventsFromSubjects(subjects: Subject[]): void {
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

    this.morningEvents.sort((a, b) =>
      this.compareTime(a.startTime, b.startTime)
    );
  }

  private getDayNumber(day: string): number {
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
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        if (hours && minutes) {
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
      }

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
          this.loadUserData();
        },
        error: (error) => {
          console.error('Error al completar tarea:', error);
          this.toastService.showToast('Error al completar la tarea', 'error');
        },
      });
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
