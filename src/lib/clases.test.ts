import { describe, expect, it } from 'vitest';
import { activarClaseAlterna, guardarClaseAlterna, nombreAlterno, quitarAlternoPierdeAlgo, quitarClaseAlterna } from './clases.ts';
import type { Bloque, Datos, Materia } from './tipos.ts';

const materia = (id: string, extra: Partial<Materia> = {}): Materia => ({
  id,
  nombre: id,
  color: 'orquidea',
  clase: `meet.google.com/${id}`,
  moodle: '',
  classroom: '',
  tieneClaseAlterna: false,
  claseAlterna: '',
  claseAlternaNombre: '',
  ocultaEn: [],
  ...extra,
});
const bloque = (id: string, materiaId: string, enlace: Bloque['enlace'] = 'principal'): Bloque => ({
  id,
  materiaId,
  dia: 0,
  inicio: '08:00',
  fin: '10:00',
  enlace,
});

// Ecuaciones tiene alterno ("Viernes") y un bloque que lo usa; Física no tiene.
const ecu = materia('ecu', { tieneClaseAlterna: true, claseAlterna: 'meet.google.com/vie', claseAlternaNombre: 'Viernes' });
const fis = materia('fis');
const datos: Datos = {
  materias: [ecu, fis],
  entregas: [],
  drive: [],
  horario: [bloque('b1', 'ecu'), bloque('b2', 'ecu', 'alterno'), bloque('b3', 'fis')],
};

describe('nombreAlterno', () => {
  it('muestra el nombre tal como se escribió, sin pasarlo a minúsculas', () => {
    expect(nombreAlterno(ecu)).toBe('Viernes');
    expect(nombreAlterno({ claseAlternaNombre: 'Lab B' })).toBe('Lab B');
  });

  it('sin nombre, o solo con espacios, se llama "Alterno"', () => {
    expect(nombreAlterno(fis)).toBe('Alterno');
    expect(nombreAlterno({ claseAlternaNombre: '   ' })).toBe('Alterno');
  });
});

describe('activarClaseAlterna y guardarClaseAlterna', () => {
  it('marcar la casilla no cambia nada más', () => {
    const nuevos = activarClaseAlterna(datos, 'fis');
    expect(nuevos.materias[1]).toEqual({ ...fis, tieneClaseAlterna: true });
    expect(nuevos.materias[0]).toBe(ecu);
    expect(nuevos.horario).toBe(datos.horario);
  });

  it('no hace nada si la materia no existe o ya la tiene marcada', () => {
    expect(activarClaseAlterna(datos, 'x')).toBe(datos);
    expect(activarClaseAlterna(datos, 'ecu')).toBe(datos);
  });

  it('guarda el link alterno y su nombre, solo con la casilla marcada', () => {
    const conCasilla = activarClaseAlterna(datos, 'fis');
    const conLink = guardarClaseAlterna(conCasilla, 'fis', 'claseAlterna', 'zoom.us/j/9');
    expect(guardarClaseAlterna(conLink, 'fis', 'claseAlternaNombre', 'Laboratorio').materias[1]).toMatchObject({
      claseAlterna: 'zoom.us/j/9',
      claseAlternaNombre: 'Laboratorio',
    });
    expect(guardarClaseAlterna(datos, 'fis', 'claseAlterna', 'zoom.us/j/9')).toBe(datos);
  });
});

describe('quitarAlternoPierdeAlgo', () => {
  it('es true si el link o el nombre tienen texto, o si un bloque usa el alterno', () => {
    expect(quitarAlternoPierdeAlgo(ecu, [])).toBe(true);
    expect(quitarAlternoPierdeAlgo({ ...ecu, claseAlterna: '' }, [])).toBe(true);
    expect(quitarAlternoPierdeAlgo({ ...ecu, claseAlternaNombre: '' }, [])).toBe(true);
    expect(quitarAlternoPierdeAlgo({ ...ecu, claseAlterna: '', claseAlternaNombre: '' }, datos.horario)).toBe(true);
  });

  it('es false con el alterno vacío y sin bloques que lo usen', () => {
    const vacio = { ...ecu, claseAlterna: '', claseAlternaNombre: '' };
    expect(quitarAlternoPierdeAlgo(vacio, [])).toBe(false);
    expect(quitarAlternoPierdeAlgo(vacio, [bloque('b1', 'ecu'), bloque('b9', 'otra', 'alterno')])).toBe(false);
  });
});

describe('quitarClaseAlterna', () => {
  it('desmarca la casilla, vacía el link y su nombre, y los bloques que lo usaban pasan al principal', () => {
    const nuevos = quitarClaseAlterna(datos, 'ecu');
    expect(nuevos.materias[0]).toEqual({ ...ecu, tieneClaseAlterna: false, claseAlterna: '', claseAlternaNombre: '' });
    expect(nuevos.materias[1]).toBe(fis);
    expect(nuevos.horario.map((b) => [b.id, b.enlace])).toEqual([
      ['b1', 'principal'],
      ['b2', 'principal'],
      ['b3', 'principal'],
    ]);
    expect(nuevos.horario[0]).toBe(datos.horario[0]); // Los demás bloques no cambian.
  });

  it('no hace nada si la materia no existe o no tiene la casilla marcada', () => {
    expect(quitarClaseAlterna(datos, 'x')).toBe(datos);
    expect(quitarClaseAlterna(datos, 'fis')).toBe(datos);
  });
});
