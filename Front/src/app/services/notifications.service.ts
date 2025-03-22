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

    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(reminder._id, 16) % 100000, // Convertir _id a un número único
          title: `Recordatorio: ${reminder.taskName}`,
          body: reminder.message || 'Es hora de tu recordatorio',
          schedule: { at: reminderDate },
          sound: 'notification.wav',
          actionTypeId: 'REMINDER_ACTION',
          extra: {
            reminderId: reminder._id,
          },
        },
      ],
    });
  }

  async cancelNotification(reminderId: string) {
    if (!this.platform.is('capacitor')) return;

    const notificationId = parseInt(reminderId, 16) % 100000;
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  }
}
