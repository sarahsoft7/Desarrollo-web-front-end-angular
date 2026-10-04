import { Component, input, output } from '@angular/core';
import { FiltroEstado, FiltroPrioridad } from '../../modelos/actividad';

@Component({
  selector: 'app-filtros-actividades',
  standalone: true,
  imports: [],
  templateUrl: './filtros-actividades.html',
  styleUrl: './filtros-actividades.css',
})
export class FiltrosActividades {
  readonly termino = input<string>('');
  readonly estado = input<FiltroEstado>('todas');
  readonly prioridad = input<FiltroPrioridad>('todas');
  readonly hayFiltros = input<boolean>(false);

  readonly buscarCambiado = output<string>();
  readonly estadoCambiado = output<FiltroEstado>();
  readonly prioridadCambiada = output<FiltroPrioridad>();
  readonly limpiarFiltros = output<void>();

  escribirTermino(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.buscarCambiado.emit(inputElement.value);
  }

  elegirEstado(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.estadoCambiado.emit(selectElement.value as FiltroEstado);
  }

  elegirPrioridad(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.prioridadCambiada.emit(selectElement.value as FiltroPrioridad);
  }

  limpiar(): void {
    this.limpiarFiltros.emit();
  }
}