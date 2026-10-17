import { describe, expect, it, vi } from 'vitest';
import { storageFalso } from '../test/storage-falso.ts';
import { abrirAlmacen, CLAVE, CLAVE_COPIA_IMPORTACION } from './almacen.ts';
import { agregarMateria, borrarEntrega, marcarAvisadas } from './datos.ts';
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

  it('marcar avisos no toca el Deshacer pendiente, y deshacer conserva esas marcas', () => {
    const base = storageFalso();
    base.setItem(
      CLAVE,
      JSON.stringify({
        materias: [{ id: 'm1', nombre: 'Física', color: 'orquidea', clase: '', moodle: '', classroom: '' }],
        entregas: [
          { id: 'e1', materia: 'm1', texto: 'Taller', fecha: '2026-10-20T20:00:00-05:00', hecha: false, avisada: false },
          { id: 'e2', materia: 'm1', texto: 'Quiz', fecha: '2026-10-21T20:00:00-05:00', hecha: false, avisada: false },
        ],
        drive: [],
      }),
    );
    const store = crearStore(abrirAlmacen(base));

    store.actualizar((datos) => borrarEntrega(datos, 'e1'), 'Entrega borrada');
    store.actualizarSinDeshacer((datos) => marcarAvisadas(datos, ['e2']));

    expect(store.obtener().deshacer).toBe('Entrega borrada');
    expect(store.obtener().datos.entregas.map((e) => [e.id, e.avisada])).toEqual([['e2', true]]);

    store.deshacer();
    expect(store.obtener().deshacer).toBeNull();
    expect(store.obtener().datos.entregas.map((e) => [e.id, e.avisada])).toEqual([
      ['e1', false],
      ['e2', true],
    ]);
  });

  it('sin Deshacer pendiente, un cambio interno no crea uno', () => {
    const store = crearStore(abrirAlmacen(storageFalso()));
    store.actualizarSinDeshacer((datos) => agregarMateria(datos, 'Física'));
    expect(store.obtener().deshacer).toBeNull();
    store.deshacer();
    expect(store.obtener().datos.materias.at(-1)?.nombre).toBe('Física');
  });

  it('importar copia lo guardado, reemplaza los datos y se puede deshacer', () => {
    const storage = storageFalso();
    const store = crearStore(abrirAlmacen(storage));
    store.actualizar((datos) => agregarMateria(datos, 'Física'));
    const guardadoAntes = storage.valores.get(CLAVE);
    const antes = store.obtener().datos;
    const nuevos = { materias: [], entregas: [], drive: [] };

    expect(store.importar(nuevos, 'Datos importados')).toBe(true);
    expect(storage.valores.get(CLAVE_COPIA_IMPORTACION)).toBe(guardadoAntes);
    expect(store.obtener()).toMatchObject({ datos: nuevos, deshacer: 'Datos importados' });
    expect(JSON.parse(storage.valores.get(CLAVE)!)).toEqual(nuevos);

    store.deshacer();
    expect(store.obtener().datos).toBe(antes);
  });

  it('si la copia falla, importar no cambia nada', () => {
    const base = storageFalso();
    const store = crearStore(
      abrirAlmacen({
        ...base,
        setItem: (clave: string, valor: string) => {
          if (clave === CLAVE_COPIA_IMPORTACION) throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
          base.setItem(clave, valor);
        },
      }),
    );
    store.actualizar((datos) => agregarMateria(datos, 'Física'), 'Algo deshacible');
    const antes = store.obtener();
    const guardadoAntes = base.valores.get(CLAVE);
    const oyente = vi.fn();
    store.suscribir(oyente);

    expect(store.importar({ materias: [], entregas: [], drive: [] }, 'Datos importados')).toBe(false);
    expect(store.obtener()).toBe(antes);
    expect(base.valores.get(CLAVE)).toBe(guardadoAntes);
    expect(oyente).not.toHaveBeenCalled();
  });
});
