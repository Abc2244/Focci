import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    const loginData = { email: this.email, password: this.password };
    this.apiService.loginUser(loginData).subscribe(
      (response) => {
        this.authService.setToken(response.access_token); // Almacenar el token usando AuthService
        this.router.navigate(['/home']); // Redirigir tras un login exitoso
      },
      (error) => {
        alert('Error al iniciar sesión. Verifica tus credenciales.');
      }
    );
  }
}
