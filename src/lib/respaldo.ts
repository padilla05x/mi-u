// Exportar e importar todos los datos como un archivo JSON.
import { esObjeto, validarDatos, type Validacion } from './almacen.ts';
import { aIsoBogota } from './fechas.ts';
import type { Datos } from './tipos.ts';

/**
 * Versión del formato de los respaldos. Súbela solo si los datos cambian de forma que una versión anterior de Mi U
 * no sepa leer; los archivos sin "version" son de la 1.
 */
export const VERSION_RESPALDO = 1;

export const VERSION_MAS_NUEVA = 'Este respaldo es de una versión más nueva de Mi U.';

/** El archivo lleva la versión del formato, la fecha de exportación en hora de Bogotá y los datos. */
export function exportar(datos: Datos, ahora: number): string {
  return JSON.stringify({ version: VERSION_RESPALDO, fechaExportacion: aIsoBogota(ahora), ...datos }, null, 2);
}

/**
 * Lee un respaldo con las reglas de la carga de localStorage (almacen.ts). La diferencia es que rechaza los colores
 * de materia que no existen en vez de reemplazarlos. Si no sirve, devuelve el motivo para mostrarlo.
 */
export function importar(texto: string): Validacion {
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: 'El archivo no es JSON válido.' };
  }
  if (!esObjeto(valor)) return validarDatos(valor);

  const { version = 1, ...datos } = valor;
  delete datos.fechaExportacion; // Solo informa; no es parte de los datos.
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, motivo: 'El campo "version" no es un número de versión válido.' };
  }
  if (version > VERSION_RESPALDO) return { ok: false, motivo: VERSION_MAS_NUEVA };
  return validarDatos(datos, { estricto: true });
}
