import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ThemeService } from './theme.service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private activeToasts: Map<string, HTMLIonToastElement> = new Map();
  private toastDebounceTime = 3000; // 3 segundos

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
    // Crear una clave única para el mensaje y tipo
    const toastKey = `${type}-${message}`;

    // Si ya existe un toast activo con el mismo mensaje y tipo, no mostrar otro
    if (this.activeToasts.has(toastKey)) {
      return;
    }

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

    // Guardar referencia al toast activo
    this.activeToasts.set(toastKey, toast);

    // Eliminar la referencia cuando el toast se cierre
    toast.onDidDismiss().then(() => {
      setTimeout(() => {
        this.activeToasts.delete(toastKey);
      }, this.toastDebounceTime);
    });

    await toast.present();
    return toast;
  }

  /**
   * Muestra un mensaje de error de carga genérico
   * @param entity Nombre de la entidad que falló al cargar
   */
  async showLoadError(entity: string) {
    const message = `No se pudieron cargar ${entity.toLowerCase()}. Por favor, intenta más tarde.`;
    await this.showToast(message, 'error');
  }

  /**
   * Muestra un mensaje de error de conexión
   */
  async showConnectionError() {
    const message = 'Error de conexión. Verifica tu conexión a internet.';
    await this.showToast(message, 'error');
  }
}
