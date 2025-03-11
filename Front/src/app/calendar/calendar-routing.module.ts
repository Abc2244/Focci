import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CalendarPage } from './calendar.page';

const routes: Routes = [
  {
    path: '',
    component: CalendarPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarPageRoutingModule {}

export interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  name: string;
  credits: number;
  schedule: ScheduleItem[];
}
