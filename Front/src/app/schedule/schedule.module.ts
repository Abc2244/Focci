import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SchedulePageRoutingModule } from './schedule-routing.module';

import { SchedulePage } from './schedule.page';

import { SharedModule } from '../shared/shared.module';

// Importar los módulos en lugar de los componentes
import { CalendarPageModule } from '../calendar/calendar.module';
import { WeekPageModule } from '../week/week.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SchedulePageRoutingModule,
    SharedModule,
    CalendarPageModule, // Importar el módulo completo
    WeekPageModule, // Importar el módulo completo
  ],
  declarations: [SchedulePage],
})
export class SchedulePageModule {}
