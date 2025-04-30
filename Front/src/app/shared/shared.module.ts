import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TutorialModule } from './tutorial/tutorial.module';
import { SideMenuComponent } from '../components/side-menu/side-menu.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    SideMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TutorialModule,
    RouterModule
  ],
  exports: [
    TutorialModule,
    SideMenuComponent,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule {}
