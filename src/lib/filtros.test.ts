import { describe, expect, it } from 'vitest';
import { coincideBusqueda, contarPorFiltro, cumpleFiltro, filtrarEntregas, normalizarBusqueda } from './filtros.ts';
import type { Entrega, Materia } from './tipos.ts';

const ahora = Date.parse('2026-10-14T09:00:00-05:00');

const materias: Materia[] = [
  { id: 'is', nombre: 'Ingeniería de Software', color: 'orquidea', clase: '', moodle: '', classroom: '', ocultaEn: [] },
  { id: 'pc', nombre: 'Programación Concurrente', color: 'oliva', clase: '', moodle: '', classroom: '', ocultaEn: [] },
];

const entrega = (id: string, materia: string, texto: string, fecha: string, hecha = false): Entrega => ({
  id,
  materia,
  texto,
  fecha,
  hecha,
  avisada: false,
});

// Una entrega por estado: vencida, para hoy, mañana, en N días y entregada.
const lista = [
  entrega('vencida', 'is', 'Parcial 1', '2026-10-13T18:00:00-05:00'),
  entrega('hoy', 'pc', 'Taller de sockets', '2026-10-14T23:59:00-05:00'),
  entrega('manana', 'is', 'Diseño de la base de datos', '2026-10-15T07:00:00-05:00'),
  entrega('dias', 'pc', 'Informe final', '2026-10-20T20:00:00-05:00'),
  entrega('entregada', 'is', 'Lectura', '2026-10-10T08:00:00-05:00', true),
];
const ids = (es: Entrega[]) => es.map((e) => e.id);

describe('cumpleFiltro', () => {
  it.each([
    ['todas', ['vencida', 'hoy', 'manana', 'dias', 'entregada']],
    ['pendientes', ['hoy', 'manana', 'dias']],
    ['vencidas', ['vencida']],
    ['entregadas', ['entregada']],
  ] as const)('"%s" deja pasar %j', (filtro, esperadas) => {
    expect(ids(lista.filter((e) => cumpleFiltro(e, filtro, ahora)))).toEqual(esperadas);
  });
});

describe('normalizarBusqueda y coincideBusqueda', () => {
  it('quita tildes, mayúsculas y espacios de más', () => {
    expect(normalizarBusqueda('  INGENIERÍA   de  Sóftware ')).toBe('ingenieria de software');
    expect(normalizarBusqueda('Diseño')).toBe('diseno');
  });

  it('busca en la descripción o en el nombre de la materia', () => {
    expect(coincideBusqueda(lista[2], 'Ingeniería de Software', 'DISENO')).toBe(true);
    expect(coincideBusqueda(lista[2], 'Ingeniería de Software', 'ingenieria')).toBe(true);
    expect(coincideBusqueda(lista[2], 'Ingeniería de Software', 'sockets')).toBe(false);
    expect(coincideBusqueda(lista[2], 'Ingeniería de Software', '   ')).toBe(true);
  });
});

describe('filtrarEntregas y contarPorFiltro', () => {
  it('combina la búsqueda con el filtro activo', () => {
    expect(ids(filtrarEntregas(lista, materias, { filtro: 'pendientes', busqueda: 'ingeniería' }, ahora))).toEqual(['manana']);
    expect(ids(filtrarEntregas(lista, materias, { filtro: 'todas', busqueda: 'PROGRAMACION' }, ahora))).toEqual(['hoy', 'dias']);
  });

  it('cuenta lo que mostraría cada filtro con la búsqueda actual', () => {
    expect(contarPorFiltro(lista, materias, '', ahora)).toEqual({ todas: 5, pendientes: 3, vencidas: 1, entregadas: 1 });
    expect(contarPorFiltro(lista, materias, 'ingenieria', ahora)).toEqual({ todas: 3, pendientes: 1, vencidas: 1, entregadas: 1 });
  });
});
