import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TaskPageRoutingModule } from './task-routing.module';
import { TaskPage } from './task.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TaskPageRoutingModule,
    SharedModule,
  ],
  declarations: [TaskPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TaskModule {}
