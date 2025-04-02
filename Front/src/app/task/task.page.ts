import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';
import {
  Task,
  CreateTaskDTO,
  TaskResponse,
} from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.page.html',
  styleUrls: ['./task.page.scss'],
})
export class TaskPage implements OnInit {
  tasks: Task[] = [];
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map();
  showModal = false;
  isEditing = false;
  taskForm: FormGroup;
  currentTaskId: string | null = null;
  minDate: string;

  // Modificar estas propiedades para permitir todas las horas
  hourValues: number[] = Array.from({ length: 24 }, (_, i) => i); // 0-23 horas
  minuteValues: number[] = [0, 15, 30, 45]; // Intervalos de 15 minutos

  get incompleteTasks() {
    return this.tasks.filter((task) => !task.completed);
  }

  get completedTasks() {
    return this.tasks.filter((task) => task.completed);
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      due_date: ['', Validators.required],
      subject_id: ['', Validators.required],
      estimated_time: [30, [Validators.required, Validators.min(0)]],
    });

    this.minDate = new Date().toISOString();
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadTasks();

    // Asegurarse de que los valores de hora estén correctamente inicializados
    this.hourValues = Array.from({ length: 24 }, (_, i) => i);
  }

  ionViewWillEnter() {
    // Este método se llama cada vez que la página está a punto de ser mostrada
    this.loadSubjects(); // Recargar las materias
    this.loadTasks(); // Recargar las tareas
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe({
        next: (subjects) => {
          this.subjects = subjects as Subject[];
          subjects.forEach((subject: any) => {
            this.subjectMap.set(subject._id, subject.name);
          });
        },
        error: (error) => {
          this.toastService.showToast('Error al cargar las materias', 'error');
          console.error('Error al cargar las materias:', error);
        },
      });
    }
  }

  loadTasks() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserTasks(userId).subscribe({
        next: (tasks) => {
          this.tasks = tasks;
        },
        error: (error) => {
          this.toastService.showToast('Error al cargar las tareas', 'error');
          console.error('Error al cargar las tareas:', error);
        },
      });
    }
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : 'Materia no encontrada';
  }

  isTaskLate(task: Task): boolean {
    if (task.completed) {
      return new Date(task.completed_date!) > new Date(task.due_date);
    }
    return new Date() > new Date(task.due_date);
  }

  async completeTask(taskId: string | undefined) {
    if (!taskId) return;

    this.apiService.completeTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.toastService.showToast('Tarea completada exitosamente', 'success');
      },
      error: (error) => {
        this.toastService.showToast('Error al completar la tarea', 'error');
        console.error('Error:', error);
      },
    });
  }

  uncompleteTask(taskId: string | undefined) {
    if (!taskId) return;

    this.apiService.uncompleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.toastService.showToast('Tarea marcada como pendiente', 'info');
      },
      error: (error) => {
        this.toastService.showToast('Error al desmarcar la tarea', 'error');
        console.error('Error al desmarcar la tarea:', error);
      },
    });
  }

  deleteTask(taskId: string | undefined) {
    if (!taskId) return;

    this.apiService.deleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.toastService.showToast('Tarea eliminada con éxito', 'success');
      },
      error: (error) => {
        this.toastService.showToast('Error al eliminar la tarea', 'error');
        console.error('Error al eliminar la tarea:', error);
      },
    });
  }

  async addTask() {
    this.isEditing = false;
    this.currentTaskId = null;
    this.taskForm.reset();

    // Establecer una fecha predeterminada (ahora + 1 día)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Mediodía por defecto

    this.taskForm.patchValue({
      due_date: tomorrow.toISOString(),
    });

    this.showModal = true;
  }

  async saveTask() {
    if (this.taskForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.showToast('Error: Usuario no identificado', 'error');
        return;
      }

      const formData = this.taskForm.value;
      const taskData: CreateTaskDTO = {
        user_id: userId,
        subject_id: formData.subject_id,
        description: formData.description,
        due_date: new Date(formData.due_date).toISOString(),
        estimated_time: formData.estimated_time,
      };

      try {
        if (this.isEditing && this.currentTaskId) {
          await this.apiService
            .updateTask(this.currentTaskId, taskData)
            .toPromise();
          this.toastService.showToast('Tarea actualizada con éxito', 'success');
        } else {
          const response = await this.apiService
            .createTask(taskData)
            .toPromise();
          if (response) {
            this.toastService.showToast(
              `Tarea creada: ${response.task_type} (Prioridad: ${response.adjusted_priority})`,
              'success'
            );
          }
        }
        this.dismissModal();
        this.loadTasks();
      } catch (error: any) {
        console.error('Error detallado:', error);
        const errorMessage =
          error.error?.detail || error.message || 'Error al guardar la tarea';
        this.toastService.showToast(errorMessage, 'error');
      }
    }
  }

  dismissModal() {
    this.showModal = false;
    this.taskForm.reset();
    this.currentTaskId = null;
  }

  editTask(task: Task) {
    this.isEditing = true;
    this.currentTaskId = task._id || null;

    // Asegurarse de que los valores de hora estén correctamente configurados
    this.hourValues = Array.from({ length: 24 }, (_, i) => i);

    this.taskForm.patchValue({
      description: task.description,
      due_date: task.due_date,
      subject_id: task.subject_id,
      estimated_time: task.estimated_time,
    });

    this.showModal = true;
  }
}
