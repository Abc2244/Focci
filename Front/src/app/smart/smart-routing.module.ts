import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SmartPage } from './smart.page';

const routes: Routes = [
  {
    path: '',
    component: SmartPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmartPageRoutingModule {}
