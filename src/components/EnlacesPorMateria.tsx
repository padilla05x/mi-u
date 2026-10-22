import { ArrowDown, BookPlus, Check, ExternalLink, Eye, EyeOff, Pencil, Trash, type LucideIcon } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { nombreAlterno, quitarAlternoPierdeAlgo } from '../lib/clases.ts';
import { abrirEnlace } from '../lib/enlaces.ts';
import { materiasOcultas, materiasVisibles } from '../lib/secciones.ts';
import type { Bloque, Materia, SeccionEnlace } from '../lib/tipos.ts';
import Dialogo from './Dialogo.tsx';
import EstadoVacio from './EstadoVacio.tsx';
import { botonIconoPeligro, botonSecundario, campo as claseCampo, fila, tituloElemento } from './estilos.ts';
import PuntoMateria from './PuntoMateria.tsx';
import Tarjeta from './Tarjeta.tsx';

/** Props de las secciones que usan esta tarjeta (Clases virtuales, Moodle y Classroom). */
export interface PropsSeccionEnlaces {
  materias: Materia[];
  onGuardar: (id: string, seccion: SeccionEnlace, url: string) => void;
  /** Borra el enlace de la materia en la sección y la oculta ahí. */
  onQuitar: (id: string, seccion: SeccionEnlace) => void;
  /** Vuelve a mostrarla en la sección, con el enlace vacío. */
  onMostrar: (id: string, seccion: SeccionEnlace) => void;
  /** Link alterno de la clase virtual: solo lo pasa Clases virtuales. */
  alterno?: PropsAlterno;
  className?: string;
}

export interface PropsAlterno {
  /** Para saber si desmarcar la casilla perdería algo: un bloque que usa el alterno. */
  horario: Bloque[];
  /** Marca "Tiene más de un link". */
  onActivar: (id: string) => void;
  /** Desmarca la casilla: vacía el alterno y su nombre, y los bloques que lo usaban pasan al principal. */
  onQuitar: (id: string) => void;
  onGuardar: (id: string, campo: 'claseAlterna' | 'claseAlternaNombre', valor: string) => void;
}

interface Props extends PropsSeccionEnlaces {
  seccion: SeccionEnlace;
  titulo: string;
  pista: string;
  icono: LucideIcon;
  /** Lo que va antes de las filas, como "Abrir Google Classroom". */
  children?: ReactNode;
}

const AYUDA_EDICION = 'Quita una materia de esta sección. Su enlace se borra, pero la materia sigue en las demás.';

/**
 * Tarjeta con una fila por materia: el nombre arriba y, debajo, el enlace con su botón Abrir, que solo se habilita
 * con un enlace guardado. Va apilada en todos los tamaños porque estas tarjetas son angostas. En modo edición cada
 * fila suma un botón para quitar la materia de esta sección, y al final aparecen las ocultas para mostrarlas de nuevo.
 * Con `alterno` (Clases virtuales), cada fila puede tener un segundo link: se configura en modo edición con la casilla
 * "Tiene más de un link" y se abre con su propio botón.
 */
