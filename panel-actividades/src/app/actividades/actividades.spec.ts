import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActividadesService } from './actividades';

const REMOTAS = [
  { id: 1, task_title: 'Revisar el informe', description: null, priority_level: 3, is_done: false, created_at: '2026-08-10T09:00:00Z' },
  { id: 2, task_title: 'Preparar la reunión', description: 'Con el equipo.', priority_level: 2, is_done: false, created_at: '2026-08-12T09:00:00Z' },
  { id: 3, task_title: 'Llamar al proveedor', description: null, priority_level: 1, is_done: true, created_at: '2026-08-14T09:00:00Z' },
];

describe('ActividadesService', () => {
  let servicio: ActividadesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(ActividadesService);
    http.expectOne('http://localhost:3000/actividades').flush(REMOTAS);
  });

  describe('al cargar', () => {
    it('trae las actividades del servidor traducidas', () => {
      expect(servicio.total()).toBe(3);
      expect(servicio.actividades()[0].titulo).toBe('Revisar el informe');
      expect(servicio.actividades()[0].prioridad).toBe('alta');
    });

    it('cuenta pendientes y completadas por separado', () => {
      expect(servicio.pendientes()).toBe(2);
      expect(servicio.completadas()).toBe(1);
      expect(servicio.porcentaje()).toBe(33);
    });
  });

  describe('crear', () => {
    it('mantiene el título ingresado', () => {
      const creada = servicio.crear('  Revisar el foco  ', 'alta');
      expect(creada?.titulo).toBe('  Revisar el foco  ');
    });

    it('devuelve la actividad con su identificador y en pendiente', () => {
      const creada = servicio.crear('Revisar el foco', 'alta');
      expect(creada).not.toBeNull();
      expect(creada?.id).toBeGreaterThan(0);
      expect(creada?.estado).toBe('pendiente');
    });

    it('rechaza un título de dos caracteres', () => {
      expect(servicio.crear('ab', 'alta')).toBeNull();
      expect(servicio.total()).toBe(3);
    });

    it('acepta uno de tres', () => {
      expect(servicio.crear('abc', 'alta')).not.toBeNull();
    });

    it('permite crear actividades con títulos similares', () => {
      expect(servicio.crear('revisar EL informe', 'alta')).not.toBeNull();
    });
  });

  describe('avanzarEstado', () => {
    it('lleva de pendiente a en progreso', () => {
      servicio.avanzarEstado(1);
      http.expectOne((r) => r.method === 'PATCH' || r.method === 'PUT').flush({ ...REMOTAS[0], is_done: false });
      expect(servicio.buscarPorId(1)?.estado).toBe('en_progreso');
    });

    it('lleva de en progreso a completada', () => {
      servicio.avanzarEstado(1);
      http.expectOne((r) => r.method === 'PATCH' || r.method === 'PUT').flush({ ...REMOTAS[0], is_done: false });
      servicio.avanzarEstado(1);
      http.expectOne((r) => r.method === 'PATCH' || r.method === 'PUT').flush({ ...REMOTAS[0], is_done: true });
      expect(servicio.buscarPorId(1)?.estado).toBe('completada');
    });

    it('deja completada una actividad ya completada', () => {
      expect(servicio.buscarPorId(3)?.estado).toBe('completada');
      servicio.avanzarEstado(3);
      expect(servicio.buscarPorId(3)?.estado).toBe('completada');
    });

    it('no toca nada con un identificador que no existe', () => {
      const antes = servicio.actividades();
      servicio.avanzarEstado(999);
      expect(servicio.actividades()).toBe(antes);
    });
  });

  describe('eliminar', () => {
    it('quita solo esa actividad', () => {
      servicio.eliminar(2);
      http.expectOne((r) => r.method === 'DELETE').flush(null);
      expect(servicio.buscarPorId(2)).toBeUndefined();
    });

    it('mantiene la consistencia al eliminar', () => {
      servicio.eliminar(1);
      http.expectOne((r) => r.method === 'DELETE').flush(null);
      expect(servicio.buscarPorId(1)).toBeUndefined();
    });
  });

  describe('buscarPorId', () => {
    it('devuelve undefined si no existe', () => {
      expect(servicio.buscarPorId(999)).toBeUndefined();
    });
  });
});