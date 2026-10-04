import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Actividad, Prioridad } from '../modelos/actividad';

interface ActividadRemota {
  id: number | string;
  task_title: string;
  description: string | null;
  priority_level: number | string;
  is_done: boolean;
  created_at: string;
}

export interface DatosActividadRemota {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  completada: boolean;
}

export interface FiltrosConsulta {
  busqueda?: string;
  completada?: boolean;
  prioridad?: Prioridad;
}

const PRIORIDADES: Record<number, Prioridad> = { 1: 'baja', 2: 'media', 3: 'alta' };
const NIVELES: Record<Prioridad, number> = { baja: 1, media: 2, alta: 3 };

export function esActividadRemota(valor: unknown): valor is ActividadRemota {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const v = valor as Record<string, unknown>;

  return (
    (typeof v['id'] === 'number' || typeof v['id'] === 'string') &&
    typeof v['task_title'] === 'string' &&
    (typeof v['priority_level'] === 'number' || typeof v['priority_level'] === 'string') &&
    typeof v['is_done'] === 'boolean'
  );
}

export function aActividad(remota: ActividadRemota): Actividad {
  const nivelNum = Number(remota.priority_level);
  
  return {
    id: Number(remota.id),
    titulo: remota.task_title,
    descripcion: remota.description ?? '',
    prioridad: PRIORIDADES[nivelNum] ?? 'media',
    estado: remota.is_done ? 'completada' : 'pendiente',
    creadaEn: remota.created_at ? String(remota.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
    destacada: false,
  };
}

export function aActividades(datos: unknown): Actividad[] {
  return Array.isArray(datos) ? datos.filter(esActividadRemota).map(aActividad) : [];
}

function aCuerpoRemoto(datos: DatosActividadRemota): Record<string, unknown> {
  return {
    task_title: datos.titulo,
    description: datos.descripcion === '' ? null : datos.descripcion,
    priority_level: NIVELES[datos.prioridad],
    is_done: datos.completada,
    created_at: new Date().toISOString(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class ActividadesApi {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/actividades';

  listar(filtros?: FiltrosConsulta): Observable<Actividad[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.busqueda) {
        params = params.set('q', filtros.busqueda);
      }
      if (filtros.completada !== undefined) {
        params = params.set('is_done', String(filtros.completada));
      }
      if (filtros.prioridad) {
        params = params.set('priority_level', String(NIVELES[filtros.prioridad]));
      }
    }

    return this.http.get<unknown>(this.base, { params }).pipe(map(aActividades));
  }

  crear(datos: DatosActividadRemota): Observable<Actividad> {
    const cuerpo = aCuerpoRemoto(datos);
    return this.http.post<unknown>(this.base, cuerpo).pipe(
      map((res) => {
        if (!esActividadRemota(res)) {
          throw new Error('La respuesta del servidor no tiene un formato válido.');
        }
        return aActividad(res);
      })
    );
  }

  actualizar(id: number, datos: Partial<DatosActividadRemota>): Observable<Actividad> {
    const cuerpo: Record<string, unknown> = {};
    if (datos.titulo !== undefined) cuerpo['task_title'] = datos.titulo;
    if (datos.descripcion !== undefined) cuerpo['description'] = datos.descripcion === '' ? null : datos.descripcion;
    if (datos.prioridad !== undefined) cuerpo['priority_level'] = NIVELES[datos.prioridad];
    if (datos.completada !== undefined) cuerpo['is_done'] = datos.completada;

    return this.http.patch<unknown>(`${this.base}/${id}`, cuerpo).pipe(
      map((res) => {
        if (!esActividadRemota(res)) {
          throw new Error('Respuesta inválida al actualizar.');
        }
        return aActividad(res);
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}