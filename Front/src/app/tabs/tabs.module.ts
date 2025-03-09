import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TabsPageRoutingModule } from './tabs-routing.module';
import { TabsPage } from './tabs.page';
import { RouterModule } from '@angular/router';
import { SideMenuComponent } from '../components/side-menu/side-menu.component';
import { HeaderComponent } from '../components/header/header.component';
import { TabBarComponent } from '../components/tab-bar/tab-bar.component';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule, TabsPageRoutingModule],
  declarations: [TabsPage, SideMenuComponent, HeaderComponent, TabBarComponent],
})
export class TabsPageModule {}
