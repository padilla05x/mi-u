import { GraduationCap } from 'lucide-react';
import EnlacesPorMateria, { type PropsSeccionEnlaces } from './EnlacesPorMateria.tsx';

export default function AulaMoodle(props: PropsSeccionEnlaces) {
  return (
    <EnlacesPorMateria
      {...props}
      seccion="moodle"
      titulo="Aula virtual (Moodle)"
      pista="Aula de cada materia en la plataforma de la universidad."
      icono={GraduationCap}
    />
  );
}
