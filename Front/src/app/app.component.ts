import { Component, OnInit } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {
    this.initializeApp();
  }

  ngOnInit() {
    // El servicio de temas se inicializa automáticamente
  }

  initializeApp() {
    // No es necesario mostrar el splash screen manualmente si autoHide está en true
    SplashScreen.show({
      autoHide: true,
    });
  }
}
