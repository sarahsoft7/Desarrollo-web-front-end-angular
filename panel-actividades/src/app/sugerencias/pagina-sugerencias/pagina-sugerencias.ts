import { HttpErrorResponse } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';

interface Sugerencia {
  titulo: string;
  motivo: string;
}

function esSugerencia(valor: unknown): valor is Sugerencia {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Sugerencia;
  return typeof v.titulo === 'string' && typeof v.motivo === 'string';
}

function mensajeDe(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    }
    if (error.status === 404) {
      return 'No se encontró el recurso de sugerencias (404).';
    }
    return `Error en el servidor (${error.status}): ${error.message}`;
  }
  return 'Ocurrió un error inesperado al cargar las sugerencias.';
}

@Component({
  selector: 'app-pagina-sugerencias',
  standalone: true,
  imports: [],
  templateUrl: './pagina-sugerencias.html',
  styleUrl: './pagina-sugerencias.css',
})
export class PaginaSugerencias {
  protected readonly recurso = httpResource<unknown>(() => '/sugerencias.json');

  protected readonly sugerencias = computed(() => {
    const datos = this.recurso.value();
    return Array.isArray(datos) ? datos.filter(esSugerencia) : [];
  });

  protected readonly mensajeError = computed(() => mensajeDe(this.recurso.error()));
}