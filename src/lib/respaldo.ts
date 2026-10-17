// Exportar e importar todos los datos como un archivo JSON.
import { interpretar } from './almacen.ts';
import type { Datos } from './tipos.ts';

export const exportar = (datos: Datos): string => JSON.stringify(datos, null, 2);

/** Valida con las mismas reglas que al cargar de localStorage; null si el archivo no es un respaldo de Mi U. */
export const importar = (texto: string): Datos | null => interpretar(texto);
