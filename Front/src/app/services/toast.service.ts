import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ThemeService } from './theme.service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(
    private toastController: ToastController,
    private themeService: ThemeService
  ) {}

  /**
   * Muestra un toast con un estilo consistente en toda la aplicación
   * @param message Mensaje a mostrar
   * @param type Tipo de toast (success, error, warning, info)
   * @param duration Duración en milisegundos (por defecto 3000ms)
   */
  async showToast(
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) {
    const isDark = this.themeService.isDarkMode();
    
    const toastConfig = {
      success: { icon: 'checkmark-circle', emoji: '✨' },
      error: { icon: 'close-circle', emoji: '❌' },
      warning: { icon: 'warning', emoji: '⚠️' },
      info: { icon: 'information-circle', emoji: 'ℹ️' }
    };

    const config = toastConfig[type];
    const formattedMessage = `${config.emoji} ${message}`;

    const toast = await this.toastController.create({
      message: formattedMessage,
      duration: duration,
      position: 'top',
      cssClass: `app-toast toast-${type} ${isDark ? 'dark-toast' : 'light-toast'}`,
      animated: true,
      buttons: [
        {
          icon: config.icon,
          side: 'start',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
    return toast;
  }
}
