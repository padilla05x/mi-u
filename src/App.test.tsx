// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { abrirAlmacen, CLAVE, CLAVE_COPIA_IMPORTACION, type AlmacenWeb } from './lib/almacen.ts';
import { crearStore } from './lib/store.ts';
import type { Bloque, Datos, Entrega, Materia, SeccionEnlace } from './lib/tipos.ts';
import { storageFalso } from './test/storage-falso.ts';

// Miércoles 14 de octubre de 2026, 9:00 a. m. en Bogotá.
const AHORA = new Date('2026-10-14T09:00:00-05:00');

const materia = (
  id: string,
  nombre: string,
  extra: Partial<Pick<Materia, 'clase' | 'moodle' | 'classroom' | 'ocultaEn'>> = {},
): Materia => ({
  id,
  nombre,
  color: 'orquidea',
  clase: '',
  moodle: '',
  classroom: '',
  ocultaEn: [],
  ...extra,
});

const entrega = (id: string, materiaId: string, texto: string, fecha: string): Entrega => ({
  id,
  materia: materiaId,
  texto,
  fecha,
  hecha: false,
  avisada: false,
});

/** Datos guardados para una prueba; sin horario, va vacío. */
type DatosDePrueba = Omit<Datos, 'horario'> & Partial<Pick<Datos, 'horario'>>;

function montar(datos?: DatosDePrueba, storage: AlmacenWeb = storageFalso()) {
  if (datos) storage.setItem(CLAVE, JSON.stringify({ horario: [], ...datos }));
  const usuario = userEvent.setup();
  const vista = render(<App store={crearStore(abrirAlmacen(storage))} />);
  return { usuario, vista, guardado: (): Datos => JSON.parse(storage.getItem(CLAVE)!) };
}

const seccion = (titulo: string) => screen.getByRole('region', { name: titulo });
const filas = (region: HTMLElement) => within(region).queryAllByRole('listitem');
/** Filas de la lista de entregas (sin las de la vista semanal); vacía si no hay lista. */
const filasEntregas = () => {
  const lista = screen.queryByRole('list', { name: 'Lista de entregas' });
  return lista ? within(lista).getAllByRole('listitem') : [];
};

