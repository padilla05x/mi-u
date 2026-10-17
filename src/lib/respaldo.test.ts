import { describe, expect, it } from 'vitest';
import { exportar, importar } from './respaldo.ts';
import type { Datos, Materia } from './tipos.ts';

const datos: Datos = {
  materias: [
    {
      id: 'm1',
      nombre: 'Física',
      color: 'orquidea',
      clase: '',
      moodle: '',
      classroom: '',
      ocultaEn: [],
    },
  ],
  entregas: [
    {
      id: 'e1',
      materia: 'm1',
      texto: 'Taller',
      fecha: '2026-10-20T20:00:00-05:00',
      hecha: false,
      avisada: false,
    },
  ],
  drive: [{ id: 'd1', nombre: 'Carpeta', url: 'https://drive.google.com' }],
};

describe('respaldo', () => {
  it('lo exportado se importa igual', () => {
    expect(importar(exportar(datos))).toEqual(datos);
  });

  it('rechaza archivos que no son un respaldo', () => {
    expect(importar('no es json')).toBeNull();
    expect(importar('{"materias": 1}')).toBeNull();
    expect(importar('[]')).toBeNull();
  });

  it('acepta ocultaEn con las tres secciones, y lo completa con [] en respaldos anteriores', () => {
    const conOcultas: Datos = { ...datos, materias: [{ ...datos.materias[0], ocultaEn: ['clase', 'moodle', 'classroom'] }] };
    expect(importar(exportar(conOcultas))).toEqual(conOcultas);

    const vieja: Partial<Materia> = { ...datos.materias[0] };
    delete vieja.ocultaEn;
    expect(importar(JSON.stringify({ ...datos, materias: [vieja] }))).toEqual(datos);
  });

  it('rechaza el archivo si ocultaEn tiene algo que no sea una de las tres secciones', () => {
    const conOcultaEn = (ocultaEn: unknown) => JSON.stringify({ ...datos, materias: [{ ...datos.materias[0], ocultaEn }] });
    expect(importar(conOcultaEn(['drive']))).toBeNull();
    expect(importar(conOcultaEn(['moodle', 'Moodle']))).toBeNull();
    expect(importar(conOcultaEn(['moodle', 1]))).toBeNull();
    expect(importar(conOcultaEn('moodle'))).toBeNull();
    expect(importar(conOcultaEn(null))).toBeNull();
  });
});
