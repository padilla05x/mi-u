import { describe, expect, it } from 'vitest';
import { moverMateria, quitarMateria } from './datos.ts';
import type { Datos } from './tipos.ts';

const datos: Datos = {
  materias: ['a', 'b', 'c'].map((id) => ({ id, nombre: id, color: 'orquidea', clase: '', moodle: '', classroom: '', tieneClaseAlterna: false, claseAlterna: '', claseAlternaNombre: '', ocultaEn: [] })),
  entregas: [],
  drive: [],
  horario: [],
};
const orden = (d: Datos) => d.materias.map((m) => m.id).join('');

describe('moverMateria', () => {
  it('mueve hacia abajo y hacia arriba', () => {
    expect(orden(moverMateria(datos, 'a', 2))).toBe('bca');
    expect(orden(moverMateria(datos, 'c', 0))).toBe('cab');
  });

  it('limita el destino y ignora ids que no existen o la misma posición', () => {
    expect(orden(moverMateria(datos, 'a', 9))).toBe('bca');
    expect(moverMateria(datos, 'b', 1)).toBe(datos);
    expect(moverMateria(datos, 'x', 0)).toBe(datos);
  });
});

describe('quitarMateria', () => {
  it('borra la materia con sus entregas y sus bloques del horario, y deja los de las demás', () => {
    const conHorario: Datos = {
      ...datos,
      entregas: [
        { id: 'e1', materia: 'a', texto: 'Taller', fecha: '2026-10-20T20:00:00-05:00', hecha: false, avisada: false },
        { id: 'e2', materia: 'b', texto: 'Quiz', fecha: '2026-10-21T20:00:00-05:00', hecha: false, avisada: false },
      ],
      horario: [
        { id: 'b1', materiaId: 'a', dia: 0, inicio: '08:00', fin: '10:00', enlace: 'principal' },
        { id: 'b2', materiaId: 'b', dia: 0, inicio: '10:00', fin: '12:00', enlace: 'principal' },
        { id: 'b3', materiaId: 'a', dia: 3, inicio: '14:00', fin: '16:00', enlace: 'principal' },
      ],
    };
    const nuevos = quitarMateria(conHorario, 'a');
    expect(orden(nuevos)).toBe('bc');
    expect(nuevos.entregas.map((e) => e.id)).toEqual(['e2']);
    expect(nuevos.horario.map((b) => b.id)).toEqual(['b2']);
  });
});
