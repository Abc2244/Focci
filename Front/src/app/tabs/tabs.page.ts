import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import {
  MenuController,
  Platform,
  IonTabs,
  AnimationController,
} from '@ionic/angular';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage implements OnInit, AfterViewInit {
  @ViewChild(IonTabs) tabs!: IonTabs;
  activeTab: string = 'week';
  pageTitle: string = 'Mi Semana';

  // Mapeo de rutas a títulos con índice de tipo string
  pageTitles: { [key: string]: string } = {
    week: 'Mi Semana',
    calendar: 'Calendario',
    stats: 'Estadísticas',
    smart: 'Asistente Inteligente',
    subjects: 'Materias',
    tasks: 'Tareas',
    reminders: 'Recordatorios',
    profile: 'Perfil',
  };

  constructor(
    private menuCtrl: MenuController,
    private platform: Platform,
    private router: Router,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit() {
    // Asegurarse de que el menú esté habilitado
    this.menuCtrl.enable(true, 'main-menu');

    // Detectar cambios de ruta para actualizar el título y el tab activo
    this.router.events
      .pipe(
        filter(
          (event: Event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        // Extraer el segmento de ruta actual
        const urlParts = event.url.split('/');
        if (urlParts.length > 2) {
          const currentRoute = urlParts[2];
          this.activeTab = currentRoute;
          this.updatePageTitle(currentRoute);
        }

        // Cerrar el menú en dispositivos móviles al navegar
        if (this.platform.width() < 768) {
          this.menuCtrl.close('main-menu');
        }
      });
  }

  ngAfterViewInit() {
    // Asegurarse de que el menú esté disponible después de que la vista se haya inicializado
    setTimeout(() => {
      this.menuCtrl.enable(true, 'main-menu');

      // Obtener el tab inicial
      if (this.tabs) {
        const selectedTab = this.tabs.getSelected();
        if (selectedTab) {
          this.activeTab = selectedTab;
          this.updatePageTitle(this.activeTab);
        }
      }
    }, 100);
  }

  updatePageTitle(route: string) {
    this.pageTitle = this.pageTitles[route] || 'Mi Semana';
  }

  getPageTitle() {
    return this.pageTitle;
  }

  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  // Método para animar la transición entre tabs
  tabChanged(event: any) {
    this.activeTab = event.tab;
    this.updatePageTitle(this.activeTab);
  }
}
