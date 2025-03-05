import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  selectedDay = 4; // Día 4 seleccionado por defecto

  constructor() {}

  ngOnInit() {}

  selectDay(day: number) {
    this.selectedDay = day;
  }
}
