import { useState } from 'react';

export interface ErrorFormulario {
  texto: string;
  /** Cuenta los intentos fallidos seguidos; MensajeError lo usa de key. */
  intento: number;
}

/** Error de un formulario para MensajeError: se muestra al enviar mal y se limpia al cambiar un campo o al enviar bien. */
export function useErrorFormulario() {
  const [error, setError] = useState<ErrorFormulario | null>(null);
  const mostrar = (texto: string) => setError((previo) => ({ texto, intento: (previo?.intento ?? 0) + 1 }));
  const limpiar = () => setError(null);
  return { error, mostrar, limpiar };
}
