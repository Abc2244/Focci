import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

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
    private toastService: ToastService
  ) {}

  async login() {
    if (!this.email || !this.password) {
      await this.toastService.showToast('Por favor, complete todos los campos', 'warning');
      return;
    }

    try {
      const success = await this.authService.login(this.email, this.password);

      if (success) {
        await this.toastService.showToast('¡Inicio de sesión exitoso!', 'success');
        this.router.navigate(['/tabs/subjects']);
      } else {
        await this.toastService.showToast('Credenciales inválidas', 'error');
      }
    } catch (error) {
      console.error('Error en login:', error);
      await this.toastService.showToast('Error al conectar con el servidor', 'error');
    }
  }
}
