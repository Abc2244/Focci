import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface TutorialStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  nextButton?: string;
  prevButton?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private currentStepSubject = new BehaviorSubject<number>(0);
  currentStep$ = this.currentStepSubject.asObservable();
  
  private tutorialActiveSubject = new BehaviorSubject<boolean>(false);
  tutorialActive$ = this.tutorialActiveSubject.asObservable();

  private steps: TutorialStep[] = [
    {
      target: '.profile-header .user-avatar-container',
      title: 'Tu Perfil',
      content: 'Aquí puedes ver y gestionar tu información personal.',
      position: 'right'
    },
    {
      target: '.profile-header .edit-profile-button',
      title: 'Editar Perfil',
      content: 'Haz clic aquí para modificar tu nombre de usuario y correo electrónico.',
      position: 'left'
    },
    {
      target: 'ion-list ion-item:has(ion-icon[name="notifications-outline"])',
      title: 'Notificaciones',
      content: 'Activa o desactiva las notificaciones de la aplicación según tus preferencias.',
      position: 'left'
    },
    {
      target: 'ion-list ion-item:has(ion-icon[name="moon-outline"])',
      title: 'Modo Oscuro',
      content: 'Cambia entre el tema claro y oscuro para mayor comodidad visual.',
      position: 'left'
    },
    {
      target: '[data-tutorial="theme-selector"]',
      title: 'Personalización',
      content: 'Selecciona entre diferentes temas de color o crea uno personalizado.',
      position: 'left'
    },
    {
      target: 'ion-list ion-item:has(ion-icon[name="key-outline"])',
      title: 'Seguridad',
      content: 'Mantén tu cuenta segura actualizando tu contraseña regularmente.',
      position: 'left'
    },
    {
      target: '[data-tutorial="sync-data"]',
      title: 'Sincronización',
      content: 'Mantén tus datos actualizados sincronizándolos con el servidor.',
      position: 'left'
    },
    {
      target: '.logout-button',
      title: 'Cerrar Sesión',
      content: 'Cierra tu sesión cuando hayas terminado de usar la aplicación.',
      position: 'top'
    }
  ];

  constructor(private router: Router) {}

  startTutorial() {
    this.tutorialActiveSubject.next(true);
    this.currentStepSubject.next(0);
  }

  nextStep() {
    const currentStep = this.currentStepSubject.value;
    if (currentStep < this.steps.length - 1) {
      this.currentStepSubject.next(currentStep + 1);
    } else {
      this.endTutorial();
    }
  }

  previousStep() {
    const currentStep = this.currentStepSubject.value;
    if (currentStep > 0) {
      this.currentStepSubject.next(currentStep - 1);
    }
  }

  endTutorial() {
    this.tutorialActiveSubject.next(false);
    this.currentStepSubject.next(0);
  }

  getCurrentStep(): TutorialStep {
    return this.steps[this.currentStepSubject.value];
  }

  getCurrentStepIndex(): number {
    return this.currentStepSubject.value;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  isActive(): boolean {
    return this.tutorialActiveSubject.value;
  }

  getFirstStep(): TutorialStep {
    return this.steps[0];
  }

  getLastStep(): TutorialStep {
    return this.steps[this.steps.length - 1];
  }
} 