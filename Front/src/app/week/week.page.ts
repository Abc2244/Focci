import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Task, CreateTaskDTO } from '../interfaces/task.interface';
import { Subject, ScheduleItem } from '../interfaces/subject.interface';
import { IonModal } from '@ionic/angular';

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
}

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

  setupWeekDays() {
    this.weekDays = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, ...

    // Ajustar para que la semana comience en lunes (0 = Lunes, 6 = Domingo)
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - ((currentDay + 6) % 7));

    // Crear array con los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + i);

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

    // Obtener el ID del usuario
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

    // Cargar materias y tareas
    this.apiService.getUserSubjects(userId).subscribe({
      next: (subjects: Subject[]) => {
        this.subjects = subjects;
        this.generateEventsFromSubjects();

        // Cargar tareas después de obtener las materias
        this.apiService.getTasks(userId).subscribe({
          next: (tasks: Task[]) => {
            this.tasks = tasks.filter((task: Task) => {
              // Solo mostrar tareas no completadas o completadas hoy
              if (!task.completed) return true;

              const completedDate = new Date(task.completed_date || '');
              const today = new Date();
              return (
                completedDate.getDate() === today.getDate() &&
                completedDate.getMonth() === today.getMonth() &&
                completedDate.getFullYear() === today.getFullYear()
              );
            });

            this.filterTasksForSelectedDay();
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error al cargar tareas:', error);
            this.toastService.showToast('Error al cargar tareas', 'error');
            this.isLoading = false;
          },
        });
      },
      error: (error: any) => {
        console.error('Error al cargar materias:', error);
        this.toastService.showToast('Error al cargar materias', 'error');
        this.isLoading = false;
      },
    });
  }

  filterTasksForSelectedDay() {
    if (!this.tasks || this.tasks.length === 0) {
      this.filteredTasks = [];
      return;
    }

    const selectedDate = this.weekDays[this.selectedDay].date;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtrar a un nuevo array en lugar de modificar el original
    this.filteredTasks = this.tasks.filter((task) => {
      const taskDate = new Date(task.due_date);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  }

  generateEventsFromSubjects() {
    this.morningEvents = [];
    this.afternoonEvents = [];

    const selectedDate = this.weekDays[this.selectedDay].date;
    const dayName = this.weekDays[this.selectedDay].name;

    this.subjects.forEach((subject) => {
      if (subject.schedule) {
        const todaySchedule = subject.schedule.filter(
          (schedule) => schedule.day === dayName
        );

        todaySchedule.forEach((schedule) => {
          const event: EventItem = {
            id: subject._id,
            title: subject.name,
            details: `${this.formatTime(
              schedule.startTime
            )} - ${this.formatTime(schedule.endTime)}`,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            type: 'class',
            subjectId: subject._id,
          };

          const hour = parseInt(schedule.startTime.split(':')[0], 10);
          if (hour < 12) {
            this.morningEvents.push(event);
          } else {
            this.afternoonEvents.push(event);
          }
        });
      }
    });

    // Ordenar eventos por hora de inicio
    this.morningEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
    this.afternoonEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  selectDay(index: number) {
    this.selectedDay = index;
    this.filterTasksForSelectedDay();
    this.generateEventsFromSubjects();
  }

  getSubjectName(subjectId: string): string | null {
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : null;
  }

  completeTask(taskId: string) {
    const task = this.tasks.find((t) => t._id === taskId);
    if (task) {
      task.completed = !task.completed;
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
    console.log('Guardando tarea...');
    if (this.taskForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        console.error('No se encontró ID de usuario');
        this.toastService.showToast(
          'Error: No se encontró ID de usuario',
          'error'
        );
        return;
      }

      const formData = this.taskForm.value;
      console.log('Datos del formulario:', formData);

      // Asegurarse de que la fecha esté en formato ISO
      let dueDate = formData.due_date;
      if (dueDate && typeof dueDate === 'string' && !dueDate.includes('Z')) {
        dueDate = new Date(dueDate).toISOString();
      }

      const taskData = {
        user_id: userId,
        description: formData.description,
        subject_id: formData.subject_id,
        due_date: dueDate,
        completed: false,
      };

      console.log('Datos a enviar:', taskData);

      this.apiService.createTask(taskData).subscribe({
        next: (response) => {
          console.log('Tarea creada:', response);
          this.toastService.showToast('Tarea creada con éxito', 'success');
          this.dismissTaskModal();
          this.loadUserData();
        },
        error: (error) => {
          console.error('Error al crear tarea:', error);
          this.toastService.showToast('Error al crear la tarea', 'error');
        },
      });
    } else {
      console.log('Formulario inválido:', this.taskForm.errors);
      this.toastService.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
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
    console.log('Guardando materia...');
    if (this.subjectForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        console.error('No se encontró ID de usuario');
        this.toastService.showToast(
          'Error: No se encontró ID de usuario',
          'error'
        );
        return;
      }

      const formData = this.subjectForm.value;
      console.log('Datos del formulario:', formData);

      const subjectData = {
        user_id: userId,
        name: formData.name,
        credits: parseInt(formData.credits || '0'),
        schedule: this.selectedScheduleItems,
      };

      console.log('Datos a enviar:', subjectData);

      this.apiService.createSubject(subjectData).subscribe({
        next: (response) => {
          console.log('Materia creada:', response);
          this.toastService.showToast('Materia creada con éxito', 'success');
          this.dismissSubjectModal();
          this.loadUserData();
        },
        error: (error) => {
          console.error('Error al crear materia:', error);
          this.toastService.showToast('Error al crear la materia', 'error');
        },
      });
    } else {
      console.log('Formulario inválido:', this.subjectForm.errors);
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
}
