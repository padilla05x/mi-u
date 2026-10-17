import { describe, expect, it } from 'vitest';
import { storageFalso } from '../test/storage-falso.ts';
import { abrirAlmacen, CLAVE, CLAVE_COPIA_IMPORTACION, CLAVE_CORRUPTO, type AlmacenWeb } from './almacen.ts';
import { COLORES_MATERIA } from './colores.ts';
import type { Datos, Materia } from './tipos.ts';

const MATERIAS_BASE = [
  'Infraestructura Computacional',
  'Infraestructura de Comunicaciones',
  'Dirección Estratégica de T.I.',
  'Programación Concurrente',
  'Ingeniería de Software',
  'Ecuaciones Diferenciales',
  'Estructura de Datos',
];

const datosNuevos: Datos = {
  materias: [{ id: 'm1', nombre: 'Ingeniería de Software', color: 'orquidea', clase: 'https://meet.google.com/abc', moodle: '', classroom: '', ocultaEn: [] }],
  entregas: [{ id: 'e1', materia: 'm1', texto: 'Taller 3', fecha: '2026-10-20T20:00:00-05:00', hecha: false, avisada: false }],
  drive: [{ id: 'd1', nombre: 'Carpeta de PETI', url: 'https://drive.google.com/drive/folders/abc' }],
};

const lanza = (nombre: string) => (): never => {
  throw new DOMException('Simulado en la prueba', nombre);
};

const nombres = (datos: Datos) => datos.materias.map((m) => m.nombre);

