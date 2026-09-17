import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-seccion',
  standalone: true,
  templateUrl: './panel-seccion.html',
  styleUrl: './panel-seccion.css',
})
export class PanelSeccion {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}