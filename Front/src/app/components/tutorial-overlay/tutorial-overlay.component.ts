import { Component, OnInit, OnDestroy } from '@angular/core';
import { TutorialService, TutorialStep } from '../../services/tutorial.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-tutorial-overlay',
  template: `
    <div class="tutorial-overlay" *ngIf="isActive" [@fadeInOut]>
      <div class="tutorial-backdrop" (click)="endTutorial()"></div>
      <div class="tutorial-highlight" [ngStyle]="highlightStyle" [@highlightAnimation]></div>
      <div class="tutorial-step" 
           [ngStyle]="stepStyle"
           [@slideInOut]="currentStep?.position">
        <div class="tutorial-content">
          <div class="tutorial-header">
            <ion-icon [name]="getStepIcon()" color="primary"></ion-icon>
            <h3>{{ currentStep?.title }}</h3>
          </div>
          <p>{{ currentStep?.content }}</p>
          <div class="tutorial-progress">
            <div class="progress-dots">
              <span *ngFor="let i of getTotalSteps()" 
                    [class.active]="i === getCurrentStepIndex()"
                    class="progress-dot">
              </span>
            </div>
          </div>
          <div class="tutorial-buttons">
            <ion-button fill="clear"
                    *ngIf="!isFirstStep"
                    (click)="previousStep()"
                    class="tutorial-btn secondary">
              <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
              Anterior
            </ion-button>
            <ion-button (click)="nextStep()" 
                    [class.primary]="!isLastStep"
                    [class.success]="isLastStep"
                    class="tutorial-btn">
              {{ isLastStep ? 'Finalizar' : 'Siguiente' }}
              <ion-icon [name]="isLastStep ? 'checkmark-outline' : 'arrow-forward-outline'" 
                       slot="end">
              </ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .tutorial-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }

    .tutorial-highlight {
      position: absolute;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid var(--ion-color-primary);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      z-index: 1001;
      pointer-events: none;
      transition: all 0.3s ease-in-out;
    }

    .tutorial-step {
      position: absolute;
      background: var(--ion-background-color);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 320px;
      z-index: 1002;
      animation: float 3s ease-in-out infinite;
    }

    .tutorial-content {
      position: relative;
    }

    .tutorial-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 10px;

      ion-icon {
        font-size: 24px;
      }

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--ion-text-color);
      }
    }

    p {
      margin: 0 0 16px;
      color: var(--ion-color-medium);
      font-size: 14px;
      line-height: 1.5;
    }

    .tutorial-progress {
      margin-bottom: 16px;

      .progress-dots {
        display: flex;
        justify-content: center;
        gap: 6px;

        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ion-color-medium);
          opacity: 0.3;
          transition: all 0.3s ease;

          &.active {
            background: var(--ion-color-primary);
            opacity: 1;
            transform: scale(1.2);
          }
        }
      }
    }

    .tutorial-buttons {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 20px;

      .tutorial-btn {
        flex: 1;
        min-width: 120px;
        height: 40px;
        --padding-start: 16px;
        --padding-end: 16px;
        --border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.5px;
        text-transform: none;
        --box-shadow: none;

        &.secondary {
          --color: var(--ion-color-medium);
          opacity: 0.8;
          
          &:hover {
            opacity: 1;
          }
        }

        &.primary {
          --background: var(--ion-color-primary);
          --color: white;
          
          &:hover {
            --background: var(--ion-color-primary-shade);
          }
        }

        &.success {
          --background: var(--ion-color-success);
          --color: white;
          
          &:hover {
            --background: var(--ion-color-success-shade);
          }
        }

        ion-icon {
          font-size: 18px;
          margin-inline: 4px;
        }
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      state('top', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('bottom', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('left', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('right', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        style({
          transform: '{{enterTransform}}',
          opacity: 0
        }),
        animate('300ms ease-out')
      ], { params: { enterTransform: 'translateY(20px)' } }),
      transition(':leave', [
        animate('300ms ease-in', style({
          transform: '{{leaveTransform}}',
          opacity: 0
        }))
      ], { params: { leaveTransform: 'translateY(-20px)' } })
    ]),
    trigger('highlightAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class TutorialOverlayComponent implements OnInit, OnDestroy {
  isActive = false;
  currentStep?: TutorialStep;
  stepStyle: any = {};
  highlightStyle: any = {};
  private subscriptions: Subscription[] = [];
  private originalOverflow: string;

  constructor(private tutorialService: TutorialService) {
    this.originalOverflow = '';
  }

  ngOnInit() {
    this.subscriptions.push(
      this.tutorialService.tutorialActive$.subscribe(
        active => {
          this.isActive = active;
          if (active) {
            this.disableScroll();
          } else {
            this.enableScroll();
          }
        }
      ),
      this.tutorialService.currentStep$.subscribe(() => {
        this.updateStep();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.enableScroll();
  }

  private disableScroll() {
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private enableScroll() {
    document.body.style.overflow = this.originalOverflow;
  }

  private updateStep() {
    this.currentStep = this.tutorialService.getCurrentStep();
    if (this.currentStep && this.currentStep.position) {
      const targetElement = document.querySelector(this.currentStep.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        this.positionStep(rect, this.currentStep.position as 'top' | 'bottom' | 'left' | 'right');
        this.updateHighlight(rect);
        this.scrollIntoView(targetElement);
      }
    }
  }

  private scrollIntoView(element: Element) {
    const padding = 50; // Espacio adicional para asegurar que el elemento sea visible
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= padding &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight - padding) &&
      rect.right <= window.innerWidth
    );

    if (!isInViewport) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  private updateHighlight(rect: DOMRect) {
    const padding = 8; // Padding alrededor del elemento resaltado
    this.highlightStyle = {
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + (padding * 2)}px`,
      height: `${rect.height + (padding * 2)}px`
    };
  }

  private positionStep(targetRect: DOMRect, position: 'top' | 'bottom' | 'left' | 'right') {
    const padding = 15;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const stepWidth = 320;
    const stepHeight = 200;
    let finalPosition: 'top' | 'bottom' | 'left' | 'right' = position;
    let left, top;

    // Padding mínimo desde los bordes de la pantalla
    const minPadding = 20;
    
    // Calcular el espacio disponible en cada dirección
    const spaceAbove = targetRect.top;
    const spaceBelow = windowHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = windowWidth - targetRect.right;

    // Determinar la mejor posición basada en el espacio disponible
    const positions: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
    const spaces = {
      top: spaceAbove,
      bottom: spaceBelow,
      left: spaceLeft,
      right: spaceRight
    };

    // Requisitos mínimos de espacio para cada posición
    const requirements = {
      top: stepHeight + padding * 2,
      bottom: stepHeight + padding * 2,
      left: stepWidth + padding * 2,
      right: stepWidth + padding * 2
    };

    // Encontrar la mejor posición que tenga espacio suficiente
    const validPositions = positions.filter(pos => spaces[pos] >= requirements[pos]);
    
    if (validPositions.length > 0) {
      // Preferir la posición original si es válida
      if (validPositions.includes(position)) {
        finalPosition = position;
      } else {
        // Si la posición original no es válida, usar la que tenga más espacio
        finalPosition = validPositions.reduce((best, current) => 
          spaces[current] > spaces[best] ? current : best
        );
      }
    }

    // Calcular la posición final
    switch (finalPosition) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = Math.min(Math.max(minPadding, targetRect.left + (targetRect.width / 2) - (stepWidth / 2)), windowWidth - stepWidth - minPadding);
        break;
      case 'top':
        top = Math.max(minPadding, targetRect.top - stepHeight - padding);
        left = Math.min(Math.max(minPadding, targetRect.left + (targetRect.width / 2) - (stepWidth / 2)), windowWidth - stepWidth - minPadding);
        break;
      case 'left':
        top = Math.min(Math.max(minPadding, targetRect.top + (targetRect.height / 2) - (stepHeight / 2)), windowHeight - stepHeight - minPadding);
        left = Math.max(minPadding, targetRect.left - stepWidth - padding);
        break;
      case 'right':
        top = Math.min(Math.max(minPadding, targetRect.top + (targetRect.height / 2) - (stepHeight / 2)), windowHeight - stepHeight - minPadding);
        left = Math.min(targetRect.right + padding, windowWidth - stepWidth - minPadding);
        break;
    }

    // Asegurar que el globo nunca se solape con el elemento destacado
    if (finalPosition === 'left' || finalPosition === 'right') {
      // Si el globo se solapa verticalmente con el elemento
      if (top + stepHeight > targetRect.top && top < targetRect.bottom) {
        if (top + stepHeight/2 > targetRect.top + targetRect.height/2) {
          // Mover el globo arriba del elemento
          top = Math.max(minPadding, targetRect.top - stepHeight - padding);
        } else {
          // Mover el globo abajo del elemento
          top = Math.min(windowHeight - stepHeight - minPadding, targetRect.bottom + padding);
        }
      }
    } else {
      // Si el globo se solapa horizontalmente con el elemento
      if (left + stepWidth > targetRect.left && left < targetRect.right) {
        if (left + stepWidth/2 > targetRect.left + targetRect.width/2) {
          // Mover el globo a la izquierda del elemento
          left = Math.max(minPadding, targetRect.left - stepWidth - padding);
        } else {
          // Mover el globo a la derecha del elemento
          left = Math.min(windowWidth - stepWidth - minPadding, targetRect.right + padding);
        }
      }
    }

    // Asegurar que el globo nunca se salga de la pantalla
    top = Math.max(minPadding, Math.min(windowHeight - stepHeight - minPadding, top));
    left = Math.max(minPadding, Math.min(windowWidth - stepWidth - minPadding, left));

    this.stepStyle = { top: `${top}px`, left: `${left}px` };

    // Actualizar la posición actual
    if (this.currentStep) {
      this.currentStep.position = finalPosition;
    }
  }

  getStepIcon(): string {
    const icons: { [key: string]: string } = {
      'Tu Perfil': 'person-circle',
      'Editar Perfil': 'create',
      'Notificaciones': 'notifications',
      'Modo Oscuro': 'moon',
      'Personalización': 'color-palette',
      'Seguridad': 'shield-checkmark',
      'Sincronización': 'sync',
      'Cerrar Sesión': 'log-out'
    };
    return icons[this.currentStep?.title || ''] || 'information-circle';
  }

  getArrowPosition(): string {
    return `arrow-${this.currentStep?.position || 'bottom'}`;
  }

  getTotalSteps(): number[] {
    const total = this.tutorialService.getTotalSteps();
    return Array(total).fill(0).map((_, i) => i);
  }

  getCurrentStepIndex(): number {
    return this.tutorialService.getCurrentStepIndex();
  }

  nextStep() {
    this.tutorialService.nextStep();
  }

  previousStep() {
    this.tutorialService.previousStep();
  }

  endTutorial() {
    this.tutorialService.endTutorial();
  }

  get isFirstStep(): boolean {
    return this.currentStep === this.tutorialService.getFirstStep();
  }

  get isLastStep(): boolean {
    return this.currentStep === this.tutorialService.getLastStep();
  }
} 