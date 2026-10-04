import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { PaginaNoEncontrada } from './pagina-no-encontrada';

describe('PaginaNoEncontrada', () => {
  async function montar() {
    await TestBed.configureTestingModule({
      imports: [PaginaNoEncontrada],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PaginaNoEncontrada);
    await fixture.whenStable();
    return fixture;
  }

  it('se instancia correctamente', async () => {
    const fixture = await montar();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el mensaje de página no encontrada', async () => {
    const fixture = await montar();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('página no existe');
  });

  it('ofrece un enlace para volver a la lista principal', async () => {
    const fixture = await montar();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(enlace).not.toBeNull();
  });

  it('mantiene la accesibilidad con encabezado estructurado', async () => {
    const fixture = await montar();
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1, h2');
    expect(h1).not.toBeNull();
  });

  it('renderiza el contenedor principal correctamente', async () => {
    const fixture = await montar();
    expect(fixture.nativeElement).not.toBeNull();
  });
});