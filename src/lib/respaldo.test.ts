import { describe, expect, it } from 'vitest';
import { exportar, importar, VERSION_MAS_NUEVA } from './respaldo.ts';
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

// 8:30 p. m. en Bogotá; en Tokio, donde corren las pruebas, ya es el 15.
const AHORA = Date.parse('2026-10-14T20:30:00-05:00');

/** Un respaldo como los que exporta la app, con un cambio. */
const con = (cambio: Record<string, unknown>) => JSON.stringify({ version: 1, ...datos, ...cambio });
const materia = (cambio: Record<string, unknown>) => con({ materias: [{ ...datos.materias[0], ...cambio }] });
const entrega = (cambio: Record<string, unknown>) => con({ entregas: [{ ...datos.entregas[0], ...cambio }] });

describe('exportar', () => {
  it('incluye la versión del formato y la fecha de exportación en hora de Bogotá', () => {
    const archivo = JSON.parse(exportar(datos, AHORA));
    expect(Object.keys(archivo)).toEqual(['version', 'fechaExportacion', 'materias', 'entregas', 'drive']);
    expect(archivo).toMatchObject({ version: 1, fechaExportacion: '2026-10-14T20:30:00-05:00' });
  });

  it('lo exportado se importa igual, sin la versión ni la fecha entre los datos', () => {
    expect(importar(exportar(datos, AHORA))).toEqual({ ok: true, datos });
  });
});

describe('importar: versión', () => {
  it('sin "version" es de la versión 1, como los archivos anteriores', () => {
    expect(importar(JSON.stringify(datos))).toEqual({ ok: true, datos });
  });

  it('acepta la versión 1 escrita', () => {
    expect(importar(con({ version: 1 }))).toEqual({ ok: true, datos });
  });

  it('rechaza una versión más nueva', () => {
    expect(importar(con({ version: 2 }))).toEqual({ ok: false, motivo: VERSION_MAS_NUEVA });
    expect(VERSION_MAS_NUEVA).toBe('Este respaldo es de una versión más nueva de Mi U.');
  });

  it.each([['1'], [0], [1.5], [null]])('rechaza una versión que no es un número entero desde 1 (%j)', (version) => {
    expect(importar(con({ version }))).toEqual({ ok: false, motivo: 'El campo "version" no es un número de versión válido.' });
  });
});

describe('importar: motivo de cada error', () => {
  it.each([
    ['JSON inválido', '{"materias": [', 'El archivo no es JSON válido.'],
    ['no es un objeto', '[]', 'El archivo no contiene datos de Mi U.'],
    ['falta "materias"', JSON.stringify({ entregas: [], drive: [] }), 'Falta el campo "materias".'],
    ['falta "drive"', JSON.stringify({ materias: [], entregas: [] }), 'Falta el campo "drive".'],
    ['"materias" no es una lista', con({ materias: 1 }), 'El campo "materias" no es una lista.'],
    ['"entregas" no es una lista', con({ entregas: {} }), 'El campo "entregas" no es una lista.'],
    ['materia sin id', materia({ id: undefined }), 'La materia 1 ("Física") no tiene el campo "id".'],
    [
      'la segunda materia sin id ni nombre',
      con({ materias: [datos.materias[0], { clase: '', moodle: '', classroom: '' }] }),
      'La materia 2 no tiene el campo "id".',
    ],
    ['materia con nombre que no es texto', materia({ nombre: 5 }), 'El campo "nombre" de la materia 1 no es texto.'],
    ['materia que no es un objeto', con({ materias: ['Física'] }), 'La materia 1 no tiene el formato esperado.'],
    [
      'color que no existe',
      materia({ color: 'azul' }),
      'El campo "color" de la materia 1 ("Física") es "azul", que no es un color de Mi U.',
    ],
    ...[
      ['fecha sin -05:00', '2026-10-20T20:00:00Z'],
      ['fecha con otro desfase', '2026-10-20T20:00:00-03:00'],
      ['fecha que no existe', '2026-02-30T10:00:00-05:00'],
      ['fecha en milisegundos fuera de rango', 1e20],
    ].map(([caso, fecha]) => [
      caso as string,
      entrega({ fecha }),
      'El campo "fecha" de la entrega 1 ("Taller") no es una fecha ISO con la hora de Bogotá, como 2026-10-20T20:00:00-05:00.',
    ]),
    ['entrega sin "avisada"', entrega({ avisada: undefined }), 'La entrega 1 ("Taller") no tiene el campo "avisada".'],
    ['"hecha" no es booleano', entrega({ hecha: 'no' }), 'El campo "hecha" de la entrega 1 ("Taller") no es verdadero o falso.'],
    ['enlace de Drive sin url', con({ drive: [{ id: 'd1', nombre: 'Carpeta' }] }), 'El enlace de Drive 1 ("Carpeta") no tiene el campo "url".'],
  ])('%s', (_caso, texto, motivo) => {
    expect(importar(texto)).toEqual({ ok: false, motivo });
  });
});

describe('importar: mismas reglas que la carga', () => {
  it('migra el formato viejo: da color a las materias sin él y pasa las fechas en milisegundos a ISO', () => {
    const viejo = JSON.stringify({
      materias: [{ ...datos.materias[0], color: undefined }],
      entregas: [{ ...datos.entregas[0], fecha: Date.parse('2026-10-20T20:00:00-05:00') }],
      drive: datos.drive,
    });
    expect(importar(viejo)).toEqual({ ok: true, datos });
  });
});
