import { describe, expect, it } from 'vitest';
import { COLORES_MATERIA, siguienteColor } from './colores.ts';
import { agregarMateria } from './datos.ts';

describe('siguienteColor', () => {
  it('toma el primer color, en orden, que ninguna materia usa', () => {
    expect(siguienteColor([])).toBe('orquidea');
    expect(siguienteColor(['orquidea', 'magenta'])).toBe('oliva');
  });

  it('con los ocho en uso toma el menos usado y, en empate, el primero en orden', () => {
    expect(siguienteColor([...COLORES_MATERIA])).toBe('orquidea');
    expect(siguienteColor([...COLORES_MATERIA, 'orquidea', 'oliva'])).toBe('magenta');
  });
});

describe('agregarMateria', () => {
  it('le da a la materia nueva el siguiente color', () => {
    const datos = {
      materias: [{ id: 'm1', nombre: 'Ingeniería de Software', color: 'orquidea' as const, clase: '', moodle: '', classroom: '', ocultaEn: [] }],
      entregas: [],
      drive: [],
    };
    expect(agregarMateria(datos, 'Cálculo Integral').materias[1]).toMatchObject({ nombre: 'Cálculo Integral', color: 'oliva' });
  });
});
