import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskManagerPageRoutingModule } from './task-manager-routing.module';

import { TaskManagerPage } from './task-manager.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskManagerPageRoutingModule
  ],
  declarations: [TaskManagerPage]
})
export class TaskManagerPageModule {}