describe('abrirAlmacen', () => {
  it('la primera vez carga las materias base, sin entregas ni avisos', () => {
    const { datos, aviso } = abrirAlmacen(storageFalso());
    expect(aviso).toBeNull();
    expect(nombres(datos)).toEqual(MATERIAS_BASE);
    expect(datos.entregas).toEqual([]);
    expect(datos.drive).toEqual([]);
  });

  it('guarda y vuelve a cargar los mismos datos', () => {
    const storage = storageFalso();
    expect(abrirAlmacen(storage).guardar(datosNuevos)).toBeNull();
    expect(abrirAlmacen(storage)).toMatchObject({ datos: datosNuevos, aviso: null });
  });

  it('migra las fechas en milisegundos de mi-u.html al formato ISO de Bogotá', () => {
    // mi-u.html guardaba new Date(valorDelCampo).getTime(); en un equipo en Bogotá,
    // "2026-10-20T20:00" da este instante.
    const viejo = {
      ...datosNuevos,
      entregas: [
        { ...datosNuevos.entregas[0], fecha: Date.parse('2026-10-20T20:00:00-05:00') },
        { ...datosNuevos.entregas[0], id: 'e2', fecha: '2026-10-22T07:30:00-05:00' },
      ],
    };
    const storage = storageFalso({ [CLAVE]: JSON.stringify(viejo) });
    const almacen = abrirAlmacen(storage);

    expect(almacen.aviso).toBeNull();
    expect(almacen.datos.entregas.map((e) => e.fecha)).toEqual(['2026-10-20T20:00:00-05:00', '2026-10-22T07:30:00-05:00']);
    expect(almacen.datos.materias).toEqual(datosNuevos.materias);
    expect(almacen.datos.drive).toEqual(datosNuevos.drive);

    almacen.guardar(almacen.datos);
    expect(JSON.parse(storage.valores.get(CLAVE)!).entregas[0].fecha).toBe('2026-10-20T20:00:00-05:00');
  });

  it('JSON inválido: lo copia en mi-u-v1-corrupto, carga el estado inicial y avisa', () => {
    const storage = storageFalso({ [CLAVE]: '{"materias": [' });
    const { datos, aviso } = abrirAlmacen(storage);

    expect(storage.valores.get(CLAVE_CORRUPTO)).toBe('{"materias": [');
    expect(storage.valores.get(CLAVE)).toBe('{"materias": [');
    expect(nombres(datos)).toEqual(MATERIAS_BASE);
    expect(aviso).toContain('"mi-u-v1-corrupto"');
  });

  it.each([
    ['no es un objeto', '[]'],
    ['es null', 'null'],
    ['faltan listas', '{"materias": []}'],
    ['materia sin nombre', JSON.stringify({ ...datosNuevos, materias: [{ id: 'm1', clase: '', moodle: '', classroom: '' }] })],
    ['fecha que no existe', JSON.stringify({ ...datosNuevos, entregas: [{ ...datosNuevos.entregas[0], fecha: '2026-02-30T10:00:00-05:00' }] })],
    ['"hecha" no es booleano', JSON.stringify({ ...datosNuevos, entregas: [{ ...datosNuevos.entregas[0], hecha: 'no' }] })],
    ['ocultaEn nombra una sección que no existe', JSON.stringify({ ...datosNuevos, materias: [{ ...datosNuevos.materias[0], ocultaEn: ['drive'] }] })],
    ['ocultaEn no es una lista', JSON.stringify({ ...datosNuevos, materias: [{ ...datosNuevos.materias[0], ocultaEn: 'moodle' }] })],
  ])('forma incorrecta (%s): copia, estado inicial y aviso', (_caso, crudo) => {
    const storage = storageFalso({ [CLAVE]: crudo });
    const { datos, aviso } = abrirAlmacen(storage);

    expect(storage.valores.get(CLAVE_CORRUPTO)).toBe(crudo);
    expect(storage.valores.get(CLAVE)).toBe(crudo);
    expect(nombres(datos)).toEqual(MATERIAS_BASE);
    expect(aviso).toContain('"mi-u-v1-corrupto"');
  });

  it('no pisa una copia anterior distinta: usa mi-u-v1-corrupto-2', () => {
    const storage = storageFalso({ [CLAVE]: 'dañado nuevo', [CLAVE_CORRUPTO]: 'dañado viejo' });
    const { aviso } = abrirAlmacen(storage);

    expect(storage.valores.get(CLAVE_CORRUPTO)).toBe('dañado viejo');
    expect(storage.valores.get(`${CLAVE_CORRUPTO}-2`)).toBe('dañado nuevo');
    expect(aviso).toContain('"mi-u-v1-corrupto-2"');
  });

  it('no duplica la copia si al recargar el contenido dañado es el mismo', () => {
    const storage = storageFalso({ [CLAVE]: 'dañado' });
    abrirAlmacen(storage);
    abrirAlmacen(storage);
    expect([...storage.valores.keys()].sort()).toEqual([CLAVE, CLAVE_CORRUPTO]);
  });

  it('si no puede hacer la copia, avisa y no sobrescribe los datos dañados', () => {
    // Falla solo la copia: así se comprueba que guardar() ni siquiera intenta escribir en "mi-u-v1".
    const base = storageFalso({ [CLAVE]: 'dañado' });
    const storage = {
      ...base,
      setItem: (clave: string, valor: string) => {
        if (clave.startsWith(CLAVE_CORRUPTO)) throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
        base.setItem(clave, valor);
      },
    };
    const almacen = abrirAlmacen(storage);

    expect(almacen.aviso).toMatch(/no se pudo hacer una copia/);
    expect(almacen.guardar(datosNuevos)).toBe(almacen.aviso);
    expect(base.valores.get(CLAVE)).toBe('dañado');
  });

  it('localStorage bloqueado: sigue en memoria y avisa sin lanzar errores', () => {
    const bloqueado: AlmacenWeb = { getItem: lanza('SecurityError'), setItem: lanza('SecurityError') };
    const almacen = abrirAlmacen(bloqueado);

    expect(nombres(almacen.datos)).toEqual(MATERIAS_BASE);
    expect(almacen.aviso).toMatch(/no deja guardar/);
    expect(almacen.guardar(datosNuevos)).toBe(almacen.aviso);
  });

  it('sin localStorage (null, o sin window como en Node): sigue en memoria y avisa', () => {
    expect(abrirAlmacen(null).aviso).toMatch(/no deja guardar/);
    expect(abrirAlmacen().aviso).toMatch(/no deja guardar/);
  });

  it('localStorage lleno al guardar: devuelve un aviso en vez de lanzar un error', () => {
    const almacen = abrirAlmacen({ ...storageFalso(), setItem: lanza('QuotaExceededError') });

    expect(almacen.aviso).toBeNull();
    expect(almacen.guardar(datosNuevos)).toMatch(/está lleno/);
  });
});

