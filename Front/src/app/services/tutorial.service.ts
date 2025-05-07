import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';

export interface TutorialStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  nextButton?: string;
  prevButton?: string;
  route?: string;
  dataAttribute?: string; // Atributo de datos para marcado adicional
}

export interface TutorialSection {
  route: string;
  steps: TutorialStep[];
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly SCROLL_DURATION = 100;
  private readonly NAVIGATION_DELAY = 1000; // Aumentado a 1000ms para dar más tiempo
  private readonly ELEMENT_CHECK_DELAY = 200; // Aumentado a 200ms
  private readonly MAX_RETRY_ATTEMPTS = 15; // Aumentado a 15 intentos
  private readonly CLEANUP_DELAY = 300; // Aumentado a 300ms

  private currentStepSubject = new BehaviorSubject<number>(0);
  currentStep$ = this.currentStepSubject.asObservable();
  
  private tutorialActiveSubject = new BehaviorSubject<boolean>(false);
  tutorialActive$ = this.tutorialActiveSubject.asObservable();

  private elementFoundSubject = new BehaviorSubject<boolean>(false);
  elementFound$ = this.elementFoundSubject.asObservable();

  private currentSectionIndex = 0;
  private retryCount = 0;

  // Ajustar los tutoriales para corregir problemas
  private tutorialSections: TutorialSection[] = [
    {
      route: '/tabs/profile',
      steps: [
        {
          target: '.profile-header .user-avatar-container, [data-tutorial="profile-avatar"]',
          title: 'Tu Perfil',
          content: 'Aquí puedes ver y gestionar tu información personal.',
          position: 'right',
          dataAttribute: 'profile-avatar'
        },
        {
          target: '.profile-header .edit-profile-button, [data-tutorial="edit-profile"]',
          title: 'Editar Perfil',
          content: 'Haz clic aquí para modificar tu nombre de usuario y correo electrónico.',
          position: 'left',
          dataAttribute: 'edit-profile'
        },
        {
          target: 'ion-list ion-item:has(ion-icon[name="notifications-outline"]), [data-tutorial="notifications"]',
          title: 'Notificaciones',
          content: 'Activa o desactiva las notificaciones de la aplicación según tus preferencias.',
          position: 'left',
          dataAttribute: 'notifications'
        },
        {
          target: 'ion-list ion-item:has(ion-icon[name="moon-outline"]), [data-tutorial="dark-mode"]',
          title: 'Modo Oscuro',
          content: 'Cambia entre el tema claro y oscuro para mayor comodidad visual.',
          position: 'left',
          dataAttribute: 'dark-mode'
        },
        {
          target: '[data-tutorial="theme-selector"]',
          title: 'Personalización',
          content: 'Selecciona entre diferentes temas de color o crea uno personalizado.',
          position: 'left',
          nextButton: 'Continuar a Materias',
          dataAttribute: 'theme-selector'
        }
      ]
    },
    {
      route: '/tabs/subjects',
      steps: [
        {
          target: 'div.page-header',
          title: 'Tus Materias',
          content: 'Esta es la sección donde encontrarás todas tus materias organizadas por semestre.',
          position: 'bottom',
          dataAttribute: 'subjects-header'
        },
        {
          target: 'ion-card.subject-card',
          title: 'Tarjeta de Materia',
          content: 'Cada tarjeta muestra información importante de la materia como nombre, profesor y horarios. Toca una para ver más detalles.',
          position: 'right',
          dataAttribute: 'subject-card'
        },
        {
          target: '.add-subject-button',
          title: 'Agregar Materia',
          content: 'Usa este botón para agregar una nueva materia a tu semestre actual.',
          position: 'left',
          nextButton: 'Continuar a Tareas',
          dataAttribute: 'add-subject'
        }
      ]
    },
    {
      route: '/tabs/tasks',
      steps: [
        {
          target: 'ion-tab-button[tab="tasks"]',
          title: 'Tus Tareas',
          content: 'Aquí podrás gestionar todas tus tareas académicas. Organiza tus actividades, establece fechas límite y mantén un seguimiento de tu progreso.',
          position: 'bottom',
          dataAttribute: 'tasks-tab'
        },
        {
          target: '.stats-container',
          title: 'Resumen de Tareas',
          content: 'Visualiza rápidamente el estado de tus tareas: pendientes, completadas y tiempo total estimado.',
          position: 'bottom',
          dataAttribute: 'task-stats'
        },
        {
          target: '.task-card',
          title: 'Tarjeta de Tarea',
          content: 'Cada tarjeta muestra la información importante de la tarea: descripción, materia, fecha límite y tiempo estimado. Puedes marcarla como completada, editarla o eliminarla.',
          position: 'right',
          dataAttribute: 'task-card'
        },
        {
          target: '.task-actions',
          title: 'Acciones de Tarea',
          content: 'Gestiona tus tareas con estas acciones: marcar como completada, editar detalles o eliminar la tarea.',
          position: 'bottom',
          dataAttribute: 'task-actions'
        },
        {
          target: '.add-task-button',
          title: 'Agregar Tarea',
          content: 'Crea una nueva tarea especificando la descripción, materia, fecha límite y tiempo estimado.',
          position: 'left',
          nextButton: 'Continuar a Recordatorios',
          dataAttribute: 'add-task'
        }
      ]
    },
    {
      route: '/tabs/reminders',
      steps: [
        {
          target: 'none',
          title: 'Tus Recordatorios',
          content: 'Aquí podrás gestionar todos tus recordatorios y notificaciones. Mantente al día con tus tareas y actividades importantes.',
          position: 'right'
        },
        {
          target: '.reminder-card',
          title: 'Tarjeta de Recordatorio',
          content: 'Cada recordatorio muestra la tarea asociada, fecha y hora programada, y mensaje personalizado. Los recordatorios pueden tener diferentes prioridades y niveles de insistencia.',
          position: 'right',
          dataAttribute: 'reminder-card'
        },
        {
          target: '.reminder-info',
          title: 'Información del Recordatorio',
          content: 'Visualiza la prioridad, estado y nivel de insistencia del recordatorio mediante etiquetas de colores.',
          position: 'bottom',
          dataAttribute: 'reminder-info'
        },
        {
          target: '.reminder-actions',
          title: 'Acciones de Recordatorio',
          content: 'Gestiona tus recordatorios: edita los detalles o elimina los que ya no necesites.',
          position: 'bottom',
          dataAttribute: 'reminder-actions'
        },
        {
          target: '.add-reminder-button',
          title: 'Agregar Recordatorio',
          content: 'Crea un nuevo recordatorio seleccionando una tarea, estableciendo fecha y hora, y configurando el nivel de prioridad e insistencia.',
          position: 'left',
          nextButton: 'Continuar al Horario',
          dataAttribute: 'add-reminder'
        }
      ]
    },
    {
      route: '/tabs/schedule',
      steps: [
        {
          target: 'div.page-container',
          title: 'Tu Horario',
          content: 'Aquí encontrarás tu horario con todas tus actividades. Navega entre semanas usando los controles superiores y visualiza tus eventos organizados por día y hora.',
          position: 'right'
        },
        {
          target: 'div.day-events.ng-star-inserted',
          title: 'Eventos',
          content: 'Cada evento tiene un color según su tipo (clases, tareas o recordatorios). Toca cualquiera para ver sus detalles.',
          position: 'right',
          dataAttribute: 'calendar-events'
        },
        {
          target: 'ion-fab.fab-controls ion-fab-button.main-fab',
          title: 'Vistas del Calendario',
          content: 'Cambia entre vista mensual, semanal o detallada según tus necesidades.',
          position: 'left',
          nextButton: 'Continuar a Estadísticas',
          dataAttribute: 'calendar-controls'
        }
      ]
    },
    {
      route: '/tabs/stats',
      steps: [
        {
          target: 'div.page-container',
          title: 'Tus Estadísticas',
          content: 'Aquí podrás ver un resumen detallado de tu rendimiento académico y gestión de tareas. Analiza tus patrones de trabajo y mejora tu productividad.',
          position: 'right'
        },
        {
          target: '.period-segment',
          title: 'Período de Análisis',
          content: 'Selecciona el período que deseas analizar: semana, mes o semestre. Los datos se actualizarán automáticamente según tu selección.',
          position: 'bottom',
          dataAttribute: 'period-selector'
        },
        {
          target: '.stats-summary',
          title: 'Resumen General',
          content: 'Visualiza rápidamente tus métricas clave: tareas creadas, completadas y tu tasa de éxito general.',
          position: 'bottom',
          dataAttribute: 'stats-summary',
          nextButton: 'Finalizar Tutorial'
        }
      ]
    }
  ];

