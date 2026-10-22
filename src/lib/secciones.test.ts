import { describe, expect, it } from 'vitest';
import { quitarMateria } from './datos.ts';
import { materiasOcultas, materiasVisibles, mostrarEnSeccion, quitarDeSeccion } from './secciones.ts';
import type { Datos, Materia } from './tipos.ts';

const materia = (id: string, extra: Partial<Materia> = {}): Materia => ({
  id,
  nombre: id,
  color: 'orquidea',
  clase: `https://meet.google.com/${id}`,
  moodle: `https://moodle.u.edu.co/${id}`,
  classroom: `https://classroom.google.com/${id}`,
  tieneClaseAlterna: false,
  claseAlterna: '',
  claseAlternaNombre: '',
  ocultaEn: [],
  ...extra,
});

const datos: Datos = {
  materias: [materia('a'), materia('b', { moodle: '', ocultaEn: ['moodle'] }), materia('c')],
  entregas: [{ id: 'e1', materia: 'a', texto: 'Taller', fecha: '2026-10-20T20:00:00-05:00', hecha: false, avisada: false }],
  drive: [],
  horario: [],
};
const ids = (materias: Materia[]) => materias.map((m) => m.id);

describe('materiasVisibles y materiasOcultas', () => {
  it('reparten las materias según la sección, en el orden de Mis materias', () => {
    expect(ids(materiasVisibles(datos.materias, 'moodle'))).toEqual(['a', 'c']);
    expect(ids(materiasOcultas(datos.materias, 'moodle'))).toEqual(['b']);
    expect(ids(materiasVisibles(datos.materias, 'clase'))).toEqual(['a', 'b', 'c']);
    expect(materiasOcultas(datos.materias, 'clase')).toEqual([]);
  });
});

describe('quitarDeSeccion', () => {
  it('borra el enlace de esa sección, la oculta ahí y no cambia nada más', () => {
    const nuevos = quitarDeSeccion(datos, 'a', 'clase');
    expect(nuevos.materias[0]).toEqual({ ...materia('a'), clase: '', ocultaEn: ['clase'] });
    expect(nuevos.materias.slice(1)).toEqual(datos.materias.slice(1));
    expect(nuevos.entregas).toBe(datos.entregas);
    expect(nuevos.drive).toBe(datos.drive);
    expect(ids(materiasVisibles(nuevos.materias, 'clase'))).toEqual(['b', 'c']);
    expect(ids(materiasVisibles(nuevos.materias, 'moodle'))).toEqual(['a', 'c']);
  });

  it('suma la sección a las que ya tenía ocultas', () => {
    expect(quitarDeSeccion(datos, 'b', 'classroom').materias[1]).toMatchObject({ classroom: '', ocultaEn: ['moodle', 'classroom'] });
  });

  it('no hace nada si la materia no existe o ya está oculta en esa sección', () => {
    expect(quitarDeSeccion(datos, 'x', 'clase')).toBe(datos);
    expect(quitarDeSeccion(datos, 'b', 'moodle')).toBe(datos);
  });

  it('quitar la última visible deja la sección sin materias, pero todas siguen existiendo', () => {
    const nuevos = quitarDeSeccion(quitarDeSeccion(datos, 'a', 'moodle'), 'c', 'moodle');
    expect(materiasVisibles(nuevos.materias, 'moodle')).toEqual([]);
    expect(ids(materiasOcultas(nuevos.materias, 'moodle'))).toEqual(['a', 'b', 'c']);
    expect(ids(nuevos.materias)).toEqual(['a', 'b', 'c']);
  });
});

describe('mostrarEnSeccion', () => {
  it('la vuelve a mostrar con el enlace vacío', () => {
    const nuevos = mostrarEnSeccion(quitarDeSeccion(datos, 'a', 'clase'), 'a', 'clase');
    expect(nuevos.materias[0]).toEqual({ ...materia('a'), clase: '', ocultaEn: [] });
    expect(ids(materiasVisibles(nuevos.materias, 'clase'))).toEqual(['a', 'b', 'c']);
  });

  it('vacía el enlace aunque los datos guardaran uno, y deja ocultas las demás secciones', () => {
    const conEnlace: Datos = { ...datos, materias: [materia('a', { ocultaEn: ['clase', 'moodle'] })] };
    expect(mostrarEnSeccion(conEnlace, 'a', 'clase').materias[0]).toMatchObject({
      clase: '',
      moodle: 'https://moodle.u.edu.co/a',
      ocultaEn: ['moodle'],
    });
  });

  it('no hace nada si la materia no existe o no está oculta, y conserva su enlace', () => {
    expect(mostrarEnSeccion(datos, 'x', 'moodle')).toBe(datos);
    expect(mostrarEnSeccion(datos, 'a', 'moodle')).toBe(datos);
  });
});

describe('quitarDeSeccion y el link alterno', () => {
  const ecu = materia('ecu', { tieneClaseAlterna: true, claseAlterna: 'meet.google.com/vie', claseAlternaNombre: 'Viernes' });
  const conAlterno: Datos = {
    ...datos,
    materias: [ecu, materia('b')],
    horario: [
      { id: 'b1', materiaId: 'ecu', dia: 0, inicio: '08:00', fin: '10:00', enlace: 'principal' },
      { id: 'b2', materiaId: 'ecu', dia: 4, inicio: '08:00', fin: '10:00', enlace: 'alterno' },
    ],
  };

  it('quitarla de Clases virtuales también borra su alterno, y los bloques que lo usaban pasan al principal', () => {
    const nuevos = quitarDeSeccion(conAlterno, 'ecu', 'clase');
    expect(nuevos.materias[0]).toEqual({ ...ecu, clase: '', tieneClaseAlterna: false, claseAlterna: '', claseAlternaNombre: '', ocultaEn: ['clase'] });
    expect(nuevos.horario.map((b) => b.enlace)).toEqual(['principal', 'principal']);
  });

  it('quitarla de Moodle o de Classroom no toca el alterno ni los bloques', () => {
    for (const seccion of ['moodle', 'classroom'] as const) {
      const nuevos = quitarDeSeccion(conAlterno, 'ecu', seccion);
      expect(nuevos.materias[0]).toMatchObject({ tieneClaseAlterna: true, claseAlterna: 'meet.google.com/vie', claseAlternaNombre: 'Viernes' });
      expect(nuevos.horario).toBe(conAlterno.horario);
    }
  });

  it('si ya estaba oculta en Clases virtuales, no cambia nada', () => {
    const oculta: Datos = { ...conAlterno, materias: [{ ...ecu, ocultaEn: ['clase'] }] };
    expect(quitarDeSeccion(oculta, 'ecu', 'clase')).toBe(oculta);
  });
});

describe('quitarMateria (Mis materias)', () => {
  it('sigue borrando la materia por completo, con sus entregas, aunque esté oculta en alguna sección', () => {
    const nuevos = quitarMateria(quitarDeSeccion(datos, 'a', 'clase'), 'a');
    expect(ids(nuevos.materias)).toEqual(['b', 'c']);
    expect(nuevos.entregas).toEqual([]);
  });
});
