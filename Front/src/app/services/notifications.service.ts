import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private isNativePlatform: boolean;

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
    if (this.isNativePlatform) {
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
  async sendTestNotification() {
    if (!this.isNativePlatform) {
      console.log('Las notificaciones solo funcionan en dispositivos nativos');
      return;
    }

    try {
      // Verificar permisos de manera más eficiente
      const permStatus = await LocalNotifications.checkPermissions();

      if (permStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log(
            'Permisos no concedidos, no se pueden mostrar notificaciones'
          );
          return;
        }
      }

      // Usar un tiempo más corto para la notificación de prueba
      const notificationTime = new Date(Date.now() + 1000);

      // Usar un ID único basado en timestamp para evitar conflictos
      const uniqueId = Math.floor(Date.now() % 100000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: uniqueId,
            title: 'Notificación de prueba',
            body: 'Esta es una notificación de prueba para verificar que funcionan correctamente',
            schedule: { at: notificationTime },
            sound: 'default',
            actionTypeId: 'TEST_ACTION',
            smallIcon: 'ic_notification', // Icono para la barra de estado
            largeIcon: 'ic_launcher', // Icono grande para la notificación
          },
        ],
      });
    } catch (error) {
      console.error('Error al programar notificación de prueba:', error);
      throw error;
    }
  }

  async scheduleNotification(reminder: any) {
    if (!this.isNativePlatform) {
      console.log('Las notificaciones solo funcionan en dispositivos nativos');
      return;
    }

    try {
      // Asegurarse de que reminder_date sea un objeto Date
      let reminderDate: Date;
      if (typeof reminder.reminder_date === 'string') {
        reminderDate = new Date(reminder.reminder_date);
      } else {
        reminderDate = reminder.reminder_date;
      }
      
      const now = new Date();

      // Verificar si la fecha es válida
      if (isNaN(reminderDate.getTime())) {
        console.error('Fecha de recordatorio inválida:', reminder.reminder_date);
        return;
      }

      // Si la fecha del recordatorio ya pasó, no programar
      if (reminderDate < now) {
        console.log('La fecha del recordatorio ya pasó, no se programará:', reminderDate);
        return;
      }

      console.log('Programando notificación para:', reminderDate);

      // Asegurarse de que insistence_level sea un número
      const insistenceLevel = typeof reminder.insistence_level === 'string' 
        ? parseInt(reminder.insistence_level) 
        : reminder.insistence_level;

      // Generar un ID único basado en el ID del recordatorio
      let uniqueIdBase: number;
      if (reminder._id) {
        // Usar los primeros 8 caracteres del ID como número hexadecimal
        uniqueIdBase = parseInt(reminder._id.substring(0, 8), 16) % 100000;
      } else {
        // Si no hay ID, usar timestamp actual
        uniqueIdBase = Math.floor(Date.now() % 100000);
      }

      // Crear notificaciones según el nivel de insistencia
      const notifications = [];

      // Notificación principal con sonido y vibración para mayor atención
      notifications.push({
        id: uniqueIdBase,
        title: `Recordatorio: ${reminder.taskName || 'Tarea'}`,
        body: reminder.message || 'Es hora de tu recordatorio',
        schedule: { at: reminderDate },
        sound: 'default',
        vibrate: true,
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        importance: 5, // Alta importancia
        actionTypeId: 'REMINDER_ACTION',
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
            vibrate: true,
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
            importance: 5,
          });
        }
      }

      console.log('Notificaciones a programar:', notifications);
      await LocalNotifications.schedule({ notifications });
      console.log('Notificaciones programadas con éxito');
    } catch (error) {
      console.error('Error al programar notificación:', error);
    }
  }

  async cancelNotification(reminderId: string) {
    if (!this.isNativePlatform) return;

    try {
      const baseId = parseInt(reminderId.substring(0, 8), 16) % 100000;
      const notificationsToCancel = [];

      // Cancelar la notificación principal
      notificationsToCancel.push({ id: baseId });

      // Cancelar posibles notificaciones de insistencia (hasta 5 por si acaso)
      for (let i = 1; i <= 5; i++) {
        notificationsToCancel.push({ id: baseId + i });
      }

      await LocalNotifications.cancel({ notifications: notificationsToCancel });
    } catch (error) {
      console.error('Error al cancelar notificación:', error);
    }
  }
}
