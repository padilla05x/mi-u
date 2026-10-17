import type { LucideIcon } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { botonPeligro, botonPrincipal, botonSecundario } from './estilos.ts';

interface Props {
  titulo: string;
  children: ReactNode;
  /** Texto del botón que confirma, por ejemplo "Quitar materia". */
  accion: string;
  iconoAccion?: LucideIcon;
  /** Peligro para lo que borra (por defecto); principal para lo que tiene vuelta atrás, como Importar. */
  estiloAccion?: 'peligro' | 'principal';
  onConfirmar: () => void;
  /** Al pulsar "Cancelar" o Esc. */
  onCancelar: () => void;
  /** Id del elemento que recibe el foco al cerrar si el botón que abrió el diálogo ya no existe (por ejemplo, porque se borró). */
  focoSinOrigen?: string;
}

const ENFOCABLES = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

const ESTILOS_ACCION = { peligro: botonPeligro, principal: botonPrincipal };

/**
 * Diálogo modal para confirmar una acción, como quitar una materia o importar un respaldo. El foco empieza en
 * "Cancelar" y no sale del diálogo; el resto de la página queda inerte. Al cerrarse, el foco vuelve a donde estaba
 * al abrirlo.
 */
export default function Dialogo(props: Props) {
  const { titulo, children, accion, iconoAccion: Icono, estiloAccion = 'peligro', onConfirmar, onCancelar, focoSinOrigen } = props;
  const idTitulo = useId();
  const idTexto = useId();
  const capa = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);

  const alPulsar = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancelar();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const enfocables = [...panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)];
    const [primero, ultimo] = [enfocables[0], enfocables.at(-1)];
    const activo = document.activeElement;
    const dentro = panel.current.contains(activo);
    if (e.shiftKey && (!dentro || activo === primero)) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && (!dentro || activo === ultimo)) {
      e.preventDefault();
      primero?.focus();
    }
  });

  useEffect(() => {
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Todo lo que no es el diálogo queda inerte: ni el puntero ni el teclado ni el lector de pantalla llegan ahí.
    const inertes = [...document.body.children].filter((el) => el !== capa.current && !el.hasAttribute('inert'));
    inertes.forEach((el) => el.setAttribute('inert', ''));
    cancelar.current?.focus();
    const escuchar = (e: KeyboardEvent) => alPulsar(e);
    document.addEventListener('keydown', escuchar);
    return () => {
      document.removeEventListener('keydown', escuchar);
      inertes.forEach((el) => el.removeAttribute('inert'));
      const destino = origen?.isConnected ? origen : focoSinOrigen ? document.getElementById(focoSinOrigen) : null;
      destino?.focus();
    };
  }, [focoSinOrigen]);

  return createPortal(
    <div ref={capa} className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-fondo/80 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        className="w-full max-w-md rounded-2xl border border-borde bg-tarjeta p-5 shadow-[var(--sombra-tarjeta)] md:p-6"
      >
        <h2 id={idTitulo} className="text-[18px] leading-6 font-semibold tracking-[-0.01em] break-words">
          {titulo}
        </h2>
        <div id={idTexto} className="mt-2 text-[14px] leading-5 text-tenue">
          {children}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelar} type="button" className={botonSecundario} onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className={ESTILOS_ACCION[estiloAccion]} onClick={onConfirmar}>
            {Icono && <Icono size={16} aria-hidden="true" />}
            {accion}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
