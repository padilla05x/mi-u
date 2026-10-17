import { ExternalLink, FolderOpen, FolderPlus, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { useErrorFormulario } from '../hooks/useErrorFormulario.ts';
import { abrirEnlace } from '../lib/enlaces.ts';
import type { DriveLink } from '../lib/tipos.ts';
import Campo from './Campo.tsx';
import EstadoVacio from './EstadoVacio.tsx';
import { botonIcono, botonPrincipal, botonSecundario, campo, fila, tituloElemento } from './estilos.ts';
import MensajeError from './MensajeError.tsx';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  enlaces: DriveLink[];
  onAgregar: (nombre: string, url: string) => void;
  onQuitar: (id: string) => void;
  className?: string;
}

export default function Drive({ enlaces, onAgregar, onQuitar, className }: Props) {
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const { error, mostrar: mostrarError, limpiar: limpiarError } = useErrorFormulario();

  const guardar = () => {
    const nombreLimpio = nombre.trim();
    const urlLimpia = url.trim();
    if (!nombreLimpio || !urlLimpia) {
      mostrarError('Escribe un nombre y un enlace.');
      return;
    }
    limpiarError();
    onAgregar(nombreLimpio, urlLimpia);
    setNombre('');
    setUrl('');
  };

  return (
    <Tarjeta
      titulo="Drive"
      pista="Acceso rápido a tu Drive y a carpetas que uses seguido."
      icono={FolderOpen}
      className={className}
    >
      <button type="button" className={`${botonSecundario} w-full`} onClick={() => abrirEnlace('https://drive.google.com')}>
        <ExternalLink size={16} aria-hidden="true" />
        Abrir Google Drive
      </button>
      <div className="mt-4">
        {enlaces.length === 0 ? (
          <EstadoVacio
            icono={FolderPlus}
            titulo="Guarda aquí tus carpetas"
            texto="Los enlaces que más usas quedan a un clic."
            accion="Agregar enlace"
            enfocar="drive-nombre"
          />
        ) : (
          <ul>
            {enlaces.map((l) => (
              <li key={l.id} className={`${fila} flex items-center gap-3`}>
                <FolderOpen size={18} className="shrink-0 text-tenue" aria-hidden="true" />
                <span className={`${tituloElemento} min-w-0 flex-1 truncate`} title={l.nombre}>
                  {l.nombre}
                </span>
                <button
                  type="button"
                  className={botonSecundario}
                  aria-label={`Abrir ${l.nombre}`}
                  onClick={() => abrirEnlace(l.url)}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Abrir
                </button>
                <button
                  type="button"
                  className={botonIcono}
                  title="Quitar"
                  aria-label={`Quitar ${l.nombre}`}
                  onClick={() => onQuitar(l.id)}
                >
                  <Trash size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <Campo id="drive-nombre" etiqueta="Nombre">
          <input
            id="drive-nombre"
            type="text"
            className={campo}
            placeholder="Ej. Carpeta de PETI"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              limpiarError();
            }}
          />
        </Campo>
        <Campo id="drive-enlace" etiqueta="Enlace">
          <input
            id="drive-enlace"
            type="text"
            className={campo}
            placeholder="Pega el enlace"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              limpiarError();
            }}
          />
        </Campo>
        <button type="button" className={botonPrincipal} onClick={guardar}>
          <Plus size={16} aria-hidden="true" />
          Guardar
        </button>
      </div>
      <MensajeError error={error} className="mt-3" />
    </Tarjeta>
  );
}
