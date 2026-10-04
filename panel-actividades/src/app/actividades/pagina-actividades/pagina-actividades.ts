import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    RouterLink,
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

  private readonly queryParams = signal<Record<string, string>>({});

  constructor() {
    this.ruta.queryParams.subscribe((params) => {
      this.queryParams.set(params as Record<string, string>);
    });

    effect(() => {
      console.info(`[Pagina] ${this.mostradas()} de ${this.total()} visibles`);
    });
  }

  protected readonly termino = computed(() => (this.queryParams()['buscar'] ?? '').trim());

  protected readonly filtroEstado = computed<FiltroEstado>(() => {
    const val = this.queryParams()['estado'];
    if (!val || val === 'todos') return 'todas';
    return val as FiltroEstado;
  });

  protected readonly filtroPrioridad = computed<FiltroPrioridad>(() => {
    const val = this.queryParams()['prioridad'];
    if (!val || val === 'todas') return 'todas';
    return val as FiltroPrioridad;
  });

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
    const busqueda = this.termino().toLowerCase();
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();

    return this.actividades()
      .filter((a) => {
        const coincideTexto =
          busqueda === '' ||
          a.titulo.toLowerCase().includes(busqueda) ||
          a.descripcion.toLowerCase().includes(busqueda);

        const coincideEstado =
          estado === 'todas' || a.estado === estado;

        const coincidePrioridad =
          prioridad === 'todas' || a.prioridad === prioridad;

        return coincideTexto && coincideEstado && coincidePrioridad;
      })
      .sort((a, b) => this.ordenPrioridad[a.prioridad] - this.ordenPrioridad[b.prioridad]);
  });

  protected readonly mostradas = computed(() => this.visibles().length);

  protected readonly hayFiltros = computed(() => {
    const textoActivo = this.termino() !== '';
    const estadoActivo = this.filtroEstado() !== 'todas';
    const prioridadActiva = this.filtroPrioridad() !== 'todas';

    return textoActivo || estadoActivo || prioridadActiva;
  });

  protected readonly mensajeVacio = computed(() =>
    this.total() === 0
      ? 'Todavía no hay actividades. Crea la primera para empezar.'
      : 'Ninguna actividad coincide con los filtros aplicados.',
  );

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

  protected readonly cargando = this.servicio.cargando;
  protected readonly errorCarga = this.servicio.error;

  protected recargar(): void {
    this.servicio.cargar();
  }  
}