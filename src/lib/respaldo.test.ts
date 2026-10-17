import { describe, expect, it } from 'vitest';
import { exportar, importar } from './respaldo.ts';
import type { Datos } from './tipos.ts';

const datos: Datos = {
  materias: [
    {
      id: 'm1',
      nombre: 'Física',
      color: 'orquidea',
      clase: '',
      moodle: '',
      classroom: '',
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
});
