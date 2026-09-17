export type EstadoActividad = 'pendiente' | 'en_progreso' | 'completada';
export type FiltroEstado = EstadoActividad | 'todas';
export type Prioridad = 'alta' | 'media' | 'baja';
export type FiltroPrioridad = Prioridad | 'todas';

export const ETIQUETAS: Record<EstadoActividad, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

export interface Actividad {
  id: number;
  titulo: string;
  estado: EstadoActividad;
  prioridad: Prioridad;
  creadaEn: string;
  destacada: boolean;
}