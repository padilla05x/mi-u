import { describe, expect, it } from 'vitest';
import { exportar, importar, VERSION_MAS_NUEVA } from './respaldo.ts';
import { materiasVisibles } from './secciones.ts';
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
      tieneClaseAlterna: false,
      claseAlterna: '',
      claseAlternaNombre: '',
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
  horario: [],
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
    expect(Object.keys(archivo)).toEqual(['version', 'fechaExportacion', 'materias', 'entregas', 'drive', 'horario']);
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

  it('acepta ocultaEn con las tres secciones, y lo completa con [] en respaldos anteriores', () => {
    const conOcultas: Datos = { ...datos, materias: [{ ...datos.materias[0], ocultaEn: ['clase', 'moodle', 'classroom'] }] };
    expect(importar(exportar(conOcultas, AHORA))).toEqual({ ok: true, datos: conOcultas });

    const vieja: Partial<Materia> = { ...datos.materias[0] };
    delete vieja.ocultaEn;
    expect(importar(JSON.stringify({ ...datos, materias: [vieja] }))).toEqual({ ok: true, datos });
  });

  it('rechaza el archivo si ocultaEn tiene algo que no sea una de las tres secciones', () => {
    const conOcultaEn = (ocultaEn: unknown) => JSON.stringify({ ...datos, materias: [{ ...datos.materias[0], ocultaEn }] });
    const noEsSeccion = (valor: string) =>
      `El campo "ocultaEn" de la materia 1 ("Física") tiene ${valor}, que no es una sección (clase, moodle o classroom).`;
    const noEsLista = 'El campo "ocultaEn" de la materia 1 ("Física") no es una lista.';
    expect(importar(conOcultaEn(['drive']))).toEqual({ ok: false, motivo: noEsSeccion('"drive"') });
    expect(importar(conOcultaEn(['moodle', 'Moodle']))).toEqual({ ok: false, motivo: noEsSeccion('"Moodle"') });
    expect(importar(conOcultaEn(['moodle', 1]))).toEqual({ ok: false, motivo: noEsSeccion('1') });
    expect(importar(conOcultaEn('moodle'))).toEqual({ ok: false, motivo: noEsLista });
    expect(importar(conOcultaEn(null))).toEqual({ ok: false, motivo: noEsLista });
  });
});

describe('importar: secciones ocultas (ocultaEn)', () => {
  /** Un respaldo exportado por la app, con la materia cambiada. */
  const respaldoConMateria = (materia: Record<string, unknown>) =>
    JSON.stringify({ version: 1, fechaExportacion: '2026-10-14T20:30:00-05:00', ...datos, materias: [materia] });

  it('un respaldo sin ocultaEn deja la materia con ocultaEn: [], y las secciones la muestran', () => {
    const vieja: Partial<Materia> = { ...datos.materias[0] };
    delete vieja.ocultaEn;

    const resultado = importar(respaldoConMateria(vieja));

    expect(resultado).toEqual({ ok: true, datos });
    // Sin la migración, secciones.ts fallaría al leer ocultaEn.
    expect(resultado.ok && materiasVisibles(resultado.datos.materias, 'clase').map((m) => m.id)).toEqual(['m1']);
  });

  it('un respaldo con ocultaEn: ["clase"] lo conserva', () => {
    const resultado = importar(respaldoConMateria({ ...datos.materias[0], ocultaEn: ['clase'] }));

    expect(resultado).toEqual({ ok: true, datos: { ...datos, materias: [{ ...datos.materias[0], ocultaEn: ['clase'] }] } });
    expect(resultado.ok && materiasVisibles(resultado.datos.materias, 'clase')).toEqual([]);
  });

  it('un ocultaEn inválido devuelve su motivo concreto y no trae datos', () => {
    const resultado = importar(respaldoConMateria({ ...datos.materias[0], ocultaEn: ['inventada'] }));

    expect(resultado).toEqual({
      ok: false,
      motivo: 'El campo "ocultaEn" de la materia 1 ("Física") tiene "inventada", que no es una sección (clase, moodle o classroom).',
    });
    expect('datos' in resultado).toBe(false);
  });
});

