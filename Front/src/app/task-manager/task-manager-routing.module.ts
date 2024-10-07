import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaskManagerPage } from './task-manager.page';

const routes: Routes = [
  {
    path: '',
    component: TaskManagerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskManagerPageRoutingModule {}
