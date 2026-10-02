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

export const LIMITES = {
  tituloMin: 3,
  tituloMax: 80,
  descripcionMax: 300,
} as const;

export function esEstadoActividad(valor: unknown): valor is EstadoActividad {
  return valor === 'pendiente' || valor === 'en_progreso' || valor === 'completada';
}

export function esPrioridad(valor: unknown): valor is Prioridad {
  return valor === 'alta' || valor === 'media' || valor === 'baja';
}

export function esActividad(valor: unknown): valor is Actividad {
  if (typeof valor !== 'object' || valor === null) return false;

  const a = valor as Record<string, unknown>;

  return (
    typeof a['id'] === 'number' &&
    typeof a['titulo'] === 'string' &&
    esEstadoActividad(a['estado']) &&
    esPrioridad(a['prioridad']) &&
    typeof a['creadaEn'] === 'string' &&
    typeof a['destacada'] === 'boolean'
  );
}

export function esListaActividades(valor: unknown): valor is Actividad[] {
  return Array.isArray(valor) && valor.every(esActividad);
}