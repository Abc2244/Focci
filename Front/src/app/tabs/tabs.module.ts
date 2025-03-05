import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TabsPageRoutingModule } from './tabs-routing.module';
import { TabsPage } from './tabs.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  imports: [CommonModule, IonicModule, TabsPageRoutingModule],
  declarations: [TabsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TabsPageModule {}
