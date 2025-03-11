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

interface DayHeader {
  name: string;
  shortName: string;
  date: string;
  isToday: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  day: number;
  description?: string;
  location?: string;
  color: string;
  type: 'subject' | 'task' | 'custom';
  subjectId?: string;
  taskId?: string;
  classroom?: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
})
export class SchedulePage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;

  subjects: Subject[] = [];
  tasks: Task[] = [];
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private fb: FormBuilder
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

  loadData() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      try {
        this.apiService.getUserSubjects(userId).subscribe({
          next: (subjects) => {
            this.subjects = subjects;
            this.processSubjectsToEvents();
            this.updateCalendarView();
          },
          error: (error) => {
            console.error('Error al cargar materias:', error);
            this.toastService.showToast('Error al cargar materias', 'error');
          },
        });

        this.apiService.getUserTasks(userId).subscribe({
          next: (tasks) => {
            this.tasks = tasks;
            this.processTasksToEvents();
            this.updateCalendarView();
          },
          error: (error) => {
            console.error('Error al cargar tareas:', error);
            this.toastService.showToast('Error al cargar tareas', 'error');
          },
        });
      } catch (error) {
        this.toastService.showToast('Error al cargar datos', 'error');
      }
    } else {
      this.toastService.showToast('Usuario no autenticado', 'error');
    }
  }

  processSubjectsToEvents() {
    if (this.subjects && this.subjects.length > 0) {
      this.subjects.forEach((subject) => {
        if (subject.schedule && subject.schedule.length > 0) {
          subject.schedule.forEach((scheduleItem: ScheduleItem) => {
            const dayMap: { [key: string]: number } = {
              Domingo: 0,
              Lunes: 1,
              Martes: 2,
              Miércoles: 3,
              Jueves: 4,
              Viernes: 5,
              Sábado: 6,
            };

            const day = dayMap[scheduleItem.day];
            if (day !== undefined) {
              const [startHour, startMinute] =
                scheduleItem.startTime.split(':');
              const [endHour, endMinute] = scheduleItem.endTime.split(':');

              const startTime = new Date();
              startTime.setHours(parseInt(startHour), parseInt(startMinute));

              const endTime = new Date();
              endTime.setHours(parseInt(endHour), parseInt(endMinute));

              this.events.push({
                id: `${subject._id}-${day}`,
                title: subject.name,
                startTime: startTime,
                endTime: endTime,
                day: day,
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
      this.tasks.forEach((task) => {
        const dueDate = new Date(task.due_date);
        const day = getDay(dueDate);

        this.events.push({
          id: task._id || '',
          title: task.description,
          startTime: dueDate,
          endTime: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hora de duración
          day: day,
          description: task.description,
          color: '#f57c00',
          type: 'task',
          taskId: task._id,
        });
      });
    }
  }

  updateCalendarView() {
    this.isLoading = false;
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
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
      };
    });
  }

  updateCurrentWeekLabel() {
    const start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(this.currentDate, { weekStartsOn: 1 });
    this.currentWeekLabel = `${format(start, 'd MMM', {
      locale: es,
    })} - ${format(end, 'd MMM', { locale: es })}`;
  }

  previousWeek() {
    this.currentDate = addDays(this.currentDate, -7);
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
  }

  nextWeek() {
    this.currentDate = addDays(this.currentDate, 7);
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
  }

  goToToday() {
    this.currentDate = new Date();
    this.updateDaysOfWeek();
    this.updateCurrentWeekLabel();
  }

  formatHour(hour: number): string {
    return `${hour}:00`;
  }

  getEventStyle(event: CalendarEvent) {
    const startHour = event.startTime.getHours();
    const endHour = event.endTime.getHours();
    const top = startHour * 60;
    const height = (endHour - startHour) * 60;
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: event.color,
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
      this.updateCalendarView();
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
      this.updateCalendarView();
    }
  }
}
