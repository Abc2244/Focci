import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

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
    private toastController: ToastController
  ) {
    this.reminderForm = this.fb.group({
      reminder_date: ['', Validators.required],
      priority: [3, Validators.required],
      task_id: ['', Validators.required],
      status: ['pendiente', Validators.required],
      insistence_level: [
        1,
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
    });
  }

  ngOnInit() {
    console.log('RemindersPage initialized');
    this.loadReminders();
    this.loadTasks();
  }

  loadReminders(): void {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();
    console.log('Current User ID:', userId);
    if (userId) {
      this.apiService.getUpcomingReminders(userId).subscribe(
        (data: any) => {
          console.log('Reminders Data Structure:', data);
          this.reminders = data;
          this.filterReminders();
          this.isLoading = false;
        },
        (error: any) => {
          console.error('Error loading reminders:', error);
          this.isLoading = false;
          this.presentToast('Error al cargar recordatorios', 'danger');
        }
      );
    } else {
      console.error('User ID not found');
      this.isLoading = false;
      this.presentToast('Usuario no identificado', 'danger');
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

  loadTasks(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getTasks(userId).subscribe(
        (data: any) => {
          this.tasks = data;
        },
        (error: any) => {
          console.error('Error loading tasks:', error);
          this.presentToast('Error al cargar tareas', 'danger');
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
      this.presentToast('Por favor complete todos los campos', 'warning');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.presentToast('Usuario no identificado', 'danger');
      return;
    }

    const reminderData = {
      ...this.reminderForm.value,
      user_id: userId,
    };

    if (this.isEditing && this.currentReminderId) {
      this.apiService
        .updateReminder(this.currentReminderId, reminderData)
        .subscribe(
          () => {
            this.loadReminders();
            this.showModal = false;
            this.presentToast('Recordatorio actualizado', 'success');
          },
          (error: any) => {
            console.error('Error updating reminder:', error);
            this.presentToast('Error al actualizar recordatorio', 'danger');
          }
        );
    } else {
      this.apiService.createReminder(reminderData).subscribe(
        () => {
          this.loadReminders();
          this.showModal = false;
          this.presentToast('Recordatorio creado', 'success');
        },
        (error: any) => {
          console.error('Error creating reminder:', error);
          this.presentToast('Error al crear recordatorio', 'danger');
        }
      );
    }
  }

  deleteReminder(reminderId: string): void {
    this.apiService.deleteReminder(reminderId).subscribe(
      () => {
        this.loadReminders();
        this.presentToast('Recordatorio eliminado', 'success');
      },
      (error: any) => {
        console.error('Error deleting reminder:', error);
        this.presentToast('Error al eliminar recordatorio', 'danger');
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
        this.presentToast('Recordatorio completado', 'success');
      },
      (error: any) => {
        console.error('Error completing reminder:', error);
        this.presentToast('Error al completar recordatorio', 'danger');
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
        this.presentToast('Recordatorio reactivado', 'success');
      },
      (error: any) => {
        console.error('Error reactivating reminder:', error);
        this.presentToast('Error al reactivar recordatorio', 'danger');
      }
    );
  }

  // Método para convertir el nivel de prioridad numérico a texto
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

  // Método para obtener la clase CSS según el nivel de insistencia
  getInsistenceClass(level: number): string {
    level = Number(level);
    if (level >= 0 && level <= 3) {
      return 'insistence-low';
    } else if (level >= 4 && level <= 7) {
      return 'insistence-medium';
    } else {
      return 'insistence-high';
    }
  }

  // Método para convertir el nivel de insistencia numérico a texto
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

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom',
    });
    toast.present();
  }

  dismissModal() {
    this.showModal = false;
  }
}
