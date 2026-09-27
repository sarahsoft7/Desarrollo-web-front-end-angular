import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlmacenamientoService {
  guardar(clave: string, valor: unknown): boolean {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  }

  existe(clave: string): boolean {
    try {
      return localStorage.getItem(clave) !== null;
    } catch {
      return false;
    }
  }

  leer(clave: string): unknown {
    try {
      const texto = localStorage.getItem(clave);
      return texto === null ? null : JSON.parse(texto);
    } catch {
      return null;
    }
  }

  leerSeguro<T>(clave: string, validador: (valor: unknown) => valor is T): T | null {
    try {
      const texto = localStorage.getItem(clave);
      if (texto === null) return null;
      const datos: unknown = JSON.parse(texto);
      return validador(datos) ? datos : null;
    } catch {
      return null;
    }
  }
}