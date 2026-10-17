import { BookOpen, BookPlus, ChevronDown, ChevronUp, GripVertical, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import type { Materia } from '../lib/tipos.ts';
import Campo from './Campo.tsx';
import EstadoVacio from './EstadoVacio.tsx';
import { botonIcono, botonPrincipal, campo, fila, tituloElemento } from './estilos.ts';
import PuntoMateria from './PuntoMateria.tsx';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  materias: Materia[];
  onAgregar: (nombre: string) => void;
  /** Quita la materia con sus enlaces y sus entregas. */
  onQuitar: (id: string) => void;
  /** Pone la materia en la posición `destino`. */
  onMover: (id: string, destino: number) => void;
  className?: string;
}

export default function Materias({ materias, onAgregar, onQuitar, onMover, className }: Props) {
  const [nombre, setNombre] = useState('');
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  const agregar = () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    onAgregar(nombreLimpio);
    setNombre('');
  };

  const quitar = (m: Materia) => {
    if (window.confirm(`¿Quitar "${m.nombre}"? También se borran sus links y entregas.`)) onQuitar(m.id);
  };

  return (
    <Tarjeta titulo="Mis materias" pista="Las materias aparecen en todas las secciones." icono={BookOpen} className={className}>
      {materias.length === 0 ? (
        <EstadoVacio
          icono={BookPlus}
          titulo="Todavía no tienes materias"
          texto="Agrégalas para organizar tus entregas y enlaces."
          accion="Agregar materia"
          enfocar="nueva-materia"
        />
      ) : (
        <ul>
          {materias.map((m, i) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => setArrastrando(m.id)}
              onDragEnd={() => setArrastrando(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => arrastrando && onMover(arrastrando, i)}
              className={`${fila} flex items-center gap-3 ${arrastrando === m.id ? 'opacity-50' : ''}`}
            >
              <GripVertical size={18} className="shrink-0 cursor-grab text-tenue" aria-hidden="true" />
              <PuntoMateria color={m.color} />
              <span className={`${tituloElemento} min-w-0 flex-1 truncate`} title={m.nombre}>
                {m.nombre}
              </span>
              <button
                type="button"
                className={botonIcono}
                title="Subir"
                aria-label={`Subir ${m.nombre}`}
                disabled={i === 0}
                onClick={() => onMover(m.id, i - 1)}
              >
                <ChevronUp size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={botonIcono}
                title="Bajar"
                aria-label={`Bajar ${m.nombre}`}
                disabled={i === materias.length - 1}
                onClick={() => onMover(m.id, i + 1)}
              >
                <ChevronDown size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={botonIcono}
                title="Quitar"
                aria-label={`Quitar ${m.nombre}`}
                onClick={() => quitar(m)}
              >
                <Trash size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-end gap-3">
        <Campo id="nueva-materia" etiqueta="Nueva materia" className="flex-1">
          <input
            id="nueva-materia"
            type="text"
            className={campo}
            placeholder="Ej. Cálculo Integral"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Campo>
        <button type="button" className={botonPrincipal} onClick={agregar}>
          <Plus size={16} aria-hidden="true" />
          Agregar
        </button>
      </div>
    </Tarjeta>
  );
}
