import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SmartPageRoutingModule } from './smart-routing.module';

import { SmartPage } from './smart.page';
import { ScheduleService } from '../services/schedule.service';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SmartPageRoutingModule],
  declarations: [SmartPage],
  providers: [ScheduleService],
})
export class SmartPageModule {}
