import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnInit {
  selectedPeriod = 'week';

  constructor() {}

  ngOnInit() {}

  segmentChanged(event: any) {
    this.selectedPeriod = event.detail.value;
  }
}
