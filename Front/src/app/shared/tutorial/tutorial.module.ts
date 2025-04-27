import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TutorialOverlayComponent } from '../../components/tutorial-overlay/tutorial-overlay.component';

@NgModule({
  declarations: [
    TutorialOverlayComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    TutorialOverlayComponent
  ]
})
export class TutorialModule { } 