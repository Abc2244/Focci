import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskManagerPageRoutingModule } from './task-manager-routing.module';

import { TaskManagerPage } from './task-manager.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskManagerPageRoutingModule,
    SharedModule,
  ],
  declarations: [TaskManagerPage],
})
export class TaskManagerPageModule {}
