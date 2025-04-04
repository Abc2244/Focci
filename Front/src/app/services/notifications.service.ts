import { Injectable } from '@angular/core';
import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private isNativePlatform: boolean;
  private scheduledNotifications: Set<string> = new Set();

  constructor(private platform: Platform) {
    // Determinar si estamos en una plataforma nativa una sola vez
    this.isNativePlatform =
      this.platform.is('capacitor') ||
      this.platform.is('cordova') ||
      this.platform.is('android') ||
      this.platform.is('ios');

    this.initializeNotifications();
  }

  async initializeNotifications() {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Registrar listener para notificaciones
      LocalNotifications.addListener(
        'localNotificationReceived',
        (notification) => {
          console.log('Notificación recibida:', notification);
        }
      );

      // Limpiar notificaciones antiguas al iniciar
      await this.clearOldNotifications();
    } catch (error) {
      console.error('Error al inicializar notificaciones:', error);
    }
  }

  // Método para limpiar notificaciones antiguas
  private async clearOldNotifications() {
    try {
      const pendingNotifications = await LocalNotifications.getPending();
      if (
        pendingNotifications &&
        pendingNotifications.notifications.length > 0
      ) {
        const now = new Date().getTime();
        const oldNotifications = pendingNotifications.notifications.filter(
          (n) => {
            if (n.schedule && n.schedule.at) {
              const notificationTime = new Date(n.schedule.at).getTime();
              return notificationTime < now;
            }
            return false;
          }
        );

        if (oldNotifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: oldNotifications,
          });
        }
      }
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
    }
  }

  // Método de prueba para enviar una notificación inmediata
  async sendTestNotification(): Promise<boolean> {
    try {
      // Verificar permisos
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log(
            'Permisos no concedidos, no se pueden mostrar notificaciones'
          );
          return false;
        }
      }

      // Usar un tiempo más corto para la notificación de prueba (5 segundos)
      const notificationTime = new Date(Date.now() + 5000);
      const uniqueId = Math.floor(Math.random() * 100000);

      console.log('Programando notificación de prueba para:', notificationTime);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: uniqueId,
            title: 'Notificación de prueba',
            body: 'Esta es una notificación de prueba para verificar que funcionan correctamente',
            schedule: { at: notificationTime },
            sound: 'default',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
          },
        ],
      });

      console.log('Notificación de prueba programada con ID:', uniqueId);
      return true;
    } catch (error) {
      console.error('Error al programar notificación de prueba:', error);
      return false;
    }
  }

  async scheduleNotification(reminder: any): Promise<boolean> {
    try {
      if (!reminder || !reminder._id || !reminder.reminder_date) {
        console.error('Fecha inválida:', reminder?.reminder_date);
        return false;
      }

      // Verificar si ya existe una notificación programada para este recordatorio
      if (this.scheduledNotifications.has(reminder._id)) {
        // Cancelar la notificación existente antes de reprogramarla
        await this.cancelNotification(reminder._id);
      }

      // Generar un ID único basado en el ID del recordatorio
      const uniqueId =
        Math.abs(
          reminder._id.split('').reduce((a: number, b: string) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0)
        ) % 100000;

      // Convertir la fecha a objeto Date si es string
      const reminderDate =
        typeof reminder.reminder_date === 'string'
          ? new Date(reminder.reminder_date)
          : reminder.reminder_date;

      // Verificar si la fecha es válida y futura
      const now = new Date();
      if (
        !(reminderDate instanceof Date) ||
        isNaN(reminderDate.getTime()) ||
        reminderDate <= now
      ) {
        console.error('Fecha de recordatorio inválida o pasada:', reminderDate);
        return false;
      }

      // Obtener el título y mensaje para la notificación
      const taskName = reminder.taskName || 'Tarea';
      const title = `Recordatorio: ${taskName}`;
      const message = reminder.message || 'Es hora de tu recordatorio';

      // Configurar la notificación
      const notificationOptions: ScheduleOptions = {
        notifications: [
          {
            id: uniqueId,
            title: title,
            body: message,
            schedule: {
              at: reminderDate,
              allowWhileIdle: true,
            },
            sound: 'default',
            smallIcon: 'ic_notification',
            actionTypeId: '',
            extra: {
              reminderId: reminder._id,
              taskId: reminder.task_id,
            },
          },
        ],
      };

      // Programar la notificación
      await LocalNotifications.schedule(notificationOptions);
      console.log(
        `Notificación programada para: ${reminderDate.toLocaleString()} (ID: ${uniqueId})`
      );

      // Registrar la notificación como programada
      this.scheduledNotifications.add(reminder._id);

      return true;
    } catch (error) {
      console.error('Error al programar notificación:', error);
      return false;
    }
  }

  async cancelNotification(reminderId: string): Promise<boolean> {
    try {
      // Generar el mismo ID base que se usó al programar
      const uniqueIdBase =
        Math.abs(
          reminderId.split('').reduce((a: number, b: string) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0)
        ) % 100000;

      const notificationsToCancel = [];

      // Cancelar la notificación principal
      notificationsToCancel.push({ id: uniqueIdBase });

      // Cancelar posibles notificaciones de insistencia (hasta 5 por si acaso)
      for (let i = 1; i <= 5; i++) {
        notificationsToCancel.push({ id: uniqueIdBase + i });
      }

      await LocalNotifications.cancel({ notifications: notificationsToCancel });
      console.log('Notificaciones canceladas para ID:', reminderId);

      // Eliminar de las notificaciones programadas
      this.scheduledNotifications.delete(reminderId);
      return true;
    } catch (error) {
      console.error('Error al cancelar notificación:', error);
      return false;
    }
  }

  // Método para verificar notificaciones pendientes (útil para depuración)
  async getPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      console.log('Notificaciones pendientes:', pending.notifications);
      return pending.notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones pendientes:', error);
      return [];
    }
  }

  // Método para limpiar y reprogramar todas las notificaciones
  async resetAllNotifications(): Promise<boolean> {
    try {
      // Cancelar todas las notificaciones pendientes
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications,
        });
        console.log('Todas las notificaciones canceladas');
      }

      // Limpiar el registro de notificaciones programadas
      this.scheduledNotifications.clear();
      return true;
    } catch (error) {
      console.error('Error al resetear notificaciones:', error);
      return false;
    }
  }
}
