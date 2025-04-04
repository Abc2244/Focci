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
      // Verificar permisos
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Evitar duplicados
      if (this.scheduledNotifications.has(reminder._id)) {
        // Cancelar notificación existente antes de reprogramar
        await this.cancelNotification(reminder._id);
      }

      // Convertir la fecha del recordatorio a objeto Date
      let reminderDate = new Date(reminder.reminder_date);
      const now = new Date();

      // Verificar si la fecha es válida y futura
      if (isNaN(reminderDate.getTime())) {
        console.error('Fecha inválida:', reminder.reminder_date);
        return false;
      }

      // Si la fecha ya pasó, no programar
      if (reminderDate <= now) {
        console.log('La fecha ya pasó, no se programará:', reminderDate);
        return false;
      }

      console.log('Programando notificación para:', reminderDate.toISOString());

      // Asegurarse de que insistence_level sea un número
      const insistenceLevel = Number(reminder.insistence_level) || 1;

      // Generar un ID único basado en el ID del recordatorio
      let uniqueIdBase: number;
      if (reminder._id) {
        // Usar un hash simple del ID
        uniqueIdBase =
          Math.abs(
            reminder._id.split('').reduce((a: number, b: string) => {
              a = (a << 5) - a + b.charCodeAt(0);
              return a & a;
            }, 0)
          ) % 100000;
      } else {
        uniqueIdBase = Math.floor(Math.random() * 100000);
      }

      // Crear notificaciones según el nivel de insistencia
      const notifications = [];

      // Notificación principal
      notifications.push({
        id: uniqueIdBase,
        title: `Recordatorio: ${reminder.taskName || 'Tarea'}`,
        body: reminder.message || 'Es hora de tu recordatorio',
        schedule: { at: reminderDate },
        sound: 'default',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        extra: {
          reminderId: reminder._id,
          priority: reminder.priority,
        },
      });

      // Notificaciones adicionales según insistencia
      if (insistenceLevel > 5) {
        // Agregar recordatorios cada 3 minutos para mayor insistencia
        const intervalMinutes = insistenceLevel > 8 ? 2 : 3;
        const repeatCount = insistenceLevel > 8 ? 4 : 3;

        for (let i = 1; i <= repeatCount; i++) {
          const repeatDate = new Date(
            reminderDate.getTime() + i * intervalMinutes * 60000
          );
          notifications.push({
            id: uniqueIdBase + i,
            title: `⚠️ Recordatorio Pendiente: ${reminder.taskName || 'Tarea'}`,
            body: `${reminder.message || 'Recordatorio pendiente'} (${i + 1}/${
              repeatCount + 1
            })`,
            schedule: { at: repeatDate },
            sound: 'default',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
          });
        }
      }

      console.log('Notificaciones a programar:', JSON.stringify(notifications));

      // Programar cada notificación individualmente para mayor fiabilidad
      for (const notification of notifications) {
        await LocalNotifications.schedule({
          notifications: [notification],
        });
        console.log(
          'Notificación programada:',
          notification.id,
          'para',
          notification.schedule.at
        );
      }

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
