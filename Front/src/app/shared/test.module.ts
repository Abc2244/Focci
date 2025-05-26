import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    IonicModule.forRoot(),
    HttpClientModule,
    HttpClientTestingModule,
    RouterTestingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    IonicModule,
    HttpClientModule,
    HttpClientTestingModule,
    RouterTestingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class TestModule { } 