// Forma de los datos que Mi U guarda en localStorage (clave "mi-u-v1").
import type { ColorMateria } from './colores.ts';

/** Secciones con un enlace por materia: Clases virtuales, Aula virtual (Moodle) y Classroom. Es también el campo del enlace. */
export type SeccionEnlace = 'clase' | 'moodle' | 'classroom';

export interface Materia {
  id: string;
  nombre: string;
  /** Color para reconocerla de un vistazo (ver "Colores de materia" en docs/diseno.md). */
  color: ColorMateria;
  /** Enlace de la clase virtual (Meet, Zoom o Teams). */
  clase: string;
  /** Enlace del aula en Moodle. */
  moodle: string;
  /** Enlace de la clase en Google Classroom. */
  classroom: string;
  /** Secciones de las que se quitó: ahí no aparece, pero sigue en las demás, en Entregas y en Mis materias. */
  ocultaEn: SeccionEnlace[];
}

export interface Entrega {
  id: string;
  /** id de la materia. */
  materia: string;
  texto: string;
  /** Hora límite en Bogotá, por ejemplo "2026-10-20T20:00:00-05:00". */
  fecha: string;
  hecha: boolean;
  /** Ya se mostró el aviso del navegador. */
  avisada: boolean;
}

export interface DriveLink {
  id: string;
  nombre: string;
  url: string;
}

export interface Datos {
  materias: Materia[];
  entregas: Entrega[];
  drive: DriveLink[];
}
