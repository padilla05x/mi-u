// Clases de Tailwind compartidas, según docs/diseno.md.
const transicion = 'transition-colors duration-150 ease-estandar';
// `transition` (y no solo colores) porque el botón secundario también cambia su sombra interna.
const botonBase =
  'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] leading-5 font-semibold whitespace-nowrap transition duration-150 ease-estandar disabled:cursor-not-allowed disabled:opacity-50';

/** Para crear (Agregar y Guardar) y para confirmar Importar en su diálogo. */
export const botonPrincipal = `${botonBase} bg-acento text-sobre-acento enabled:hover:bg-acento-hover`;
/** Abrir enlaces, accesos a Google, activar avisos y botones de los estados vacíos. */
export const botonSecundario = `${botonBase} bg-acento-suave text-acento enabled:hover:shadow-[inset_0_0_0_1px_var(--color-acento)]`;
/** Como botonSecundario, pero para un enlace (<a>): :enabled no se aplica a los enlaces. */
export const enlaceSecundario = `${botonBase} bg-acento-suave text-acento hover:shadow-[inset_0_0_0_1px_var(--color-acento)]`;
/** Confirma una acción que borra, como "Quitar materia" en el diálogo de confirmación. */
export const botonPeligro = `${botonBase} bg-peligro-suave text-peligro enabled:hover:shadow-[inset_0_0_0_1px_var(--color-peligro)]`;
const baseIcono = `inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-tenue ${transicion}`;
/** Botón solo de icono (borrar y quitar); necesita aria-label. */
export const botonIcono = `${baseIcono} hover:bg-superficie hover:text-texto`;
/** Quitar una materia de una sección en modo edición: tenue en reposo y en peligro al pasar el puntero o enfocarlo. */
export const botonIconoPeligro = `${baseIcono} hover:bg-peligro-suave hover:text-peligro focus-visible:bg-peligro-suave focus-visible:text-peligro`;

export const campo = `h-10 w-full min-w-0 rounded-[10px] border border-borde-control bg-tarjeta px-3 text-[14px] leading-5 text-texto ${transicion} focus:border-acento`;
export const fila = `-mx-2 border-b border-borde px-2 py-3 last:border-b-0 ${transicion} hover:bg-superficie`;
export const tituloElemento = 'text-[15px] leading-5 font-medium';
export const pista = 'text-[13px] leading-[18px] text-tenue';
