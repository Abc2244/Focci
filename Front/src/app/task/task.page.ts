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
  hourValues: number[] = Array.from({ length: 24 }, (_, i) => i);
  minuteValues: number[] = [0, 15, 30, 45];
  isLoading = false;
  hasError = false;

  get incompleteTasks() {
    return this.tasks
      .filter((task) => !task.completed)
      .sort((a, b) => {
        // Primero por prioridad (mayor a menor)
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        // Luego por fecha de entrega (más cercana primero)
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }

  get completedTasks() {
    return this.tasks
      .filter((task) => task.completed)
      .sort(
        (a, b) =>
          new Date(b.completed_date!).getTime() -
          new Date(a.completed_date!).getTime()
      );
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      due_date: ['', Validators.required],
      subject_id: ['', Validators.required],
      estimated_time: [30, [Validators.required, Validators.min(0)]],
    });

    this.minDate = new Date().toISOString();
  }

  getTaskTypeIcon(type: string | undefined): string {
    switch (type?.toLowerCase()) {
      case 'examen':
        return 'school-outline';
      case 'proyecto':
        return 'build-outline';
      case 'lectura':
        return 'book-outline';
      case 'tarea':
        return 'document-text-outline';
      case 'taller':
        return 'flask-outline';
      case 'general':
        return 'clipboard-outline';
      default:
        return 'clipboard-outline';
    }
  }

  getTaskTypeIconColor(type: string | undefined): string {
    switch (type?.toLowerCase()) {
      case 'examen':
        return '#e74c3c'; // Rojo para exámenes
      case 'proyecto':
        return '#f39c12'; // Naranja para proyectos
      case 'lectura':
        return '#27ae60'; // Verde para lecturas
      case 'tarea':
        return '#3498db'; // Azul para tareas
      case 'taller':
        return '#9b59b6'; // Morado para talleres
      case 'general':
        return '#95a5a6'; // Gris para general
      default:
        return '#95a5a6';
    }
  }

  getNotificationIconColor(): string {
    return '#f1c40f'; // Amarillo para notificaciones (campanita)
  }

  getSubjectIconColor(): string {
    return 'var(--ion-color-primary)'; // Color primary de Ionic para materias
  }

  getCalendarIconColor(): string {
    return 'var(--ion-color-primary)'; // Azul para iconos de calendario
  }

  getTimeIconColor(): string {
    return 'var(--ion-color-success)'; // Verde para iconos de tiempo
  }

  getPriorityClass(priority: number | undefined): string {
    if (!priority) return 'priority-normal';
    switch (priority) {
      case 5:
        return 'priority-critical';
      case 4:
        return 'priority-high';
      case 3:
        return 'priority-medium';
      case 2:
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  }

  getConfidenceColor(confidence: number | undefined): string {
    if (!confidence) return 'medium';
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'primary';
    if (confidence >= 0.4) return 'warning';
    return 'danger';
  }

  formatConfidence(confidence: number | undefined): string {
    if (!confidence) return '';
    return `${(confidence * 100).toFixed(0)}%`;
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadTasks();
  }

  ionViewWillEnter() {
    this.loadSubjects();
    this.loadTasks();
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe({
        next: (subjects: Subject[]) => {
          this.subjects = subjects.map(s => ({...s, userId: s.user_id}));
          this.subjectMap.clear();
          subjects.forEach((subject) => {
            this.subjectMap.set(subject._id || '', subject.name);
          });
        },
        error: (error) => {
          this.subjects = [];
          this.subjectMap.clear();
        },
      });
    }
  }

  loadTasks() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.isLoading = true;
      this.apiService.getUserTasks(userId).subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.isLoading = false;
          this.hasError = false;
        },
        error: (error) => {
          console.error('Error al cargar las tareas:', error);
          this.isLoading = false;
          // Solo mostrar error si no es 404 (no hay tareas)
          if (error.status !== 404) {
            this.hasError = true;
            this.toastService.showToast('Error al cargar las tareas', 'error');
          } else {
            this.hasError = false;
          }
          this.tasks = [];
        },
      });
    } else {
      this.tasks = [];
      this.isLoading = false;
      this.hasError = false;
    }
  }

  getSubjectName(subjectId: string): string {
    return this.subjectMap.get(subjectId) || 'Materia no encontrada';
  }

  isTaskLate(task: Task): boolean {
    if (task.completed) {
      return new Date(task.completed_date!) > new Date(task.due_date);
    }
    return new Date() > new Date(task.due_date);
  }

  isUrgent(task: Task): boolean {
    if (task.completed) return false;

    const now = new Date();
    const dueDate = new Date(task.due_date);
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return diffHours <= 24; // Es urgente si faltan 24 horas o menos
  }

  getTotalEstimatedTime(): number {
    return this.tasks
      .filter((task) => !task.completed)
      .reduce((total, task) => total + (task.estimated_time || 0), 0);
  }

  async completeTask(taskId: string) {
    this.apiService.completeTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.toastService.showToast('¡Tarea completada! 🎉', 'success');
      },
      error: (error) => {
        this.toastService.showToast('Error al completar la tarea', 'error');
        console.error('Error:', error);
      },
    });
  }

  async uncompleteTask(taskId: string) {
    this.apiService.uncompleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks();
        this.toastService.showToast('Tarea reabierta', 'warning');
      },
      error: (error) => {
        this.toastService.showToast('Error al reabrir la tarea', 'error');
        console.error('Error:', error);
      },
    });
  }

  async confirmDeleteTask(taskId: string) {
    const alert = await this.alertController.create({
      header: '¿Eliminar tarea?',
      message: '¿Estás seguro de que deseas eliminar esta tarea? También se eliminarán todos los recordatorios asociados.',
      cssClass: 'custom-alert delete-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
          handler: () => {}
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-button-delete',
          handler: () => {
            this.deleteTask(taskId);
          }
        }
      ]
    });

    await alert.present();
  }

  private deleteTask(taskId: string) {
    this.apiService.deleteTask(taskId).subscribe({
      next: (response: any) => {
        this.loadTasks();
        
        const remindersDeleted = response.details?.reminders_deleted || 0;
        let message = 'Tarea eliminada';
        if (remindersDeleted > 0) {
          message += `. Se eliminaron ${remindersDeleted} recordatorios asociados.`;
        }
        
        this.toastService.showToast(message, 'success');
      },
      error: (error: any) => {
        this.toastService.showToast('Error al eliminar la tarea', 'error');
        console.error('Error:', error);
      },
    });
  }

  addTask() {
    this.isEditing = false;
    this.currentTaskId = null;
    this.taskForm.reset();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    this.taskForm.patchValue({
      due_date: tomorrow.toISOString(),
      estimated_time: 30,
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

      try {
        const formValue = this.taskForm.value;
        const taskData: CreateTaskDTO = {
          user_id: userId,
          subject_id: formValue.subject_id,
          description: formValue.description.trim(),
          due_date: new Date(formValue.due_date).toISOString(),
          estimated_time: formValue.estimated_time,
        };

        if (this.isEditing && this.currentTaskId) {
          await this.apiService
            .updateTask(this.currentTaskId, taskData)
            .toPromise();
          this.toastService.showToast('Tarea actualizada', 'success');
        } else {
          const response = await this.apiService
            .createTask(taskData)
            .toPromise();
          if (response) {
            this.toastService.showToast(
              `Nueva tarea creada: ${response.task_type} (Prioridad: ${response.adjusted_priority})`,
              'success'
            );
          }
        }
        this.dismissModal();
        this.loadTasks();
      } catch (error: any) {
        console.error('Error:', error);
        const errorMessage =
          error.error?.detail || error.message || 'Error al guardar la tarea';
        this.toastService.showToast(errorMessage, 'error');
      }
    } else {
      this.markFormGroupTouched(this.taskForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  dismissModal() {
    this.showModal = false;
    this.taskForm.reset();
    this.currentTaskId = null;
    this.isEditing = false;
  }

  editTask(task: Task) {
    this.isEditing = true;
    this.currentTaskId = task._id || null;

    this.taskForm.patchValue({
      description: task.description,
      due_date: task.due_date,
      subject_id: task.subject_id,
      estimated_time: task.estimated_time,
    });

    this.showModal = true;
  }
}
