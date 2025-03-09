import { Component, OnInit } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage implements OnInit {
  activeTab: string = 'week';
  pageTitle: string = ''; // Título vacío

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
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse a los eventos de navegación para actualizar la pestaña activa
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        // Extraer el segmento de ruta actual
        const urlParts = event.url.split('/');
        if (urlParts.length > 2) {
          const currentRoute = urlParts[2];
          this.activeTab = currentRoute;
          // Ya no actualizamos el título
        }

        // Cerrar el menú en dispositivos móviles al navegar
        if (this.platform.width() < 768) {
          this.menuCtrl.close('main-menu');
        }
      });
  }

  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  // Método para manejar el cambio de tabs
  tabChanged(event: any) {
    let tab: string;

    // Manejar tanto el evento de ion-tabs como el evento personalizado
    if (event && event.tab) {
      tab = event.tab;
    } else if (event && event.detail && event.detail.tab) {
      tab = event.detail.tab;
    } else {
      return;
    }

    this.activeTab = tab;
    // Ya no actualizamos el título

    // Asegurarse de que la navegación ocurra solo una vez
    if (event.tab) {
      // Si viene de nuestro componente personalizado, la navegación ya ocurrió
      return;
    }

    // Navegar a la ruta correspondiente
    this.router.navigate(['/tabs', tab]);
  }
}
