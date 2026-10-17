import { esColorMateria, siguienteColor, type ColorMateria } from './colores.ts';
import { nuevoId } from './datos.ts';
import { aIsoBogota, esIsoBogota } from './fechas.ts';
import type { Datos, DriveLink, Entrega, Materia, SeccionEnlace } from './tipos.ts';

export const CLAVE = 'mi-u-v1';
export const CLAVE_CORRUPTO = 'mi-u-v1-corrupto';
/** Copia de lo guardado justo antes de importar un respaldo; cada importación reemplaza la anterior. */
export const CLAVE_COPIA_IMPORTACION = 'mi-u-v1-respaldo-importacion';

const MATERIAS_BASE = [
  'Infraestructura Computacional',
  'Infraestructura de Comunicaciones',
  'Dirección Estratégica de T.I.',
  'Programación Concurrente',
  'Ingeniería de Software',
  'Ecuaciones Diferenciales',
  'Estructura de Datos',
];

const AVISO_BLOQUEADO =
  'El navegador no deja guardar datos en este sitio. Puedes seguir usando Mi U, pero los cambios se perderán al cerrar o recargar la página.';
const AVISO_LLENO =
  'El almacenamiento del navegador está lleno y no se pudieron guardar los últimos cambios. Siguen disponibles hasta que cierres o recargues la página.';
const AVISO_CORRUPTO_SIN_COPIA =
  'Los datos guardados están dañados y no se pudo hacer una copia. Para no perderlos, Mi U no guardará cambios en esta sesión.';
const avisoCorrupto = (clave: string) =>
  `Los datos guardados estaban dañados, así que se cargó el estado inicial. El contenido original quedó en "${clave}" del localStorage.`;

/** Lo que el almacén usa de localStorage; las pruebas pasan uno falso. */
export type AlmacenWeb = Pick<Storage, 'getItem' | 'setItem'>;

export interface Almacen {
  /** Datos guardados, o el estado inicial si no había o no se pudieron leer. */
  datos: Datos;
  /** Mensaje para el usuario si algo falló al cargar; null si todo salió bien. */
  aviso: string | null;
  /** Guarda los datos. Devuelve null si pudo o, si no, el mensaje para el usuario. */
  guardar(datos: Datos): string | null;
  /**
   * Antes de importar, copia lo guardado en "mi-u-v1" a CLAVE_COPIA_IMPORTACION. Devuelve false si no pudo (y
   * entonces no hay que importar); si no había nada guardado, no crea la copia y devuelve true.
   */
  copiarAntesDeImportar(): boolean;
}

/**
 * Carga los datos guardados. Nunca lanza errores ni borra nada: si no puede leer
 * o respaldar lo que hay en "mi-u-v1", la app sigue en memoria sin escribir ahí.
 */
export function abrirAlmacen(storage: AlmacenWeb | null = localStorageDelNavegador()): Almacen {
  // Sin poder escribir no hay copia posible, así que tampoco se importa.
  const enMemoria = (aviso: string): Almacen => ({
    datos: estadoInicial(),
    aviso,
    guardar: () => aviso,
    copiarAntesDeImportar: () => false,
  });
  if (!storage) return enMemoria(AVISO_BLOQUEADO);

  let crudo: string | null;
  try {
    crudo = storage.getItem(CLAVE);
  } catch {
    return enMemoria(AVISO_BLOQUEADO);
  }

  const guardar = (datos: Datos): string | null => {
    try {
      storage.setItem(CLAVE, JSON.stringify(datos));
      return null;
    } catch (error) {
      return error instanceof DOMException && error.name === 'QuotaExceededError' ? AVISO_LLENO : AVISO_BLOQUEADO;
    }
  };

  const copiarAntesDeImportar = (): boolean => {
    try {
      const actual = storage.getItem(CLAVE);
      if (actual !== null) storage.setItem(CLAVE_COPIA_IMPORTACION, actual);
      return true;
    } catch {
      return false;
    }
  };

  if (crudo === null) return { datos: estadoInicial(), aviso: null, guardar, copiarAntesDeImportar };
  const datos = interpretar(crudo);
  if (datos) return { datos, aviso: null, guardar, copiarAntesDeImportar };

  const copia = respaldar(storage, crudo);
  if (!copia) return enMemoria(AVISO_CORRUPTO_SIN_COPIA);
  return { datos: estadoInicial(), aviso: avisoCorrupto(copia), guardar, copiarAntesDeImportar };
}