beforeEach(() => {
  vi.useFakeTimers({ now: AHORA, toFake: ['Date'] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Entregas', () => {
  it('agrega una entrega con materia, descripción y fecha, y la borra', async () => {
    const { usuario, guardado } = montar();
    const entregas = seccion('Entregas');

    await usuario.selectOptions(within(entregas).getByLabelText('Materia'), 'Ingeniería de Software');
    await usuario.type(within(entregas).getByLabelText('Descripción'), 'Taller 3');
    fireEvent.change(within(entregas).getByLabelText('Fecha límite'), { target: { value: '2026-10-14T23:59' } });
    await usuario.click(within(entregas).getByRole('button', { name: 'Agregar' }));

    const [fila] = filasEntregas();
    expect(fila).toHaveTextContent('Taller 3');
    expect(fila).toHaveTextContent('Ingeniería de Software · mié, 14 de oct, 11:59 p. m.');
    expect(fila).toHaveTextContent('Para hoy');
    expect(guardado().entregas).toMatchObject([{ texto: 'Taller 3', fecha: '2026-10-14T23:59:00-05:00', hecha: false }]);
    expect(within(entregas).getByLabelText('Descripción')).toHaveValue('');

    await usuario.click(within(fila).getByRole('button', { name: 'Borrar Taller 3' }));

    expect(filasEntregas()).toHaveLength(0);
    expect(within(entregas).getByText('Todavía no tienes entregas')).toBeInTheDocument();
    expect(guardado().entregas).toEqual([]);
  });

  it('sin descripción o fecha muestra un error bajo el formulario y no agrega nada', async () => {
    const storage = storageFalso();
    const { usuario } = montar(undefined, storage);
    const entregas = seccion('Entregas');
    const agregar = within(entregas).getByRole('button', { name: 'Agregar' });

    await usuario.click(agregar);
    const error = within(entregas).getByRole('alert');
    expect(error).toHaveTextContent('Completa materia, descripción y fecha.');

    // Al reenviar sin corregir, el mensaje se crea de nuevo para que el lector de pantalla lo repita.
    await usuario.click(agregar);
    expect(within(entregas).getByRole('alert')).not.toBe(error);

    await usuario.type(within(entregas).getByLabelText('Descripción'), 'Taller 3');
    expect(within(entregas).queryByRole('alert')).not.toBeInTheDocument();
    await usuario.click(agregar);
    expect(within(entregas).getByRole('alert')).toHaveTextContent('Completa materia, descripción y fecha.');
    expect(filasEntregas()).toHaveLength(0);
    expect(storage.valores.has(CLAVE)).toBe(false);

    fireEvent.change(within(entregas).getByLabelText('Fecha límite'), { target: { value: '2026-10-20T20:00' } });
    expect(within(entregas).queryByRole('alert')).not.toBeInTheDocument();
    await usuario.click(agregar);
    expect(filasEntregas()).toHaveLength(1);
  });

  it('marcarla como hecha la deja "Entregada" y la pasa al final', async () => {
    const { usuario, guardado } = montar({
      materias: [materia('m1', 'Ingeniería de Software')],
      entregas: [
        entrega('e1', 'm1', 'Quiz', '2026-10-15T07:00:00-05:00'),
        entrega('e2', 'm1', 'Informe', '2026-10-17T20:00:00-05:00'),
      ],
      drive: [],
    });
    const entregas = seccion('Entregas');
    expect(filasEntregas()[0]).toHaveTextContent('Quiz');
    expect(filasEntregas()[0]).toHaveTextContent('Mañana');
    expect(filasEntregas()[1]).toHaveTextContent('en 3 días');

    await usuario.click(within(entregas).getByRole('checkbox', { name: 'Quiz' }));

    const [primera, segunda] = filasEntregas();
    expect(primera).toHaveTextContent('Informe');
    expect(segunda).toHaveTextContent('Quiz');
    expect(segunda).toHaveTextContent('Entregada');
    expect(within(segunda).getByRole('checkbox')).toBeChecked();
    expect(guardado().entregas.find((e) => e.id === 'e1')?.hecha).toBe(true);
  });
});

describe('Mis materias', () => {
  it('agrega una materia y aparece en todas las secciones', async () => {
    const { usuario, guardado } = montar();
    const materias = seccion('Mis materias');

    await usuario.type(within(materias).getByLabelText('Nueva materia'), '  Cálculo Integral ');
    await usuario.click(within(materias).getByRole('button', { name: 'Agregar' }));

    expect(within(materias).getByText('Cálculo Integral')).toBeInTheDocument();
    for (const titulo of ['Clases virtuales', 'Aula virtual (Moodle)', 'Classroom']) {
      expect(within(seccion(titulo)).getByLabelText('Enlace de Cálculo Integral')).toBeInTheDocument();
    }
    expect(within(seccion('Entregas')).getByRole('option', { name: 'Cálculo Integral' })).toBeInTheDocument();
    expect(guardado().materias.at(-1)).toMatchObject({ nombre: 'Cálculo Integral', clase: '', moodle: '', classroom: '' });
  });

  it('quitar una materia pide confirmación en un diálogo y borra también sus enlaces y entregas', async () => {
    const { usuario, guardado } = montar({
      materias: [materia('m1', 'Ingeniería de Software', { clase: 'meet.google.com/abc' }), materia('m2', 'Estructura de Datos')],
      entregas: [
        entrega('e1', 'm1', 'Taller 3', '2026-10-20T20:00:00-05:00'),
        entrega('e2', 'm2', 'Parcial', '2026-10-21T08:00:00-05:00'),
      ],
      drive: [],
    });

    await usuario.click(within(seccion('Mis materias')).getByRole('button', { name: 'Quitar Ingeniería de Software' }));

    const dialogo = screen.getByRole('dialog', { name: '¿Quitar "Ingeniería de Software"?' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription('También se borran sus enlaces y entregas. Después podrás deshacerlo.');
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(guardado().materias).toHaveLength(2);

    await usuario.click(within(dialogo).getByRole('button', { name: 'Quitar materia' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Ingeniería de Software')).not.toBeInTheDocument();
    expect(within(seccion('Clases virtuales')).queryByLabelText('Enlace de Ingeniería de Software')).not.toBeInTheDocument();
    expect(filasEntregas().map((f) => within(f).getByRole('checkbox').getAttribute('aria-label'))).toEqual([
      'Parcial',
    ]);
    expect(guardado()).toMatchObject({ materias: [{ id: 'm2' }], entregas: [{ id: 'e2' }] });
    // Su botón ya no existe: el foco pasa a "Deshacer", que la devuelve.
    expect(screen.getByRole('status')).toHaveTextContent('Materia quitada');
    expect(screen.getByRole('button', { name: 'Deshacer' })).toHaveFocus();
  });

  it('Cancelar cierra el diálogo sin quitar nada y devuelve el foco al botón que lo abrió', async () => {
    const storage = storageFalso();
    const { usuario } = montar(undefined, storage);
    const quitar = within(seccion('Mis materias')).getByRole('button', { name: 'Quitar Ingeniería de Software' });

    await usuario.click(quitar);
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(seccion('Mis materias')).getByText('Ingeniería de Software')).toBeInTheDocument();
    expect(storage.valores.has(CLAVE)).toBe(false);
    expect(quitar).toHaveFocus();
  });

  it('con teclado: el foco no sale del diálogo, los atajos no actúan y Esc lo cierra sin quitar nada', async () => {
    const storage = storageFalso();
    const { usuario, vista } = montar(undefined, storage);
    const quitar = within(seccion('Mis materias')).getByRole('button', { name: 'Quitar Ingeniería de Software' });
    quitar.focus();
    await usuario.keyboard('{Enter}');

    const dialogo = screen.getByRole('dialog');
    const cancelar = within(dialogo).getByRole('button', { name: 'Cancelar' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Quitar materia' });
    expect(cancelar).toHaveFocus();
    expect(vista.container).toHaveAttribute('inert'); // El resto de la página no se puede usar.

    await usuario.tab();
    expect(confirmar).toHaveFocus();
    await usuario.tab();
    expect(cancelar).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(confirmar).toHaveFocus();
    await usuario.keyboard('n');
    expect(confirmar).toHaveFocus();

    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(vista.container).not.toHaveAttribute('inert');
    expect(quitar).toHaveFocus();
    expect(within(seccion('Mis materias')).getByText('Ingeniería de Software')).toBeInTheDocument();
    expect(storage.valores.has(CLAVE)).toBe(false);
  });
});

describe('Enlaces por materia', () => {
  it('guarda el enlace al salir del campo, habilita Abrir y lo abre con https://', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    const { usuario, guardado } = montar();
    const clases = seccion('Clases virtuales');
    const boton = within(clases).getByRole('button', { name: 'Abrir Ingeniería de Software' });
    expect(boton).toBeDisabled();

    await usuario.type(within(clases).getByLabelText('Enlace de Ingeniería de Software'), '  meet.google.com/abc-defg-hij ');
    expect(boton).toBeDisabled(); // Como en mi-u.html, se guarda al confirmar el campo, no en cada tecla.
    await usuario.tab();

    expect(boton).toBeEnabled();
    expect(within(clases).getByLabelText('Enlace de Ingeniería de Software')).toHaveValue('meet.google.com/abc-defg-hij');
    expect(guardado().materias.find((m) => m.nombre === 'Ingeniería de Software')?.clase).toBe('meet.google.com/abc-defg-hij');

    await usuario.click(boton);
    expect(abrir).toHaveBeenCalledWith('https://meet.google.com/abc-defg-hij', '_blank', 'noopener');
  });

  it('Enter también guarda, y cada sección guarda su propio enlace', async () => {
    const { usuario, guardado } = montar();

    await usuario.type(
      within(seccion('Aula virtual (Moodle)')).getByLabelText('Enlace de Estructura de Datos'),
      'https://moodle.u.edu.co/course/7{Enter}',
    );

    expect(within(seccion('Aula virtual (Moodle)')).getByRole('button', { name: 'Abrir Estructura de Datos' })).toBeEnabled();
    expect(within(seccion('Classroom')).getByRole('button', { name: 'Abrir Estructura de Datos' })).toBeDisabled();
    expect(guardado().materias.find((m) => m.nombre === 'Estructura de Datos')).toMatchObject({
      clase: '',
      moodle: 'https://moodle.u.edu.co/course/7',
      classroom: '',
    });
  });
});

const SECCIONES_ENLACE: { titulo: string; campo: SeccionEnlace }[] = [
  { titulo: 'Clases virtuales', campo: 'clase' },
  { titulo: 'Aula virtual (Moodle)', campo: 'moodle' },
  { titulo: 'Classroom', campo: 'classroom' },
];
const ENLACES_FISICA: Record<SeccionEnlace, string> = {
  clase: 'meet.google.com/fis',
  moodle: 'moodle.u.edu.co/fis',
  classroom: 'classroom.google.com/fis',
};
const AYUDA_EDICION = 'Quita una materia de esta sección. Su enlace se borra, pero la materia sigue en las demás.';
const TODAS_OCULTAS = 'Todas las materias están ocultas en esta sección. Usa Editar para mostrarlas de nuevo.';

describe.each(SECCIONES_ENLACE)('Modo edición en $titulo', ({ titulo, campo }) => {
  const otras = SECCIONES_ENLACE.filter((s) => s.campo !== campo);
  const montarConEnlaces = () =>
    montar({
      materias: [materia('m1', 'Física', ENLACES_FISICA), materia('m2', 'Química')],
      entregas: [entrega('e1', 'm1', 'Taller de Física', '2026-10-20T20:00:00-05:00')],
      drive: [],
    });
  const abrirDialogoQuitar = async (usuario: ReturnType<typeof userEvent.setup>, tarjeta: HTMLElement) => {
    await usuario.click(within(tarjeta).getByRole('button', { name: 'Editar' }));
    await usuario.click(within(tarjeta).getByRole('button', { name: `Quitar Física de ${titulo}` }));
    return screen.getByRole('dialog', { name: `¿Quitar Física de ${titulo}?` });
  };

  it('entra y sale de edición: el botón pasa de "Editar" a "Listo" y la ayuda describe la tarjeta', async () => {
    const { usuario, guardado } = montarConEnlaces();
    const tarjeta = seccion(titulo);
    expect(within(tarjeta).queryByRole('button', { name: /^Quitar / })).not.toBeInTheDocument();
    expect(tarjeta).not.toHaveAccessibleDescription();

    await usuario.click(within(tarjeta).getByRole('button', { name: 'Editar' }));

    const listo = within(tarjeta).getByRole('button', { name: 'Listo' });
    expect(within(tarjeta).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(tarjeta).toHaveAccessibleDescription(AYUDA_EDICION);
    for (const otra of otras) expect(within(seccion(otra.titulo)).getByRole('button', { name: 'Editar' })).toBeInTheDocument();

    // Tab recorre cada fila en orden: campo, Abrir (si hay enlace) y Quitar.
    within(tarjeta).getByLabelText('Enlace de Física').focus();
    await usuario.tab();
    expect(within(tarjeta).getByRole('button', { name: 'Abrir Física' })).toHaveFocus();
    await usuario.tab();
    expect(within(tarjeta).getByRole('button', { name: `Quitar Física de ${titulo}` })).toHaveFocus();
    await usuario.tab();
    expect(within(tarjeta).getByLabelText('Enlace de Química')).toHaveFocus();

    // El campo de enlace funciona igual que en modo normal.
    await usuario.type(within(tarjeta).getByLabelText('Enlace de Química'), 'u.edu.co/qui{Enter}');
    expect(guardado().materias[1][campo]).toBe('u.edu.co/qui');

    await usuario.click(listo);
    expect(within(tarjeta).getByRole('button', { name: 'Editar' })).toHaveFocus();
    expect(within(tarjeta).queryByRole('button', { name: /^Quitar / })).not.toBeInTheDocument();
    expect(tarjeta).not.toHaveAccessibleDescription();
  });

  it('quitar pide confirmación; Cancelar y Esc no cambian nada y devuelven el foco al botón', async () => {
    const { usuario, guardado } = montarConEnlaces();
    const antes = guardado();
    const tarjeta = seccion(titulo);

    const dialogo = await abrirDialogoQuitar(usuario, tarjeta);
    const quitar = within(tarjeta).getByRole('button', { name: `Quitar Física de ${titulo}` });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription(
      'Se borrará su enlace en esta sección. La materia y sus enlaces en las demás secciones no cambian.',
    );
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Quitar' })).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(quitar).toHaveFocus();

    await usuario.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(quitar).toHaveFocus();

    expect(within(tarjeta).getByLabelText('Enlace de Física')).toHaveValue(ENLACES_FISICA[campo]);
    expect(guardado()).toEqual(antes);
  });

  it('confirmar borra el enlace y oculta la fila; la materia sigue en todo lo demás y "Mostrar" la devuelve vacía', async () => {
    const { usuario, guardado } = montarConEnlaces();
    const tarjeta = seccion(titulo);

    const dialogo = await abrirDialogoQuitar(usuario, tarjeta);
    await usuario.click(within(dialogo).getByRole('button', { name: 'Quitar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(tarjeta).queryByLabelText('Enlace de Física')).not.toBeInTheDocument();
    expect(within(tarjeta).getByRole('button', { name: 'Listo' })).toHaveFocus(); // Su botón ya no existe.
    expect(guardado().materias[0]).toMatchObject({ [campo]: '', ocultaEn: [campo] });
    for (const otra of otras) {
      expect(within(seccion(otra.titulo)).getByLabelText('Enlace de Física')).toHaveValue(ENLACES_FISICA[otra.campo]);
      expect(guardado().materias[0][otra.campo]).toBe(ENLACES_FISICA[otra.campo]);
    }
    expect(within(seccion('Mis materias')).getByText('Física')).toBeInTheDocument();
    expect(within(seccion('Entregas')).getByRole('option', { name: 'Física' })).toBeInTheDocument();
    expect(filasEntregas()[0]).toHaveTextContent('Física');

    const ocultas = within(tarjeta).getByRole('list', { name: 'Ocultas aquí (1)' });
    expect(within(ocultas).getByRole('listitem')).toHaveTextContent('Física');
    await usuario.click(within(ocultas).getByRole('button', { name: `Mostrar Física en ${titulo}` }));

    // Vuelve en su lugar, con el campo vacío y enfocado para pegar el enlace de nuevo.
    const campoFisica = within(tarjeta).getByLabelText('Enlace de Física');
    expect(campoFisica).toHaveValue('');
    expect(campoFisica).toHaveFocus();
    expect(within(tarjeta).getAllByLabelText(/^Enlace de /).map((c) => c.getAttribute('aria-label'))).toEqual([
      'Enlace de Física',
      'Enlace de Química',
    ]);
    expect(within(tarjeta).queryByText(/Ocultas aquí/)).not.toBeInTheDocument();
    expect(guardado().materias[0]).toMatchObject({ [campo]: '', ocultaEn: [] });
  });

  it('al quitar la última visible, en modo normal avisa que todas están ocultas', async () => {
    const { usuario } = montar({
      materias: [materia('m1', 'Física'), materia('m2', 'Química', { ocultaEn: [campo] })],
      entregas: [],
      drive: [],
    });
    const tarjeta = seccion(titulo);
    expect(within(tarjeta).getAllByLabelText(/^Enlace de /)).toHaveLength(1);

    const dialogo = await abrirDialogoQuitar(usuario, tarjeta);
    expect(within(tarjeta).getByRole('list', { name: 'Ocultas aquí (1)' })).toHaveTextContent('Química');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Quitar' }));

    expect(within(tarjeta).queryAllByLabelText(/^Enlace de /)).toHaveLength(0);
    expect(within(tarjeta).getByRole('list', { name: 'Ocultas aquí (2)' })).toBeInTheDocument();
    expect(within(tarjeta).queryByText(TODAS_OCULTAS)).not.toBeInTheDocument();

    await usuario.click(within(tarjeta).getByRole('button', { name: 'Listo' }));

    expect(within(tarjeta).getByText(TODAS_OCULTAS)).toBeInTheDocument();
    expect(within(tarjeta).queryByRole('list')).not.toBeInTheDocument();
    for (const otra of otras) expect(within(seccion(otra.titulo)).queryByText(TODAS_OCULTAS)).not.toBeInTheDocument();
    expect(within(seccion('Mis materias')).getByText('Química')).toBeInTheDocument();
  });

  it('sin materias no muestra el botón Editar', () => {
    montar({ materias: [], entregas: [], drive: [] });
    expect(within(seccion(titulo)).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

describe('Drive', () => {
  it('agrega un enlace, lo abre y lo quita', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    const { usuario, guardado } = montar();
    const drive = seccion('Drive');

    await usuario.type(within(drive).getByLabelText('Nombre'), 'Carpeta de PETI');
    await usuario.type(within(drive).getByLabelText('Enlace'), 'drive.google.com/drive/folders/abc');
    await usuario.click(within(drive).getByRole('button', { name: 'Guardar' }));

    expect(filas(drive)).toHaveLength(1);
    expect(guardado().drive).toMatchObject([{ nombre: 'Carpeta de PETI', url: 'drive.google.com/drive/folders/abc' }]);

    await usuario.click(within(drive).getByRole('button', { name: 'Abrir Carpeta de PETI' }));
    expect(abrir).toHaveBeenCalledWith('https://drive.google.com/drive/folders/abc', '_blank', 'noopener');

    await usuario.click(within(drive).getByRole('button', { name: 'Quitar Carpeta de PETI' }));
    expect(filas(drive)).toHaveLength(0);
    expect(guardado().drive).toEqual([]);
  });

  it('sin nombre o enlace muestra un error bajo el formulario y no guarda nada', async () => {
    const storage = storageFalso();
    const { usuario } = montar(undefined, storage);
    const drive = seccion('Drive');
    const guardar = within(drive).getByRole('button', { name: 'Guardar' });

    await usuario.click(guardar);
    expect(within(drive).getByRole('alert')).toHaveTextContent('Escribe un nombre y un enlace.');

    await usuario.type(within(drive).getByLabelText('Nombre'), 'Carpeta de PETI');
    expect(within(drive).queryByRole('alert')).not.toBeInTheDocument();
    await usuario.type(within(drive).getByLabelText('Enlace'), '   ');
    await usuario.click(guardar);
    expect(within(drive).getByRole('alert')).toHaveTextContent('Escribe un nombre y un enlace.');
    expect(filas(drive)).toHaveLength(0);
    expect(storage.valores.has(CLAVE)).toBe(false);

    await usuario.type(within(drive).getByLabelText('Enlace'), 'drive.google.com');
    expect(within(drive).queryByRole('alert')).not.toBeInTheDocument();
    await usuario.click(guardar);
    expect(filas(drive)).toHaveLength(1);
  });
});

describe('Encabezado', () => {
  it('muestra la fecha de hoy en es-CO, con el día de Bogotá', () => {
    vi.setSystemTime(new Date('2026-10-14T20:00:00-05:00')); // En Tokio ya es el 15.
    montar();
    expect(screen.getByRole('banner')).toHaveTextContent('Miércoles, 14 de octubre de 2026');
  });
});

describe('Avisos del navegador', () => {
  function simularNotificaciones(permiso: NotificationPermission) {
    const creadas: { titulo: string; cuerpo?: string }[] = [];
    class NotificacionFalsa {
      static permission = permiso;
      static requestPermission = vi.fn(async () => {
        NotificacionFalsa.permission = 'granted';
        return NotificacionFalsa.permission;
      });
      constructor(titulo: string, opciones?: NotificationOptions) {
        creadas.push({ titulo, cuerpo: opciones?.body });
      }
    }
    vi.stubGlobal('Notification', NotificacionFalsa);
    return creadas;
  }

  it('el botón solo aparece con permiso "default" y desaparece al concederlo', async () => {
    simularNotificaciones('default');
    const { usuario } = montar();

    await usuario.click(screen.getByRole('button', { name: 'Activar avisos del navegador' }));

    expect(screen.queryByRole('button', { name: 'Activar avisos del navegador' })).not.toBeInTheDocument();
  });

  it('sin soporte de avisos, o con el permiso negado, no hay botón', () => {
    montar();
    expect(screen.queryByRole('button', { name: 'Activar avisos del navegador' })).not.toBeInTheDocument();
    cleanup();

    simularNotificaciones('denied');
    montar();
    expect(screen.queryByRole('button', { name: 'Activar avisos del navegador' })).not.toBeInTheDocument();
  });

  it('con permiso concedido avisa al abrir y cada 60 s, una sola vez por entrega', () => {
    vi.useRealTimers();
    vi.useFakeTimers({ now: AHORA, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const creadas = simularNotificaciones('granted');
    const storage = storageFalso();
    storage.setItem(
      CLAVE,
      JSON.stringify({
        materias: [materia('m1', 'Ingeniería de Software')],
        entregas: [
          entrega('e1', 'm1', 'Quiz', '2026-10-14T11:00:00-05:00'),
          entrega('e2', 'm1', 'Parcial', '2026-10-15T10:00:00-05:00'),
        ],
        drive: [],
      }),
    );
    const avisadas = () => (JSON.parse(storage.getItem(CLAVE)!) as Datos).entregas.map((e) => e.avisada);

    // StrictMode repite los efectos al montar: aun así, cada entrega se avisa una sola vez.
    render(
      <StrictMode>
        <App store={crearStore(abrirAlmacen(storage))} />
      </StrictMode>,
    );

    // Quiz vence en 2 h: se avisa al abrir.
    expect(creadas).toEqual([{ titulo: 'Entrega en menos de 24 h', cuerpo: 'Quiz · Ingeniería de Software' }]);
    expect(avisadas()).toEqual([true, false]);

    // Parcial vence en 25 h: entra en la ventana de 24 h en la revisión de las 10:00.
    act(() => vi.advanceTimersByTime(59 * 60_000));
    expect(creadas).toHaveLength(1);
    act(() => vi.advanceTimersByTime(60_000));
    expect(creadas.map((a) => a.cuerpo)).toEqual(['Quiz · Ingeniería de Software', 'Parcial · Ingeniería de Software']);
    expect(avisadas()).toEqual([true, true]);

    act(() => vi.advanceTimersByTime(10 * 60_000));
    expect(creadas).toHaveLength(2);
  });

  it('marcar entregas como avisadas no quita el Deshacer pendiente, y deshacer no repite el aviso', async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ now: AHORA, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const creadas = simularNotificaciones('granted');
    const { usuario, guardado } = montar({
      materias: [materia('m1', 'Física')],
      entregas: [
        entrega('e1', 'm1', 'Parcial', '2026-10-15T10:00:00-05:00'),
        entrega('e2', 'm1', 'Informe', '2026-10-20T20:00:00-05:00'),
      ],
      drive: [],
    });

    await usuario.click(screen.getByRole('button', { name: 'Borrar Informe' }));
    expect(screen.getByRole('status')).toHaveTextContent('Entrega borrada');

    // A las 10:00 el Parcial entra en la ventana de 24 h y la app lo marca como avisado.
    act(() => vi.advanceTimersByTime(60 * 60_000));
    expect(creadas.map((a) => a.cuerpo)).toEqual(['Parcial · Física']);
    expect(guardado().entregas).toMatchObject([{ id: 'e1', avisada: true }]);
    expect(screen.getByRole('status')).toHaveTextContent('Entrega borrada');

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));

    expect(filasEntregas().map((f) => within(f).getByRole('checkbox').getAttribute('aria-label'))).toEqual([
      'Parcial',
      'Informe',
    ]);
    expect(guardado().entregas.map((e) => e.avisada)).toEqual([true, false]);
    act(() => vi.advanceTimersByTime(60_000));
    expect(creadas).toHaveLength(1);
  });

  it('al desmontar no deja intervalos activos', () => {
    vi.useRealTimers();
    vi.useFakeTimers({ now: AHORA, toFake: ['Date', 'setInterval', 'clearInterval'] });
    simularNotificaciones('granted');
    const { vista } = montar();
    expect(vi.getTimerCount()).toBe(2); // El reloj de las etiquetas y la revisión de avisos.

    vista.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Avisos del almacén', () => {
  it('muestra un mensaje si localStorage está bloqueado', () => {
    render(<App store={crearStore(abrirAlmacen(null))} />);
    expect(screen.getByRole('alert')).toHaveTextContent('El navegador no deja guardar datos en este sitio.');
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
  });

  it('muestra un mensaje si localStorage se llena al guardar, y el cambio sigue en pantalla', async () => {
    const lleno = {
      ...storageFalso(),
      setItem: () => {
        throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
      },
    };
    const { usuario } = montar(undefined, lleno);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Nueva materia'), 'Cálculo Integral');
    await usuario.click(within(seccion('Mis materias')).getByRole('button', { name: 'Agregar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El almacenamiento del navegador está lleno');
    expect(within(seccion('Mis materias')).getByText('Cálculo Integral')).toBeInTheDocument();
  });
});

describe('Encabezado y contadores', () => {
  it('saluda según la hora de Bogotá', () => {
    vi.setSystemTime(new Date('2026-10-14T20:00:00-05:00')); // En Tokio ya son las 10:00 del 15.
    montar();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Buenas noches');
  });

  it('cuenta vencidas, para hoy y próximos 7 días, solo de entregas pendientes', () => {
    montar({
      materias: [materia('m1', 'Ingeniería de Software')],
      entregas: [
        entrega('e1', 'm1', 'Parcial', '2026-10-13T18:00:00-05:00'),
        entrega('e2', 'm1', 'Taller', '2026-10-14T23:59:00-05:00'),
        entrega('e3', 'm1', 'Quiz', '2026-10-15T07:00:00-05:00'),
        entrega('e4', 'm1', 'Informe', '2026-10-21T08:00:00-05:00'),
        entrega('e5', 'm1', 'Proyecto', '2026-10-22T08:00:00-05:00'),
        { ...entrega('e6', 'm1', 'Lectura', '2026-10-15T08:00:00-05:00'), hecha: true },
      ],
      drive: [],
    });
    const resumen = screen.getByRole('list', { name: 'Resumen de entregas' });
    expect(within(resumen).getAllByRole('listitem').map((c) => c.textContent)).toEqual([
      '1Vencidas',
      '1Para hoy',
      '2Próximos 7 días',
    ]);
  });
});

describe('Estados vacíos', () => {
  it('el botón de cada estado vacío lleva el foco al campo donde se empieza', async () => {
    const { usuario } = montar({ materias: [], entregas: [], drive: [] });

    await usuario.click(within(seccion('Entregas')).getByRole('button', { name: 'Agregar entrega' }));
    expect(screen.getByLabelText('Descripción')).toHaveFocus();

    await usuario.click(within(seccion('Drive')).getByRole('button', { name: 'Agregar enlace' }));
    expect(screen.getByLabelText('Nombre')).toHaveFocus();

    await usuario.click(within(seccion('Mis materias')).getByRole('button', { name: 'Agregar materia' }));
    expect(screen.getByLabelText('Nueva materia')).toHaveFocus();

    for (const titulo of ['Clases virtuales', 'Aula virtual (Moodle)', 'Classroom']) {
      screen.getByLabelText('Descripción').focus();
      await usuario.click(within(seccion(titulo)).getByRole('button', { name: 'Ir a Mis materias' }));
      expect(screen.getByLabelText('Nueva materia')).toHaveFocus();
    }
  });
});

// Una entrega por estado el miércoles 14 de octubre a las 9:00: vencida, para hoy, mañana, en N días y entregada.
const cincoEstados = (): DatosDePrueba => ({
  materias: [materia('m1', 'Ingeniería de Software'), materia('m2', 'Programación Concurrente')],
  entregas: [
    entrega('e1', 'm1', 'Parcial 1', '2026-10-13T18:00:00-05:00'),
    entrega('e2', 'm2', 'Taller de sockets', '2026-10-14T23:59:00-05:00'),
    entrega('e3', 'm1', 'Diseño de la base de datos', '2026-10-15T07:00:00-05:00'),
    entrega('e4', 'm2', 'Informe final', '2026-10-20T20:00:00-05:00'),
    { ...entrega('e5', 'm1', 'Lectura', '2026-10-10T08:00:00-05:00'), hecha: true },
  ],
  drive: [],
});
const titulos = () => filasEntregas().map((f) => within(f).getByRole('checkbox').getAttribute('aria-label'));
const grupoFiltros = () => screen.getByRole('group', { name: 'Filtrar por estado' });
const botonesFiltro = () => within(grupoFiltros()).getAllByRole('button').map((b) => b.textContent);

describe('Filtro y búsqueda', () => {
  it('filtra por estado con un grupo de botones que indica cuál está activo', async () => {
    const { usuario } = montar(cincoEstados());
    const boton = (nombre: string) => within(grupoFiltros()).getByRole('button', { name: nombre });
    expect(botonesFiltro()).toEqual(['Todas 5', 'Pendientes 3', 'Vencidas 1', 'Entregadas 1']);
    expect(boton('Todas 5')).toHaveAttribute('aria-pressed', 'true');

    await usuario.click(boton('Vencidas 1'));
    expect(boton('Vencidas 1')).toHaveAttribute('aria-pressed', 'true');
    expect(boton('Todas 5')).toHaveAttribute('aria-pressed', 'false');
    expect(titulos()).toEqual(['Parcial 1']);

    await usuario.click(boton('Pendientes 3'));
    expect(titulos()).toEqual(['Taller de sockets', 'Diseño de la base de datos', 'Informe final']);

    await usuario.click(boton('Entregadas 1'));
    expect(titulos()).toEqual(['Lectura']);
  });

  it('busca por descripción o materia sin distinguir mayúsculas ni tildes, combinado con el filtro', async () => {
    const { usuario } = montar(cincoEstados());
    const buscar = screen.getByLabelText('Buscar entregas');

    await usuario.type(buscar, 'INGENIERIA');
    expect(titulos()).toEqual(['Parcial 1', 'Diseño de la base de datos', 'Lectura']);
    expect(botonesFiltro()).toEqual(['Todas 3', 'Pendientes 1', 'Vencidas 1', 'Entregadas 1']);

    await usuario.click(within(grupoFiltros()).getByRole('button', { name: 'Pendientes 1' }));
    expect(titulos()).toEqual(['Diseño de la base de datos']);

    await usuario.clear(buscar);
    await usuario.type(buscar, 'diseno');
    expect(titulos()).toEqual(['Diseño de la base de datos']);
  });

  it('sin resultados muestra el estado vacío y "Limpiar búsqueda" deja la lista como estaba', async () => {
    const { usuario } = montar(cincoEstados());
    const buscar = screen.getByLabelText('Buscar entregas');

    await usuario.type(buscar, 'zzz');
    expect(screen.getByText('Ninguna entrega coincide con la búsqueda')).toBeInTheDocument();
    expect(filasEntregas()).toHaveLength(0);

    await usuario.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(buscar).toHaveValue('');
    expect(buscar).toHaveFocus();
    expect(filasEntregas()).toHaveLength(5);
  });

  it('si un filtro queda vacío, "Ver todas" vuelve a mostrarlas', async () => {
    const datos = cincoEstados();
    const { usuario } = montar({ ...datos, entregas: datos.entregas.filter((e) => e.id !== 'e1') });

    await usuario.click(within(grupoFiltros()).getByRole('button', { name: 'Vencidas 0' }));
    expect(screen.getByText('No hay entregas vencidas')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Ver todas' }));
    expect(within(grupoFiltros()).getByRole('button', { name: 'Todas 4' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(grupoFiltros()).getByRole('button', { name: 'Todas 4' })).toHaveFocus();
    expect(filasEntregas()).toHaveLength(4);
  });
});

describe('Vista semanal', () => {
  const semana = () => screen.getByRole('region', { name: /^Semana del/ });
  const botonSemana = (nombre: string) => within(semana()).getByRole('button', { name: nombre });

  it('muestra la semana de Bogotá con hoy resaltado, las entregas hechas y navega entre semanas', async () => {
    const { usuario } = montar(cincoEstados());
    expect(semana()).toHaveAccessibleName('Semana del 12 al 18 de octubre de 2026');
    const hoy = semana().querySelector('[aria-current="date"]');
    expect(hoy).toHaveTextContent('Mié 14');
    expect(hoy).toHaveTextContent('Hoy');
    expect(hoy).toHaveTextContent('Taller de sockets');
    expect(hoy).toHaveTextContent('Programación Concurrente');
    expect(hoy).toHaveTextContent('Para hoy');
    expect(botonSemana('Esta semana')).toBeDisabled();

    await usuario.click(botonSemana('Semana siguiente'));
    expect(semana()).toHaveAccessibleName('Semana del 19 al 25 de octubre de 2026');
    expect(semana()).toHaveTextContent('Informe final');
    expect(semana().querySelector('[aria-current="date"]')).toBeNull();

    await usuario.click(botonSemana('Esta semana'));
    expect(semana()).toHaveAccessibleName('Semana del 12 al 18 de octubre de 2026');

    await usuario.click(botonSemana('Semana anterior'));
    expect(semana()).toHaveAccessibleName('Semana del 5 al 11 de octubre de 2026');
    expect(semana()).toHaveTextContent('Lectura');
    expect(semana()).toHaveTextContent('Entregada');
  });

  it('no la afectan el filtro ni la búsqueda de la lista, y lo dice', async () => {
    const { usuario } = montar(cincoEstados());
    expect(semana()).toHaveTextContent('el filtro y la búsqueda solo cambian la lista de abajo');
    await usuario.click(within(grupoFiltros()).getByRole('button', { name: 'Entregadas 1' }));
    await usuario.type(screen.getByLabelText('Buscar entregas'), 'zzz');
    expect(semana()).toHaveTextContent('Taller de sockets');
    expect(semana()).toHaveTextContent('Parcial 1');
  });
});

describe('Deshacer y respaldo', () => {
  it('quitar un enlace de Drive se puede deshacer', async () => {
    const { usuario } = montar({
      materias: [],
      entregas: [],
      drive: [{ id: 'd1', nombre: 'Carpeta de PETI', url: 'https://drive.google.com' }],
    });

    await usuario.click(screen.getByRole('button', { name: 'Quitar Carpeta de PETI' }));
    expect(screen.queryByText('Carpeta de PETI')).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(screen.getByText('Carpeta de PETI')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('un cambio de la persona sí quita el Deshacer pendiente', async () => {
    const { usuario } = montar({
      materias: [materia('m1', 'Física')],
      entregas: [
        entrega('e1', 'm1', 'Parcial', '2026-10-15T10:00:00-05:00'),
        entrega('e2', 'm1', 'Informe', '2026-10-20T20:00:00-05:00'),
      ],
      drive: [],
    });

    await usuario.click(screen.getByRole('button', { name: 'Borrar Informe' }));
    expect(screen.getByRole('status')).toHaveTextContent('Entrega borrada');
    await usuario.click(screen.getByRole('checkbox', { name: 'Parcial' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  const archivoJson = (texto: string, nombre = 'mi-u.json') => new File([texto], nombre, { type: 'application/json' });
  const respaldoQuimica = JSON.stringify({ version: 1, materias: [materia('m9', 'Química')], entregas: [], drive: [] });
  const subir = (usuario: ReturnType<typeof userEvent.setup>, archivo: File) =>
    usuario.upload(screen.getByLabelText('Archivo de respaldo'), archivo);

  it('importar pide confirmación; al confirmar guarda la copia, reemplaza los datos y se puede deshacer', async () => {
    const storage = storageFalso();
    const { usuario, guardado } = montar({ materias: [materia('m1', 'Física')], entregas: [], drive: [] }, storage);
    const guardadoAntes = storage.getItem(CLAVE);

    await subir(usuario, archivoJson(respaldoQuimica, 'respaldo.json'));

    const dialogo = await screen.findByRole('dialog', { name: '¿Importar "respaldo.json"?' });
    expect(dialogo).toHaveAccessibleDescription('Importar reemplazará tus datos actuales. Antes se guardará una copia de respaldo.');
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    const importar = within(dialogo).getByRole('button', { name: 'Importar' });
    expect(importar).toHaveClass('bg-acento'); // Botón principal, no de peligro.
    expect(importar).not.toHaveClass('bg-peligro-suave');
    expect(guardado().materias.map((m) => m.nombre)).toEqual(['Física']);

    await usuario.click(importar);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(seccion('Mis materias')).getByText('Química')).toBeInTheDocument();
    expect(guardado().materias.map((m) => m.nombre)).toEqual(['Química']);
    expect(storage.getItem(CLAVE_COPIA_IMPORTACION)).toBe(guardadoAntes);
    expect(screen.getByRole('status')).toHaveTextContent('Datos importados');

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(within(seccion('Mis materias')).getByText('Física')).toBeInTheDocument();
    expect(within(seccion('Mis materias')).queryByText('Química')).not.toBeInTheDocument();
  });

  it('Cancelar la confirmación no cambia nada', async () => {
    const storage = storageFalso();
    const { usuario } = montar({ materias: [materia('m1', 'Física')], entregas: [], drive: [] }, storage);
    const antes = new Map(storage.valores);

    await subir(usuario, archivoJson(respaldoQuimica));
    await usuario.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(seccion('Mis materias')).getByText('Física')).toBeInTheDocument();
    expect(within(seccion('Mis materias')).queryByText('Química')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(storage.valores).toEqual(antes);
  });

  it('si no había datos guardados, importa sin crear la copia', async () => {
    const storage = storageFalso();
    const { usuario, guardado } = montar(undefined, storage);

    await subir(usuario, archivoJson(respaldoQuimica));
    await usuario.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Importar' }));

    expect(guardado().materias.map((m) => m.nombre)).toEqual(['Química']);
    expect(storage.valores.has(CLAVE_COPIA_IMPORTACION)).toBe(false);
  });

  it('si no se puede guardar la copia, no importa nada y lo dice en la tarjeta', async () => {
    const base = storageFalso();
    const storage: AlmacenWeb = {
      getItem: base.getItem,
      setItem: (clave, valor) => {
        if (clave === CLAVE_COPIA_IMPORTACION) throw new DOMException('Simulado en la prueba', 'QuotaExceededError');
        base.setItem(clave, valor);
      },
    };
    const { usuario } = montar({ materias: [materia('m1', 'Física')], entregas: [], drive: [] }, storage);
    const guardadoAntes = base.getItem(CLAVE);

    await subir(usuario, archivoJson(respaldoQuimica));
    await usuario.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Importar' }));

    expect(within(seccion('Respaldo')).getByRole('alert')).toHaveTextContent(
      'No se pudo guardar la copia de respaldo; no se importó nada.',
    );
    expect(within(seccion('Mis materias')).getByText('Física')).toBeInTheDocument();
    expect(base.getItem(CLAVE)).toBe(guardadoAntes);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('un archivo que no es un respaldo muestra el motivo en la tarjeta, sin pedir confirmación ni cambiar nada', async () => {
    const { usuario, guardado } = montar({ materias: [materia('m1', 'Física')], entregas: [], drive: [] });
    const respaldo = seccion('Respaldo');

    for (const [texto, motivo] of [
      ['{"notas": []}', 'Falta el campo "materias".'],
      ['{"materias": [', 'El archivo no es JSON válido.'],
      [respaldoQuimica.replace('"version":1', '"version":2'), 'Este respaldo es de una versión más nueva de Mi U.'],
    ]) {
      await subir(usuario, archivoJson(texto));
      expect(await within(respaldo).findByRole('alert')).toHaveTextContent(motivo);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
    expect(within(seccion('Mis materias')).getByText('Física')).toBeInTheDocument();
    expect(guardado().materias.map((m) => m.nombre)).toEqual(['Física']);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Al elegir un respaldo válido, el mensaje se va.
    await subir(usuario, archivoJson(respaldoQuimica));
    await screen.findByRole('dialog');
    expect(within(respaldo).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exportar descarga un JSON con la versión y la fecha de Bogotá, y su nombre lleva el día de Bogotá', async () => {
    vi.setSystemTime(new Date('2026-10-14T20:30:00-05:00')); // En Tokio ya es el 15.
    const { usuario } = montar({ materias: [materia('m1', 'Física')], entregas: [], drive: [] });
    const archivos: Blob[] = [];
    const nombres: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nombres.push(this.download);
    });
    // jsdom no implementa los enlaces a Blob.
    const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
    Object.assign(URL, {
      createObjectURL: (archivo: Blob) => {
        archivos.push(archivo);
        return 'blob:mi-u';
      },
      revokeObjectURL: () => {},
    });
    try {
      await usuario.click(screen.getByRole('button', { name: 'Exportar datos' }));
    } finally {
      Object.assign(URL, original);
    }

    expect(nombres).toEqual(['mi-u-2026-10-14.json']);
    expect(JSON.parse(await archivos[0].text())).toMatchObject({
      version: 1,
      fechaExportacion: '2026-10-14T20:30:00-05:00',
      materias: [{ id: 'm1', nombre: 'Física' }],
    });
  });
});

describe('Orden de materias y atajos', () => {
  it('sube una materia con su botón y se guarda', async () => {
    const { usuario, guardado } = montar({ materias: [materia('m1', 'Física'), materia('m2', 'Química')], entregas: [], drive: [] });

    await usuario.click(screen.getByRole('button', { name: 'Subir Química' }));
    expect(guardado().materias.map((m) => m.nombre)).toEqual(['Química', 'Física']);
    expect(screen.getByRole('button', { name: 'Subir Química' })).toBeDisabled();
  });

  it('"n" y "/" enfocan los campos, pero no mientras se escribe', async () => {
    const { usuario } = montar({
      materias: [materia('m1', 'Física')],
      entregas: [entrega('e1', 'm1', 'Taller', '2026-10-20T20:00:00-05:00')],
      drive: [],
    });

    await usuario.keyboard('n');
    expect(screen.getByLabelText('Descripción')).toHaveFocus();
    await usuario.keyboard('/');
    expect(screen.getByLabelText('Descripción')).toHaveValue('/');
    screen.getByLabelText('Descripción').blur();
    await usuario.keyboard('/');
    expect(screen.getByLabelText('Buscar entregas')).toHaveFocus();
  });
});

describe('Hoy y Horario', () => {
  // AHORA es miércoles (dia 2) a las 9:00 en Bogotá.
  const bloqueDe = (id: string, materiaId: string, dia: Bloque['dia'], inicio: string, fin: string): Bloque => ({ id, materiaId, dia, inicio, fin });
  const conHorario = (horario: Bloque[]) => ({
    materias: [materia('fis', 'Física', { clase: 'meet.google.com/fis' }), materia('qui', 'Química'), materia('cal', 'Cálculo')],
    entregas: [],
    drive: [],
    horario,
  });
  const semana = () =>
    conHorario([
      bloqueDe('b-qui', 'qui', 2, '14:00', '16:00'),
      bloqueDe('b-fis', 'fis', 2, '08:00', '10:00'),
      bloqueDe('b-cal', 'cal', 0, '10:00', '12:00'),
    ]);
  const clasesDeHoy = () => within(screen.getByRole('list', { name: 'Clases de hoy' })).getAllByRole('listitem');
  /** La fila del Horario que se anuncia con esa frase (su texto oculto), o null. */
  const filaDelHorario = (frase: string | RegExp) => within(seccion('Horario')).queryByText(frase)?.closest('li') ?? null;
  /** Lo que el lector de pantalla lee del contenido: sin lo que tiene aria-hidden ni los botones, que se anuncian por su nombre. */
  const textoLeido = (elemento: Element): string =>
    [...elemento.childNodes]
      .map((nodo) =>
        nodo.nodeType === Node.TEXT_NODE
          ? nodo.textContent
          : nodo instanceof Element && nodo.getAttribute('aria-hidden') !== 'true' && nodo.tagName !== 'BUTTON'
            ? textoLeido(nodo)
            : '',
      )
      .join('');
  const llenar = async (usuario: ReturnType<typeof userEvent.setup>, materiaNombre: string, dia: string, inicio: string, fin: string) => {
    const horario = seccion('Horario');
    await usuario.selectOptions(within(horario).getByLabelText('Materia'), materiaNombre);
    await usuario.selectOptions(within(horario).getByLabelText('Día'), dia);
    fireEvent.change(within(horario).getByLabelText('Inicio'), { target: { value: inicio } });
    fireEvent.change(within(horario).getByLabelText('Fin'), { target: { value: fin } });
    await usuario.click(within(horario).getByRole('button', { name: 'Agregar' }));
  };

  it('Hoy va justo después del encabezado y muestra las clases de hoy en orden de hora', () => {
    montar(semana());
    expect(screen.getAllByRole('region')[0]).toBe(seccion('Hoy'));
    expect(seccion('Hoy')).toHaveTextContent('Tus clases del miércoles, según tu horario.');
    const [primera, segunda, ...resto] = clasesDeHoy();
    expect(resto).toEqual([]);
    expect(primera).toHaveTextContent('08:00–10:00');
    expect(primera).toHaveTextContent('Física');
    expect(segunda).toHaveTextContent('14:00–16:00');
    expect(segunda).toHaveTextContent('Química');
    expect(seccion('Hoy')).not.toHaveTextContent('Cálculo'); // Es del lunes.
  });

  it('"Entrar" abre el enlace de clase virtual en otra pestaña, y sin enlace queda deshabilitado', () => {
    montar(semana());
    const [fisica, quimica] = clasesDeHoy();

    const entrar = within(fisica).getByRole('link', { name: 'Entrar a la clase de Física' });
    expect(entrar).toHaveTextContent('Entrar');
    expect(entrar).toHaveAttribute('href', 'https://meet.google.com/fis');
    expect(entrar).toHaveAttribute('target', '_blank');
    expect(entrar).toHaveAttribute('rel', 'noopener noreferrer');

    expect(within(quimica).queryByRole('link')).not.toBeInTheDocument();
    const sinEnlace = within(quimica).getByRole('button', { name: 'Sin enlace para Química' });
    expect(sinEnlace).toHaveTextContent('Sin enlace');
    expect(sinEnlace).toBeDisabled();
  });

  it('"En curso" marca la clase que está ocurriendo y se quita al llegar su hora de fin', () => {
    vi.useRealTimers();
    vi.useFakeTimers({ now: new Date('2026-10-14T09:59:00-05:00'), toFake: ['Date', 'setInterval', 'clearInterval'] });
    montar(semana());
    const [fisica, quimica] = clasesDeHoy();
    expect(within(fisica).getByText('En curso')).toBeInTheDocument();
    expect(within(fisica).getByText('En curso').querySelector('svg')).toBeInTheDocument();
    expect(within(quimica).queryByText('En curso')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000)); // 10:00: Física termina.
    expect(screen.queryByText('En curso')).not.toBeInTheDocument();
  });

  it('sin clases hoy muestra un estado vacío amable, y su botón lleva al formulario de Horario', async () => {
    const { usuario } = montar(conHorario([bloqueDe('b-cal', 'cal', 0, '10:00', '12:00')]));
    const hoy = seccion('Hoy');
    expect(within(hoy).getByText('Hoy no tienes clases')).toBeInTheDocument();
    expect(hoy).toHaveTextContent('Aprovecha el día libre. Tu semana completa está en Horario.');
    expect(screen.queryByRole('list', { name: 'Clases de hoy' })).not.toBeInTheDocument();

    await usuario.click(within(hoy).getByRole('button', { name: 'Ir a Horario' }));
    expect(within(seccion('Horario')).getByLabelText('Materia')).toHaveFocus();
  });

  it('sin horario lo invita a armarlo, y sin materias lleva primero a Mis materias', async () => {
    montar(conHorario([]));
    expect(seccion('Hoy')).toHaveTextContent('Agrega tu horario y aquí verás las clases de cada día, con su enlace para entrar.');
    expect(within(seccion('Horario')).getByText('Todavía no tienes horario')).toBeInTheDocument();
    cleanup();

    const { usuario } = montar({ materias: [], entregas: [], drive: [] });
    expect(within(seccion('Horario')).getByText('Primero agrega tus materias')).toBeInTheDocument();
    expect(within(seccion('Horario')).queryByLabelText('Materia')).not.toBeInTheDocument();
    await usuario.click(within(seccion('Hoy')).getByRole('button', { name: 'Ir a Mis materias' }));
    expect(screen.getByLabelText('Nueva materia')).toHaveFocus();
  });

  it('agrega bloques agrupados por día y ordenados por hora, guarda el id de la materia y los muestra en Hoy', async () => {
    const { usuario, guardado } = montar(conHorario([]));
    const horario = seccion('Horario');

    await llenar(usuario, 'Física', 'Miércoles', '08:00', '10:00');
    await llenar(usuario, 'Química', 'Lunes', '10:00', '12:00');
    await llenar(usuario, 'Física', 'Miércoles', '06:00', '07:00');

    // Un grupo por día con bloques, de lunes a domingo.
    const [lunes, miercoles, ...otros] = within(horario).getAllByRole('list');
    expect(otros).toEqual([]);
    expect(lunes).toBe(within(horario).getByRole('list', { name: 'Lunes' }));
    expect(miercoles).toBe(within(horario).getByRole('list', { name: 'Miércoles' }));
    expect(within(within(horario).getByRole('list', { name: 'Miércoles' })).getAllByRole('listitem').map(textoLeido)).toEqual([
      'Física, miércoles de 06:00 a 07:00',
      'Física, miércoles de 08:00 a 10:00',
    ]);
    expect(filaDelHorario('Química, lunes de 10:00 a 12:00')).toHaveTextContent('10:00–12:00');
    expect(guardado().horario).toEqual([
      { id: expect.any(String), materiaId: 'fis', dia: 2, inicio: '08:00', fin: '10:00' },
      { id: expect.any(String), materiaId: 'qui', dia: 0, inicio: '10:00', fin: '12:00' },
      { id: expect.any(String), materiaId: 'fis', dia: 2, inicio: '06:00', fin: '07:00' },
    ]);
    // Las horas se vacían; la materia y el día se quedan para la siguiente clase.
    expect(within(horario).getByLabelText('Inicio')).toHaveValue('');
    expect(within(horario).getByLabelText('Día')).toHaveDisplayValue('Miércoles');
    // Hoy es miércoles: las dos de Física aparecen arriba.
    expect(clasesDeHoy().map((li) => li.textContent)).toEqual([expect.stringContaining('06:00'), expect.stringContaining('08:00')]);
  });

  it('los errores de validarBloque salen en el mensaje de la tarjeta y no agregan nada', async () => {
    const { usuario, guardado } = montar(conHorario([bloqueDe('b-fis', 'fis', 2, '08:00', '10:00')]));
    const horario = seccion('Horario');
    const antes = guardado().horario;

    await usuario.click(within(horario).getByRole('button', { name: 'Agregar' }));
    expect(within(horario).getByRole('alert')).toHaveTextContent('Completa la hora de inicio y la de fin.');

    await llenar(usuario, 'Química', 'Miércoles', '10:00', '09:00');
    expect(within(horario).getByRole('alert')).toHaveTextContent('El bloque ("Química") debe terminar después de empezar: va de 10:00 a 09:00.');

    await llenar(usuario, 'Química', 'Miércoles', '09:00', '11:00');
    expect(within(horario).getByRole('alert')).toHaveTextContent(
      'El bloque ("Química") se solapa con otro del miércoles: "Física", de 08:00 a 10:00.',
    );
    expect(guardado().horario).toEqual(antes);

    // Al corregir un campo el mensaje se va; un bloque que solo se toca con otro sí se agrega.
    fireEvent.change(within(horario).getByLabelText('Inicio'), { target: { value: '10:00' } });
    expect(within(horario).queryByRole('alert')).not.toBeInTheDocument();
    await usuario.click(within(horario).getByRole('button', { name: 'Agregar' }));
    expect(filaDelHorario('Química, miércoles de 10:00 a 11:00')).toBeInTheDocument();
  });

  it('borrar un bloque se puede deshacer con "Bloque borrado"', async () => {
    const { usuario, guardado } = montar(semana());
    const horario = seccion('Horario');

    await usuario.click(within(horario).getByRole('button', { name: 'Borrar Física, miércoles de 08:00 a 10:00' }));

    expect(filaDelHorario('Física, miércoles de 08:00 a 10:00')).not.toBeInTheDocument();
    expect(guardado().horario.map((b) => b.id)).toEqual(['b-qui', 'b-cal']);
    expect(clasesDeHoy()).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Bloque borrado');

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(filaDelHorario('Física, miércoles de 08:00 a 10:00')).toBeInTheDocument();
    expect(clasesDeHoy()).toHaveLength(2);
  });

  it('quitar una materia borra sus bloques del horario y de Hoy, y deshacer los devuelve', async () => {
    const { usuario, guardado } = montar(semana());

    await usuario.click(within(seccion('Mis materias')).getByRole('button', { name: 'Quitar Física' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Quitar materia' }));

    expect(filaDelHorario(/^Física,/)).not.toBeInTheDocument();
    expect(clasesDeHoy().map((li) => li.textContent)).toEqual([expect.stringContaining('Química')]);
    expect(guardado().horario.map((b) => b.id)).toEqual(['b-qui', 'b-cal']);

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(filaDelHorario('Física, miércoles de 08:00 a 10:00')).toBeInTheDocument();
    expect(clasesDeHoy()).toHaveLength(2);
  });

  it('cada clase del Horario se anuncia con su frase, con texto oculto dentro de la fila y lo visible con aria-hidden', () => {
    montar(semana());
    const fila = filaDelHorario('Física, miércoles de 08:00 a 10:00');
    expect(fila?.tagName).toBe('LI');
    expect(fila).not.toHaveAttribute('aria-label');

    // La frase está en el contenido de la fila, oculta a la vista.
    const frase = within(fila!).getByText('Física, miércoles de 08:00 a 10:00');
    expect(frase).toHaveClass('sr-only');
    // Lo que se ve (hora, punto y nombre) no se lee, para no repetir la frase.
    expect(within(fila!).getByText('08:00–10:00')).toHaveAttribute('aria-hidden', 'true');
    expect(within(fila!).getByText('Física').closest('[aria-hidden="true"]')).not.toBeNull();
    // Del contenido, el lector solo oye la frase; el botón se anuncia por su propio nombre.
    expect(textoLeido(fila!)).toBe('Física, miércoles de 08:00 a 10:00');
    expect(within(fila!).getByRole('button')).toHaveAccessibleName('Borrar Física, miércoles de 08:00 a 10:00');
  });
});

describe('Tema', () => {
  const guardado = new Map<string, string>();
  beforeEach(() => {
    guardado.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => guardado.set(k, v),
      removeItem: (k: string) => guardado.delete(k),
    });
  });
  afterEach(() => {
    delete document.documentElement.dataset.tema;
  });

  it('fuerza el tema oscuro, lo recuerda y vuelve a seguir al sistema', async () => {
    const { usuario } = montar();
    const grupo = screen.getByRole('group', { name: 'Tema' });

    await usuario.click(within(grupo).getByRole('button', { name: 'Oscuro' }));
    expect(document.documentElement.dataset.tema).toBe('oscuro');
    expect(guardado.get('mi-u-tema')).toBe('oscuro');

    await usuario.click(within(grupo).getByRole('button', { name: 'Sistema' }));
    expect(document.documentElement.dataset.tema).toBeUndefined();
    expect(guardado.has('mi-u-tema')).toBe(false);
  });
});

