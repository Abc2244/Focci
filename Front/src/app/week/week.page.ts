import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Task } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';

interface WeekDay {
  name: string;
  number: number;
  date: Date;
}

interface EventItem {
  id: string;
  title: string;
  details: string;
  time: string;
  type: 'class' | 'event';
  subjectId?: string;
}

@Component({
  selector: 'app-week',
  templateUrl: './week.page.html',
  styleUrls: ['./week.page.scss'],
})
export class WeekPage implements OnInit {
  selectedDay = 0; // Por defecto selecciona el primer día
  weekDays: WeekDay[] = [];

  // Datos para mostrar
  morningEvents: EventItem[] = [];
  afternoonEvents: EventItem[] = [];
  tasks: Task[] = [];
  subjects: Subject[] = [];

  // Estado de carga
  isLoading = true;
  userId: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    // Obtener el ID del usuario del localStorage
    this.userId = localStorage.getItem('userId') || '';
  }

  ngOnInit() {
    this.setupWeekDays();
    this.loadUserData();
  }

  setupWeekDays() {
    // Obtener la fecha actual
    const today = new Date();

    // Encontrar el domingo de esta semana
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());

    // Generar los días de la semana
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);

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

  loadUserData() {
    this.isLoading = true;

    // Obtener el ID del usuario usando el mismo método que funciona en subjects.page.ts
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      console.error('Error: ID de usuario no encontrado');
      this.toastService.showToast(
        'Error: ID de usuario no encontrado',
        'error'
      );
      this.isLoading = false;
      return;
    }

    this.userId = userId;

    try {
      // Cargar materias del usuario
      this.apiService.getUserSubjects(this.userId).subscribe(
        (subjects) => {
          this.subjects = subjects as Subject[];
          this.generateEventsFromSubjects();
          this.loadTasks();
        },
        (error) => {
          console.error('Error al cargar materias:', error);
          // Si hay error al cargar materias, cargar al menos las tareas
          this.loadTasks();
          this.isLoading = false;
        }
      );
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.showToast('Error al cargar datos', 'error');
      this.isLoading = false;
    }
  }

  loadTasks() {
    // Cargar tareas del usuario
    this.apiService.getTasks(this.userId).subscribe(
      (tasks) => {
        this.tasks = tasks as Task[];
        this.filterTasksForSelectedDay();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar tareas:', error);
        this.isLoading = false;
        this.toastService.showToast('Error al cargar tareas', 'error');
      }
    );
  }

  selectDay(index: number) {
    this.selectedDay = index;
    this.generateEventsFromSubjects();
    this.filterTasksForSelectedDay();
  }

  generateEventsFromSubjects() {
    // Limpiar eventos existentes
    this.morningEvents = [];
    this.afternoonEvents = [];

    if (!this.subjects || this.subjects.length === 0) return;

    // Obtener el día de la semana seleccionado
    const selectedDayName = this.weekDays[this.selectedDay].name;

    // Filtrar materias que tienen horario en el día seleccionado
    this.subjects.forEach((subject) => {
      if (!subject.schedule) return;

      const scheduleForDay = subject.schedule.filter(
        (item) => item.day === selectedDayName
      );

      // Crear eventos para cada horario
      scheduleForDay.forEach((scheduleItem) => {
        const timeStr = this.formatTime(scheduleItem.time);
        const hour = this.getHourFromTimeString(timeStr);

        const event: EventItem = {
          id: `${subject._id}-${scheduleItem.day}-${scheduleItem.time}`,
          title: subject.name,
          details: `Materia: ${subject.name}`,
          time: timeStr,
          type: 'class',
          subjectId: subject._id,
        };

        // Clasificar como mañana o tarde
        if (hour < 12) {
          this.morningEvents.push(event);
        } else {
          this.afternoonEvents.push(event);
        }
      });
    });

    // Ordenar eventos por hora
    this.morningEvents.sort((a, b) => this.compareTimeStrings(a.time, b.time));
    this.afternoonEvents.sort((a, b) =>
      this.compareTimeStrings(a.time, b.time)
    );
  }

  filterTasksForSelectedDay() {
    if (!this.tasks || this.tasks.length === 0) {
      this.tasks = [];
      return;
    }

    const selectedDate = this.weekDays[this.selectedDay].date;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtrar tareas para el día seleccionado
    this.tasks = this.tasks.filter((task) => {
      const taskDate = new Date(task.due_date);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  }

  formatTime(timeString: string): string {
    // Si es un formato ISO, convertirlo a formato legible
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

  getHourFromTimeString(timeStr: string): number {
    // Extraer la hora de un string de tiempo
    const match = timeStr.match(/(\d+):/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  compareTimeStrings(time1: string, time2: string): number {
    // Convertir strings de tiempo a minutos para comparar
    const getTimeValue = (time: string) => {
      const parts = time.match(/(\d+):(\d+)/);
      if (!parts) return 0;

      let hours = parseInt(parts[1], 10);
      const minutes = parseInt(parts[2], 10);

      // Ajustar PM si es necesario
      if (time.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      }

      return hours * 60 + minutes;
    };

    return getTimeValue(time1) - getTimeValue(time2);
  }

  completeTask(taskId: string) {
    const taskToUpdate = {
      completed: true,
      completed_date: new Date().toISOString(),
    };

    this.apiService.updateTask(taskId, taskToUpdate).subscribe(
      () => {
        // Actualizar la tarea en la lista local
        const taskIndex = this.tasks.findIndex((t) => t._id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex].completed = true;
        }
        this.toastService.showToast('Tarea completada', 'success');
      },
      (error) => {
        console.error('Error al completar la tarea:', error);
        this.toastService.showToast('Error al completar la tarea', 'error');
      }
    );
  }

  addNewTask() {
    // Navegar a la página de tareas con el día preseleccionado
    this.toastService.showToast(
      'Función de agregar tarea en desarrollo',
      'info'
    );
  }

  addNewEvent() {
    // Navegar a la página de eventos con el día preseleccionado
    this.toastService.showToast(
      'Función de agregar evento en desarrollo',
      'info'
    );
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : 'Sin materia';
  }
}
