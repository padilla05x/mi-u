import { ArrowDown, BookPlus, CalendarClock, CalendarPlus, Plus, Trash } from 'lucide-react';
import { useId, useState } from 'react';
import { useErrorFormulario } from '../hooks/useErrorFormulario.ts';
import { nombreMateria } from '../lib/datos.ts';
import { describirBloque, DIAS, horarioPorDia, validarBloque, type BloqueNuevo } from '../lib/horario.ts';
import type { Bloque, DiaSemana, Materia } from '../lib/tipos.ts';
import Campo from './Campo.tsx';
import EstadoVacio from './EstadoVacio.tsx';
import { botonIcono, botonPrincipal, campo, fila, tituloElemento } from './estilos.ts';
import MensajeError from './MensajeError.tsx';
import PuntoMateria from './PuntoMateria.tsx';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  horario: Bloque[];
  materias: Materia[];
  /** Recibe un bloque ya validado con validarBloque. */
  onAgregar: (bloque: BloqueNuevo) => void;
  onBorrar: (id: string) => void;
  className?: string;
}

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Clases fijas de cada semana: un formulario para agregarlas y la lista agrupada por día. */
export default function Horario({ horario, materias, onAgregar, onBorrar, className }: Props) {
  const id = useId();
  const [materia, setMateria] = useState('');
  const [dia, setDia] = useState<DiaSemana>(0);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const { error, mostrar: mostrarError, limpiar: limpiarError } = useErrorFormulario();
  // Si la materia elegida ya no existe (o aún no se eligió), queda la primera, como en Entregas.
  const materiaElegida = materias.some((m) => m.id === materia) ? materia : (materias[0]?.id ?? '');
  const porId = new Map(materias.map((m) => [m.id, m]));

  const cambiar = <T,>(guardar: (valor: T) => void) => (valor: T) => {
    guardar(valor);
    limpiarError();
  };

  const agregar = () => {
    if (!inicio || !fin) {
      mostrarError('Completa la hora de inicio y la de fin.');
      return;
    }
    const nuevo: BloqueNuevo = { materiaId: materiaElegida, dia, inicio, fin };
    const motivo = validarBloque(nuevo, horario, materias);
    if (motivo) {
      mostrarError(motivo);
      return;
    }
    limpiarError();
    onAgregar(nuevo);
    // La materia y el día se quedan, para agregar seguidas varias clases del mismo día.
    setInicio('');
    setFin('');
  };

  return (
    <Tarjeta
      titulo="Horario"
      pista="Tus clases fijas de cada semana. Las de cada día aparecen arriba, en Hoy."
      icono={CalendarClock}
      className={className}
    >
      {materias.length === 0 ? (
        <EstadoVacio
          icono={BookPlus}
          titulo="Primero agrega tus materias"
          texto="Cada clase del horario es de una de tus materias."
          accion="Ir a Mis materias"
          iconoAccion={ArrowDown}
          enfocar="nueva-materia"
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <Campo id="horario-materia" etiqueta="Materia">
              <select
                id="horario-materia"
                className={campo}
                value={materiaElegida}
                onChange={(e) => cambiar(setMateria)(e.target.value)}
              >
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="horario-dia" etiqueta="Día">
              <select
                id="horario-dia"
                className={campo}
                value={dia}
                onChange={(e) => cambiar(setDia)(Number(e.target.value) as DiaSemana)}
              >
                {DIAS.map((nombre, i) => (
                  <option key={nombre} value={i}>
                    {conMayuscula(nombre)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="horario-inicio" etiqueta="Inicio">
              <input
                id="horario-inicio"
                type="time"
                className={campo}
                value={inicio}
                onChange={(e) => cambiar(setInicio)(e.target.value)}
              />
            </Campo>
            <Campo id="horario-fin" etiqueta="Fin">
              <input id="horario-fin" type="time" className={campo} value={fin} onChange={(e) => cambiar(setFin)(e.target.value)} />
            </Campo>
            <button type="button" className={botonPrincipal} onClick={agregar}>
              <Plus size={16} aria-hidden="true" />
              Agregar
            </button>
          </div>
          <MensajeError error={error} className="mt-3" />
          <div className="mt-4">
            {horario.length === 0 ? (
              <EstadoVacio
                icono={CalendarPlus}
                titulo="Todavía no tienes horario"
                texto="Agrega tus clases de la semana y verás las de cada día en Hoy."
                accion="Agregar clase"
                enfocar="horario-materia"
              />
            ) : (
              // Columnas de texto: los días bajan en orden (el del DOM) y uno largo no deja huecos junto a los cortos.
              <div className="columns-1 gap-x-6 md:columns-2 lg:columns-3">
                {horarioPorDia(horario).map(({ dia: diaGrupo, bloques }) => (
                  <div key={diaGrupo} className="mb-4 min-w-0 break-inside-avoid last:mb-0">
                    <h3 id={`${id}-dia-${diaGrupo}`} className="text-[13px] leading-[18px] font-semibold">
                      {conMayuscula(DIAS[diaGrupo])}
                    </h3>
                    <ul aria-labelledby={`${id}-dia-${diaGrupo}`} className="mt-1">
                      {bloques.map((bloque) => {
                        const nombre = nombreMateria(materias, bloque.materiaId);
                        const descripcion = describirBloque(bloque, nombre);
                        const color = porId.get(bloque.materiaId)?.color;
                        return (
                          <li key={bloque.id} className={`${fila} flex items-center gap-3`}>
                            {/* El lector de pantalla oye la frase completa; lo que se ve va oculto para que no lo repita. */}
                            <span className="sr-only">{descripcion}</span>
                            <span aria-hidden="true" className="shrink-0 text-[14px] leading-5 font-semibold tabular-nums">
                              {bloque.inicio}–{bloque.fin}
                            </span>
                            <span aria-hidden="true" className="flex min-w-0 flex-1 items-center gap-2">
                              {color && <PuntoMateria color={color} />}
                              <span className={`${tituloElemento} truncate`} title={nombre}>
                                {nombre}
                              </span>
                            </span>
                            <button
                              type="button"
                              className={botonIcono}
                              title="Borrar"
                              aria-label={`Borrar ${descripcion}`}
                              onClick={() => onBorrar(bloque.id)}
                            >
                              <Trash size={18} aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Tarjeta>
  );
}
