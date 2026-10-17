import { ArrowDown, BookPlus, Check, ExternalLink, Eye, EyeOff, Pencil, Trash, type LucideIcon } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { abrirEnlace } from '../lib/enlaces.ts';
import { materiasOcultas, materiasVisibles } from '../lib/secciones.ts';
import type { Materia, SeccionEnlace } from '../lib/tipos.ts';
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
  className?: string;
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
 */
export default function EnlacesPorMateria(props: Props) {
  const { seccion, titulo, pista, icono, materias, onGuardar, onQuitar, onMostrar, className, children } = props;
  const id = useId();
  const [editando, setEditando] = useState(false);
  const [porQuitar, setPorQuitar] = useState<Materia | null>(null);
  // Sin materias no hay nada que editar.
  const enEdicion = editando && materias.length > 0;
  const visibles = materiasVisibles(materias, seccion);
  const ocultas = materiasOcultas(materias, seccion);
  const idEditar = `${id}-editar`;
  const idCampo = (materia: string) => `${id}-enlace-${materia}`;

  const quitar = (m: Materia) => {
    onQuitar(m.id, seccion);
    setPorQuitar(null);
  };
  const mostrar = (m: Materia) => {
    flushSync(() => onMostrar(m.id, seccion));
    // Su chip ya no existe: el foco pasa a su campo, vacío, para pegar el enlace de nuevo.
    document.getElementById(idCampo(m.id))?.focus();
  };

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
                  nombre={m.nombre}
                  valor={m[seccion]}
                  onGuardar={(url) => onGuardar(m.id, seccion, url)}
                />
                <button
                  type="button"
                  className={botonSecundario}
                  disabled={!m[seccion]}
                  aria-label={`Abrir ${m.nombre}`}
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
          Se borrará su enlace en esta sección. La materia y sus enlaces en las demás secciones no cambian.
        </Dialogo>
      )}
    </Tarjeta>
  );
}

interface PropsCampo {
  id: string;
  nombre: string;
  valor: string;
  onGuardar: (url: string) => void;
}

/** Como en mi-u.html, el enlace se guarda al confirmar el campo (al salir de él o con Enter), no en cada tecla. */
function CampoDeEnlace({ id, nombre, valor, onGuardar }: PropsCampo) {
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
      aria-label={`Enlace de ${nombre}`}
      className={`${claseCampo} flex-1`}
      placeholder="Pega el enlace"
      value={borrador}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') confirmar();
      }}
    />
  );
}
