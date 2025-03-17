import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StatsPageRoutingModule } from './stats-routing.module';
import { StatsPage } from './stats.page';

@NgModule({
  imports: [CommonModule, IonicModule, StatsPageRoutingModule],
  declarations: [StatsPage],
})
export class StatsPageModule {}
