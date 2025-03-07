import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async login() {
    if (!this.email || !this.password) {
      await this.presentToast('Por favor, complete todos los campos');
      return;
    }

    try {
      console.log('Intentando login con:', { email: this.email });
      const success = await this.authService.login(this.email, this.password);
      console.log('Resultado del login:', success);

      if (success) {
        await this.presentToast('Inicio de sesión exitoso', 'success');
        this.router.navigate(['/tabs/subjects']);
      } else {
        console.log('Login falló pero no hubo error');
        await this.presentToast('Credenciales inválidas', 'danger');
      }
    } catch (error) {
      console.error('Error en login component:', error);
      await this.presentToast('Error al conectar con el servidor', 'danger');
    }
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' = 'danger'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: color,
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
