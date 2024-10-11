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
    const registerData = { username: this.username, email: this.email, password: this.password };
    this.apiService.registerUser(registerData).subscribe(
      (response) => {
        alert('Usuario registrado exitosamente.');
        this.router.navigate(['/login']);
      },
      (error) => {
        alert('Error en el registro.');
      }
    );
  }
}
