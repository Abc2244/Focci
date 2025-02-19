import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';

  constructor() {}

  // Guardar el token en el almacenamiento local
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Obtener el token del almacenamiento local
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtener el ID del usuario desde el token
  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded.user_id;
    }
    return null;
  }

  // Eliminar el token (cerrar sesión)
  logout() {
    localStorage.removeItem(this.tokenKey);
  }
}
