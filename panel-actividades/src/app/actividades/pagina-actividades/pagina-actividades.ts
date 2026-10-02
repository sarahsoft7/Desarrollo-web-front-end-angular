import { Component, computed, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actividad, EstadoActividad, FiltroEstado, FiltroPrioridad, Prioridad } from '../../modelos/actividad';
import { FiltrosActividades } from '../filtros-actividades/filtros-actividades';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { PanelSeccion } from '../../compartido/panel-seccion/panel-seccion';
import { ActividadesService } from '../actividades';

@Component({
  selector: 'app-pagina-actividades',
  standalone: true,
  imports: [
    FiltrosActividades,
    ListaActividades,
    PanelSeccion,
  ],
  templateUrl: './pagina-actividades.html',
  styleUrl: './pagina-actividades.css',
})
export class PaginaActividades {
  private readonly servicio = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  private readonly ordenPrioridad: Record<Prioridad, number> = {
    alta: 0,
    media: 1,
    baja: 2,
  };

  // Entradas desde la URL
  readonly buscar = input<string | undefined>('');
  readonly estado = input<FiltroEstado | undefined>('todas');
  readonly prioridad = input<FiltroPrioridad | undefined>('todas');

  // Normalización para evitar undefined
  protected readonly termino = computed(() => this.buscar() ?? '');
  protected readonly filtroEstado = computed(() => this.estado() ?? 'todas');
  protected readonly filtroPrioridad = computed(() => this.prioridad() ?? 'todas');

  protected readonly actividades = this.servicio.actividades;
  protected readonly total = this.servicio.total;
  protected readonly pendientes = this.servicio.totalPendientes;

  protected readonly enProgreso = computed(
    () => this.actividades().filter((a) => a.estado === 'en_progreso').length,
  );

  protected readonly completadas = computed(
    () => this.actividades().filter((a) => a.estado === 'completada').length,
  );

  protected readonly porcentaje = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100),
  );

  protected readonly visibles = computed(() => {
    const termino = this.termino().trim().toLocaleLowerCase('es');
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();

    return this.actividades()
      .filter((a) => termino === '' || a.titulo.toLocaleLowerCase('es').includes(termino))
      .filter((a) => estado === 'todas' || a.estado === estado)
      .filter((a) => prioridad === 'todas' || a.prioridad === prioridad)
      .sort((a, b) => this.ordenPrioridad[a.prioridad] - this.ordenPrioridad[b.prioridad]);
  });

  protected readonly mostradas = computed(() => this.visibles().length);

  protected readonly hayFiltros = computed(
    () =>
      this.termino().trim() !== '' ||
      this.filtroEstado() !== 'todas' ||
      this.filtroPrioridad() !== 'todas',
  );

  protected readonly mensajeVacio = computed(() =>
    this.total() === 0
      ? 'Todavía no hay actividades. Crea la primera para empezar.'
      : 'Ninguna actividad coincide con los filtros aplicados.',
  );

  constructor() {
    effect(() => {
      console.info(`[Pagina] ${this.mostradas()} de ${this.total()} visibles`);
    });
  }

  // Métodos que navegan para cambiar la URL
  protected cambiarBuscar(valor: string): void {
    this.actualizar({ buscar: valor.trim() === '' ? null : valor });
  }

  protected cambiarEstado(valor: FiltroEstado): void {
    this.actualizar({ estado: valor === 'todas' ? null : valor });
  }

  protected cambiarPrioridad(valor: FiltroPrioridad): void {
    this.actualizar({ prioridad: valor === 'todas' ? null : valor });
  }

  protected limpiarFiltros(): void {
    this.actualizar({ buscar: null, estado: null, prioridad: null });
  }

  private actualizar(cambios: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected alternarDestacada(id: number): void {
    this.servicio.alternarDestacada(id);
  }

  protected avanzarEstado(id: number): void {
    this.servicio.completar(id);
  }

  protected eliminar(id: number): void {
    const actividad = this.servicio.buscarPorId(id);

    if (!actividad || !confirm(`¿Eliminar «${actividad.titulo}»?`)) {
      return;
    }

    this.servicio.eliminar(id);
  }

  protected restablecer(): void {
    this.servicio.vaciar();
    this.limpiarFiltros();
  }
}