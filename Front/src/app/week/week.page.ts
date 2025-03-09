import { Component, OnInit } from '@angular/core';

interface WeekDay {
  name: string;
  number: number;
  date: Date;
}

@Component({
  selector: 'app-week',
  templateUrl: './week.page.html',
  styleUrls: ['./week.page.scss'],
})
export class WeekPage implements OnInit {
  selectedDay = 0; // Por defecto selecciona el primer día

  // Datos de los días de la semana (se inicializarán dinámicamente)
  weekDays: WeekDay[] = [];

  constructor() {}

  ngOnInit() {
    // Inicializar la fecha actual y configurar los días de la semana
    this.setupWeekDays();
  }

  setupWeekDays() {
    // Obtener la fecha actual
    const today = new Date();
    console.log('Fecha actual:', today.toLocaleDateString());

    // Encontrar el domingo de esta semana
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    console.log('Domingo de esta semana:', sunday.toLocaleDateString());

    // Generar los días de la semana
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);

      this.weekDays.push({
        name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i],
        number: date.getDate(),
        date: date,
      });

      // Si es hoy, seleccionar este día
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        this.selectedDay = i;
        console.log('Día actual seleccionado:', i, date.toLocaleDateString());
      }
    }

    console.log(
      'Días de la semana generados:',
      this.weekDays.map((d) => `${d.name} ${d.number}`)
    );
  }

  selectDay(day: number) {
    this.selectedDay = day;
  }
}
