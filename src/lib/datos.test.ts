import { describe, expect, it } from 'vitest';
import { moverMateria } from './datos.ts';
import type { Datos } from './tipos.ts';

const datos: Datos = {
  materias: ['a', 'b', 'c'].map((id) => ({ id, nombre: id, color: 'orquidea', clase: '', moodle: '', classroom: '' })),
  entregas: [],
  drive: [],
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
