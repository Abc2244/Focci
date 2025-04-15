import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ColorTheme = 'blue' | 'green' | 'orange' | 'purple' | 'custom';
export type ThemeMode = 'light' | 'dark' | ColorTheme;

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _colorTheme = new BehaviorSubject<ColorTheme>('blue');
  private _isDark = new BehaviorSubject<boolean>(false);

  public colorTheme$ = this._colorTheme.asObservable();
  public isDark$ = this._isDark.asObservable();

  // Definición de los temas predefinidos
  private predefinedThemes = {
    blue: {
      primary: '#2196F3',
      rgb: '33, 150, 243',
      contrast: '#ffffff',
      shade: '#1e88e5',
      tint: '#42a5f5',
    },
    green: {
      primary: '#4CAF50',
      rgb: '76, 175, 80',
      contrast: '#ffffff',
      shade: '#43a047',
      tint: '#66bb6a',
    },
    orange: {
      primary: '#FF9800',
      rgb: '255, 152, 0',
      contrast: '#000000',
      shade: '#f57c00',
      tint: '#ffa726',
    },
    purple: {
      primary: '#9C27B0',
      rgb: '156, 39, 176',
      contrast: '#ffffff',
      shade: '#8e24aa',
      tint: '#ab47bc',
    },
  };

  private themeVariables = {
    light: {
      '--app-background-light': '#f4f5f8',
      '--app-background-dark': '#ffffff',
      '--app-card-color': '#ffffff',
      '--app-card-color-rgb': '255, 255, 255',
      '--app-text-color': '#000000',
      '--app-text-color-medium': '#666666',
      '--app-text-color-light': '#999999',
      '--app-shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
      '--app-shadow-md': '0 4px 8px rgba(0, 0, 0, 0.1)',
      '--app-shadow-lg': '0 8px 20px rgba(0, 0, 0, 0.1)',
      '--card-shadow': '0 4px 8px rgba(0, 0, 0, 0.1)',
      '--input-background': 'rgba(0, 0, 0, 0.05)',
    },
    dark: {
      '--app-background-light': '#121212',
      '--app-background-dark': '#1e1e1e',
      '--app-card-color': '#2d2d2d',
      '--app-card-color-rgb': '45, 45, 45',
      '--app-text-color': '#ffffff',
      '--app-text-color-medium': '#b0b0b0',
      '--app-text-color-light': '#808080',
      '--app-shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.2)',
      '--app-shadow-md': '0 4px 8px rgba(0, 0, 0, 0.3)',
      '--app-shadow-lg': '0 8px 20px rgba(0, 0, 0, 0.4)',
      '--card-shadow': '0 4px 8px rgba(0, 0, 0, 0.2)',
      '--input-background': 'rgba(255, 255, 255, 0.05)',
    },
  };

  constructor() {
    const savedColorTheme = localStorage.getItem('app-color-theme') || 'blue';
    const savedIsDark = localStorage.getItem('app-is-dark') === 'true';

    this.applyTheme(savedColorTheme as ColorTheme);
    this.applyDarkMode(savedIsDark);
  }

  public getCurrentTheme(): ColorTheme {
    return this._colorTheme.value;
  }

  public isDarkMode(): boolean {
    return this._isDark.value;
  }

  public applyTheme(theme: ColorTheme) {
    if (['blue', 'green', 'orange', 'purple'].includes(theme)) {
      this.applyPredefinedTheme(
        theme as 'blue' | 'green' | 'orange' | 'purple'
      );
    } else if (theme === 'custom') {
      const savedColor = localStorage.getItem('custom-primary-color');
      if (savedColor) {
        this.updateCustomColors(savedColor);
      }
    }

    this._colorTheme.next(theme);
    localStorage.setItem('app-color-theme', theme);

    // Disparar evento personalizado para actualizar el calendario
    document.dispatchEvent(new CustomEvent('themeChanged'));
  }

  public applyDarkMode(isDark: boolean) {
    const theme = isDark ? this.themeVariables.dark : this.themeVariables.light;

    // Aplicar todas las variables de tema
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Mantener el atributo data-theme para compatibilidad
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    this._isDark.next(isDark);
    localStorage.setItem('app-is-dark', isDark.toString());

    // Disparar evento personalizado para actualizar el calendario
    document.dispatchEvent(new CustomEvent('themeChanged'));
  }

  // Método para actualizar colores personalizados
  updateCustomColors(primaryColor: string) {
    // Validar y normalizar el color
    if (!primaryColor.startsWith('#')) {
      primaryColor = '#' + primaryColor;
    }

    // Color primario base
    document.documentElement.style.setProperty(
      '--ion-color-primary',
      primaryColor
    );

    // Calcular variantes
    const rgb = this.hexToRgb(primaryColor);
    if (rgb) {
      const { r, g, b } = rgb;

      // RGB para efectos de transparencia
      document.documentElement.style.setProperty(
        '--ion-color-primary-rgb',
        `${r}, ${g}, ${b}`
      );

      // Calcular contraste automáticamente
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const contrast = brightness > 128 ? '#000000' : '#ffffff';
      const contrastRgb = contrast === '#ffffff' ? '255, 255, 255' : '0, 0, 0';

      // Establecer contraste y sus variantes
      document.documentElement.style.setProperty(
        '--ion-color-primary-contrast',
        contrast
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-contrast-rgb',
        contrastRgb
      );

      // Tint (más claro) y Shade (más oscuro)
      const tint = this.lightenDarkenColor(primaryColor, 20);
      const shade = this.lightenDarkenColor(primaryColor, -20);

      document.documentElement.style.setProperty(
        '--ion-color-primary-tint',
        tint
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-shade',
        shade
      );
    }

    // Guardar el color personalizado
    localStorage.setItem('custom-primary-color', primaryColor);
  }

  // Mejorado para manejar colores más precisamente
  private lightenDarkenColor(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const { r, g, b } = rgb;
    const adjustColor = (c: number) => Math.min(255, Math.max(0, c + amount));

    const newR = adjustColor(r);
    const newG = adjustColor(g);
    const newB = adjustColor(b);

    return `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  applyPredefinedTheme(themeName: 'blue' | 'green' | 'orange' | 'purple') {
    const theme = this.predefinedThemes[themeName];
    if (theme) {
      document.documentElement.style.setProperty(
        '--ion-color-primary',
        theme.primary
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-rgb',
        theme.rgb
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-contrast',
        theme.contrast
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-contrast-rgb',
        theme.contrast === '#ffffff' ? '255, 255, 255' : '0, 0, 0'
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-shade',
        theme.shade
      );
      document.documentElement.style.setProperty(
        '--ion-color-primary-tint',
        theme.tint
      );

      this._colorTheme.next(themeName);
      localStorage.setItem('app-color-theme', themeName);
    }
  }
}
