import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  @Input() activeTab: string = 'week';
  @Output() tabChange = new EventEmitter<{ tab: string }>();

  tabs = [
    { id: 'week', icon: 'calendar-outline', label: 'Semana' },
    { id: 'calendar', icon: 'calendar-number-outline', label: 'Calendario' },
    { id: 'stats', icon: 'bar-chart-outline', label: 'Estadísticas' },
    { id: 'smart', icon: 'bulb-outline', label: 'Inteligente' },
  ];

  constructor(private router: Router) {}

  onTabChange(tabId: string) {
    // Navegar a la ruta correspondiente
    this.router.navigate(['/tabs', tabId]);

    // Emitir el evento con la estructura correcta
    this.tabChange.emit({ tab: tabId });
  }
}
