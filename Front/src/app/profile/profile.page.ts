import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ThemeService, ColorTheme } from '../services/theme.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userProfile: any = {
    username: '',
    email: '',
  };

  settings: any = {
    notifications: true,
    darkMode: false,
    language: 'es',
  };

  lastSync: Date = new Date();
  showEditProfileModal = false;
  showChangePasswordModal = false;
  showThemeSelectorModal = false;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  customColorInput: string = '#ff00ff'; // Color rosa por defecto

  themeOptions = [
    { value: 'blue' as ColorTheme, label: 'Azul', icon: 'water-outline' },
    { value: 'green' as ColorTheme, label: 'Verde', icon: 'leaf-outline' },
    { value: 'orange' as ColorTheme, label: 'Naranja', icon: 'flame-outline' },
    { value: 'purple' as ColorTheme, label: 'Morado', icon: 'flower-outline' },
    {
      value: 'custom' as ColorTheme,
      label: 'Personalizado',
      icon: 'color-palette-outline',
    },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    public themeService: ThemeService
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadSettings();
    this.settings.darkMode = this.themeService.isDarkMode();

    const savedColor = localStorage.getItem('custom-primary-color');
    if (savedColor) {
      this.customColorInput = savedColor;
      document.documentElement.style.setProperty('--custom-primary-color', savedColor);
    }
    
    // Actualizamos la validación comparando los valores directamente
    this.passwordForm.valueChanges.subscribe(() => {
      const newPassword = this.passwordForm.get('new_password')?.value;
      const confirmPassword = this.passwordForm.get('confirm_password')?.value;
      
      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        this.passwordForm.setErrors({ mismatch: true });
      } else {
        // Solo eliminamos el error de mismatch si existe
        const currentErrors = this.passwordForm.errors;
        if (currentErrors && currentErrors['mismatch']) {
          delete currentErrors['mismatch'];
          this.passwordForm.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      }
    });
  }

  loadUserProfile() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserProfile(userId).subscribe(
        (data: any) => {
          this.userProfile = data;
          this.updateProfileForm();
        },
        (error: any) => {
          console.error('Error loading user profile:', error);
          this.presentToast('Error al cargar el perfil', 'danger');
        }
      );
    } else {
      console.error('User ID not found');
      this.presentToast('ID de usuario no encontrado', 'danger');
    }
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(this.settings));
    this.presentToast('Configuración guardada', 'success');
  }

  toggleDarkMode() {
    this.themeService.applyDarkMode(this.settings.darkMode);
    this.saveSettings();
  }

  changeTheme(theme: ColorTheme) {
    if (theme === 'custom') {
      // No aplicamos el tema inmediatamente para permitir la selección del color
      this.themeService.applyTheme(theme);
    } else {
      this.themeService.applyTheme(theme);
      this.showThemeSelectorModal = false;
    }
  }

  applyCustomColor() {
    document.documentElement.style.setProperty('--custom-primary-color', this.customColorInput);
    this.themeService.updateCustomColors(this.customColorInput);
    this.themeService.applyTheme('custom');
    this.showThemeSelectorModal = false;
  }

  openThemeSelector() {
    this.showThemeSelectorModal = true;
  }

  getThemeName() {
    const currentTheme = this.themeService.getCurrentTheme();
    const themeMap: { [key: string]: string } = {
      blue: 'Azul',
      green: 'Verde',
      orange: 'Naranja',
      purple: 'Morado',
      custom: 'Personalizado',
    };
    return themeMap[currentTheme] || 'Azul';
  }

  openLanguageSelector() {
    // Implementar selector de idioma
    this.presentToast('Función no implementada', 'warning');
  }

  getLanguageName() {
    const languages = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
    };
    return (
      languages[this.settings.language as keyof typeof languages] || 'Español'
    );
  }

  syncData() {
    this.lastSync = new Date();
    this.presentToast('Datos sincronizados correctamente', 'success');
  }

  clearCache() {
    this.presentToast('Caché limpiada correctamente', 'success');
  }

  showAbout() {
    this.presentToast('TaskMaster v1.0.0', 'primary');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openEditProfileModal() {
    this.updateProfileForm();
    this.showEditProfileModal = true;
  }

  openChangePasswordModal() {
    this.passwordForm.reset();
    this.showChangePasswordModal = true;
  }

  updateProfileForm() {
    this.profileForm.patchValue({
      username: this.userProfile.username,
      email: this.userProfile.email,
    });
  }

  cancelEditProfile() {
    this.showEditProfileModal = false;
  }

  cancelChangePassword() {
    this.showChangePasswordModal = false;
  }

  saveProfile() {
    if (this.profileForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (userId) {
        // Solo enviamos los campos que el backend espera según el modelo User en el backend
        const profileData = {
          username: this.profileForm.value.username,
          email: this.profileForm.value.email,
          password: this.userProfile.password // Mantenemos la contraseña actual
        };
        
        console.log('Enviando datos de perfil:', profileData);
        
        this.apiService.updateUserProfile(userId, profileData).subscribe(
          (response: any) => {
            this.userProfile = { ...this.userProfile, ...profileData };
            this.showEditProfileModal = false;
            this.presentToast('Perfil actualizado correctamente', 'success');
          },
          (error: any) => {
            console.error('Error updating profile:', error);
            this.presentToast('Error al actualizar el perfil: ' + (error.message || 'Error desconocido'), 'danger');
          }
        );
      }
    } else {
      if (!this.profileForm.get('username')?.valid) {
        this.presentToast('Por favor, ingrese un nombre de usuario', 'warning');
      } else if (!this.profileForm.get('email')?.valid) {
        this.presentToast('Por favor, ingrese un email válido', 'warning');
      } else {
        this.presentToast('Por favor, complete los campos requeridos', 'warning');
      }
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      // Verificamos manualmente si las contraseñas coinciden
      const newPassword = this.passwordForm.get('new_password')?.value;
      const confirmPassword = this.passwordForm.get('confirm_password')?.value;
      
      if (newPassword !== confirmPassword) {
        this.presentToast('Las contraseñas no coinciden', 'warning');
        return;
      }

      const userId = this.authService.getCurrentUserId();
      if (userId) {
        const passwordData = {
          old_password: this.passwordForm.value.old_password,
          new_password: this.passwordForm.value.new_password,
        };
        
        console.log('Enviando datos de contraseña:', passwordData);

        this.apiService.updatePassword(userId, passwordData).subscribe(
          (response: any) => {
            this.showChangePasswordModal = false;
            this.presentToast(
              'Contraseña actualizada correctamente',
              'success'
            );
            this.passwordForm.reset();
          },
          (error: any) => {
            console.error('Error updating password:', error);
            this.presentToast('Error al actualizar la contraseña: ' + (error.message || 'Verifique su contraseña actual'), 'danger');
          }
        );
      }
    } else {
      // Mostrar mensajes específicos para cada campo
      if (!this.passwordForm.get('old_password')?.valid) {
        this.presentToast('Por favor, ingrese su contraseña actual', 'warning');
      } else if (!this.passwordForm.get('new_password')?.valid) {
        this.presentToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      } else if (!this.passwordForm.get('confirm_password')?.valid) {
        this.presentToast('Por favor, confirme su nueva contraseña', 'warning');
      } else {
        this.presentToast('Por favor, complete todos los campos requeridos', 'warning');
      }
    }
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom',
    });
    toast.present();
  }
}
