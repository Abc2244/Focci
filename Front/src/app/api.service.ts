import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:8000'; 

  constructor(private http: HttpClient) {}

  // Enviar un nuevo recordatorio al backend
  crearRecordatorio(recordatorio: any) {
    return this.http.post(`${this.apiUrl}/crear_recordatorio/`, recordatorio);
  }

  // Obtener recomendaciones basadas en un recordatorio
  obtenerRecomendaciones(recordatorio: any) {
    return this.http.post(`${this.apiUrl}/obtener_recomendaciones/`, recordatorio);
  }
}
