import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ActividadesApi } from './actividades-api';

describe('ActividadesApi', () => {
  it('se crea correctamente y maneja peticiones a la API', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpTestingController);
    const servicio = TestBed.inject(ActividadesApi);

    expect(servicio).toBeTruthy();
  });
});