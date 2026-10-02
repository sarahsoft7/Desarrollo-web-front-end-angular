import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, form, required, minLength, maxLength } from '@angular/forms/signals';
import { ActividadesService } from '../actividades';
import { LIMITES, Prioridad } from '../../modelos/actividad';

interface NuevaActividad {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
}

@Component({
  selector: 'app-formulario-actividad',
  imports: [FormField, RouterLink],
  templateUrl: './formulario-actividad.html',
  styleUrl: './formulario-actividad.css',
})
export class FormularioActividad implements OnInit {
  private readonly servicio = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly LIMITES = LIMITES;

  protected readonly idEdicion = signal<number | null>(null);
  protected readonly esEdicion = computed(() => this.idEdicion() !== null);

  protected readonly guardando = signal(false);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly errorServidor = signal<string | null>(null);

  protected readonly modelo = signal<NuevaActividad>({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
  });

  protected readonly f = form(this.modelo, (f) => {
    required(f.titulo);
    minLength(f.titulo, LIMITES.tituloMin);
    maxLength(f.titulo, LIMITES.tituloMax);
    maxLength(f.descripcion, LIMITES.descripcionMax);
  });

  protected readonly restantes = computed(() => LIMITES.tituloMax - this.modelo().titulo.length);

  protected readonly errorTitulo = computed(
    () => this.f.titulo().touched() && !this.f.titulo().valid()
  );

  protected readonly errorDescripcion = computed(
    () => this.f.descripcion().touched() && !this.f.descripcion().valid()
  );

  // Validación en tiempo real para verificar si el título ya existe
  protected readonly tituloDuplicado = computed(() => {
    const tituloActual = this.modelo().titulo.trim();
    if (!tituloActual || tituloActual.length < LIMITES.tituloMin) {
      return false;
    }
    return !this.servicio.tituloDisponible(tituloActual, this.idEdicion() ?? undefined);
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      const existente = this.servicio.buscarPorId(id);
      if (existente) {
        this.idEdicion.set(id);
        this.modelo.set({
          titulo: existente.titulo,
          descripcion: '',
          prioridad: existente.prioridad,
        });
      }
    }
  }

  protected async crear(evento: Event): Promise<void> {
    evento.preventDefault();

    if (!this.f().valid() || this.tituloDuplicado() || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.errorServidor.set(null);
    this.mensajeExito.set(null);

    try {
      const { titulo, prioridad } = this.modelo();
      const id = this.idEdicion();

      await this.servicio.guardar(
        {
          titulo,
          prioridad,
          estado: 'pendiente',
          destacada: false,
        },
        id ?? undefined
      );

      this.mensajeExito.set(
        id ? 'Actividad actualizada con éxito' : 'Actividad creada con éxito'
      );

      setTimeout(() => {
        this.router.navigate(['/actividades']);
      }, 1000);
    } catch (error) {
      this.errorServidor.set(
        error instanceof Error ? error.message : 'Ocurrió un error al guardar'
      );
    } finally {
      this.guardando.set(false);
    }
  }
}