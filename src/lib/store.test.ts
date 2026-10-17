import { describe, expect, it, vi } from 'vitest';
import { storageFalso } from '../test/storage-falso.ts';
import { abrirAlmacen, CLAVE } from './almacen.ts';
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
});
