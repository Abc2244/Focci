import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  @Input() activeTab: string = 'week';
  @Output() tabChange = new EventEmitter<{ tab: string }>();

  constructor(private router: Router) {}

  navigateTo(tab: string) {
    this.activeTab = tab;
    this.tabChange.emit({ tab: tab });
    this.router.navigate(['/tabs', tab]);
  }
}
