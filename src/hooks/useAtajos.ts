import { useEffect } from 'react';

/** Tecla → id del campo que enfoca. */
export const ATAJOS: Record<string, string> = { '/': 'buscar-entregas', n: 'entrega-descripcion' };

/** Atajos de una tecla; no actúan mientras se escribe en un campo ni con Ctrl, Alt o Cmd. */
export function useAtajos() {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const destino = e.target instanceof HTMLElement ? e.target : null;
      if (e.ctrlKey || e.altKey || e.metaKey || destino?.closest('input, select, textarea, [contenteditable]')) return;
      const campo = ATAJOS[e.key] && document.getElementById(ATAJOS[e.key]);
      if (!campo) return;
      e.preventDefault();
      campo.focus();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, []);
}
