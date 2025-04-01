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
    this.initializeApp();
  }

  initializeApp() {
    // No es necesario mostrar el splash screen manualmente si autoHide está en true
    // SplashScreen.show();
  }
}
