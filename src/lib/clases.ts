// Link alterno de la clase virtual: un segundo enlace por materia, por ejemplo uno para los lunes y otro para los
// viernes. Lo activa la casilla "Tiene más de un link" (Materia.tieneClaseAlterna) y cada bloque del horario elige
// cuál abre (Bloque.enlace).
import type { Bloque, Datos, Materia } from './tipos.ts';

/** El nombre del link alterno tal como se escribió, o "Alterno" si está vacío. */
export function nombreAlterno(materia: Pick<Materia, 'claseAlternaNombre'>): string {
  return materia.claseAlternaNombre.trim() || 'Alterno';
}

/** Marca "Tiene más de un link". No cambia nada si la materia no existe o ya la tiene marcada. */
export function activarClaseAlterna(datos: Datos, id: string): Datos {
  const materia = datos.materias.find((m) => m.id === id);
  if (!materia || materia.tieneClaseAlterna) return datos;
  return reemplazar(datos, { ...materia, tieneClaseAlterna: true });
}

/** Guarda el link alterno o su nombre. Sin la casilla marcada no hay alterno que guardar. */
export function guardarClaseAlterna(datos: Datos, id: string, campo: 'claseAlterna' | 'claseAlternaNombre', valor: string): Datos {
  const materia = datos.materias.find((m) => m.id === id);
  if (!materia?.tieneClaseAlterna) return datos;
  return reemplazar(datos, { ...materia, [campo]: valor });
}

/**
 * true si desmarcar la casilla perdería algo y conviene confirmarlo: el link alterno o su nombre tienen texto, o algún
 * bloque del horario usa el alterno.
 */
export function quitarAlternoPierdeAlgo(materia: Materia, horario: Bloque[]): boolean {
  return (
    Boolean(materia.claseAlterna || materia.claseAlternaNombre) ||
    horario.some((b) => b.materiaId === materia.id && b.enlace === 'alterno')
  );
}

/**
 * Desmarca "Tiene más de un link": vacía el link alterno y su nombre, y los bloques que lo usaban pasan al principal.
 * No cambia nada si la materia no existe o no tiene la casilla marcada.
 */
export function quitarClaseAlterna(datos: Datos, id: string): Datos {
  const materia = datos.materias.find((m) => m.id === id);
  if (!materia?.tieneClaseAlterna) return datos;
  return {
    ...reemplazar(datos, { ...materia, tieneClaseAlterna: false, claseAlterna: '', claseAlternaNombre: '' }),
    horario: datos.horario.map((b) => (b.materiaId === id && b.enlace === 'alterno' ? { ...b, enlace: 'principal' } : b)),
  };
}

const reemplazar = (datos: Datos, materia: Materia): Datos => ({
  ...datos,
  materias: datos.materias.map((m) => (m.id === materia.id ? materia : m)),
});
