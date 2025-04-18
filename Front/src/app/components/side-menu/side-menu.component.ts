import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit {
  userProfile: any = {
    username: '',
    email: '',
  };

  menuItems = [
    { path: '/tabs/subjects', icon: 'book-outline', label: 'Materias' },
    { path: '/tabs/tasks', icon: 'checkbox-outline', label: 'Tareas' },
    { path: '/tabs/reminders', icon: 'alarm-outline', label: 'Recordatorios' },
    { path: '/tabs/profile', icon: 'person-outline', label: 'Perfil' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserProfile(userId).subscribe(
        (data: any) => {
          this.userProfile = data;
        },
        (error: any) => {
          console.error('Error loading user profile:', error);
        }
      );
    }
  }
}