describe('copia antes de importar', () => {
  it('copia tal cual lo guardado en mi-u-v1-respaldo-importacion, y la siguiente la reemplaza', () => {
    const storage = storageFalso({ [CLAVE]: '{"guardado": 1}' });
    const almacen = abrirAlmacen(storage);
    expect(CLAVE_COPIA_IMPORTACION).toBe('mi-u-v1-respaldo-importacion');

    expect(almacen.copiarAntesDeImportar()).toBe(true);
    expect(storage.valores.get(CLAVE_COPIA_IMPORTACION)).toBe('{"guardado": 1}');

    storage.setItem(CLAVE, '{"guardado": 2}');
    expect(almacen.copiarAntesDeImportar()).toBe(true);
    expect(storage.valores.get(CLAVE_COPIA_IMPORTACION)).toBe('{"guardado": 2}');
  });

  it('si no había datos guardados, no crea la copia', () => {
    const storage = storageFalso();
    expect(abrirAlmacen(storage).copiarAntesDeImportar()).toBe(true);
    expect(storage.valores.has(CLAVE_COPIA_IMPORTACION)).toBe(false);
  });

  it('devuelve false si no puede escribir la copia o leer lo guardado', () => {
    const base = storageFalso({ [CLAVE]: JSON.stringify(datosNuevos) });
    const sinEspacio = abrirAlmacen({
      ...base,
      setItem: (clave: string, valor: string) => {
        if (clave === CLAVE_COPIA_IMPORTACION) throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
        base.setItem(clave, valor);
      },
    });
    expect(sinEspacio.copiarAntesDeImportar()).toBe(false);
    expect(base.valores.has(CLAVE_COPIA_IMPORTACION)).toBe(false);

    let lecturas = 0;
    const lecturaFalla = abrirAlmacen({
      ...base,
      getItem: (clave: string) => {
        if (++lecturas > 1) throw new DOMException('Simulado en la prueba', 'SecurityError');
        return base.getItem(clave);
      },
    });
    expect(lecturaFalla.copiarAntesDeImportar()).toBe(false);
  });

  it('sin localStorage no hay copia posible', () => {
    expect(abrirAlmacen(null).copiarAntesDeImportar()).toBe(false);
  });
});

describe('secciones ocultas al cargar', () => {
  it('las materias guardadas sin ocultaEn reciben [] y el formato nuevo se guarda al primer cambio', () => {
    const vieja: Partial<Materia> = { ...datosNuevos.materias[0] };
    delete vieja.ocultaEn;
    const crudo = JSON.stringify({ ...datosNuevos, materias: [vieja, { ...vieja, id: 'm2', nombre: 'Física' }] });
    const storage = storageFalso({ [CLAVE]: crudo });
    const almacen = abrirAlmacen(storage);

    expect(almacen.aviso).toBeNull();
    expect(almacen.datos.materias.map((m) => m.ocultaEn)).toEqual([[], []]);
    expect(almacen.datos.materias[0]).toEqual(datosNuevos.materias[0]);
    expect(storage.valores.get(CLAVE)).toBe(crudo); // Cargar no escribe nada.

    almacen.guardar(almacen.datos);
    expect(JSON.parse(storage.valores.get(CLAVE)!).materias.map((m: Materia) => m.ocultaEn)).toEqual([[], []]);
  });

  it('conserva ocultaEn de los datos que ya lo tienen', () => {
    const nuevos: Datos = { ...datosNuevos, materias: [{ ...datosNuevos.materias[0], clase: '', ocultaEn: ['clase', 'classroom'] }] };
    const storage = storageFalso({ [CLAVE]: JSON.stringify(nuevos) });
    expect(abrirAlmacen(storage)).toMatchObject({ datos: nuevos, aviso: null });
  });
});

describe('color de las materias al cargar', () => {
  const guardadas = (materias: object[]) => storageFalso({ [CLAVE]: JSON.stringify({ materias, entregas: [], drive: [] }) });
  const sinColor = (id: string) => ({ id, nombre: `Materia ${id}`, clase: '', moodle: '', classroom: '' });

  it('las materias base reciben los siete primeros colores', () => {
    expect(abrirAlmacen(storageFalso()).datos.materias.map((m) => m.color)).toEqual(COLORES_MATERIA.slice(0, 7));
  });

  it('los datos de mi-u.html, sin color, reciben los colores en el orden de la lista', () => {
    const { datos, aviso } = abrirAlmacen(guardadas([sinColor('a'), sinColor('b'), sinColor('c')]));
    expect(aviso).toBeNull();
    expect(datos.materias.map((m) => m.color)).toEqual(['orquidea', 'oliva', 'magenta']);
  });

  it('conserva los colores válidos y da a las demás el primero libre, también si la clave no existe', () => {
    const { datos, aviso } = abrirAlmacen(
      guardadas([{ ...sinColor('a'), color: 'oliva' }, sinColor('b'), { ...sinColor('c'), color: 'azul' }, { ...sinColor('d'), color: 'orquidea' }]),
    );
    expect(aviso).toBeNull();
    expect(datos.materias.map((m) => m.color)).toEqual(['oliva', 'magenta', 'turquesa', 'orquidea']);
  });
});
