import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SubjectsPageRoutingModule } from './subjects-routing.module';
import { SubjectsPage } from './subjects.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SubjectsPageRoutingModule,
    SharedModule,
  ],
  declarations: [SubjectsPage],
})
export class SubjectsPageModule {}
