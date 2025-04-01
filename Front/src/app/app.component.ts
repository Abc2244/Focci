import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    this.showSplash();
  }
  async showSplash() {
    await SplashScreen.show({
      showDuration: 3000,
      autoHide: true,
    });
  }
}