export default function EnlacesPorMateria(props: Props) {
  const { seccion, titulo, pista, icono, materias, onGuardar, onQuitar, onMostrar, alterno, className, children } = props;
  const id = useId();
  const [editando, setEditando] = useState(false);
  const [porQuitar, setPorQuitar] = useState<Materia | null>(null);
  const [alternoPorQuitar, setAlternoPorQuitar] = useState<Materia | null>(null);
  // Sin materias no hay nada que editar.
  const enEdicion = editando && materias.length > 0;
  const visibles = materiasVisibles(materias, seccion);
  const ocultas = materiasOcultas(materias, seccion);
  const idEditar = `${id}-editar`;
  const idCampo = (materia: string) => `${id}-enlace-${materia}`;
  const idAlterno = (materia: string) => `${id}-alterno-${materia}`;
  const idNombreAlterno = (materia: string) => `${id}-nombre-alterno-${materia}`;

  const quitar = (m: Materia) => {
    onQuitar(m.id, seccion);
    setPorQuitar(null);
  };
  const mostrar = (m: Materia) => {
    flushSync(() => onMostrar(m.id, seccion));
    // Su chip ya no existe: el foco pasa a su campo, vacío, para pegar el enlace de nuevo.
    document.getElementById(idCampo(m.id))?.focus();
  };
  // Desmarcar solo pregunta si se perdería algo: un link o un nombre escritos, o bloques que usan el alterno.
  const alternarCasilla = (m: Materia) => {
    if (!alterno) return;
    if (!m.tieneClaseAlterna) alterno.onActivar(m.id);
    else if (quitarAlternoPierdeAlgo(m, alterno.horario)) setAlternoPorQuitar(m);
    else alterno.onQuitar(m.id);
  };
  const quitarAlterno = (m: Materia) => {
    alterno?.onQuitar(m.id);
    setAlternoPorQuitar(null);
  };
  const botonAlterno = (m: Materia) => (
    <button
      type="button"
      className={botonSecundario}
      disabled={!m.claseAlterna}
      aria-label={`Abrir clase de ${m.nombre}, ${nombreAlterno(m)}`}
      onClick={() => abrirEnlace(m.claseAlterna)}
    >
      <ExternalLink size={16} aria-hidden="true" />
      <span className="max-w-32 truncate">{nombreAlterno(m)}</span>
    </button>
  );

  const botonEditar = materias.length > 0 && (
    <button id={idEditar} type="button" className={botonSecundario} onClick={() => setEditando(!enEdicion)}>
      {enEdicion ? <Check size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
      {enEdicion ? 'Listo' : 'Editar'}
    </button>
  );

  return (
    <Tarjeta
      titulo={titulo}
      pista={pista}
      icono={icono}
      className={className}
      accion={botonEditar}
      ayudaEdicion={enEdicion ? AYUDA_EDICION : undefined}
    >
      {children}
      {materias.length === 0 ? (
        <EstadoVacio
          icono={BookPlus}
          titulo="Primero agrega tus materias"
          texto="Aquí aparecerá una fila por materia para guardar su enlace."
          accion="Ir a Mis materias"
          iconoAccion={ArrowDown}
          enfocar="nueva-materia"
        />
      ) : visibles.length === 0 && !enEdicion ? (
        <div className="grid justify-items-center gap-2.5 rounded-xl bg-fondo px-6 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-acento-suave text-acento">
            <EyeOff size={28} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-[18px] text-tenue">
            Todas las materias están ocultas en esta sección. Usa Editar para mostrarlas de nuevo.
          </p>
        </div>
      ) : (
        <ul>
          {visibles.map((m) => (
            <li key={m.id} className={`${fila} grid gap-2`}>
              <span className="flex min-w-0 items-center gap-2">
                <PuntoMateria color={m.color} />
                <span className={`${tituloElemento} truncate`} title={m.nombre}>
                  {m.nombre}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <CampoDeEnlace
                  id={idCampo(m.id)}
                  ariaLabel={`Enlace de ${m.nombre}`}
                  valor={m[seccion]}
                  onGuardar={(url) => onGuardar(m.id, seccion, url)}
                />
                <button
                  type="button"
                  className={botonSecundario}
                  disabled={!m[seccion]}
                  // Con alterno, los dos botones dicen cuál abre cada uno.
                  aria-label={alterno && m.tieneClaseAlterna ? `Abrir clase de ${m.nombre}, principal` : `Abrir ${m.nombre}`}
                  onClick={() => abrirEnlace(m[seccion])}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Abrir
                </button>
                {enEdicion && (
                  <button
                    type="button"
                    className={botonIconoPeligro}
                    title="Quitar de esta sección"
                    aria-label={`Quitar ${m.nombre} de ${titulo}`}
                    onClick={() => setPorQuitar(m)}
                  >
                    <Trash size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
              {alterno && m.tieneClaseAlterna && !enEdicion && <div className="flex justify-end">{botonAlterno(m)}</div>}
              {alterno && enEdicion && (
                <div className="grid gap-3">
                  <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] leading-[18px] font-medium">
                    <input
                      type="checkbox"
                      className="size-[18px] cursor-pointer accent-acento"
                      checked={m.tieneClaseAlterna}
                      onChange={() => alternarCasilla(m)}
                    />
                    {/* El espacio va fuera del texto oculto: jsdom quita el de adentro y Chromium agrega otro, que se colapsa. */}
                    Tiene más de un link <span className="sr-only">({m.nombre})</span>
                  </label>
                  {m.tieneClaseAlterna && (
                    <>
                      <div className="grid min-w-0 gap-1.5">
                        <label htmlFor={idAlterno(m.id)} className="text-[13px] leading-[18px] font-medium">
                          Link alterno <span className="sr-only">de {m.nombre}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <CampoDeEnlace
                            id={idAlterno(m.id)}
                            valor={m.claseAlterna}
                            onGuardar={(url) => alterno.onGuardar(m.id, 'claseAlterna', url)}
                          />
                          {botonAlterno(m)}
                        </div>
                      </div>
                      <div className="grid min-w-0 gap-1.5">
                        <label htmlFor={idNombreAlterno(m.id)} className="text-[13px] leading-[18px] font-medium">
                          Nombre del link alterno <span className="sr-only">de {m.nombre}</span>
                        </label>
                        <CampoDeEnlace
                          id={idNombreAlterno(m.id)}
                          valor={m.claseAlternaNombre}
                          placeholder="Alterno"
                          onGuardar={(nombre) => alterno.onGuardar(m.id, 'claseAlternaNombre', nombre)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {enEdicion && ocultas.length > 0 && (
        <div className="mt-4 border-t border-borde pt-4">
          <h3 id={`${id}-ocultas`} className="text-[13px] leading-[18px] font-medium">
            Ocultas aquí ({ocultas.length})
          </h3>
          <ul aria-labelledby={`${id}-ocultas`} className="mt-2 flex flex-wrap gap-2">
            {ocultas.map((m) => (
              <li key={m.id} className="flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-borde bg-fondo py-1 pr-1 pl-3">
                <PuntoMateria color={m.color} />
                <span className="min-w-0 truncate text-[14px] leading-5" title={m.nombre}>
                  {m.nombre}
                </span>
                <button
                  type="button"
                  className={botonSecundario}
                  aria-label={`Mostrar ${m.nombre} en ${titulo}`}
                  onClick={() => mostrar(m)}
                >
                  <Eye size={16} aria-hidden="true" />
                  Mostrar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {porQuitar && (
        <Dialogo
          titulo={`¿Quitar ${porQuitar.nombre} de ${titulo}?`}
          accion="Quitar"
          iconoAccion={Trash}
          onConfirmar={() => quitar(porQuitar)}
          onCancelar={() => setPorQuitar(null)}
          // Al confirmar desaparece su fila: el foco pasa a "Listo".
          focoSinOrigen={idEditar}
        >
          {alterno && porQuitar.tieneClaseAlterna
            ? 'Se borrarán su enlace y su link alterno en esta sección, y las clases del horario que usaban el alterno pasarán al link principal. La materia y sus enlaces en las demás secciones no cambian.'
            : 'Se borrará su enlace en esta sección. La materia y sus enlaces en las demás secciones no cambian.'}
        </Dialogo>
      )}
      {alternoPorQuitar && (
        <Dialogo
          titulo={`¿Quitar el link alterno de ${alternoPorQuitar.nombre}?`}
          accion="Quitar link alterno"
          iconoAccion={Trash}
          onConfirmar={() => quitarAlterno(alternoPorQuitar)}
          onCancelar={() => setAlternoPorQuitar(null)}
        >
          Se borrarán el link alterno y su nombre, y las clases del horario que lo usaban pasarán al link principal.
        </Dialogo>
      )}
    </Tarjeta>
  );
}

interface PropsCampo {
  id: string;
  valor: string;
  onGuardar: (valor: string) => void;
  /** Nombre accesible cuando el campo no tiene una etiqueta visible. */
  ariaLabel?: string;
  placeholder?: string;
}

/**
 * Como en mi-u.html, el enlace se guarda al confirmar el campo (al salir de él o con Enter), no en cada tecla, y sin
 * espacios al inicio ni al final. Lo usan el enlace de cada sección, el link alterno y su nombre.
 */
function CampoDeEnlace({ id, valor, onGuardar, ariaLabel, placeholder = 'Pega el enlace' }: PropsCampo) {
  const [borrador, setBorrador] = useState(valor);
  const confirmar = () => {
    const url = borrador.trim();
    setBorrador(url);
    if (url !== valor) onGuardar(url);
  };
  return (
    <input
      id={id}
      type="text"
      aria-label={ariaLabel}
      className={`${claseCampo} flex-1`}
      placeholder={placeholder}
      value={borrador}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') confirmar();
      }}
    />
  );
}
