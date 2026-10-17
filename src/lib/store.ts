// Estado de la app fuera de React: cada cambio se guarda enseguida en el almacén, como
// hacía mi-u.html, y la interfaz se suscribe con useSyncExternalStore.
import type { Almacen } from './almacen.ts';
import type { Datos } from './tipos.ts';

export interface EstadoStore {
  datos: Datos;
  /** Mensajes del almacén para el usuario: el de la carga (dura toda la sesión) y el del último guardado. */
  avisos: string[];
  /** Qué se acaba de borrar o reemplazar y se puede deshacer; null si no hay nada. Cualquier otro cambio lo descarta. */
  deshacer: string | null;
}

export interface Store {
  obtener(): EstadoStore;
  suscribir(oyente: () => void): () => void;
  /** Aplica el cambio, lo guarda y avisa a la interfaz. Con `deshacible` (el mensaje) el cambio se puede revertir. */
  actualizar(cambio: (datos: Datos) => Datos, deshacible?: string): void;
  /** Devuelve los datos a antes del último cambio deshacible. */
  deshacer(): void;
  /** Quita la opción de deshacer sin revertir nada. */
  descartarDeshacer(): void;
}

const sinRepetir = (...avisos: (string | null)[]) => [...new Set(avisos.filter((aviso) => aviso !== null))];

export function crearStore(almacen: Almacen): Store {
  let estado: EstadoStore = {
    datos: almacen.datos,
    avisos: sinRepetir(almacen.aviso),
    deshacer: null,
  };
  let previo: Datos | null = null;
  const oyentes = new Set<() => void>();
  const aplicar = (datos: Datos, deshacer: string | null) => {
    estado = {
      datos,
      avisos: sinRepetir(almacen.aviso, almacen.guardar(datos)),
      deshacer,
    };
    oyentes.forEach((oyente) => oyente());
  };
  return {
    obtener: () => estado,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    actualizar(cambio, deshacible) {
      previo = deshacible ? estado.datos : null;
      aplicar(cambio(estado.datos), deshacible ?? null);
    },
    deshacer() {
      if (previo) aplicar(previo, null);
      previo = null;
    },
    descartarDeshacer() {
      previo = null;
      if (estado.deshacer) aplicar(estado.datos, null);
    },
  };
}
