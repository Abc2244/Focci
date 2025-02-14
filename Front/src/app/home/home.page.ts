import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(private router: Router) {}

  logout() {
    // Aquí puedes agregar la lógica para cerrar sesión
    localStorage.removeItem('token'); // O el método que uses para almacenar el token
    this.router.navigate(['/login']);
  }
}
