import { TriangleAlert, X } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import AulaMoodle from './components/AulaMoodle.tsx';
import ClasesVirtuales from './components/ClasesVirtuales.tsx';
import Classroom from './components/Classroom.tsx';
import Drive from './components/Drive.tsx';
import Encabezado from './components/Encabezado.tsx';
import Entregas from './components/Entregas.tsx';
import Materias from './components/Materias.tsx';
import Respaldo from './components/Respaldo.tsx';
import { botonIcono, botonSecundario } from './components/estilos.ts';
import { useAhora } from './hooks/useAhora.ts';
import { useAtajos } from './hooks/useAtajos.ts';
import { useAvisos } from './hooks/useAvisos.ts';
import {
  agregarDrive,
  agregarEntrega,
  agregarMateria,
  alternarEntrega,
  borrarEntrega,
  guardarEnlace,
  marcarAvisadas,
  moverMateria,
  nombreMateria,
  quitarDrive,
  quitarMateria,
  type CampoEnlace,
} from './lib/datos.ts';
import { resumenEntregas } from './lib/entregas.ts';
import type { Store } from './lib/store.ts';

export default function App({ store }: { store: Store }) {
  const { datos, avisos, deshacer } = useSyncExternalStore(store.suscribir, store.obtener);
  const ahora = useAhora();
  useAtajos();
  const nombreDe = (id: string) => nombreMateria(datos.materias, id);
  const avisosNavegador = useAvisos(datos.entregas, nombreDe, (ids) => store.actualizar((d) => marcarAvisadas(d, ids)));
  const guardarEnlaceDe = (id: string, campo: CampoEnlace, url: string) =>
    store.actualizar((d) => guardarEnlace(d, id, campo, url));

  return (
    <>
      <Encabezado ahora={ahora} resumen={resumenEntregas(datos.entregas, ahora)} />
      {/* Escritorio: Entregas a todo el ancho, luego tres tarjetas de enlaces y luego Drive y Mis materias. */}
      <main className="mx-auto grid max-w-[1120px] gap-4 px-4 pb-10 md:grid-cols-2 md:gap-5 md:px-6 lg:grid-cols-6">
        {avisos.map((aviso) => (
          <div
            key={aviso}
            role="alert"
            className="flex items-start gap-3 rounded-xl bg-aviso-fondo px-4 py-3 text-[14px] leading-5 md:col-span-2 lg:col-span-6"
          >
            <TriangleAlert size={20} className="shrink-0 text-aviso" aria-hidden="true" />
            <p>{aviso}</p>
          </div>
        ))}
        <Entregas
          className="md:col-span-2 lg:col-span-6"
          entregas={datos.entregas}
          materias={datos.materias}
          ahora={ahora}
          mostrarBotonAvisos={avisosNavegador.mostrarBoton}
          onPedirAvisos={avisosNavegador.pedirPermiso}
          onAgregar={(entrega) => store.actualizar((d) => agregarEntrega(d, entrega))}
          onAlternar={(id) => store.actualizar((d) => alternarEntrega(d, id))}
          onBorrar={(id) => store.actualizar((d) => borrarEntrega(d, id), 'Entrega borrada')}
        />
        <ClasesVirtuales className="lg:col-span-2" materias={datos.materias} onGuardar={guardarEnlaceDe} />
        <AulaMoodle className="lg:col-span-2" materias={datos.materias} onGuardar={guardarEnlaceDe} />
        <Classroom className="lg:col-span-2" materias={datos.materias} onGuardar={guardarEnlaceDe} />
        <Drive
          className="lg:col-span-3"
          enlaces={datos.drive}
          onAgregar={(nombre, url) => store.actualizar((d) => agregarDrive(d, nombre, url))}
          onQuitar={(id) => store.actualizar((d) => quitarDrive(d, id), 'Enlace quitado')}
        />
        <Materias
          className="md:col-span-2 lg:col-span-3"
          materias={datos.materias}
          onAgregar={(nombre) => store.actualizar((d) => agregarMateria(d, nombre))}
          onQuitar={(id) => store.actualizar((d) => quitarMateria(d, id), 'Materia quitada')}
          onMover={(id, destino) => store.actualizar((d) => moverMateria(d, id, destino))}
        />
        <Respaldo
          className="md:col-span-2 lg:col-span-6"
          datos={datos}
          onImportar={(nuevos) => store.actualizar(() => nuevos, 'Datos importados')}
        />
      </main>
      {deshacer && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-borde bg-tarjeta px-4 py-3 text-[14px] shadow-[var(--sombra-tarjeta)]"
        >
          {deshacer}
          <span className="flex gap-2">
            <button type="button" className={botonSecundario} onClick={store.deshacer}>
              Deshacer
            </button>
            <button type="button" className={botonIcono} aria-label="Cerrar aviso" onClick={store.descartarDeshacer}>
              <X size={18} aria-hidden="true" />
            </button>
          </span>
        </div>
      )}
    </>
  );
}
