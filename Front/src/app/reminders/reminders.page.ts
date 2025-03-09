import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.page.html',
  styleUrls: ['./reminders.page.scss'],
})
export class RemindersPage implements OnInit {
  reminders: any[] = [];
  pendingReminders: any[] = [];
  completedReminders: any[] = [];
  canceledReminders: any[] = [];
  tasks: any[] = [];
  showModal = false;
  isEditing = false;
  isLoading = true;
  reminderForm: FormGroup;
  currentReminderId: string | null = null;
  minDate: string = new Date().toISOString();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private toastService: ToastService
  ) {
    this.reminderForm = this.fb.group({
      reminder_date: ['', Validators.required],
      priority: [3, Validators.required],
      task_id: ['', Validators.required],
      message: ['', Validators.required],
      status: ['pendiente', Validators.required],
      insistence_level: [
        1,
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
    });
  }

  ngOnInit() {
    this.loadReminders();
    this.loadTasks();
  }

  loadReminders(): void {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUpcomingReminders(userId).subscribe(
        (data: any) => {
          this.reminders = data;
          this.filterReminders();
          this.isLoading = false;
        },
        (error: any) => {
          this.isLoading = false;
          this.toastService.showToast('Error al cargar recordatorios', 'error');
        }
      );
    } else {
      this.isLoading = false;
      this.toastService.showToast('Usuario no identificado', 'error');
    }
  }

  filterReminders(): void {
    this.pendingReminders = this.reminders.filter(
      (reminder) => reminder.status === 'pendiente'
    );
    this.completedReminders = this.reminders.filter(
      (reminder) => reminder.status === 'completado'
    );
    this.canceledReminders = this.reminders.filter(
      (reminder) => reminder.status === 'cancelado'
    );
  }

  getTaskName(taskId: string): string {
    const task = this.tasks.find((t) => t._id === taskId);
    return task ? task.description : 'Tarea no encontrada';
  }

  getPriorityText(priority: number): string {
    switch (Number(priority)) {
      case 1:
        return 'Baja';
      case 2:
        return 'Media-Baja';
      case 3:
        return 'Media';
      case 4:
        return 'Media-Alta';
      case 5:
        return 'Alta';
      default:
        return 'No definida';
    }
  }

  getInsistenceClass(level: number): string {
    level = Number(level);
    if (level <= 3) return 'insistence-low';
    if (level <= 7) return 'insistence-medium';
    return 'insistence-high';
  }

  getInsistenceText(level: number): string {
    const levels = [
      'Muy Baja',
      'Baja',
      'Baja-Media',
      'Media-Baja',
      'Media',
      'Media-Alta',
      'Alta-Media',
      'Alta',
      'Muy Alta',
      'Crítica',
      'Urgente',
    ];
    return levels[level] || 'Media';
  }

  loadTasks(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getTasks(userId).subscribe(
        (data: any) => {
          this.tasks = data;
        },
        (error: any) => {
          this.toastService.showToast('Error al cargar tareas', 'error');
        }
      );
    }
  }

  openAddReminderModal(): void {
    this.isEditing = false;
    this.currentReminderId = null;
    this.reminderForm.reset({
      reminder_date: new Date().toISOString(),
      priority: 3,
      message: '',
      status: 'pendiente',
      insistence_level: 1,
    });
    this.showModal = true;
  }

  editReminder(reminder: any): void {
    this.isEditing = true;
    this.currentReminderId = reminder._id;
    this.reminderForm.setValue({
      reminder_date: reminder.reminder_date,
      priority: reminder.priority,
      task_id: reminder.task_id,
      message: reminder.message || '',
      status: reminder.status,
      insistence_level: reminder.insistence_level,
    });
    this.showModal = true;
  }

  cancelModal(): void {
    this.showModal = false;
  }

  saveReminder(): void {
    if (this.reminderForm.invalid) {
      this.toastService.showToast(
        'Por favor complete todos los campos',
        'warning'
      );
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastService.showToast('Usuario no identificado', 'error');
      return;
    }

    const reminderData = { ...this.reminderForm.value, user_id: userId };

    if (this.isEditing && this.currentReminderId) {
      this.apiService
        .updateReminder(this.currentReminderId, reminderData)
        .subscribe(
          () => {
            this.loadReminders();
            this.showModal = false;
            this.toastService.showToast('Recordatorio actualizado', 'success');
          },
          () => {
            this.toastService.showToast(
              'Error al actualizar recordatorio',
              'error'
            );
          }
        );
    } else {
      this.apiService.createReminder(reminderData).subscribe(
        () => {
          this.loadReminders();
          this.showModal = false;
          this.toastService.showToast('Recordatorio creado', 'success');
        },
        () => {
          this.toastService.showToast('Error al crear recordatorio', 'error');
        }
      );
    }
  }

  deleteReminder(reminderId: string): void {
    this.apiService.deleteReminder(reminderId).subscribe(
      () => {
        this.loadReminders();
        this.toastService.showToast('Recordatorio eliminado', 'success');
      },
      () => {
        this.toastService.showToast('Error al eliminar recordatorio', 'error');
      }
    );
  }

  completeReminder(reminderId: string): void {
    const reminder = this.reminders.find((r) => r._id === reminderId);
    if (!reminder) return;

    const updatedReminder = {
      ...reminder,
      status: 'completado',
      completed_date: new Date().toISOString(),
    };

    this.apiService.updateReminder(reminderId, updatedReminder).subscribe(
      () => {
        this.loadReminders();
        this.toastService.showToast('Recordatorio completado', 'success');
      },
      () => {
        this.toastService.showToast('Error al completar recordatorio', 'error');
      }
    );
  }

  reactivateReminder(reminderId: string): void {
    const reminder = this.reminders.find((r) => r._id === reminderId);
    if (!reminder) return;

    const updatedReminder = {
      ...reminder,
      status: 'pendiente',
      completed_date: null,
    };

    this.apiService.updateReminder(reminderId, updatedReminder).subscribe(
      () => {
        this.loadReminders();
        this.toastService.showToast('Recordatorio reactivado', 'info');
      },
      () => {
        this.toastService.showToast('Error al reactivar recordatorio', 'error');
      }
    );
  }

  dismissModal(): void {
    this.showModal = false;
  }
}
