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
  /**
   * Cambio de la persona: lo aplica, lo guarda y avisa a la interfaz. Con `deshacible` (el mensaje) se puede
   * revertir; sin él, descarta cualquier Deshacer pendiente.
   */
  actualizar(cambio: (datos: Datos) => Datos, deshacible?: string): void;
  /**
   * Cambio interno de la app, como marcar avisos: no crea ni descarta el Deshacer pendiente. También se aplica
   * a los datos que restauraría Deshacer, para que deshacer un borrado no pierda este cambio.
   */
  actualizarSinDeshacer(cambio: (datos: Datos) => Datos): void;
  /**
   * Reemplaza todos los datos por los de un respaldo, como un cambio deshacible con el mensaje `deshacible`. Antes
   * copia lo guardado (ver Almacen.copiarAntesDeImportar); si no puede, no cambia nada y devuelve false.
   */
  importar(datos: Datos, deshacible: string): boolean;
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
  const actualizar: Store['actualizar'] = (cambio, deshacible) => {
    previo = deshacible ? estado.datos : null;
    aplicar(cambio(estado.datos), deshacible ?? null);
  };
  return {
    obtener: () => estado,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    actualizar,
    importar(datos, deshacible) {
      if (!almacen.copiarAntesDeImportar()) return false;
      actualizar(() => datos, deshacible);
      return true;
    },
    actualizarSinDeshacer(cambio) {
      if (previo) previo = cambio(previo);
      aplicar(cambio(estado.datos), estado.deshacer);
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
