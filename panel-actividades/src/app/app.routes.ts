import { Routes } from '@angular/router';

export class Rutas {
  static readonly actividades = 'actividades';
  static readonly sugerencias = 'sugerencias';
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: Rutas.actividades,
  },
  {
    path: Rutas.actividades,
    title: 'Actividades',
    loadComponent: () =>
      import('./actividades/pagina-actividades/pagina-actividades').then(
        (m) => m.PaginaActividades,
      ),
  },
  {
    path: Rutas.sugerencias,
    title: 'Sugerencias',
    loadComponent: () =>
      import('./sugerencias/pagina-sugerencias/pagina-sugerencias').then(
        (m) => m.PaginaSugerencias,
      ),
  },
  {
    path: '**',
    redirectTo: Rutas.actividades,
  },
];