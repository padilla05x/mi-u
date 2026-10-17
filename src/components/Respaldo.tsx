import { Download, HardDriveDownload, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { Datos } from '../lib/tipos.ts';
import { exportar, importar } from '../lib/respaldo.ts';
import { botonSecundario } from './estilos.ts';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  datos: Datos;
  onImportar: (datos: Datos) => void;
  className?: string;
}

export default function Respaldo({ datos, onImportar, className }: Props) {
  const entrada = useRef<HTMLInputElement>(null);

  const descargar = () => {
    const url = URL.createObjectURL(new Blob([exportar(datos)], { type: 'application/json' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `mi-u-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const leer = async (archivo: File | undefined) => {
    if (!archivo) return;
    const nuevos = importar(await archivo.text());
    if (nuevos) onImportar(nuevos);
    else window.alert('Ese archivo no es un respaldo válido de Mi U.');
    if (entrada.current) entrada.current.value = '';
  };

  return (
    <Tarjeta
      titulo="Respaldo"
      pista="Guarda tus datos en un archivo o restáuralos. Importar reemplaza todo lo actual (puedes deshacerlo)."
      icono={HardDriveDownload}
      className={className}
    >
      <div className="flex flex-wrap gap-3">
        <button type="button" className={botonSecundario} onClick={descargar}>
          <Download size={16} aria-hidden="true" />
          Exportar datos
        </button>
        <button type="button" className={botonSecundario} onClick={() => entrada.current?.click()}>
          <Upload size={16} aria-hidden="true" />
          Importar datos
        </button>
        <input
          ref={entrada}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Archivo de respaldo"
          onChange={(e) => void leer(e.target.files?.[0])}
        />
      </div>
    </Tarjeta>
  );
}
