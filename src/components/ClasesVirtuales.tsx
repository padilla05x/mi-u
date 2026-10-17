import { Video } from 'lucide-react';
import EnlacesPorMateria, { type PropsSeccionEnlaces } from './EnlacesPorMateria.tsx';

export default function ClasesVirtuales(props: PropsSeccionEnlaces) {
  return (
    <EnlacesPorMateria
      {...props}
      seccion="clase"
      titulo="Clases virtuales"
      pista="Enlace de Meet, Zoom o Teams de cada materia."
      icono={Video}
    />
  );
}
