import { Component } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  textoRecordatorio: string = '';
  recomendaciones: any[] = [];

  constructor(private apiService: ApiService) {}

  // Crear un nuevo recordatorio
  crearRecordatorio() {
    const recordatorio = { texto: this.textoRecordatorio };
    this.apiService.crearRecordatorio(recordatorio).subscribe((res: any) => {
      console.log('Recordatorio creado:', res);
    });
  }

  // Obtener recomendaciones basadas en un recordatorio
  obtenerRecomendaciones() {
    const recordatorio = { texto: this.textoRecordatorio };
    this.apiService.obtenerRecomendaciones(recordatorio).subscribe((res: any) => {
      this.recomendaciones = res.recomendaciones;
      console.log('Recomendaciones:', this.recomendaciones);
    });
  }
}
