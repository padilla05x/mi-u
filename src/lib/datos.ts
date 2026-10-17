// Cambios sobre los datos de la app. Cada función devuelve datos nuevos sin modificar los recibidos.
import { siguienteColor } from './colores.ts';
import type { Datos, Entrega, Materia } from './tipos.ts';

export type CampoEnlace = 'clase' | 'moodle' | 'classroom';

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function nombreMateria(materias: Materia[], id: string): string {
  return materias.find((m) => m.id === id)?.nombre ?? 'Materia eliminada';
}

export function agregarMateria(datos: Datos, nombre: string): Datos {
  const color = siguienteColor(datos.materias.map((m) => m.color));
  return { ...datos, materias: [...datos.materias, { id: nuevoId(), nombre, color, clase: '', moodle: '', classroom: '' }] };
}

/** Quita la materia (con sus enlaces) y también sus entregas. */
export function quitarMateria(datos: Datos, id: string): Datos {
  return {
    ...datos,
    materias: datos.materias.filter((m) => m.id !== id),
    entregas: datos.entregas.filter((e) => e.materia !== id),
  };
}

/** Pone la materia `id` en la posición `destino` (índice final); no hace nada si no existe o ya está ahí. */
export function moverMateria(datos: Datos, id: string, destino: number): Datos {
  const desde = datos.materias.findIndex((m) => m.id === id);
  const hasta = Math.min(Math.max(destino, 0), datos.materias.length - 1);
  if (desde < 0 || desde === hasta) return datos;
  const materias = [...datos.materias];
  materias.splice(hasta, 0, ...materias.splice(desde, 1));
  return { ...datos, materias };
}

export function guardarEnlace(datos: Datos, id: string, campo: CampoEnlace, url: string): Datos {
  return { ...datos, materias: datos.materias.map((m) => (m.id === id ? { ...m, [campo]: url } : m)) };
}

export function agregarEntrega(datos: Datos, nueva: Pick<Entrega, 'materia' | 'texto' | 'fecha'>): Datos {
  return { ...datos, entregas: [...datos.entregas, { id: nuevoId(), ...nueva, hecha: false, avisada: false }] };
}

export function alternarEntrega(datos: Datos, id: string): Datos {
  return { ...datos, entregas: datos.entregas.map((e) => (e.id === id ? { ...e, hecha: !e.hecha } : e)) };
}

export function borrarEntrega(datos: Datos, id: string): Datos {
  return { ...datos, entregas: datos.entregas.filter((e) => e.id !== id) };
}

export function marcarAvisadas(datos: Datos, ids: string[]): Datos {
  return { ...datos, entregas: datos.entregas.map((e) => (ids.includes(e.id) ? { ...e, avisada: true } : e)) };
}

export function agregarDrive(datos: Datos, nombre: string, url: string): Datos {
  return { ...datos, drive: [...datos.drive, { id: nuevoId(), nombre, url }] };
}

export function quitarDrive(datos: Datos, id: string): Datos {
  return { ...datos, drive: datos.drive.filter((l) => l.id !== id) };
}
