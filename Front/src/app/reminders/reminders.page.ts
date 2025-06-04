import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, IonModal, ToastController } from '@ionic/angular';
import { ToastService } from '../services/toast.service';
import { NotificationsService } from '../services/notifications.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.page.html',
  styleUrls: ['./reminders.page.scss'],
})
export class RemindersPage implements OnInit, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;
  presentingElement: HTMLElement | null = null;

  reminders: any[] = [];
  pendingReminders: any[] = [];
  completedReminders: any[] = [];
  canceledReminders: any[] = [];
  tasks: any[] = [];
  showModal = false;
  isEditing = false;
  isLoading = true;
  reminderForm: FormGroup = this.initForm();
  currentReminderId: string | null = null;
  minDate: string = new Date().toISOString();
  currentDate = new Date();
  private dateUpdateInterval: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private toastService: ToastService,
    private notificationsService: NotificationsService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadReminders();
    this.loadTasks();
    this.requestNotificationPermissions();
    this.scheduleAllPendingReminders();
    this.presentingElement = document.querySelector('.ion-page');
    this.dateUpdateInterval = setInterval(() => {
      this.currentDate = new Date();
    }, 60000); // Actualizar cada minuto
  }

  ngOnDestroy() {
    if (this.dateUpdateInterval) {
      clearInterval(this.dateUpdateInterval);
    }
    this.loadReminders();
    this.loadTasks();
  }

  ionViewWillEnter() {
    this.loadReminders();
    this.loadTasks();
  }

  // Inicializar el formulario
  private initForm(): FormGroup {
    return this.fb.group({
      reminder_date: ['', Validators.required],
      priority: [
        '3',
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      task_id: ['', Validators.required],
      message: ['', Validators.required],
      status: ['pendiente', Validators.required],
      insistence_level: [
        '1',
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
    });
  }

  // Método para cerrar el modal
  dismissModal() {
    this.showModal = false;
    this.isEditing = false;
    this.currentReminderId = null;
    this.reminderForm.reset({
      reminder_date: '',
      priority: '3',
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: '1',
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
    
    // Verificar y actualizar recordatorios vencidos
    const now = new Date();
    this.reminders.forEach(async (reminder) => {
      const reminderDate = new Date(reminder.reminder_date);
      if (reminder.status === 'pendiente' && reminderDate < now) {
        // Actualizar el estado a completado automáticamente
        await this.updateReminderStatus(reminder._id, 'completado', true);
      }
    });

    // Filtrar recordatorios después de la actualización
    this.pendingReminders = this.reminders.filter(
      (reminder) => {
        const reminderDate = new Date(reminder.reminder_date);
        return reminder.status === 'pendiente' && reminderDate >= now;
      }
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
    level = Number(level);
    if (level === 0) return 'Muy Baja';
    if (level <= 3) return 'Baja';
    if (level <= 7) return 'Media';
    if (level <= 9) return 'Alta';
    return 'Urgente';
  }

  // Nuevas funciones para la interfaz mejorada
  getReminderIcon(reminder: any): string {
    const priority = Number(reminder.priority);
    const level = Number(reminder.insistence_level);
    
    if (priority >= 5 || level >= 8) {
      return 'alarm'; // Icono de alarma para alta prioridad
    } else if (priority >= 3 || level >= 5) {
      return 'notifications'; // Icono de notificación para media prioridad
    } else {
      return 'notifications-outline'; // Icono suave para baja prioridad
    }
  }

  getPriorityColorClass(priority: number): string {
    switch (Number(priority)) {
      case 1:
        return 'priority-low'; // Verde
      case 2:
        return 'priority-medium-low'; // Amarillo claro
      case 3:
        return 'priority-medium'; // Naranja
      case 4:
        return 'priority-medium-high'; // Rojo claro
      case 5:
        return 'priority-high'; // Rojo
      default:
        return 'priority-medium';
    }
  }

  getStatusColorClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'status-pending';
      case 'completado':
        return 'status-completed';
      case 'cancelado':
        return 'status-canceled';
      default:
        return 'status-pending';
    }
  }

  getInsistenceColorClass(level: number): string {
    level = Number(level);
    if (level <= 2) return 'insistence-very-low';
    if (level <= 4) return 'insistence-low';
    if (level <= 6) return 'insistence-medium';
    if (level <= 8) return 'insistence-high';
    return 'insistence-critical';
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
      priority: '3',
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: '1',
    });
    this.showModal = true;
  }

  // Método para editar un recordatorio
  editReminder(reminder: any): void {
    this.isEditing = true;
    this.currentReminderId = reminder._id;

    // Convertir los valores numéricos a string para el formulario
    const formValues = {
      reminder_date: reminder.reminder_date,
      priority: reminder.priority.toString(),
      task_id: reminder.task_id,
      message: reminder.message,
      status: reminder.status,
      insistence_level: reminder.insistence_level.toString(),
    };

    console.log('Setting form values:', formValues);
    this.reminderForm.patchValue(formValues);
    this.showModal = true;
  }

  // Método para reactivar un recordatorio
  reactivateReminder(reminderId: string): void {
    this.updateReminderStatus(reminderId, 'pendiente');
  }

  // Método para actualizar el estado de un recordatorio
  updateReminderStatus(reminderId: string, newStatus: string, isAutoComplete: boolean = false): void {
    const updateData = {
      status: newStatus,
      completed_date: newStatus === 'completado' ? new Date().toISOString() : null,
      auto_completed: isAutoComplete // Nuevo campo para indicar si fue autocompletado
    };

    this.apiService.updateReminder(reminderId, updateData).subscribe(
      async (response: any) => {
        if (!isAutoComplete) {
          // Solo mostrar el toast si no es autocompletado
          this.toastService.showToast(
            `Recordatorio ${newStatus === 'completado' ? 'completado' : 'reactivado'}`,
            'success'
          );
        }
        
        // Actualizar la lista de recordatorios
        const reminderIndex = this.reminders.findIndex(r => r._id === reminderId);
        if (reminderIndex !== -1) {
          this.reminders[reminderIndex] = { ...this.reminders[reminderIndex], ...updateData };
          this.filterReminders();
        }

        // Cancelar la notificación si se completa
        if (newStatus === 'completado') {
          await this.notificationsService.cancelNotification(reminderId);
        }
        // Programar la notificación si se reactiva
        else if (newStatus === 'pendiente') {
          const reminder = this.reminders.find((r) => r._id === reminderId);
          if (reminder) {
            await this.notificationsService.scheduleNotification(reminder);
          }
        }
      },
      (error: any) => {
        console.error('Error updating reminder status:', error);
        if (!isAutoComplete) {
          this.toastService.showToast('Error al actualizar el recordatorio', 'error');
        }
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

  // Método para guardar el recordatorio
  async saveReminder() {
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

      // Obtener los valores del formulario y convertir los valores numéricos
      const formData = {
        ...this.reminderForm.value,
        priority: parseInt(this.reminderForm.value.priority),
        insistence_level: parseInt(this.reminderForm.value.insistence_level),
        user_id: userId,
      };

      // Asegurarse de que la fecha sea un string ISO
      if (
        formData.reminder_date &&
        typeof formData.reminder_date === 'object'
      ) {
        formData.reminder_date = formData.reminder_date.toISOString();
      }

      if (this.isEditing && this.currentReminderId) {
        await this.apiService
          .updateReminder(this.currentReminderId, formData)
          .toPromise();
        this.toastService.showToast('Recordatorio actualizado', 'success');
      } else {
        await this.apiService.createReminder(formData).toPromise();
        this.toastService.showToast('Recordatorio creado', 'success');
      }

      this.loadReminders();
      this.dismissModal();
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
      priority: '3',
      task_id: '',
      message: '',
      status: 'pendiente',
      insistence_level: '1',
    });
    this.currentReminderId = null;
    this.isEditing = false;
  }

  isReminderExpired(reminderDate: string): boolean {
    return new Date(reminderDate) < this.currentDate;
  }
}
