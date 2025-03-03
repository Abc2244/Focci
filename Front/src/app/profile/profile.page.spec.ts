import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let apiServiceSpy = jasmine.createSpyObj('ApiService', [
    'getUserProfile',
    'updateUserProfile',
  ]);
  let authServiceSpy = jasmine.createSpyObj('AuthService', [
    'getCurrentUserId',
    'logout',
  ]);

  beforeEach(async () => {
    apiServiceSpy.getUserProfile.and.returnValue(
      of({
        username: 'testuser',
        email: 'test@example.com',
      })
    );
    apiServiceSpy.updateUserProfile.and.returnValue(of({}));
    authServiceSpy.getCurrentUserId.and.returnValue('user123');

    await TestBed.configureTestingModule({
      declarations: [ProfilePage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', () => {
    expect(apiServiceSpy.getUserProfile).toHaveBeenCalledWith('user123');
    expect(component.userProfile.username).toBe('testuser');
    expect(component.userProfile.email).toBe('test@example.com');
  });

  it('should update profile form with user data', () => {
    component.updateProfileForm();
    expect(component.profileForm.value.username).toBe('testuser');
    expect(component.profileForm.value.email).toBe('test@example.com');
  });

  it('should save profile when form is valid', () => {
    component.profileForm.setValue({
      username: 'newusername',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
    });

    component.saveProfile();

    expect(apiServiceSpy.updateUserProfile).toHaveBeenCalled();
  });

  it('should logout user', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
