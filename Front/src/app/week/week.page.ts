import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-week',
  templateUrl: './week.page.html',
  styleUrls: ['./week.page.scss'],
})
export class WeekPage implements OnInit {
  selectedDay = 2; // Martes seleccionado por defecto

  // Datos de los días de la semana
  weekDays = [
    { name: 'Dom', number: 2 },
    { name: 'Lun', number: 3 },
    { name: 'Mar', number: 4 },
    { name: 'Mié', number: 5 },
    { name: 'Jue', number: 6 },
    { name: 'Vie', number: 7 },
    { name: 'Sáb', number: 8 },
  ];

  constructor() {}

  ngOnInit() {
    // Inicializar la fecha actual y configurar los días de la semana
    this.setupWeekDays();
  }

  setupWeekDays() {
    // Obtener la fecha actual
    const today = new Date();

    // Encontrar el domingo de esta semana
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());

    // Generar los días de la semana
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);

      this.weekDays.push({
        name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i],
        number: date.getDate(),
      });

      // Si es hoy, seleccionar este día
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        this.selectedDay = i;
      }
    }
  }

  selectDay(day: number) {
    this.selectedDay = day;
  }
}
