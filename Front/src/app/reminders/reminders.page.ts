import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { ToastService } from '../services/toast.service';
import { NotificationsService } from '../services/notifications.service';
import { LocalNotifications } from '@capacitor/local-notifications';

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
    private toastService: ToastService,
    private notificationsService: NotificationsService
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
    this.requestNotificationPermissions();
    this.scheduleAllPendingReminders();
  }

  ionViewWillEnter() {
    this.loadReminders();
    this.loadTasks();
  }

  // Método para cerrar el modal
  dismissModal() {
    this.showModal = false;
    this.isEditing = false;
    this.currentReminderId = null;
    this.reminderForm.reset({
      reminder_date: '',
      priority: 3,
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: 1,
    });
  }

  loadReminders(): void {
    this.isLoading = true;
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      console.log('Fetching reminders for user:', userId);
      this.apiService.getUpcomingReminders(userId).subscribe(
        (data: any) => {
          console.log('Received reminders:', data);
          this.reminders = data;
          this.filterReminders();
          this.isLoading = false;
        },
        (error: any) => {
          console.error('Error loading reminders:', error);
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
    console.log('Filtering reminders. Total:', this.reminders.length);
    this.pendingReminders = this.reminders.filter(
      (reminder) => reminder.status === 'pendiente'
    );
    console.log('Pending reminders:', this.pendingReminders.length);
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
    level = Number(level);
    if (level === 0) return 'Muy Baja';
    if (level <= 3) return 'Baja';
    if (level <= 7) return 'Media';
    if (level <= 9) return 'Alta';
    return 'Urgente';
  }

  loadTasks(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserTasks(userId).subscribe(
        (data: any) => {
          this.tasks = data;
        },
        (error: any) => {
          console.error('Error loading tasks:', error);
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
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: 1,
    });
    this.showModal = true;
  }

  // Método para editar un recordatorio
  editReminder(reminder: any): void {
    this.isEditing = true;
    this.currentReminderId = reminder._id;
    this.reminderForm.setValue({
      reminder_date: reminder.reminder_date,
      priority: Number(reminder.priority),
      task_id: reminder.task_id,
      message: reminder.message,
      status: reminder.status,
      insistence_level: Number(reminder.insistence_level),
    });
    this.showModal = true;
  }

  // Método para completar un recordatorio
  completeReminder(reminderId: string): void {
    this.updateReminderStatus(reminderId, 'completado');
  }

  // Método para reactivar un recordatorio
  reactivateReminder(reminderId: string): void {
    this.updateReminderStatus(reminderId, 'pendiente');
  }

  // Método para actualizar el estado de un recordatorio
  updateReminderStatus(reminderId: string, newStatus: string): void {
    // Crear objeto con los datos a actualizar
    const updateData = {
      status: newStatus,
      completed_date:
        newStatus === 'completado' ? new Date().toISOString() : null,
    };

    this.apiService.updateReminder(reminderId, updateData).subscribe(
      async (response: any) => {
        this.toastService.showToast(
          `Recordatorio ${
            newStatus === 'completado' ? 'completado' : 'reactivado'
          }`,
          'success'
        );
        this.loadReminders();

        // Si se completa, cancelar la notificación
        if (newStatus === 'completado') {
          await this.notificationsService.cancelNotification(reminderId);
        }
        // Si se reactiva, programar la notificación
        else if (newStatus === 'pendiente') {
          const reminder = this.reminders.find((r) => r._id === reminderId);
          if (reminder) {
            await this.notificationsService.scheduleNotification(reminder);
          }
        }
      },
      (error: any) => {
        console.error('Error updating reminder status:', error);
        this.toastService.showToast(
          'Error al actualizar el recordatorio',
          'error'
        );
      }
    );
  }

  // Método para eliminar un recordatorio
  deleteReminder(reminderId: string): void {
    this.apiService.deleteReminder(reminderId).subscribe(
      async (response: any) => {
        this.toastService.showToast('Recordatorio eliminado', 'success');
        this.loadReminders();

        // Cancelar la notificación asociada
        await this.notificationsService.cancelNotification(reminderId);
      },
      (error: any) => {
        console.error('Error deleting reminder:', error);
        this.toastService.showToast(
          'Error al eliminar el recordatorio',
          'error'
        );
      }
    );
  }

  saveReminder() {
    if (this.reminderForm.invalid) {
      console.log('Form invalid:', this.reminderForm.errors);
      return;
    }

    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.showToast('Usuario no autenticado', 'error');
        return;
      }

      // Obtener los valores del formulario
      const formData = { ...this.reminderForm.value };

      // Asegurarse de que la fecha sea un string ISO
      if (
        formData.reminder_date &&
        typeof formData.reminder_date === 'object'
      ) {
        formData.reminder_date = formData.reminder_date.toISOString();
      }

      // Convertir valores numéricos
      formData.priority = Number(formData.priority);
      formData.insistence_level = Number(formData.insistence_level);

      // Añadir el ID de usuario
      formData.user_id = userId;

      // Añadir el nombre de la tarea para referencia
      formData.taskName = this.getTaskName(formData.task_id);

      // Añadir un ID temporal para la notificación si es nuevo
      if (!this.isEditing) {
        formData._id = `temp_${Date.now()}`;
      } else {
        formData._id = this.currentReminderId;
      }

      console.log('Saving reminder with formatted data:', formData);

      if (this.isEditing && this.currentReminderId) {
        this.apiService
          .updateReminder(this.currentReminderId, formData)
          .subscribe(
            async (response: any) => {
              console.log('Reminder updated:', response);
              this.toastService.showToast(
                'Recordatorio actualizado',
                'success'
              );
              this.loadReminders();
              this.dismissModal();

              // Actualizar la notificación
              await this.notificationsService.cancelNotification(
                this.currentReminderId!
              );
              await this.notificationsService.scheduleNotification({
                ...formData,
                _id: this.currentReminderId,
              });
            },
            (error: any) => {
              console.error('Error updating reminder:', error);
              this.toastService.showToast(
                'Error al actualizar recordatorio',
                'error'
              );
            }
          );
      } else {
        this.apiService.createReminder(formData).subscribe(
          async (response: any) => {
            console.log('Reminder created:', response);
            this.toastService.showToast('Recordatorio creado', 'success');
            this.loadReminders();
            this.dismissModal();

            // Programar la notificación para el nuevo recordatorio
            await this.notificationsService.scheduleNotification({
              ...formData,
              _id: response.reminder_id,
            });
          },
          (error: any) => {
            console.error('Error creating reminder:', error);
            this.toastService.showToast('Error al crear recordatorio', 'error');
          }
        );
      }
    } catch (error) {
      console.error('Error in saveReminder:', error);
      this.toastService.showToast('Error al guardar recordatorio', 'error');
    }
  }

  async requestNotificationPermissions() {
    try {
      // Solicitar permisos para notificaciones
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  async testNotification() {
    try {
      // Mostrar una notificación de prueba
      const success = await this.notificationsService.sendTestNotification();
      if (success) {
        this.toastService.showToast(
          'Notificación de prueba enviada',
          'success'
        );
      } else {
        this.toastService.showToast('Error al enviar notificación', 'error');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      this.toastService.showToast('Error al probar notificación', 'error');
    }
  }

  async scheduleAllPendingReminders() {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      // Primero, resetear todas las notificaciones para evitar duplicados
      await this.notificationsService.resetAllNotifications();

      this.apiService.getUpcomingReminders(userId).subscribe(
        async (reminders: any[]) => {
          const pendingReminders = reminders.filter(
            (reminder) => reminder.status === 'pendiente'
          );

          console.log(
            `Programando ${pendingReminders.length} recordatorios pendientes`
          );

          for (const reminder of pendingReminders) {
            // Añadir el nombre de la tarea para las notificaciones
            reminder.taskName = this.getTaskName(reminder.task_id);

            // Programar la notificación
            const success =
              await this.notificationsService.scheduleNotification(reminder);
            if (success) {
              console.log(`Notificación programada para: ${reminder._id}`);
            } else {
              console.error(
                `Error al programar notificación para: ${reminder._id}`
              );
            }
          }

          // Verificar notificaciones programadas
          const pending = await LocalNotifications.getPending();
          console.log(
            `Total de notificaciones programadas: ${pending.notifications.length}`
          );
        },
        (error: any) => {
          console.error('Error al obtener recordatorios:', error);
          this.toastService.showToast(
            'Error al programar recordatorios',
            'error'
          );
        }
      );
    } catch (error) {
      console.error('Error general en scheduleAllPendingReminders:', error);
    }
  }

  onWillDismiss(event: any) {
    this.showModal = false;
    this.reminderForm.reset({
      reminder_date: new Date().toISOString(),
      priority: 3,
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: 1,
    });
    this.currentReminderId = null;
    this.isEditing = false;
  }
}
