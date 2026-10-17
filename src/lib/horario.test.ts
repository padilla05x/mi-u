import { describe, expect, it } from 'vitest';
import { agregarBloque, borrarBloque, clasesDeHoy, DIAS, enCurso, validarBloque, type BloqueNuevo } from './horario.ts';
import type { Bloque, Datos, Materia } from './tipos.ts';

const materia = (id: string, nombre: string): Materia => ({
  id,
  nombre,
  color: 'orquidea',
  clase: '',
  moodle: '',
  classroom: '',
  ocultaEn: [],
});
const materias = [materia('fis', 'Física'), materia('qui', 'Química')];
const bloque = (id: string, cambio: Partial<Bloque> = {}): Bloque => ({ id, materiaId: 'fis', dia: 0, inicio: '08:00', fin: '10:00', ...cambio });
const nuevo = (cambio: Partial<BloqueNuevo> = {}): BloqueNuevo => ({ materiaId: 'fis', dia: 0, inicio: '08:00', fin: '10:00', ...cambio });
const ids = (bloques: Bloque[]) => bloques.map((b) => b.id);

// La semana del 12 al 18 de octubre de 2026 va de lunes a domingo. Las pruebas corren con TZ=Asia/Tokyo
// (vite.config.ts), 14 horas por delante de Bogotá.
const bogota = (fechaHora: string) => Date.parse(`${fechaHora}-05:00`);

describe('validarBloque', () => {
  // Química ocupa el lunes de 09:00 a 11:00.
  const horario = [bloque('q', { materiaId: 'qui', inicio: '09:00', fin: '11:00' })];

  it('acepta un bloque válido', () => {
    expect(validarBloque(nuevo({ inicio: '11:00', fin: '13:00' }), horario, materias)).toBeNull();
    expect(validarBloque(nuevo({ dia: 6, inicio: '00:00', fin: '23:59' }), horario, materias)).toBeNull();
  });

  it.each([
    ['fin antes que inicio', '10:00', '08:00'],
    ['fin igual a inicio', '10:00', '10:00'],
  ])('rechaza %s', (_caso, inicio, fin) => {
    expect(validarBloque(nuevo({ inicio, fin }), [], materias)).toBe(
      `El bloque ("Física") debe terminar después de empezar: va de ${inicio} a ${fin}.`,
    );
  });

  it.each([
    ['empieza antes y termina dentro', '08:00', '10:00'],
    ['empieza dentro y termina después', '10:00', '12:00'],
    ['queda dentro', '09:30', '10:30'],
    ['lo contiene', '08:00', '12:00'],
    ['es idéntico', '09:00', '11:00'],
  ])('rechaza un bloque que se solapa con otro del mismo día: %s', (_caso, inicio, fin) => {
    expect(validarBloque(nuevo({ inicio, fin }), horario, materias)).toBe(
      'El bloque ("Física") se solapa con otro del lunes: "Química", de 09:00 a 11:00.',
    );
  });

  it.each([
    ['termina justo cuando el otro empieza', '07:00', '09:00'],
    ['empieza justo cuando el otro termina', '11:00', '12:00'],
  ])('dos bloques que solo se tocan no se solapan: %s', (_caso, inicio, fin) => {
    expect(validarBloque(nuevo({ inicio, fin }), horario, materias)).toBeNull();
  });

  it('a la misma hora pero otro día no hay solape', () => {
    expect(validarBloque(nuevo({ dia: 1, inicio: '09:00', fin: '11:00' }), horario, materias)).toBeNull();
  });

  it('un bloque que ya está en el horario no se compara consigo mismo', () => {
    expect(validarBloque(horario[0], horario, materias)).toBeNull();
  });

  it.each([7, -1, 1.5])('rechaza un día fuera de 0 (lunes) a 6 (domingo): %s', (dia) => {
    expect(validarBloque(nuevo({ dia: dia as Bloque['dia'] }), [], materias)).toBe(
      'El campo "dia" del bloque ("Física") no es un día de 0 (lunes) a 6 (domingo).',
    );
  });

  it.each([
    ['inicio', '8:00'],
    ['inicio', ''],
    ['fin', '24:00'],
    ['fin', '10:75'],
  ])('rechaza una hora mal formada (%s "%s")', (campo, hora) => {
    expect(validarBloque(nuevo({ [campo]: hora }), [], materias)).toBe(
      `El campo "${campo}" del bloque ("Física") no es una hora HH:MM de 00:00 a 23:59, como 08:00.`,
    );
  });

  it('rechaza una materia que no está en Mis materias', () => {
    expect(validarBloque(nuevo({ materiaId: 'm9' }), [], materias)).toBe(
      'El bloque es de una materia que no está en Mis materias ("m9").',
    );
  });
});

