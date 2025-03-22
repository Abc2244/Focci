import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private platform: Platform) {
    this.initializeNotifications();
  }

  async initializeNotifications() {
    if (this.platform.is('capacitor')) {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    }
  }

  async scheduleNotification(reminder: any) {
    if (!this.platform.is('capacitor')) return;

    const reminderDate = new Date(reminder.reminder_date);
    const insistenceLevel = parseInt(reminder.insistence_level);

    // Crear notificaciones según el nivel de insistencia
    const notifications = [];

    // Notificación principal
    notifications.push({
      id: parseInt(reminder._id, 16) % 100000,
      title: `Recordatorio: ${reminder.taskName}`,
      body: reminder.message || 'Es hora de tu recordatorio',
      schedule: { at: reminderDate },
      sound: 'notification.wav',
      actionTypeId: 'REMINDER_ACTION',
      extra: {
        reminderId: reminder._id,
        priority: reminder.priority,
      },
    });

    // Notificaciones adicionales según insistencia
    if (insistenceLevel > 5) {
      // Agregar recordatorios cada 5 minutos
      for (let i = 1; i <= 3; i++) {
        const repeatDate = new Date(reminderDate.getTime() + i * 5 * 60000);
        notifications.push({
          id: (parseInt(reminder._id, 16) % 100000) + i,
          title: `⚠️ Recordatorio Pendiente: ${reminder.taskName}`,
          body: `${reminder.message} (Recordatorio ${i + 1}/4)`,
          schedule: { at: repeatDate },
          sound: 'notification_urgent.wav',
        });
      }
    }

    await LocalNotifications.schedule({ notifications });
  }

  async cancelNotification(reminderId: string) {
    if (!this.platform.is('capacitor')) return;

    const notificationId = parseInt(reminderId, 16) % 100000;
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  }
}
