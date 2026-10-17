import type { ErrorFormulario } from '../hooks/useErrorFormulario.ts';

/** Error de un formulario, debajo de él. Cada intento fallido lo vuelve a crear para que se anuncie de nuevo. */
export default function MensajeError({ error, className = '' }: { error: ErrorFormulario | null; className?: string }) {
  if (!error) return null;
  return (
    <p key={error.intento} role="alert" className={`text-[14px] leading-5 text-peligro ${className}`}>
      {error.texto}
    </p>
  );
}