  constructor(private router: Router) {
    // Añadir atributos de datos a los elementos si es posible
    this.tutorialSections.forEach(section => {
      section.steps.forEach(step => {
        if (step.dataAttribute) {
          // Este código se ejecutará una vez al inicio, pero puedes
          // también implementar una función que se llame antes de cada paso
          setTimeout(() => this.addDataAttributesToElements(step), 1000);
        }
      });
    });
  }

  // Método para añadir atributos de datos a los elementos existentes
  private addDataAttributesToElements(step: TutorialStep) {
    if (!step.dataAttribute) return;
    
    try {
      // Obtener el selector base sin el data-attribute
      const baseSelector = step.target.split(',')[0].trim();
      const elements = document.querySelectorAll(baseSelector);
      
      elements.forEach(el => {
        if (el && !el.hasAttribute('data-tutorial') && step.dataAttribute) {
          el.setAttribute('data-tutorial', step.dataAttribute);
        }
      });
    } catch (error) {
      console.warn('No se pudo añadir el atributo data-tutorial al elemento', error);
    }
  }

  // Ajustar para forzar reinicio de posición entre tutoriales
  private resetTutorialPosition() {
    // Forzar al inicio de la página inmediatamente
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.retryCount = 0;
    this.elementFoundSubject.next(false);
    
    // Dar tiempo para que se reinicie la posición visual de cualquier popup
    setTimeout(() => {
      // Intentar resetear cualquier elemento de UI en posición incorrecta
      const tutorialElements = document.querySelectorAll('.tutorial-backdrop, .tutorial-tooltip, .tour-backdrop, .tour-tooltip');
      tutorialElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.top = '';
          htmlEl.style.left = '';
          htmlEl.style.bottom = '';
          htmlEl.style.right = '';
          htmlEl.style.transform = '';
        }
      });
      
