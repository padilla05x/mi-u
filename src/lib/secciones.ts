// Quitar y volver a mostrar materias en las secciones de enlaces (Clases virtuales, Moodle y Classroom).
// Ocultar una materia en una sección no la borra: sigue en las demás, en Entregas y en Mis materias.
import { quitarClaseAlterna } from './clases.ts';
import type { Datos, Materia, SeccionEnlace } from './tipos.ts';

/** Las materias que se muestran en la sección, en el orden de Mis materias. */
export function materiasVisibles(materias: Materia[], seccion: SeccionEnlace): Materia[] {
  return materias.filter((m) => !m.ocultaEn.includes(seccion));
}

/** Las materias ocultas en la sección, en el orden de Mis materias. */
export function materiasOcultas(materias: Materia[], seccion: SeccionEnlace): Materia[] {
  return materias.filter((m) => m.ocultaEn.includes(seccion));
}

/**
 * Borra el enlace de la materia en la sección y la oculta ahí. En Clases virtuales también quita su link alterno, y
 * los bloques del horario que lo usaban pasan al principal. No cambia nada si no existe o ya está oculta.
 */
export function quitarDeSeccion(datos: Datos, id: string, seccion: SeccionEnlace): Datos {
  const materia = datos.materias.find((m) => m.id === id);
  if (!materia || materia.ocultaEn.includes(seccion)) return datos;
  const base = seccion === 'clase' ? quitarClaseAlterna(datos, id) : datos;
  const actual = base.materias.find((m) => m.id === id)!;
  return reemplazar(base, { ...actual, [seccion]: '', ocultaEn: [...actual.ocultaEn, seccion] });
}

/** Vuelve a mostrar la materia en la sección, con el enlace vacío. No cambia nada si no existe o no estaba oculta. */
export function mostrarEnSeccion(datos: Datos, id: string, seccion: SeccionEnlace): Datos {
  const materia = datos.materias.find((m) => m.id === id);
  if (!materia?.ocultaEn.includes(seccion)) return datos;
  return reemplazar(datos, { ...materia, [seccion]: '', ocultaEn: materia.ocultaEn.filter((s) => s !== seccion) });
}

const reemplazar = (datos: Datos, materia: Materia): Datos => ({
  ...datos,
  materias: datos.materias.map((m) => (m.id === materia.id ? materia : m)),
});