describe('importar: horario', () => {
  const bloque = (cambio: Record<string, unknown> = {}) => ({ id: 'b1', materiaId: 'm1', dia: 0, inicio: '08:00', fin: '10:00', enlace: 'principal', ...cambio });
  const conHorario = (horario: unknown) => con({ horario });

  it('un respaldo sin horario queda con horario: []', () => {
    const sinHorario: Partial<Datos> = { ...datos };
    delete sinHorario.horario;
    expect(importar(JSON.stringify({ version: 1, ...sinHorario }))).toEqual({ ok: true, datos });
  });

  it('conserva el horario, también con bloques solapados', () => {
    const horario = [bloque(), bloque({ id: 'b2', inicio: '09:30', fin: '11:00' })];
    expect(importar(conHorario(horario))).toEqual({ ok: true, datos: { ...datos, horario } });
  });

  const noEsDia = 'El campo "dia" del bloque 1 ("Física") no es un día de 0 (lunes) a 6 (domingo).';
  const noEsHora = (campo: string) => `El campo "${campo}" del bloque 1 ("Física") no es una hora HH:MM de 00:00 a 23:59, como 08:00.`;
  it.each([
    ['horario no es una lista', conHorario({}), 'El campo "horario" no es una lista.'],
    ['bloque que no es un objeto', conHorario(['lunes']), 'El bloque 1 no tiene el formato esperado.'],
    ['bloque sin materiaId', conHorario([bloque({ materiaId: undefined })]), 'El bloque 1 no tiene el campo "materiaId".'],
    ['día 7', conHorario([bloque({ dia: 7 })]), noEsDia],
    ['día -1', conHorario([bloque({ dia: -1 })]), noEsDia],
    ['día con decimales', conHorario([bloque({ dia: 1.5 })]), noEsDia],
    ['día como texto', conHorario([bloque({ dia: '1' })]), noEsDia],
    ['hora sin cero inicial', conHorario([bloque({ inicio: '8:00' })]), noEsHora('inicio')],
    ['hora 24:00', conHorario([bloque({ fin: '24:00' })]), noEsHora('fin')],
    ['minutos fuera de rango', conHorario([bloque({ inicio: '10:60' })]), noEsHora('inicio')],
    ['hora con segundos', conHorario([bloque({ fin: '10:00:00' })]), noEsHora('fin')],
    [
      'termina antes de empezar',
      conHorario([bloque({ inicio: '10:00', fin: '08:00' })]),
      'El bloque 1 ("Física") debe terminar después de empezar: va de 10:00 a 08:00.',
    ],
    [
      'termina a la misma hora en que empieza',
      conHorario([bloque({ inicio: '10:00', fin: '10:00' })]),
      'El bloque 1 ("Física") debe terminar después de empezar: va de 10:00 a 10:00.',
    ],
    [
      'materia que no está en el archivo',
      conHorario([bloque(), bloque({ id: 'b2', materiaId: 'm9' })]),
      'El bloque 2 es de una materia que no está en el archivo ("m9").',
    ],
  ])('%s', (_caso, texto, motivo) => {
    expect(importar(texto)).toEqual({ ok: false, motivo });
  });

  it('los motivos de un campo de algo masculino dicen "del", no "de el"', () => {
    expect(importar(con({ drive: [{ id: 'd1', nombre: 'Carpeta', url: 5 }] }))).toEqual({
      ok: false,
      motivo: 'El campo "url" del enlace de Drive 1 ("Carpeta") no es texto.',
    });
  });
});

describe('importar: link alterno', () => {
  const conAlterno = { ...datos.materias[0], tieneClaseAlterna: true, claseAlterna: 'meet.google.com/vie', claseAlternaNombre: 'Viernes' };
  const bloque = (cambio: Record<string, unknown> = {}) => ({ id: 'b1', materiaId: 'm1', dia: 4, inicio: '08:00', fin: '10:00', enlace: 'principal', ...cambio });

  it('un respaldo sin los campos del alterno ni el enlace de los bloques los completa', () => {
    const materia: Record<string, unknown> = { ...datos.materias[0] };
    delete materia.tieneClaseAlterna;
    delete materia.claseAlterna;
    delete materia.claseAlternaNombre;
    const bloqueAnterior: Record<string, unknown> = bloque();
    delete bloqueAnterior.enlace;

    expect(importar(con({ materias: [materia], horario: [bloqueAnterior] }))).toEqual({
      ok: true,
      datos: { ...datos, horario: [bloque()] },
    });
  });

  it('conserva el alterno y los bloques que lo usan', () => {
    const horario = [bloque(), bloque({ id: 'b2', dia: 0, enlace: 'alterno' })];
    expect(importar(con({ materias: [conAlterno], horario }))).toEqual({ ok: true, datos: { ...datos, materias: [conAlterno], horario } });
  });

  const noEsEnlace = 'El campo "enlace" del bloque 1 ("Física") no es "principal" ni "alterno".';
  const conCasillaFalsa = 'La materia 1 ("Física") tiene link alterno, pero "tieneClaseAlterna" es falso.';
  it.each([
    ['enlace "viernes"', con({ horario: [bloque({ enlace: 'viernes' })] }), noEsEnlace],
    ['enlace "Alterno" con mayúscula', con({ horario: [bloque({ enlace: 'Alterno' })] }), noEsEnlace],
    ['enlace numérico', con({ horario: [bloque({ enlace: 1 })] }), noEsEnlace],
    ['enlace null', con({ horario: [bloque({ enlace: null })] }), noEsEnlace],
    ['claseAlterna que no es texto', materia({ claseAlterna: 5 }), 'El campo "claseAlterna" de la materia 1 ("Física") no es texto.'],
    ['claseAlternaNombre null', materia({ claseAlternaNombre: null }), 'El campo "claseAlternaNombre" de la materia 1 ("Física") no es texto.'],
    [
      'tieneClaseAlterna como texto',
      materia({ tieneClaseAlterna: 'true' }),
      'El campo "tieneClaseAlterna" de la materia 1 ("Física") no es verdadero o falso.',
    ],
    ['link alterno con la casilla apagada', materia({ tieneClaseAlterna: false, claseAlterna: 'meet.google.com/vie' }), conCasillaFalsa],
    ['solo el nombre del alterno con la casilla apagada', materia({ tieneClaseAlterna: false, claseAlternaNombre: 'Viernes' }), conCasillaFalsa],
    [
      'bloque que usa el alterno de una materia sin alterno',
      con({ horario: [bloque({ enlace: 'alterno' })] }),
      'El bloque 1 ("Física") usa el link alterno, pero su materia no tiene uno.',
    ],
  ])('%s', (_caso, texto, motivo) => {
    expect(importar(texto)).toEqual({ ok: false, motivo });
  });
});
