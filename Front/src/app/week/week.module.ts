import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WeekPageRoutingModule } from './week-routing.module';

import { WeekPage } from './week.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    WeekPageRoutingModule,
    SharedModule,
  ],
  declarations: [WeekPage],
  exports: [WeekPage],
})
export class WeekPageModule {}
