import { describe, expect, it, vi } from 'vitest';
import { storageFalso } from '../test/storage-falso.ts';
import { abrirAlmacen, CLAVE } from './almacen.ts';
import { agregarMateria } from './datos.ts';
import { crearStore } from './store.ts';

describe('crearStore', () => {
  it('guarda cada cambio enseguida y avisa a los suscriptores', () => {
    const storage = storageFalso();
    const store = crearStore(abrirAlmacen(storage));
    const oyente = vi.fn();
    store.suscribir(oyente);

    store.actualizar((datos) => agregarMateria(datos, 'Cálculo Integral'));

    expect(oyente).toHaveBeenCalledOnce();
    expect(store.obtener().datos.materias.at(-1)?.nombre).toBe('Cálculo Integral');
    expect(JSON.parse(storage.valores.get(CLAVE)!).materias.at(-1).nombre).toBe('Cálculo Integral');
  });

  it('mantiene el aviso de la carga y suma el del último guardado, sin repetirlos', () => {
    let lleno = false;
    const base = storageFalso({ [CLAVE]: '{roto' });
    const store = crearStore(
      abrirAlmacen({
        ...base,
        setItem: (clave: string, valor: string) => {
          if (lleno && clave === CLAVE) throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
          base.setItem(clave, valor);
        },
      }),
    );
    expect(store.obtener().avisos).toEqual([expect.stringContaining('dañados')]);

    lleno = true;
    store.actualizar((datos) => datos);
    expect(store.obtener().avisos).toEqual([expect.stringContaining('dañados'), expect.stringContaining('lleno')]);

    lleno = false;
    store.actualizar((datos) => datos);
    expect(store.obtener().avisos).toEqual([expect.stringContaining('dañados')]);

    const bloqueado = crearStore(abrirAlmacen(null));
    bloqueado.actualizar((datos) => datos);
    expect(bloqueado.obtener().avisos).toHaveLength(1);
  });

  it("deshace solo el último cambio deshacible y lo descarta ante cualquier otro cambio", () => {
    const store = crearStore(abrirAlmacen(storageFalso()));
    const antes = store.obtener().datos;

    store.actualizar((datos) => ({ ...datos, materias: [] }), "Materias borradas");
    expect(store.obtener().deshacer).toBe("Materias borradas");
    store.deshacer();
    expect(store.obtener().datos).toBe(antes);
    expect(store.obtener().deshacer).toBeNull();

    store.actualizar((datos) => ({ ...datos, materias: [] }), "Materias borradas");
    store.actualizar((datos) => agregarMateria(datos, "Física"));
    expect(store.obtener().deshacer).toBeNull();
    store.deshacer();
    expect(store.obtener().datos.materias.map((m) => m.nombre)).toEqual(["Física"]);
  });
});
