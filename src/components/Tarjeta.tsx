import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { pista as clasePista } from './estilos.ts';

interface Props {
  titulo: string;
  pista: string;
  icono: LucideIcon;
  /** Ubicación en la cuadrícula de App. */
  className?: string;
  /** Botón a la derecha del título, como "Editar". */
  accion?: ReactNode;
  /**
   * Texto del modo edición. Mientras haya uno, el borde pasa a acento y el texto reemplaza a la pista, unido a la
   * tarjeta con aria-describedby. Solo cambia el color del borde, así que la tarjeta no salta.
   */
  ayudaEdicion?: string;
  children: ReactNode;
}

export default function Tarjeta({ titulo, pista, icono: Icono, className = '', accion, ayudaEdicion, children }: Props) {
  const id = useId();
  const idTexto = `${id}-texto`;
  const encabezado = (
    <h2 id={id} className="flex min-w-0 items-center gap-2.5 text-[18px] leading-6 font-semibold tracking-[-0.01em]">
      <Icono size={20} className="shrink-0 text-acento" aria-hidden="true" />
      {titulo}
    </h2>
  );
  return (
    <section
      aria-labelledby={id}
      aria-describedby={ayudaEdicion ? idTexto : undefined}
      className={`min-w-0 rounded-2xl border bg-tarjeta p-5 shadow-[var(--sombra-tarjeta)] transition-colors duration-150 ease-estandar md:p-6 ${ayudaEdicion ? 'border-acento' : 'border-borde'} ${className}`}
    >
      {accion ? (
        <div className="flex items-center justify-between gap-3">
          {encabezado}
          {accion}
        </div>
      ) : (
        encabezado
      )}
      <p id={idTexto} className={`mt-1 ${clasePista}`}>
        {ayudaEdicion ?? pista}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