function localStorageDelNavegador(): AlmacenWeb | null {
  try {
    // Lanza SecurityError si el navegador bloquea el almacenamiento, y en algunos es null.
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function estadoInicial(): Datos {
  return {
    materias: asignarColores(MATERIAS_BASE.map((nombre) => ({ id: nuevoId(), nombre, clase: '', moodle: '', classroom: '', ocultaEn: [] }))),
    entregas: [],
    drive: [],
  };
}

/** Copia el contenido dañado sin pisar copias anteriores; devuelve la clave usada, o null si no pudo. */
function respaldar(storage: AlmacenWeb, crudo: string): string | null {
  try {
    for (let n = 1; ; n++) {
      const clave = n === 1 ? CLAVE_CORRUPTO : `${CLAVE_CORRUPTO}-${n}`;
      const anterior = storage.getItem(clave);
      if (anterior === crudo) return clave;
      if (anterior === null) {
        storage.setItem(clave, crudo);
        return clave;
      }
    }
  } catch {
    return null;
  }
}

/** Valida lo guardado y migra el formato viejo; null si el JSON está dañado o la forma no coincide. */
export function interpretar(crudo: string): Datos | null {
  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return null;
  }
  const resultado = validarDatos(valor);
  return resultado.ok ? resultado.datos : null;
}

/** Datos listos para usar, o el motivo concreto por el que no sirven. */
export type Validacion = { ok: true; datos: Datos } | { ok: false; motivo: string };

interface OpcionesValidacion {
  /**
   * Qué hacer con un color de materia que no existe. Al cargar de localStorage se reemplaza por uno libre (false);
   * al importar un respaldo, el archivo se rechaza (true). Si falta el color, siempre se asigna uno.
   */
  coloresEstrictos?: boolean;
}

/**
 * Reglas de los datos de Mi U, para la carga de localStorage y para importar respaldos. Migra el formato viejo
 * (fechas en milisegundos, materias sin color y sin ocultaEn) y conserva los campos que no conoce.
 */
export function validarDatos(valor: unknown, { coloresEstrictos = false }: OpcionesValidacion = {}): Validacion {
  if (!esObjeto(valor)) return { ok: false, motivo: 'El archivo no contiene datos de Mi U.' };
  const entregas = Array.isArray(valor.entregas) ? valor.entregas.map(migrarEntrega) : valor.entregas;
  const motivo =
    motivoLista(valor.materias, 'materias', (materia, n) => motivoMateria(materia, n, coloresEstrictos)) ??
    motivoLista(entregas, 'entregas', motivoEntrega) ??
    motivoLista(valor.drive, 'drive', motivoDriveLink);
  if (motivo) return { ok: false, motivo };
  // Las tres listas ya pasaron sus reglas.
  const materias = (valor.materias as MateriaGuardada[]).map(migrarMateria);
  return {
    ok: true,
    datos: { ...valor, materias: asignarColores(materias), entregas: entregas as Entrega[], drive: valor.drive as DriveLink[] },
  };
}

/** Da color a las materias que no tienen uno válido, en orden y con la misma regla que una materia nueva. */
function asignarColores<T extends Record<string, unknown>>(materias: T[]): (T & { color: ColorMateria })[] {
  const usados = materias.map((m) => m.color).filter(esColorMateria);
  return materias.map((m) => {
    if (esColorMateria(m.color)) return { ...m, color: m.color };
    const color = siguienteColor(usados);
    usados.push(color);
    return { ...m, color };
  });
}

/** Las materias guardadas antes de poder quitarlas de una sección no traen ocultaEn: no están ocultas en ninguna. */
function migrarMateria<T extends { ocultaEn?: SeccionEnlace[] }>(materia: T): T & { ocultaEn: SeccionEnlace[] } {
  return { ...materia, ocultaEn: materia.ocultaEn ?? [] };
}

/** mi-u.html guardaba la fecha en milisegundos; ahora es texto ISO con el desfase de Bogotá. */
function migrarEntrega(valor: unknown): unknown {
  if (!esObjeto(valor) || typeof valor.fecha !== 'number') return valor;
  try {
    return { ...valor, fecha: aIsoBogota(valor.fecha) };
  } catch {
    // Fuera del rango de Date: queda como número y la regla de la fecha la rechaza.
    return valor;
  }
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Motivo por el que un valor no sirve, o null si cumple la regla. */
type Motivo = string | null;

function motivoLista(lista: unknown, campo: string, motivoDe: (elemento: unknown, n: number) => Motivo): Motivo {
  if (lista === undefined) return `Falta el campo "${campo}".`;
  if (!Array.isArray(lista)) return `El campo "${campo}" no es una lista.`;
  for (const [i, elemento] of lista.entries()) {
    const motivo = motivoDe(elemento, i + 1);
    if (motivo) return motivo;
  }
  return null;
}

/** "la materia 2 ("Física")": cuál es, con su nombre si lo tiene, para que la persona la encuentre en el archivo. */
function cual(tipo: string, n: number, valor: unknown, campoNombre: string): string {
  const nombre = esObjeto(valor) && typeof valor[campoNombre] === 'string' ? ` ("${valor[campoNombre]}")` : '';
  return `${tipo} ${n}${nombre}`;
}

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Revisa los campos en orden y devuelve el motivo del primero que falta o no cumple. */
function motivoCampos(
  valor: unknown,
  quien: string,
  reglas: [campos: string[], cumple: (campo: unknown) => boolean, falla: string | ((campo: unknown) => string)][],
): Motivo {
  if (!esObjeto(valor)) return `${conMayuscula(quien)} no tiene el formato esperado.`;
  for (const [campos, cumple, falla] of reglas) {
    for (const campo of campos) {
      if (valor[campo] === undefined) return `${conMayuscula(quien)} no tiene el campo "${campo}".`;
      if (!cumple(valor[campo])) return `El campo "${campo}" de ${quien} ${typeof falla === 'string' ? falla : falla(valor[campo])}.`;
    }
  }
  return null;
}

// Record obliga a listar todas las secciones del tipo.
const SECCIONES: Record<SeccionEnlace, true> = { clase: true, moodle: true, classroom: true };

function esSeccionEnlace(valor: unknown): valor is SeccionEnlace {
  return typeof valor === 'string' && Object.hasOwn(SECCIONES, valor);
}

const esListaDeSecciones = (valor: unknown) => Array.isArray(valor) && valor.every(esSeccionEnlace);
const motivoSecciones = (valor: unknown) =>
  Array.isArray(valor)
    ? `tiene ${JSON.stringify(valor.find((s) => !esSeccionEnlace(s)))}, que no es una sección (clase, moodle o classroom)`
    : 'no es una lista';

const esTexto = (valor: unknown) => typeof valor === 'string';
const esBooleano = (valor: unknown) => typeof valor === 'boolean';

/**
 * Una materia guardada. El color puede faltar (datos de mi-u.html) porque se asigna al cargar, y ocultaEn
 * (datos anteriores) porque empieza vacío; si está, solo puede nombrar las tres secciones de enlaces.
 */
type MateriaGuardada = Omit<Materia, 'color' | 'ocultaEn'> & { color?: unknown; ocultaEn?: SeccionEnlace[] };

function motivoMateria(valor: unknown, n: number, coloresEstrictos: boolean): Motivo {
  const quien = cual('la materia', n, valor, 'nombre');
  const tiene = (campo: string) => esObjeto(valor) && valor[campo] !== undefined;
  return (
    motivoCampos(valor, quien, [[['id', 'nombre', 'clase', 'moodle', 'classroom'], esTexto, 'no es texto']]) ??
    (tiene('ocultaEn') ? motivoCampos(valor, quien, [[['ocultaEn'], esListaDeSecciones, motivoSecciones]]) : null) ??
    (coloresEstrictos && tiene('color')
      ? motivoCampos(valor, quien, [[['color'], esColorMateria, (color) => `es ${JSON.stringify(color)}, que no es un color de Mi U`]])
      : null)
  );
}

function motivoEntrega(valor: unknown, n: number): Motivo {
  return motivoCampos(valor, cual('la entrega', n, valor, 'texto'), [
    [['id', 'materia', 'texto'], esTexto, 'no es texto'],
    [['fecha'], esIsoBogota, 'no es una fecha ISO con la hora de Bogotá, como 2026-10-20T20:00:00-05:00'],
    [['hecha', 'avisada'], esBooleano, 'no es verdadero o falso'],
  ]);
}

function motivoDriveLink(valor: unknown, n: number): Motivo {
  return motivoCampos(valor, cual('el enlace de Drive', n, valor, 'nombre'), [[['id', 'nombre', 'url'], esTexto, 'no es texto']]);
}
