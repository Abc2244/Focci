import { Component } from '@angular/core';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent {
  menuItems = [
    { path: '/tabs/subjects', icon: 'book-outline', label: 'Materias' },
    { path: '/tabs/tasks', icon: 'checkbox-outline', label: 'Tareas' },
    { path: '/tabs/reminders', icon: 'alarm-outline', label: 'Recordatorios' },
    { path: '/tabs/profile', icon: 'person-outline', label: 'Perfil' },
  ];
}