describe('clasesDeHoy', () => {
  const horario = [
    bloque('lun-tarde', { inicio: '14:00', fin: '16:00' }),
    bloque('mar', { dia: 1, inicio: '07:00', fin: '09:00' }),
    bloque('lun-temprano', { inicio: '06:00', fin: '07:00' }),
    bloque('lun-mismo-inicio', { materiaId: 'qui', inicio: '14:00', fin: '15:00' }),
    bloque('dom', { dia: 6, inicio: '20:00', fin: '22:00' }),
  ];

  it('devuelve los bloques de hoy ordenados por hora de inicio, y de fin si empiezan a la vez', () => {
    expect(ids(clasesDeHoy(horario, bogota('2026-10-12T09:00:00')))).toEqual(['lun-temprano', 'lun-mismo-inicio', 'lun-tarde']);
    expect(clasesDeHoy(horario, bogota('2026-10-14T09:00:00'))).toEqual([]);
  });

  it('cambia de día a medianoche en Bogotá', () => {
    expect(ids(clasesDeHoy(horario, bogota('2026-10-12T23:59:59')))).toEqual(['lun-temprano', 'lun-mismo-inicio', 'lun-tarde']);
    expect(ids(clasesDeHoy(horario, bogota('2026-10-13T00:00:00')))).toEqual(['mar']);
    // Del domingo al lunes de la semana siguiente.
    expect(ids(clasesDeHoy(horario, bogota('2026-10-18T23:59:59')))).toEqual(['dom']);
    expect(ids(clasesDeHoy(horario, bogota('2026-10-19T00:00:00')))).toEqual(['lun-temprano', 'lun-mismo-inicio', 'lun-tarde']);
  });

  it('usa el día de Bogotá aunque el equipo esté en Tokio', () => {
    const lunesNoche = bogota('2026-10-12T20:00:00');
    // En Tokio ya es martes 13: una implementación con la zona del equipo devolvería el bloque del martes.
    expect(new Date(lunesNoche).getDay()).toBe(2);
    expect(ids(clasesDeHoy(horario, lunesNoche))).toEqual(['lun-temprano', 'lun-mismo-inicio', 'lun-tarde']);
  });

  it('no cambia el horario recibido', () => {
    const copia = [...horario];
    clasesDeHoy(horario, bogota('2026-10-12T09:00:00'));
    expect(horario).toEqual(copia);
  });
});

describe('enCurso', () => {
  const clase = bloque('b', { inicio: '08:00', fin: '10:00' }); // Lunes.

  it('incluye el minuto de inicio', () => {
    expect(enCurso(clase, bogota('2026-10-12T07:59:59'))).toBe(false);
    expect(enCurso(clase, bogota('2026-10-12T08:00:00'))).toBe(true);
  });

  it('excluye el minuto de fin', () => {
    expect(enCurso(clase, bogota('2026-10-12T09:59:59'))).toBe(true);
    expect(enCurso(clase, bogota('2026-10-12T10:00:00'))).toBe(false);
  });

  it('a la misma hora pero otro día no está en curso', () => {
    expect(enCurso(clase, bogota('2026-10-13T09:00:00'))).toBe(false);
  });

  it('usa la hora y el día de Bogotá aunque el equipo esté en Tokio', () => {
    const nocturna = bloque('n', { inicio: '20:00', fin: '22:00' });
    const lunes2030 = bogota('2026-10-12T20:30:00');
    // En Tokio son las 10:30 del martes.
    expect([new Date(lunes2030).getDay(), new Date(lunes2030).getHours()]).toEqual([2, 10]);
    expect(enCurso(nocturna, lunes2030)).toBe(true);
    expect(enCurso(clase, bogota('2026-10-11T18:30:00'))).toBe(false); // Lunes 08:30 en Tokio, domingo en Bogotá.
  });
});

describe('agregarBloque y borrarBloque', () => {
  const datos: Datos = { materias, entregas: [], drive: [], horario: [bloque('b1')] };

  it('agrega el bloque con un id nuevo, sin cambiar los datos recibidos', () => {
    const nuevos = agregarBloque(datos, nuevo({ materiaId: 'qui', dia: 2, inicio: '14:00', fin: '16:00' }));
    expect(nuevos.horario).toHaveLength(2);
    expect(nuevos.horario[1]).toMatchObject({ materiaId: 'qui', dia: 2, inicio: '14:00', fin: '16:00' });
    expect(nuevos.horario[1].id).toEqual(expect.any(String));
    expect(nuevos.horario[1].id).not.toBe('b1');
    expect(datos.horario).toHaveLength(1);
    expect(nuevos.materias).toBe(datos.materias);
  });

  it('borra el bloque por id; si no existe, devuelve los mismos datos', () => {
    expect(borrarBloque(datos, 'b1').horario).toEqual([]);
    expect(borrarBloque(datos, 'x')).toBe(datos);
  });
});

it('DIAS nombra los días de lunes (0) a domingo (6)', () => {
  expect(DIAS).toEqual(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']);
});
