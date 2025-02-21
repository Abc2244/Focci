import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { SubjectsPageRoutingModule } from './subjects-routing.module';
import { SubjectsPage } from './subjects.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    SubjectsPageRoutingModule,
    SharedModule,
  ],
  declarations: [SubjectsPage],
})
export class SubjectsPageModule {}
