import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  @Input() activeTab: string = 'schedule';
  @Output() tabChange = new EventEmitter<{ tab: string }>();

  tabs = [
    { id: 'schedule', icon: 'time-outline', label: 'Horario' },
    { id: 'stats', icon: 'bar-chart-outline', label: 'Estadísticas' },
    { id: 'smart', icon: 'bulb-outline', label: 'Inteligente' },
  ];

  constructor(private router: Router) {}

  onTabChange(tabId: string) {
    this.router.navigate(['/tabs', tabId]);
    this.tabChange.emit({ tab: tabId });
  }
}
