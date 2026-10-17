import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aIsoBogota,
  desdeCampoFecha,
  diaDeSemanaEnBogota,
  diaEnBogota,
  esIsoBogota,
  formatoEncabezado,
  formatoDiaSemana,
  formatoFechaEntrega,
  formatoHora,
  formatoSemana,
  horaEnBogota,
  saludo,
} from './fechas.ts';

describe('diaEnBogota', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula hoy en Bogotá aunque el sistema esté en Tokio', () => {
    // Las 20:00 del 14 de octubre en Bogotá son las 10:00 del 15 en Tokio.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T20:00:00-05:00'));

    // vite.config.ts fuerza TZ=Asia/Tokyo: en la zona local ya es el 15, así que
    // una implementación que use la zona del sistema devolvería 2026-10-15.
    expect(new Date().getDate()).toBe(15);
    expect(diaEnBogota()).toBe('2026-10-14');
  });
});

describe('aIsoBogota', () => {
  it('escribe la hora de Bogotá con el desfase -05:00', () => {
    expect(aIsoBogota(Date.parse('2026-10-21T01:00:00Z'))).toBe('2026-10-20T20:00:00-05:00');
  });
});

describe('esIsoBogota', () => {
  it('acepta una fecha en el formato que se guarda', () => {
    expect(esIsoBogota('2026-10-20T20:00:00-05:00')).toBe(true);
  });

  it.each([
    '2026-10-21T01:00:00Z',
    '2026-10-20T20:00-05:00',
    '2026-02-30T10:00:00-05:00',
    '2026-10-20T24:00:00-05:00',
    'mañana',
    Date.parse('2026-10-20T20:00:00-05:00'),
    null,
  ])('rechaza %j', (valor) => {
    expect(esIsoBogota(valor)).toBe(false);
  });
});

describe('desdeCampoFecha', () => {
  it('toma el valor del campo datetime-local como hora de Bogotá', () => {
    expect(desdeCampoFecha('2026-10-20T20:00')).toBe('2026-10-20T20:00:00-05:00');
    expect(desdeCampoFecha('2026-10-20T20:00:30')).toBe('2026-10-20T20:00:30-05:00');
  });

  it.each(['', '2026-02-30T10:00', '2026-10-20', 'mañana'])('devuelve null para %j', (valor) => {
    expect(desdeCampoFecha(valor)).toBeNull();
  });
});

describe('formatos para mostrar', () => {
  // En Tokio ya es el 15 a las 10:00 a. m.; lo que se muestra es la hora de Bogotá.
  it('la fecha de una entrega sale en es-CO y hora de Bogotá', () => {
    expect(formatoFechaEntrega('2026-10-14T20:00:00-05:00')).toMatch(/^mié, 14 de oct, 08:00\sp\.\sm\.$/);
  });

  it('el encabezado muestra el día de hoy en Bogotá, con mayúscula inicial', () => {
    expect(formatoEncabezado(Date.parse('2026-10-14T20:00:00-05:00'))).toBe('Miércoles, 14 de octubre de 2026');
  });
});

describe('saludo', () => {
  // En Tokio (la zona de las pruebas) las 5:00 de Bogotá son las 19:00: el saludo debe salir de la hora de Bogotá.
  it.each([
    ['04:59', 'Buenas noches'],
    ['05:00', 'Buenos días'],
    ['11:59', 'Buenos días'],
    ['12:00', 'Buenas tardes'],
    ['18:59', 'Buenas tardes'],
    ['19:00', 'Buenas noches'],
  ])('a las %s en Bogotá dice "%s"', (hora, esperado) => {
    expect(saludo(Date.parse(`2026-10-14T${hora}:00-05:00`))).toBe(esperado);
  });
});

describe('formatos de la vista semanal', () => {
  it('el título de la semana repite el mes y el año solo si cambian', () => {
    expect(formatoSemana('2026-10-12')).toBe('Semana del 12 al 18 de octubre de 2026');
    expect(formatoSemana('2026-10-26')).toBe('Semana del 26 de octubre al 1 de noviembre de 2026');
    expect(formatoSemana('2026-12-28')).toBe('Semana del 28 de diciembre de 2026 al 3 de enero de 2027');
  });

  it('cada día muestra su nombre corto y su número', () => {
    expect(formatoDiaSemana('2026-10-14')).toBe('Mié 14');
    expect(formatoDiaSemana('2026-10-18')).toBe('Dom 18');
  });

  it('la hora de una entrega sale en hora de Bogotá', () => {
    expect(formatoHora('2026-10-14T23:59:00-05:00')).toMatch(/^11:59\sp\.\sm\.$/);
  });
});

describe('diaDeSemanaEnBogota y horaEnBogota', () => {
  it('dan el día (0 = lunes) y la hora de Bogotá aunque el sistema esté en Tokio', () => {
    // Domingo 18 de octubre, 23:59 en Bogotá: en Tokio ya es lunes 19 a las 13:59.
    const domingoNoche = Date.parse('2026-10-18T23:59:00-05:00');
    expect([new Date(domingoNoche).getDay(), new Date(domingoNoche).getHours()]).toEqual([1, 13]);
    expect(diaDeSemanaEnBogota(domingoNoche)).toBe(6);
    expect(horaEnBogota(domingoNoche)).toBe('23:59');

    const lunes = Date.parse('2026-10-19T00:00:00-05:00');
    expect(diaDeSemanaEnBogota(lunes)).toBe(0);
    expect(horaEnBogota(lunes)).toBe('00:00');
  });
});
