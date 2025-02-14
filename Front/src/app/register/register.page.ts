import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  register() {
    const registerData = {
      username: this.username,
      email: this.email,
      password: this.password,
    };

    this.apiService.registerUser(registerData).subscribe(
      (response) => {
        console.log('Registro exitoso:', response); // 👈 Ver la respuesta en consola
        alert('Usuario registrado exitosamente.');
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Error en el registro:', error); // 👈 Ver el error en consola
        alert(error.error.detail || 'Error en el registro.');
      }
    );
  }
}
