import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userProfile: any = {};

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const userId = this.authService.getCurrentUserId();
    console.log('Current User ID:', userId);
    if (userId) {
      this.apiService.getUserProfile(userId).subscribe(
        (data: any) => {
          console.log('User Profile Data:', data);
          this.userProfile = data;
        },
        (error: any) => {
          console.error('Error loading user profile:', error);
        }
      );
    } else {
      console.error('User ID not found');
    }
  }
}
