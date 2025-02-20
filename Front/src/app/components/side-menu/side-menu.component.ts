import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent {
  menuItems = [
    { title: 'Inicio', path: '/home', icon: 'home-outline' },
    { title: 'Tareas', path: '/task-manager', icon: 'checkbox-outline' },
    { title: 'Materias', path: '/subjects', icon: 'book-outline' },
    { title: 'Recordatorios', path: '/reminders', icon: 'alarm-outline' },
  ];

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
