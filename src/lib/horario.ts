// Horario semanal: clases fijas por día, en hora de Bogotá. Las horas son "HH:MM" de 24 horas, así que compararlas
// como texto las compara en orden.
import { motivoBloque } from './almacen.ts';
import { nombreDelEnlace } from './clases.ts';
import { nombreMateria, nuevoId } from './datos.ts';
import { diaDeSemanaEnBogota, horaEnBogota } from './fechas.ts';
import type { Bloque, Datos, DiaSemana, Materia } from './tipos.ts';

/** Nombre de cada día del horario: el índice es Bloque.dia (0 = lunes). */
export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

/** Un bloque del formulario, que todavía no tiene id. */
export type BloqueNuevo = Omit<Bloque, 'id'>;

/** Mismo día y se cruzan; dos bloques que solo se tocan (08:00–10:00 y 10:00–12:00) no se solapan. */
const seSolapan = (a: BloqueNuevo, b: BloqueNuevo) => a.dia === b.dia && a.inicio < b.fin && b.inicio < a.fin;

/**
 * Motivo por el que el bloque no se puede guardar, o null si se puede. Aplica las mismas reglas y el mismo formato
 * de motivo que validarDatos (almacen.ts), exige que su materia esté en Mis materias y que no se solape con otro
 * bloque del mismo día. Si el bloque ya está en el horario (mismo id), no se compara consigo mismo.
 */
export function validarBloque(bloque: BloqueNuevo | Bloque, horario: Bloque[], materias: Materia[]): string | null {
  const motivo = motivoBloque(bloque, { quien: 'el bloque', materias, dondeMateria: 'Mis materias', conId: false });
  if (motivo) return motivo;
  const id = 'id' in bloque ? bloque.id : null;
  const otro = horario.find((b) => b.id !== id && seSolapan(bloque, b));
  if (!otro) return null;
  return (
    `El bloque ("${nombreMateria(materias, bloque.materiaId)}") se solapa con otro del ${DIAS[otro.dia]}: ` +
    `"${nombreMateria(materias, otro.materiaId)}", de ${otro.inicio} a ${otro.fin}.`
  );
}

/** Por hora de inicio y, si empiezan a la vez, de fin. */
const porHora = (a: Bloque, b: Bloque) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin);

/** Los bloques del día de hoy en Bogotá, ordenados por hora de inicio (y de fin, si empiezan a la vez). */
export function clasesDeHoy(horario: Bloque[], ahora: number): Bloque[] {
  const hoy = diaDeSemanaEnBogota(ahora);
  return horario.filter((b) => b.dia === hoy).sort(porHora);
}

/** Los días que tienen bloques, de lunes a domingo, cada uno con sus bloques ordenados por hora. */
export function horarioPorDia(horario: Bloque[]): { dia: DiaSemana; bloques: Bloque[] }[] {
  return DIAS.map((_, dia) => ({ dia: dia as DiaSemana, bloques: horario.filter((b) => b.dia === dia).sort(porHora) })).filter(
    (grupo) => grupo.bloques.length > 0,
  );
}

/**
 * El nombre accesible del bloque: "Física, lunes de 08:00 a 10:00". Si usa el link alterno, lo dice:
 * "Ecuaciones, viernes de 08:00 a 10:00, link Viernes". Sin materia, "Materia eliminada".
 */
export function describirBloque(bloque: Bloque, materia: Materia | undefined): string {
  const enlace = materia && nombreDelEnlace(bloque, materia);
  const texto = `${materia?.nombre ?? 'Materia eliminada'}, ${DIAS[bloque.dia]} de ${bloque.inicio} a ${bloque.fin}`;
  return enlace ? `${texto}, link ${enlace}` : texto;
}

/** true si el bloque es de hoy y la hora en Bogotá ya llegó a su inicio sin llegar a su fin: [inicio, fin). */
export function enCurso(bloque: Bloque, ahora: number): boolean {
  const hora = horaEnBogota(ahora);
  return bloque.dia === diaDeSemanaEnBogota(ahora) && bloque.inicio <= hora && hora < bloque.fin;
}

/** Agrega el bloque con un id nuevo. No lo valida: eso lo hace validarBloque antes. */
export function agregarBloque(datos: Datos, nuevo: BloqueNuevo): Datos {
  return { ...datos, horario: [...datos.horario, { id: nuevoId(), ...nuevo }] };
}

/** Quita el bloque; si no existe, devuelve los mismos datos. */
export function borrarBloque(datos: Datos, id: string): Datos {
  if (!datos.horario.some((b) => b.id === id)) return datos;
  return { ...datos, horario: datos.horario.filter((b) => b.id !== id) };
}
