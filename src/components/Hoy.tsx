import { ArrowDown, Coffee, LogIn, Radio, Sun } from 'lucide-react';
import { completarUrl } from '../lib/enlaces.ts';
import { diaDeSemanaEnBogota } from '../lib/fechas.ts';
import { clasesDeHoy, DIAS, enCurso } from '../lib/horario.ts';
import type { Bloque, Materia } from '../lib/tipos.ts';
import EstadoVacio from './EstadoVacio.tsx';
import { botonSecundario, enlaceSecundario, fila, tituloElemento } from './estilos.ts';
import PuntoMateria from './PuntoMateria.tsx';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  horario: Bloque[];
  materias: Materia[];
  /** Hora actual (useAhora): define el día y qué clase está en curso. */
  ahora: number;
  className?: string;
}

/** Las clases de hoy (día de Bogotá) en orden de hora, con su enlace de clase virtual para entrar. */
export default function Hoy({ horario, materias, ahora, className }: Props) {
  const clases = clasesDeHoy(horario, ahora);
  const porId = new Map(materias.map((m) => [m.id, m]));

  return (
    <Tarjeta
      titulo="Hoy"
      pista={`Tus clases del ${DIAS[diaDeSemanaEnBogota(ahora)]}, según tu horario.`}
      icono={Sun}
      className={className}
    >
      {clases.length === 0 ? (
        <EstadoVacio
          icono={Coffee}
          titulo="Hoy no tienes clases"
          texto={
            horario.length > 0
              ? 'Aprovecha el día libre. Tu semana completa está en Horario.'
              : 'Agrega tu horario y aquí verás las clases de cada día, con su enlace para entrar.'
          }
          // Sin materias, Horario pide agregarlas primero: el botón lleva directo a Mis materias.
          accion={materias.length > 0 ? 'Ir a Horario' : 'Ir a Mis materias'}
          iconoAccion={ArrowDown}
          enfocar={materias.length > 0 ? 'horario-materia' : 'nueva-materia'}
        />
      ) : (
        <ul aria-label="Clases de hoy">
          {clases.map((bloque) => {
            const materia = porId.get(bloque.materiaId);
            const nombre = materia?.nombre ?? 'Materia eliminada';
            return (
              // En móvil la hora va arriba y el nombre debajo; desde md, todo en una fila.
              <li
                key={bloque.id}
                className={`${fila} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[7rem_minmax(0,1fr)_auto]`}
              >
                <span className="text-[14px] leading-5 font-semibold tabular-nums">
                  <span aria-hidden="true">
                    {bloque.inicio}–{bloque.fin}
                  </span>
                  <span className="sr-only">
                    De {bloque.inicio} a {bloque.fin}
                  </span>
                </span>
                <span className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 md:col-start-2 md:row-start-1">
                  {materia && <PuntoMateria color={materia.color} />}
                  <span className={`${tituloElemento} truncate`} title={nombre}>
                    {nombre}
                  </span>
                  {enCurso(bloque, ahora) && (
                    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-acento-suave px-2.5 text-[12px] leading-4 font-semibold text-acento">
                      <Radio size={14} aria-hidden="true" />
                      En curso
                    </span>
                  )}
                </span>
                <span className="col-start-2 row-span-2 row-start-1 md:col-start-3 md:row-span-1">
                  {materia?.clase ? (
                    <a
                      href={completarUrl(materia.clase)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={enlaceSecundario}
                      aria-label={`Entrar a la clase de ${nombre}`}
                    >
                      <LogIn size={16} aria-hidden="true" />
                      Entrar
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={botonSecundario}
                      disabled
                      aria-label={`Sin enlace para ${nombre}`}
                      title="Agrega su enlace en Clases virtuales"
                    >
                      Sin enlace
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
