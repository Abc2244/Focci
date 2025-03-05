import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SmartPageRoutingModule } from './smart-routing.module';

import { SmartPage } from './smart.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SmartPageRoutingModule
  ],
  declarations: [SmartPage]
})
export class SmartPageModule {}
