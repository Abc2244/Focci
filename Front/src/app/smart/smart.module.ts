import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SmartPageRoutingModule } from './smart-routing.module';
import { SmartPage } from './smart.page';
import { ScheduleService } from '../services/schedule.service';
import { SmartAssistantService } from '../services/smart-assistant.service';
import { NotificationsService } from '../services/notifications.service';
import { ApiService } from '../api.service';
import { ToastService } from '../services/toast.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SmartPageRoutingModule
  ],
  declarations: [SmartPage],
  providers: [
    ScheduleService,
    SmartAssistantService,
    NotificationsService,
    ApiService,
    ToastService
  ],
})
export class SmartPageModule {}
