import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { ActividadesApi, DatosActividadRemota, FiltrosConsulta } from '../api/actividades-api';
import { Actividad, EstadoActividad, LIMITES, Prioridad } from '../modelos/actividad';

@Injectable({
  providedIn: 'root',
})
export class ActividadesService {
  private readonly api = inject(ActividadesApi);

  private readonly lista = signal<Actividad[]>([]);

  readonly actividades = this.lista.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly total = computed(() => this.lista().length);
  readonly pendientes = computed(
    () => this.lista().filter((a) => a.estado === 'pendiente').length
  );
  readonly totalPendientes = this.pendientes;
  readonly enProgreso = computed(
    () => this.lista().filter((a) => a.estado === 'en_progreso').length
  );
  readonly completadas = computed(
    () => this.lista().filter((a) => a.estado === 'completada').length
  );
  readonly porcentaje = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100)
  );

  constructor() {
    this.cargar();
  }

  cargar(filtros?: FiltrosConsulta): void {
    this.cargando.set(true);
    this.error.set('');

    this.api
      .listar(filtros)
      .pipe(
        catchError((e: unknown) => {
          if (e instanceof HttpErrorResponse) {
            if (e.status === 0) {
              this.error.set('No se pudo conectar con el servidor. Revisa tu conexión.');
            } else if (e.status === 404) {
              this.error.set('No se encontró el recurso solicitado (404).');
            } else {
              this.error.set(`Error en el servidor (${e.status}): ${e.message}`);
            }
          } else {
            this.error.set('Ocurrió un error inesperado al cargar las actividades.');
          }
          return of<Actividad[]>([]);
        }),
        finalize(() => this.cargando.set(false))
      )
      .subscribe((actividades) => this.lista.set(actividades));
  }

  tituloDisponible(titulo: string, idActual?: number): boolean {
    const tituloLimpio = titulo.trim().toLowerCase();
    return !this.lista().some(
      (a) => a.titulo.trim().toLowerCase() === tituloLimpio && a.id !== idActual
    );
  }

  guardar(datos: Omit<Actividad, 'id' | 'creadaEn'>, id?: number): Promise<Actividad> {
    return new Promise((resolve, reject) => {
      if (!this.tituloDisponible(datos.titulo, id)) {
        reject(new Error('Ya existe una actividad con este título'));
        return;
      }

      if (id) {
        const datosRemotos: Partial<DatosActividadRemota> = {
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          prioridad: datos.prioridad,
          completada: datos.estado === 'completada',
        };

        this.api.actualizar(id, datosRemotos).subscribe({
          next: (actualizada) => {
            this.lista.update((actual) =>
              actual.map((item) => (item.id === id ? actualizada : item))
            );
            resolve(actualizada);
          },
          error: () => reject(new Error('No se pudo actualizar la actividad.')),
        });
      } else {
        const datosRemotos: DatosActividadRemota = {
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          prioridad: datos.prioridad,
          completada: datos.estado === 'completada',
        };

        this.api.crear(datosRemotos).subscribe({
          next: (nueva) => {
            this.lista.update((actual) => [...actual, nueva]);
            resolve(nueva);
          },
          error: () => reject(new Error('No se pudo guardar la actividad.')),
        });
      }
    });
  }

  crear(titulo: string, prioridad: Prioridad): Actividad | null {
    if (titulo.length < LIMITES.tituloMin || titulo.length > LIMITES.tituloMax) {
      return null;
    }

    const nuevoId = Math.max(0, ...this.lista().map((a) => a.id)) + 1;
    const nuevaActividad: Actividad = {
      id: nuevoId,
      titulo,
      descripcion: '',
      prioridad,
      estado: 'pendiente',
      creadaEn: new Date().toISOString().split('T')[0],
      destacada: false,
    };

    this.lista.update((actual) => [...actual, nuevaActividad]);
    return nuevaActividad;
  }

  buscarPorId(id: number): Actividad | undefined {
    return this.lista().find((a) => a.id === id);
  }

  alternarDestacada(id: number): void {
    this.lista.update((actual) =>
      actual.map((a) => (a.id === id ? { ...a, destacada: !a.destacada } : a))
    );
  }

  avanzarEstado(id: number): void {
    const act = this.buscarPorId(id);
    if (!act) return;

    const nuevoEstado = this.siguienteEstado(act.estado);
    const esCompletada = nuevoEstado === 'completada';

    this.api.actualizar(id, { completada: esCompletada }).subscribe({
      next: (actualizada) => {
        this.lista.update((actual) =>
          actual.map((a) => (a.id === id ? { ...actualizada, estado: nuevoEstado } : a))
        );
      },
      error: () => {
        this.lista.update((actual) =>
          actual.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a))
        );
      },
    });
  }

  completar(id: number): void {
    this.avanzarEstado(id);
  }

  eliminar(id: number): void {
    this.api.eliminar(id).subscribe({
      next: () => {
        this.lista.update((actual) => actual.filter((a) => a.id !== id));
      },
      error: () => {
        this.lista.update((actual) => actual.filter((a) => a.id !== id));
      },
    });
  }

  vaciar(): void {
    this.lista.set([]);
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }
}