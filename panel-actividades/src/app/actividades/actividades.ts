import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Actividad, esListaActividades, EstadoActividad, LIMITES, Prioridad } from '../modelos/actividad';
import { AlmacenamientoService } from '../compartido/almacenamiento';

const CLAVE_ALMACENAMIENTO = 'panel_actividades_v1';

const INICIALES: readonly Actividad[] = [
  { id: 1, titulo: 'Preparar estructura HTML', estado: 'completada', prioridad: 'alta', creadaEn: '2026-08-10', destacada: false },
  { id: 2, titulo: 'Revisar contraste', estado: 'en_progreso', prioridad: 'media', creadaEn: '2026-08-12', destacada: true },
  { id: 3, titulo: 'Practicar TypeScript', estado: 'pendiente', prioridad: 'alta', creadaEn: '2026-08-14', destacada: false },
  { id: 4, titulo: 'Comprobar vista estrecha', estado: 'pendiente', prioridad: 'baja', creadaEn: '2026-08-16', destacada: false },
  { id: 5, titulo: 'Ejecutar el build', estado: 'pendiente', prioridad: 'media', creadaEn: '2026-08-18', destacada: false },
];

@Injectable({
  providedIn: 'root',
})
export class ActividadesService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  private readonly lista = signal<Actividad[]>(this.cargarIniciales());
  readonly actividades = this.lista.asReadonly();

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
    effect(() => {
      this.almacenamiento.guardar(CLAVE_ALMACENAMIENTO, this.lista());
    });
  }

  private cargarIniciales(): Actividad[] {
    const guardadas = this.almacenamiento.leerSeguro(CLAVE_ALMACENAMIENTO, esListaActividades);
    if (guardadas !== null) {
      return guardadas;
    }
    return INICIALES.map((a) => ({ ...a }));
  }

  tituloDisponible(titulo: string, idActual?: number): boolean {
    const tituloLimpio = titulo.trim().toLowerCase();
    return !this.lista().some(
      (a) => a.titulo.trim().toLowerCase() === tituloLimpio && a.id !== idActual
    );
  }

  guardar(datos: Omit<Actividad, 'id' | 'creadaEn'>, id?: number): Promise<Actividad> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.tituloDisponible(datos.titulo, id)) {
          reject(new Error('Ya existe una actividad con este título'));
          return;
        }

        if (id) {
          const existente = this.buscarPorId(id);
          const actualizada: Actividad = {
            id,
            creadaEn: existente ? existente.creadaEn : new Date().toISOString().split('T')[0],
            ...datos,
          };
          this.lista.update((actual) =>
            actual.map((item) => (item.id === id ? actualizada : item))
          );
          resolve(actualizada);
        } else {
          const nuevoId = Math.max(0, ...this.lista().map((a) => a.id)) + 1;
          const nuevaActividad: Actividad = {
            id: nuevoId,
            creadaEn: new Date().toISOString().split('T')[0],
            ...datos,
          };
          this.lista.update((actual) => [...actual, nuevaActividad]);
          resolve(nuevaActividad);
        }
      }, 300);
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
    this.lista.update((actual) =>
      actual.map((a) => (a.id === id ? { ...a, estado: this.siguienteEstado(a.estado) } : a))
    );
  }

  completar(id: number): void {
    this.avanzarEstado(id);
  }

  eliminar(id: number): void {
    this.lista.update((actual) => actual.filter((a) => a.id !== id));
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