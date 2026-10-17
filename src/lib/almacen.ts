import { esColorMateria, siguienteColor, type ColorMateria } from './colores.ts';
import { nuevoId } from './datos.ts';
import { aIsoBogota, esIsoBogota } from './fechas.ts';
import type { Datos, DriveLink, Entrega, Materia } from './tipos.ts';

export const CLAVE = 'mi-u-v1';
export const CLAVE_CORRUPTO = 'mi-u-v1-corrupto';

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
}

/**
 * Carga los datos guardados. Nunca lanza errores ni borra nada: si no puede leer
 * o respaldar lo que hay en "mi-u-v1", la app sigue en memoria sin escribir ahí.
 */
export function abrirAlmacen(storage: AlmacenWeb | null = localStorageDelNavegador()): Almacen {
  const enMemoria = (aviso: string): Almacen => ({ datos: estadoInicial(), aviso, guardar: () => aviso });
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

  if (crudo === null) return { datos: estadoInicial(), aviso: null, guardar };
  const datos = interpretar(crudo);
  if (datos) return { datos, aviso: null, guardar };

  const copia = respaldar(storage, crudo);
  if (!copia) return enMemoria(AVISO_CORRUPTO_SIN_COPIA);
  return { datos: estadoInicial(), aviso: avisoCorrupto(copia), guardar };
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
    materias: asignarColores(MATERIAS_BASE.map((nombre) => ({ id: nuevoId(), nombre, clase: '', moodle: '', classroom: '' }))),
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
  try {
    const valor: unknown = JSON.parse(crudo);
    if (!esObjeto(valor)) return null;
    const { materias, drive } = valor;
    const entregas = Array.isArray(valor.entregas) ? valor.entregas.map(migrarEntrega) : null;
    if (!esLista(materias, esMateriaGuardada) || !esLista(entregas, esEntrega) || !esLista(drive, esDriveLink)) return null;
    return { ...valor, materias: asignarColores(materias), entregas, drive };
  } catch {
    // JSON mal formado, o una fecha en milisegundos fuera de rango.
    return null;
  }
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

/** mi-u.html guardaba la fecha en milisegundos; ahora es texto ISO con el desfase de Bogotá. */
function migrarEntrega(valor: unknown): unknown {
  return esObjeto(valor) && typeof valor.fecha === 'number' ? { ...valor, fecha: aIsoBogota(valor.fecha) } : valor;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esLista<T>(valor: unknown, esElemento: (elemento: unknown) => elemento is T): valor is T[] {
  return Array.isArray(valor) && valor.every(esElemento);
}

function tieneTextos(valor: Record<string, unknown>, campos: string[]): boolean {
  return campos.every((campo) => typeof valor[campo] === 'string');
}

/** Una materia guardada; el color puede faltar (datos de mi-u.html) porque se asigna al cargar. */
function esMateriaGuardada(valor: unknown): valor is Omit<Materia, 'color'> & { color?: unknown } {
  return esObjeto(valor) && tieneTextos(valor, ['id', 'nombre', 'clase', 'moodle', 'classroom']);
}

function esEntrega(valor: unknown): valor is Entrega {
  return (
    esObjeto(valor) &&
    tieneTextos(valor, ['id', 'materia', 'texto']) &&
    esIsoBogota(valor.fecha) &&
    typeof valor.hecha === 'boolean' &&
    typeof valor.avisada === 'boolean'
  );
}

function esDriveLink(valor: unknown): valor is DriveLink {
  return esObjeto(valor) && tieneTextos(valor, ['id', 'nombre', 'url']);
}
