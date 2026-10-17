import { Download, HardDriveDownload, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useErrorFormulario } from '../hooks/useErrorFormulario.ts';
import { diaEnBogota } from '../lib/fechas.ts';
import type { Datos } from '../lib/tipos.ts';
import { exportar, importar } from '../lib/respaldo.ts';
import Dialogo from './Dialogo.tsx';
import { botonSecundario } from './estilos.ts';
import MensajeError from './MensajeError.tsx';
import Tarjeta from './Tarjeta.tsx';

interface Props {
  datos: Datos;
  /** Reemplaza los datos; false si no se pudo guardar la copia previa, y entonces no cambió nada. */
  onImportar: (datos: Datos) => boolean;
  className?: string;
}

export default function Respaldo({ datos, onImportar, className }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const { error, mostrar: mostrarError, limpiar: limpiarError } = useErrorFormulario();
  // Respaldo válido que espera la confirmación.
  const [porImportar, setPorImportar] = useState<{ archivo: string; datos: Datos } | null>(null);

  const descargar = () => {
    const ahora = Date.now();
    const url = URL.createObjectURL(new Blob([exportar(datos, ahora)], { type: 'application/json' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `mi-u-${diaEnBogota(ahora)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const leer = async (archivo: File | undefined) => {
    if (!archivo) return;
    let texto: string | null = null;
    try {
      texto = await archivo.text();
    } catch {
      // Queda en null: el navegador no pudo leerlo.
    }
    // Así se puede volver a elegir el mismo archivo.
    if (entrada.current) entrada.current.value = '';
    if (texto === null) {
      mostrarError('No se pudo leer el archivo.');
      return;
    }
    const resultado = importar(texto);
    if (!resultado.ok) {
      mostrarError(resultado.motivo);
      return;
    }
    limpiarError();
    setPorImportar({ archivo: archivo.name, datos: resultado.datos });
  };

  const confirmar = (nuevos: Datos) => {
    setPorImportar(null);
    if (!onImportar(nuevos)) mostrarError('No se pudo guardar la copia de respaldo; no se importó nada.');
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
      <MensajeError error={error} className="mt-3" />
      {porImportar && (
        <Dialogo
          titulo={`¿Importar "${porImportar.archivo}"?`}
          accion="Importar"
          iconoAccion={Upload}
          estiloAccion="principal"
          onConfirmar={() => confirmar(porImportar.datos)}
          onCancelar={() => setPorImportar(null)}
        >
          Importar reemplazará tus datos actuales. Antes se guardará una copia de respaldo.
        </Dialogo>
      )}
    </Tarjeta>
  );
}