      // Ahora localizamos el elemento actual
      setTimeout(() => {
        this.locateAndScrollToCurrentElement();
      }, 100);
    }, this.NAVIGATION_DELAY);
  }

  private cleanupTutorialUI() {
    // Remover todos los elementos del tutorial anterior
    const elementsToRemove = document.querySelectorAll(
      '.tutorial-backdrop, .tutorial-tooltip, .tour-backdrop, .tour-tooltip, .shepherd-backdrop, .shepherd-tooltip'
    );
    elementsToRemove.forEach(el => el.remove());

    // Limpiar cualquier estilo residual en el body
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    
    // Resetear la posición de scroll
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  private navigateToSection(sectionIndex: number) {
    const section = this.tutorialSections[sectionIndex];
    if (section && section.route) {
      // Limpiar UI antes de la navegación
      this.cleanupTutorialUI();
      
      // Reiniciar estados
      this.elementFoundSubject.next(false);
      this.retryCount = 0;

      // Navegar a la nueva sección
      this.router.navigate([section.route]).then(() => {
        // Esperar a que la página se cargue completamente
        setTimeout(() => {
          this.cleanupTutorialUI();
          
          // Esperar un tiempo adicional antes de buscar el elemento
          setTimeout(() => {
            // Solo buscar elemento si el paso actual tiene target
            const currentStep = this.getCurrentStep();
            if (currentStep && currentStep.target) {
              this.retryCount = 0; // Reiniciar contador de intentos
              this.locateAndScrollToCurrentElement();
            } else {
              this.elementFoundSubject.next(true);
            }
          }, this.NAVIGATION_DELAY);
        }, this.CLEANUP_DELAY);
      });
    }
  }

  private locateAndScrollToCurrentElement() {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    const currentStep = this.currentStepSubject.value;
    
    if (!currentSection || !currentSection.steps[currentStep]) {
      console.warn('Paso no encontrado en la sección actual');
      return;
    }
    
    const step = currentSection.steps[currentStep];
    
    // Si el paso tiene posición center, centrar en la pantalla
    if (step.position === 'center') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      this.elementFoundSubject.next(true);
      return;
    }
    
    // Si no tiene target, solo actualizar estado
    if (!step.target) {
      this.elementFoundSubject.next(true);
      return;
    }
    
    // Añadir el atributo data si está definido
    if (step.dataAttribute) {
      this.addDataAttributesToElements(step);
    }
    
    // Intentar encontrar el elemento
    this.findElementAndScroll(step.target);
  }

  private findElementAndScroll(selector: string) {
    if (!selector) {
      this.elementFoundSubject.next(true);
      return;
    }

    if (this.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      console.warn(`No se pudo encontrar el elemento '${selector}' después de ${this.MAX_RETRY_ATTEMPTS} intentos`);
      this.elementFoundSubject.next(false);
      // Intentar una última vez con un selector más general
      const generalSelector = selector.split(',')[0].trim();
      const element = document.querySelector(generalSelector);
      if (element) {
        this.scrollToElement(element);
        this.elementFoundSubject.next(true);
      }
      return;
    }
    
    let element = document.querySelector(selector);
    
    if (element) {
      // Verificar si el elemento está realmente visible
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // El elemento existe pero no es visible aún
        this.retryCount++;
        setTimeout(() => {
          this.findElementAndScroll(selector);
        }, this.ELEMENT_CHECK_DELAY);
        return;
      }
      
      this.scrollToElement(element);
      this.elementFoundSubject.next(true);
      this.retryCount = 0;
    } else {
      // Reintentar después de un tiempo
      this.retryCount++;
      setTimeout(() => {
        this.findElementAndScroll(selector);
      }, this.ELEMENT_CHECK_DELAY);
    }
  }

  private scrollToElement(element: Element) {
    if (!element) return;
    
    try {
      // Verificar visibilidad
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.display === 'none') {
        console.warn('El elemento está oculto, no se puede hacer scroll hasta él');
        return;
      }
      
      // Asegurar que el elemento es visible
      const elementRect = element.getBoundingClientRect();
      
      // Si el elemento no tiene dimensiones, podría estar oculto o no renderizado
      if (elementRect.height === 0 && elementRect.width === 0) {
        console.warn('El elemento no tiene dimensiones visibles');
        return;
      }
      
      // Calcular posición para mantener el elemento en el área visible
      const windowHeight = window.innerHeight;
      const elementHeight = elementRect.height;
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      
      // Ajustar para mantener el elemento en el centro superior
      let scrollPosition = absoluteElementTop - (windowHeight * 0.25);
      
      // Asegurar que no hacemos scroll más allá del principio de la página
      scrollPosition = Math.max(0, scrollPosition);
      
      // Realizar el scroll de manera inmediata
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });
    } catch (error) {
      console.error('Error al hacer scroll al elemento', error);
    }
  }

  nextStep() {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    const currentStep = this.currentStepSubject.value;
    
    // Limpiar UI antes de cambiar de paso
    this.cleanupTutorialUI();
    
    if (currentStep < currentSection.steps.length - 1) {
      // Avanzar al siguiente paso en la misma sección
      this.currentStepSubject.next(currentStep + 1);
      
      // Esperar a que se limpie la UI y la página se actualice
      setTimeout(() => {
        const nextStep = this.getCurrentStep();
        if (nextStep && nextStep.target) {
          this.retryCount = 0; // Reiniciar contador de intentos
          this.locateAndScrollToCurrentElement();
        } else {
          this.elementFoundSubject.next(true);
        }
      }, this.NAVIGATION_DELAY);
    } else if (this.currentSectionIndex < this.tutorialSections.length - 1) {
      // Avanzar a la primera paso de la siguiente sección
      this.currentSectionIndex++;
      this.currentStepSubject.next(0);
      this.navigateToSection(this.currentSectionIndex);
    } else {
      // Fin del tutorial
      this.endTutorial();
    }
  }

  previousStep() {
    const currentStep = this.currentStepSubject.value;
    
    // Limpiar UI antes de cambiar de paso
    this.cleanupTutorialUI();
    
    if (currentStep > 0) {
      // Retroceder un paso en la misma sección
      this.currentStepSubject.next(currentStep - 1);
      
      // Esperar a que se limpie la UI
      setTimeout(() => {
        const prevStep = this.getCurrentStep();
        if (prevStep && prevStep.target) {
      this.locateAndScrollToCurrentElement();
        } else {
          this.elementFoundSubject.next(true);
        }
      }, this.CLEANUP_DELAY);
    } else if (this.currentSectionIndex > 0) {
      // Retroceder al último paso de la sección anterior
      this.currentSectionIndex--;
      const previousSection = this.tutorialSections[this.currentSectionIndex];
      this.currentStepSubject.next(previousSection.steps.length - 1);
      this.navigateToSection(this.currentSectionIndex);
    }
  }

  startTutorial() {
    this.currentSectionIndex = 0;
    this.tutorialActiveSubject.next(true);
    this.currentStepSubject.next(0);
    this.retryCount = 0;
    this.cleanupTutorialUI();
    this.navigateToSection(this.currentSectionIndex);
  }

  endTutorial() {
    this.tutorialActiveSubject.next(false);
    this.currentStepSubject.next(0);
    this.currentSectionIndex = 0;
    this.elementFoundSubject.next(false);
    this.cleanupTutorialUI();
  }

  getCurrentStep(): TutorialStep {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    return currentSection.steps[this.currentStepSubject.value];
  }

  getCurrentStepIndex(): number {
    return this.currentStepSubject.value;
  }

  getTotalSteps(): number {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    return currentSection.steps.length;
  }

  isActive(): boolean {
    return this.tutorialActiveSubject.value;
  }

  isElementFound(): boolean {
    return this.elementFoundSubject.value;
  }

  getFirstStep(): TutorialStep {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    return currentSection.steps[0];
  }

  getLastStep(): TutorialStep {
    const currentSection = this.tutorialSections[this.currentSectionIndex];
    return currentSection.steps[currentSection.steps.length - 1];
  }
} 