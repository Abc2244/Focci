import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';

  // Agregamos las credenciales de prueba
  private testUser = {
    email: 'abc@gmail.com',
    password: '1234',
  };

  constructor(private http: HttpClient) {
    // Verificamos si hay credenciales guardadas al iniciar
    this.checkAndLoginTestUser();
  }

  private async checkAndLoginTestUser() {
    if (!this.isAuthenticated()) {
      await this.login(this.testUser.email, this.testUser.password);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('Enviando request a:', `${this.apiUrl}/auth/login`);
      console.log('Con datos:', { email, password });

      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/login`, { email, password })
      );

      console.log('Respuesta del servidor:', response);

      if (response && response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token);
        return true;
      }

      console.log('No se encontró access_token en la respuesta:', response);
      return false;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        console.error('Error HTTP:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
        });

        switch (error.status) {
          case 401:
            console.error('Credenciales inválidas:', error.error);
            return false;
          case 404:
            console.error('Servidor no encontrado:', error.error);
            return false;
          case 500:
            console.error('Error del servidor:', error.error);
            return false;
          default:
            console.error('Error desconocido:', error);
            return false;
        }
      }
      console.error('Error no HTTP en AuthService.login:', error);
      return false;
    }
  }

  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.user_id;
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }
}
