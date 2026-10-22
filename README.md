<div align="center">

<img src="docs/img/logo.svg" alt="Logo animado de Mi U: una U que se dibuja y se marca como entregada" width="120" height="120">

# Mi U

**Tu vida universitaria en un solo panel.**
Entregas, clases virtuales, Moodle, Classroom y Drive, sin cuentas ni servidores.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![Datos](https://img.shields.io/badge/datos-solo%20en%20tu%20navegador-4f46e5)

**[Usar la app](https://padilla05x.github.io/mi-u/)** · [Funciones](#funciones) · [Así se ve](#así-se-ve) · [Instalación](#instalación-y-uso) · [Privacidad](#datos-y-privacidad) · [Desarrollo](#desarrollo)

<img src="docs/img/demo.gif" alt="Demostración: agregar una entrega con el atajo n, filtrar vencidas, buscar y cambiar de tema" width="760">

<sub>Atajo `n` para una entrega nueva, filtro de vencidas, búsqueda con `/` y cambio de tema.
<a href="docs/img/demo.mp4">Ver el video en mejor calidad</a>.</sub>

</div>

## Funciones

- **Entregas:** registra tareas con materia, descripción y fecha límite, márcalas como hechas o bórralas. La lista pone primero las pendientes y al final las entregadas, cada grupo por fecha.
- **Estados:** cada entrega muestra "Entregada", "Vencida", "Para hoy", "Mañana" o "en N días", siempre con icono y texto, no solo con color. Los días se cuentan por calendario, no en bloques de 24 horas.
- **Vista semanal:** siete días de lunes a domingo con todas las entregas de la semana, incluidas las hechas. El día de hoy va resaltado y se puede pasar a la semana anterior o a la siguiente. En pantallas pequeñas los días van apilados.
- **Filtros y búsqueda:** muestra todas las entregas, las pendientes, las vencidas o las entregadas, con la cantidad de cada grupo. Busca por descripción o por materia sin importar mayúsculas ni tildes. El filtro y la búsqueda no se guardan al recargar y no cambian la vista semanal.
- **Resumen:** el encabezado saluda según la hora del día y cuenta las entregas vencidas, las de hoy y las de los próximos 7 días.
- **Avisos:** notificación del navegador cuando faltan 24 horas o menos para una entrega pendiente (requiere permiso), una sola vez por entrega. Solo funciona con la página abierta: revisa al abrirla y cada minuto.
- **Clases virtuales, Moodle y Classroom:** guarda por materia el enlace de Meet, Zoom o Teams, del aula de Moodle y de la clase de Google Classroom, y ábrelo con un clic. Si el enlace no empieza por `http://` o `https://`, la app le agrega `https://`. Con **Editar** puedes quitar de una de estas secciones las materias que no la usan: se borra su enlace ahí, pero la materia sigue en las demás, y puedes mostrarla de nuevo cuando quieras.
- **Hoy:** tus clases del día en orden de hora, con "Entrar" para abrir su clase virtual en otra pestaña y la etiqueta "En curso" en la que está ocurriendo. Si la materia no tiene enlace de clase virtual, el botón dice "Sin enlace".
- **Horario:** tus clases fijas de la semana, con materia, día, hora de inicio y de fin, agrupadas por día. No deja agregar una clase que termine antes de empezar ni dos que se crucen el mismo día, y borrar una se puede deshacer.
- **Drive:** acceso directo a Google Drive y a las carpetas o enlaces que uses seguido.
- **Materias:** agrega o quita materias; aparecen en todas las secciones, salvo donde las quites con Editar. Cada una recibe un color propio para reconocerla de un vistazo, y puedes reordenarlas arrastrándolas o con las flechas. Al quitar una materia, la app pide confirmación y borra también sus enlaces, sus entregas y sus clases del horario.
- **Tema:** claro, oscuro o el del sistema, con el selector del encabezado.
- **Respaldo y deshacer:** exporta e importa tus datos en JSON. Borrar una entrega, una clase del horario, un enlace de Drive o una materia, y también importar, se puede deshacer. El archivo lleva la versión del formato y la fecha de exportación. Antes de importar, la app pide confirmación y guarda una copia de los datos actuales; si el archivo no sirve, dice por qué.
- **Atajos de teclado:** `/` busca entregas y `n` empieza una entrega nueva.

Todas las fechas se calculan y se muestran en hora de Bogotá (UTC−5), aunque el equipo esté en otra zona horaria.

## Así se ve

| Claro | Oscuro |
|---|---|
| <img src="docs/img/claro.png" alt="Mi U en tema claro" width="480"> | <img src="docs/img/oscuro.png" alt="Mi U en tema oscuro" width="480"> |

<details>
<summary>En el celular</summary>

<img src="docs/img/movil.png" alt="Mi U en una pantalla de celular, con las secciones apiladas" width="300">

</details>

Las capturas usan datos de ejemplo y son anteriores a Hoy y Horario, así que no muestran esas tarjetas ni el botón Editar de las secciones de enlaces.

## Requisitos

Solo para correr Mi U en tu equipo; para usarla basta abrir la [página publicada](#usar-mi-u).

- Node.js 22.13 o superior dentro de la serie 22, o Node 24 o superior (Node 23 no sirve). `package.json` no fija la versión: el rango sale de lo que piden las dependencias (`^22.13.0 || >=24`). Se recomienda Node 24 LTS (ver [Pendientes](#pendientes)).
- npm, que viene con Node.
- El despliegue usa Node 24 (`node-version: 24` en `.github/workflows/deploy.yml`).

## Instalación y uso

### Usar Mi U

Abre <https://padilla05x.github.io/mi-u/>. No hay que instalar nada ni crear una cuenta, y la página se actualiza sola con cada cambio que llega a `main`.

Los datos se guardan en el navegador, por separado para cada dirección: la página publicada y <http://localhost:5173> no comparten datos. Para pasarlos de una a otra, usa Exportar datos en Respaldo en una y luego Importar datos en la otra.

### Preparar el entorno para desarrollo

```bash
git clone https://github.com/padilla05x/mi-u.git
cd mi-u
npm install
npm run dev
```

Abre <http://localhost:5173>. Siempre usa esa misma dirección: el navegador guarda los datos por dirección, así que en `127.0.0.1:5173` o en otro puerto verías la app vacía. Por eso el puerto está fijo: si el 5173 está ocupado, Vite se detiene en vez de abrir otro.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia la app en modo desarrollo en <http://localhost:5173>. |
| `npm run build` | Revisa los tipos y genera la versión final en `dist/`. |
| `npm run preview` | Sirve la versión de `dist/` en el mismo puerto, así que ve los mismos datos que `npm run dev`. No pueden correr a la vez. |
| `npm test` | Corre todas las pruebas una vez. |
| `npx vitest` | Corre las pruebas y las repite al guardar cambios. |
| `npm run lint` | Revisa el código con ESLint. |

La versión de `dist/` no se abre con doble clic: hay que servirla con `npm run preview` o con cualquier servidor web.

### Versión anterior

`mi-u.html` es la versión inicial en un solo archivo y sigue en el repositorio hasta que se retire (ver [Pendientes](#pendientes)). Se abre con doble clic en el navegador.

Sus datos no pasan solos a la versión nueva, porque el navegador los guarda por separado según la dirección de la página. Para llevarlos:

1. Abre `mi-u.html`, abre la consola del navegador (F12) y ejecuta:
   ```js
   copy(localStorage.getItem('mi-u-v1'))
   ```
2. Abre <http://localhost:5173> (o la página publicada), abre la consola y ejecuta lo siguiente, pegando lo copiado en lugar de `PEGA_AQUÍ`:
   ```js
   localStorage.setItem('mi-u-v1', JSON.stringify(PEGA_AQUÍ))
   ```
3. Recarga la página. Mi U convierte las fechas al formato nuevo y les da color a las materias.

Ojo: el paso 2 reemplaza lo que ya tengas guardado en la versión nueva.

## Datos y privacidad

- **Todo queda en tu navegador.** Los datos viven en el `localStorage` y no salen de él: no hay cuentas ni servidor propio, y la app no envía tus datos a ninguna parte. Hasta la fuente (Inter) viene incluida en la app; solo se sale de ella cuando abres un enlace tuyo.
- **La página publicada.** GitHub Pages sirve los archivos de la app (HTML, JavaScript, estilos y la fuente), como cualquier sitio web, y GitHub registra las visitas a esos archivos: por seguridad, guarda la dirección IP de quien entra. Tus materias, entregas y demás datos no van en esas visitas.
- **Claves que usa:**
  - `mi-u-v1`: materias, entregas, enlaces de Drive y horario.
  - `mi-u-tema`: el tema elegido, solo si no es "Sistema".
  - `mi-u-v1-corrupto`: copia que se crea si los datos guardados aparecen dañados (si ya existe, la siguiente es `mi-u-v1-corrupto-2` y así sucesivamente).
  - `mi-u-v1-respaldo-importacion`: copia de lo guardado justo antes de la última importación. Si no se puede crear, no se importa nada.
- **Nada se borra en silencio.** Si los datos están dañados, se guarda esa copia, se carga el estado inicial y la app lo avisa. Si el almacenamiento está lleno o el navegador lo bloquea, la app sigue funcionando en memoria y muestra un aviso.
- **Por navegador y dirección.** Si cambias de navegador, de equipo o de dirección (por ejemplo, de <http://localhost:5173> a la página publicada), los datos no se transfieren solos.
- **Respaldo.** Antes de limpiar los datos del navegador, conviene exportar un respaldo en JSON desde la app.

## Estructura del proyecto

```
.github/
  workflows/    deploy.yml: pruebas, lint, build y publicación en GitHub Pages
src/
  lib/          lógica pura, sin React, con sus pruebas: fechas, estados, semana,
                horario, filtros, secciones, colores de materia, respaldo,
                almacenamiento y migración
  components/   una tarjeta por sección y sus piezas compartidas
  hooks/        reloj de la pantalla, avisos del navegador, atajos de teclado
                y mensajes de error de los formularios
  test/         localStorage en memoria para las pruebas
  App.tsx       arma la página
  index.css     paleta y estilos base (Tailwind CSS)
docs/
  diseno.md     paleta, contraste, tipografía, iconos y reglas de la interfaz
  img/          logo animado, capturas y video de la demo
mi-u.html       versión anterior, en un solo archivo
```

## Desarrollo

- **Stack:** Vite, React, TypeScript, Tailwind CSS, Vitest con Testing Library, ESLint e iconos de Lucide.
- **Pruebas en otra zona horaria.** Corren con la zona de Tokio, para comprobar que la lógica usa la hora de Bogotá y no la del equipo.
- **Diseño.** Las decisiones visuales están en [docs/diseno.md](docs/diseno.md). La prueba `src/diseno.test.ts` comprueba que los colores de `src/index.css` coinciden con ese documento y que cumplen el contraste WCAG AA. Si cambias un color, cámbialo en los dos lados.
- **Antes de proponer un cambio,** corre `npm test`, `npm run lint` y `npm run build`.
- **Despliegue.** Cada push a `main` publica la página con GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)), después de correr las pruebas, el lint y el build con Node 24. Si algún paso falla, no se publica. También se puede lanzar a mano desde la pestaña Actions. Solo en ese build, `vite.config.ts` usa la ruta base `/mi-u/`; en local la app sigue en la raíz.

## Hoja de ruta

- [x] Reestructurar el proyecto con Vite + React + TypeScript
- [x] Rediseño visual con modo claro y oscuro
- [x] Vista semanal de entregas
- [x] Filtros y búsqueda
- [x] Ordenar materias arrastrándolas
- [x] Exportar e importar datos en JSON
- [x] Deshacer al borrar
- [x] Pruebas unitarias para la lógica de fechas y estados
- [x] Atajos de teclado
- [x] Quitar materias de Clases virtuales, Moodle o Classroom sin borrarlas
- [x] Horario semanal y clases de hoy
- [x] Despliegue en GitHub Pages
- [x] Respaldo con versión, confirmación y copia previa

## Pendientes

- [ ] Node 24 ya corre en el despliegue; migrar el entorno local y quitar el workaround de `execArgv` en `vite.config.ts`.
- Nota: Vitest sigue en 4.1, porque Vitest 5 no admite Node 25, que es el del entorno local.
- [ ] Retirar `mi-u.html` cuando termine la fase 1. Seguirá en el historial de git (commit `90c1a4d`).

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE).

Desarrollado con berraquera por Padilla, el socio Pedro y un par de full sets de techno a la madrugada
