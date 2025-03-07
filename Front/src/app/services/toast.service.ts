import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastController: ToastController) {}

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
    // Determinar el ícono según el tipo
    let icon: string;

    switch (type) {
      case 'success':
        icon = 'checkmark-circle';
        break;
      case 'error':
        icon = 'close-circle';
        break;
      case 'warning':
        icon = 'warning';
        break;
      case 'info':
      default:
        icon = 'information-circle';
        break;
    }

    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      position: 'top',
      cssClass: `app-toast toast-${type}`,
      animated: true,
      buttons: [
        {
          icon: icon,
          side: 'start',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
    return toast;
  }
}
