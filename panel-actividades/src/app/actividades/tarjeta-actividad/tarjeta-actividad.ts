import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Actividad, ETIQUETAS } from '../../modelos/actividad';

@Component({
  selector: 'app-tarjeta-actividad',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tarjeta-actividad.html',
  styleUrl: './tarjeta-actividad.css',
})
export class TarjetaActividad {
  readonly actividad = input.required<Actividad>();
  readonly seleccionada = input(false);

  readonly avanceSolicitado = output<number>();
  readonly eliminacionSolicitada = output<number>();
  readonly seleccionCambiada = output<number>();

  protected readonly etiquetaEstado = computed(
    () => ETIQUETAS[this.actividad().estado]
  );

  protected readonly etiquetaEliminar = computed(
    () => `Eliminar ${this.actividad().titulo}`
  );

  protected readonly etiquetaAvanzar = computed(
    () => `Completar ${this.actividad().titulo}`
  );
}