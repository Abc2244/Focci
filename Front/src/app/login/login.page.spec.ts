import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { LoginPage } from './login.page';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);

    await TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should show warning when fields are empty', async () => {
    // Prueba con ambos campos vacíos
    await component.login();
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('Por favor, complete todos los campos', 'warning');

    // Prueba con solo email
    component.email = 'test@example.com';
    await component.login();
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('Por favor, complete todos los campos', 'warning');

    // Prueba con solo password
    component.email = '';
    component.password = 'password123';
    await component.login();
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('Por favor, complete todos los campos', 'warning');
  });

  it('should navigate to subjects on successful login', async () => {
    authServiceSpy.login.and.returnValue(Promise.resolve(true));
    const navigateSpy = spyOn(router, 'navigate');
    
    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.login();
    
    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('¡Inicio de sesión exitoso!', 'success');
    expect(navigateSpy).toHaveBeenCalledWith(['/tabs/subjects']);
  });

  it('should show error message on invalid credentials', async () => {
    authServiceSpy.login.and.returnValue(Promise.resolve(false));
    
    component.email = 'test@example.com';
    component.password = 'wrongpassword';
    
    await component.login();
    
    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('Credenciales inválidas', 'error');
  });

  it('should handle server error', async () => {
    authServiceSpy.login.and.returnValue(Promise.reject('Server error'));
    
    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.login();
    
    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(toastServiceSpy.showToast).toHaveBeenCalledWith('Error al conectar con el servidor', 'error');
  });
});
