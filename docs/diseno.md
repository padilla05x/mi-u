# Diseño visual de Mi U

Diseño visual de la fase 1 (paso 4). Define el aspecto y la organización de la pantalla; no cambia lo que hace la app.

## Principios

1. **Lo urgente se nota sin alarmar.** Las vencidas y las de hoy destacan; el resto queda en calma.
2. **El color nunca va solo.** Cada estado lleva icono y texto, y cada materia muestra su nombre junto a su color.
3. **AA en los dos modos.** Todo texto llega a 4,5:1 y todo borde o anillo que identifica un control, a 3:1.
4. **Nada sale del navegador.** La fuente viaja dentro de la app; no se descarga de servicios externos, porque el README promete que no se envía nada a servidores externos.

## Dirección

Sigo la dirección pedida, con estas precisiones:

- **Inter autoalojada.** Se instala con el paquete `@fontsource-variable/inter` (licencia OFL 1.1) y Vite la empaqueta con la app. Google Fonts rompería la promesa de privacidad del README.
- **Controles nativos con estilo.** La lista de materias, la casilla y el campo de fecha y hora siguen siendo los del navegador, con estilo propio. Funcionan con teclado y lector de pantalla sin código extra. Con `color-scheme: light dark`, el navegador también los dibuja en oscuro.
- **Jerarquía de botones.** El botón principal (relleno de acento) queda para crear (Agregar y Guardar) y para confirmar "Importar" en su diálogo. "Abrir", "Abrir Google Classroom", "Abrir Google Drive" y "Activar avisos del navegador" pasan a ser botones secundarios, para que las filas de enlaces no compitan con los formularios.
- **Colores de materia propios.** Quedan fuera de los tonos de los estados y están comprobados para daltonismo (ver "Colores de materia"); no están elegidos a ojo.
- **Modo oscuro automático, como ahora.** Sigue la preferencia del sistema. Un selector manual sería una función nueva.

## Paleta de la interfaz

Los nombres de token son los de `src/index.css` (`--color-<token>`). Se conservan los siete de la versión actual (`fondo`, `tarjeta`, `texto`, `tenue`, `borde`, `acento`, `acento-suave`) y se reemplazan `exito`, `peligro` y `alerta` por tokens con el nombre de cada estado. Después volvió `peligro`, con `peligro-suave`, para las acciones que borran y los mensajes de error.

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `fondo` | Fondo de la página y del recuadro de los estados vacíos | `#F5F6FA` | `#0B0F19` |
| `tarjeta` | Tarjetas, contadores y campos | `#FFFFFF` | `#141A28` |
| `superficie` | Fila al pasar el puntero y contador en cero | `#F1F3F8` | `#1B2233` |
| `borde` | Contorno de tarjetas y separadores entre filas (decorativo) | `#E3E7EF` | `#272F44` |
| `borde-control` | Borde de campos de texto, fecha y lista | `#838C9E` | `#6B7590` |
| `texto` | Texto principal | `#1A2030` | `#E8EBF3` |
| `tenue` | Texto secundario, pistas, placeholder y entrega hecha | `#596275` | `#A3ABBE` |
| `acento` | Iconos de sección, botón principal y texto de botón secundario | `#4F46E5` | `#A5B4FC` |
| `acento-hover` | Botón principal al pasar el puntero | `#4338CA` | `#C7D0FE` |
| `acento-suave` | Fondo de botón secundario y del icono de estado vacío | `#EEF0FE` | `#262C55` |
| `sobre-acento` | Texto e icono sobre el botón principal | `#FFFFFF` | `#151A3D` |
| `foco` | Anillo de foco | `#4F46E5` | `#A5B4FC` |
| `entregada` | Texto e icono de "Entregada" | `#166534` | `#7DDCA4` |
| `entregada-fondo` | Fondo de "Entregada" | `#E6F4EA` | `#11291D` |
| `vencida` | Texto e icono de "Vencida" | `#B42318` | `#FDA4A4` |
| `vencida-fondo` | Fondo de "Vencida" | `#FDECEA` | `#36161A` |
| `hoy` | Texto e icono de "Para hoy" | `#924A00` | `#F6C77E` |
| `hoy-fondo` | Fondo de "Para hoy" | `#FFF1DB` | `#33250F` |
| `manana` | Texto e icono de "Mañana" | `#1D4ED8` | `#A4BEFD` |
| `manana-fondo` | Fondo de "Mañana" | `#E8EEFD` | `#182548` |
| `dias` | Texto e icono de "en N días" | `#475467` | `#C3CAD9` |
| `dias-fondo` | Fondo de "en N días" | `#EEF1F6` | `#212839` |
| `aviso` | Icono del aviso del almacén | `#924A00` | `#F6C77E` |
| `aviso-fondo` | Fondo del aviso del almacén | `#FFF1DB` | `#33250F` |
| `peligro` | Texto del botón de peligro y de los mensajes de error | `#B42318` | `#FDA4A4` |
| `peligro-suave` | Fondo del botón de peligro | `#FDECEA` | `#36161A` |

- **El acento cambia en modo oscuro.** El índigo del modo claro (`#4F46E5`) queda en 2,7:1 sobre la tarjeta oscura, y un índigo claro con texto blanco no llega a 4,5:1. Por eso en oscuro el acento se aclara y el texto del botón principal pasa a índigo oscuro.
- **El aviso usa los valores de "Para hoy".** Tiene tokens propios para poder cambiarlos por separado.
- **Peligro usa los valores de "Vencida".** También tiene tokens propios, por la misma razón.

## Pares de contraste

Contraste WCAG 2.x calculado con la luminancia relativa. El mínimo AA es 4,5:1 para texto y 3:1 para el borde de los campos y el anillo de foco (criterio 1.4.11).

Una prueba de `npm test` lee este documento y los tokens reales de `src/index.css`, en claro y en oscuro. Falla en cuatro casos:
- algún par de esta tabla o algún color de materia queda bajo su mínimo;
- una cifra escrita aquí deja de coincidir con el cálculo;
- un token de las tablas tiene en `src/index.css` otro valor o no existe ahí;
- `src/index.css` define un color que no está en las tablas.

| Elemento | Color | Sobre | Mínimo | Claro | Oscuro |
|---|---|---|---|---|---|
| Texto principal | `texto` | `fondo` | 4,5 | 15,04 | 16,06 |
| Texto principal | `texto` | `tarjeta` | 4,5 | 16,24 | 14,58 |
| Texto principal | `texto` | `superficie` | 4,5 | 14,63 | 13,31 |
| Texto secundario y placeholder | `tenue` | `fondo` | 4,5 | 5,67 | 8,32 |
| Texto secundario y placeholder | `tenue` | `tarjeta` | 4,5 | 6,12 | 7,55 |
| Texto secundario y contador en cero | `tenue` | `superficie` | 4,5 | 5,52 | 6,90 |
| Acento: iconos y texto | `acento` | `tarjeta` | 4,5 | 6,29 | 8,72 |
| Botón secundario e icono de estado vacío | `acento` | `acento-suave` | 4,5 | 5,55 | 6,69 |
| Texto secundario en el día de hoy (vista semanal) | `tenue` | `acento-suave` | 4,5 | 5,40 | 5,80 |
| Botón principal | `sobre-acento` | `acento` | 4,5 | 6,29 | 8,45 |
| Botón principal al pasar el puntero | `sobre-acento` | `acento-hover` | 4,5 | 7,90 | 11,13 |
| Entregada | `entregada` | `entregada-fondo` | 4,5 | 6,28 | 9,31 |
| Vencida | `vencida` | `vencida-fondo` | 4,5 | 5,75 | 8,57 |
| Para hoy | `hoy` | `hoy-fondo` | 4,5 | 5,89 | 9,48 |
| Mañana | `manana` | `manana-fondo` | 4,5 | 5,77 | 8,13 |
| en N días | `dias` | `dias-fondo` | 4,5 | 6,79 | 8,95 |
| Aviso del almacén: icono | `aviso` | `aviso-fondo` | 4,5 | 5,89 | 9,48 |
| Aviso del almacén: texto | `texto` | `aviso-fondo` | 4,5 | 14,58 | 12,47 |
| Botón de peligro | `peligro` | `peligro-suave` | 4,5 | 5,75 | 8,57 |
| Mensaje de error de un formulario | `peligro` | `tarjeta` | 4,5 | 6,57 | 9,12 |
| Borde de campos | `borde-control` | `tarjeta` | 3 | 3,38 | 3,78 |
| Anillo de foco | `foco` | `tarjeta` | 3 | 6,29 | 8,72 |
| Anillo de foco | `foco` | `fondo` | 3 | 5,82 | 9,61 |
| Anillo de foco en fila resaltada | `foco` | `superficie` | 3 | 5,66 | 7,96 |
| Borde de tarjeta en modo edición | `acento` | `tarjeta` | 3 | 6,29 | 8,72 |

Hay dos excepciones al contraste:
- **Controles deshabilitados**, como "Abrir" sin enlace. WCAG excluye los componentes inactivos; se muestran con opacidad del 50 %.
- **`borde`.** Solo decora: las tarjetas y las filas se reconocen por su contenido.

## Estados de las entregas

| Estado | Cuándo | Etiqueta | Icono | Texto e icono | Fondo |
|---|---|---|---|---|---|
| Entregada | Está marcada como hecha; tiene prioridad sobre los demás | Entregada | `CircleCheck` | `entregada` | `entregada-fondo` |
| Vencida | La fecha y hora límite ya pasaron | Vencida | `CircleAlert` | `vencida` | `vencida-fondo` |
| Para hoy | Vence hoy (día de Bogotá) y la hora aún no pasa | Para hoy | `Clock` | `hoy` | `hoy-fondo` |
| Mañana | Vence el día siguiente | Mañana | `Sunrise` | `manana` | `manana-fondo` |
| en N días | Vence en 2 días de calendario o más | en N días | `CalendarDays` | `dias` | `dias-fondo` |

- **Forma de la etiqueta.** Es una píldora de 24 px de alto: icono de 14 px y texto de 12 px en peso 600, separados 6 px.
- **El color nunca va solo.** La etiqueta siempre muestra el texto, así que el estado se entiende sin color.
- **Entrega hecha.** El título se ve en `tenue` y tachado. Hoy se usa opacidad del 55 %, que deja el texto por debajo de 4,5:1.
- **Transición.** Al marcar o desmarcar, el color del título y la etiqueta cambian en 200 ms.

## Colores de materia

Cada materia guarda un color nuevo, `color`, para reconocerla de un vistazo en entregas y listas. Ninguno usa los tonos de los estados (verde, rojo, ámbar, azul o gris).

| Orden | Clave | Claro | Oscuro | Contraste claro | Contraste oscuro |
|---|---|---|---|---|---|
| 1 | `orquidea` | `#B661DA` | `#BE69E2` | 3,68 | 5,22 |
| 2 | `oliva` | `#516000` | `#637500` | 6,95 | 3,37 |
| 3 | `magenta` | `#A42F96` | `#B642A8` | 6,13 | 3,59 |
| 4 | `turquesa` | `#00A19E` | `#00A9A7` | 3,19 | 5,99 |
| 5 | `violeta` | `#7B45C4` | `#8A56D7` | 6,02 | 3,64 |
| 6 | `rosa` | `#DB509E` | `#E458A6` | 3,71 | 5,17 |
| 7 | `lima` | `#929300` | `#9A9A00` | 3,28 | 5,79 |
| 8 | `petroleo` | `#00729C` | `#0083B3` | 5,40 | 4,05 |

- **Contraste.** Se mide contra `tarjeta`, con un mínimo de 3:1 porque el punto es un elemento gráfico.
- **Claves.** Van sin tildes porque se guardan en los datos; nunca se muestran en pantalla.

### Distancia a los estados

El criterio tiene dos partes:
- el matiz (OKLCH) de cada color de materia queda a 30° o más del matiz de cada color de estado, en los dos modos;
- su croma es de 0,10 o más, así que ninguno se ve gris.

| Clave | Matiz | Estado más cercano | Distancia |
|---|---|---|---|
| `orquidea` | 315° | Mañana (azul, 267°) | 48° |
| `oliva` | 120° | Entregada (verde, 151°) | 31° |
| `magenta` | 333° | Vencida (rojo, 20°) | 47° |
| `turquesa` | 192° | Entregada (verde, 157°) | 35° |
| `violeta` | 299° | Mañana (azul, 267°) | 32° |
| `rosa` | 349° | Vencida (rojo, 20°) | 31° |
| `lima` | 110° | Para hoy (ámbar, 78°) | 32° |
| `petroleo` | 233° | Mañana (azul, 264°) | 31° |

**Dos quedan en el borde de una familia de nombre:** el oliva puede llamarse "verde oliva" y el petróleo, "azul petróleo". No afecta la lectura por tres razones:
- **Matiz y luminosidad distintos.** Su matiz está a 31° del verde de "Entregada" y del azul de "Mañana", y su luminosidad también es distinta.
- **Distinta forma y lugar.** El estado es siempre una píldora con icono y texto a la derecha de la fila. La materia es un punto junto a su nombre.
- **Ningún estado usa un punto de color.**

### Cómo se eligieron

Con una búsqueda automática que usa las mismas medidas que el validador de paletas categóricas de la guía `dataviz`:
1. **Candidatos.** Matices fuera de las zonas de los estados: lima, de turquesa a petróleo y de violeta a rosa. Cada uno en cuatro niveles de luminosidad por modo, con el mayor croma posible dentro de sRGB y contraste de 3:1 o más contra `tarjeta`.
2. **Selección.** Los ocho que más se separan entre todos los pares con visión normal, en los dos modos.
3. **Orden.** Se ordenaron para que los vecinos de la tabla pasen el validador en los dos modos. La separación con protanopía y deuteranopía queda en 11,9 en claro y 9,4 en oscuro (objetivo 8), y con visión normal en 20,0 y 18,6 (mínimo 15). Luminosidad, croma y contraste quedan dentro de rango.

### Límite conocido

Con ocho colores que además evitan los tonos de los estados, no se puede asegurar que *cualquier* par se distinga. Entre todos los pares:
- con visión normal, la separación mínima es 11,1 en claro (violeta y magenta) y 10,5 en oscuro (rosa y magenta), por debajo del 15 que se exige a los vecinos;
- con daltonismo, algunos pares casi coinciden: petróleo y rosa con protanopía en modo claro, y rosa y turquesa con deuteranopía en modo oscuro.

En la lista de entregas esos pares pueden quedar juntos. Por eso el color nunca identifica a la materia por sí solo:
- El nombre de la materia va siempre al lado del punto.
- El texto va en `texto` o `tenue`, nunca en el color de la materia.

### Uso

Un punto de 10 px antes del nombre de la materia, en tres lugares:
- la línea secundaria de cada entrega;
- la lista de Mis materias;
- las filas de Clases virtuales, Moodle y Classroom.

### Asignación

Una materia nueva toma el primer color, en orden, que ninguna otra use. Si las ocho ya tienen color, toma el menos usado y, en caso de empate, el primero en orden. Los colores solo se repiten a partir de la novena materia.

### Datos y migración

- **Formato.** `Materia.color` guarda la clave (`"orquidea"`), no el hexadecimal. Cada clave tiene un valor por modo, así que la paleta puede ajustarse sin migrar datos.
- **Al cargar.** Si una materia no tiene color, o tiene una clave que no existe, recibe uno con la misma regla que una materia nueva, recorriendo la lista en orden. No se borra nada más.
- **Datos de mi-u.html.** Como no traen colores, la primera materia queda en orquídea, la segunda en oliva y así sucesivamente.
- **Materias base.** Las siete reciben los siete primeros colores.
- **Pruebas.** Cubren la migración y la asignación.

## Tipografía

**Familia:** Inter variable (pesos de 400 a 700), autoalojada. Si no carga, se usan `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.

| Rol | Tamaño | Interlineado | Peso | Espaciado entre letras | Dónde |
|---|---|---|---|---|---|
| Saludo | 28 px (24 px en móvil) | 34 px (30 px) | 700 | −0,02 em | "Buenos días" |
| Número de contador | 24 px | 28 px | 700 | −0,01 em | Contadores del encabezado |
| Título de sección | 18 px | 24 px | 600 | −0,01 em | Título de cada tarjeta |
| Título de elemento | 15 px | 20 px | 500 | 0 | Entrega, materia y enlace de Drive |
| Marca y fecha del encabezado | 15 px | 20 px | 700 y 400 | 0 | "Mi U" y "Miércoles, 14 de octubre de 2026" |
| Cuerpo y controles | 14 px | 20 px | 400 (600 en botones) | 0 | Campos, botones y aviso |
| Etiqueta de campo | 13 px | 18 px | 500 | 0 | "Materia", "Descripción", "Fecha límite"… |
| Texto secundario | 13 px | 18 px | 400 | 0 | Pistas, materia y fecha de cada entrega |
| Etiqueta de estado | 12 px | 16 px | 600 | 0 | Píldora de estado |

- **Tamaño mínimo.** Ningún texto baja de 12 px, y ese tamaño solo lo usan las etiquetas de estado, en peso 600.
- **Fecha del encabezado.** Solo lleva mayúscula inicial ("Miércoles, 14 de octubre de 2026"), en vez de poner mayúscula a cada palabra como ahora.

## Espaciado

La base es de 4 px. Los pasos son 4, 6, 8, 12, 16, 20, 24, 32 y 40 px.

| Elemento | Móvil (390 px) | Escritorio (1100 px) |
|---|---|---|
| Margen lateral de la página | 16 | 24 |
| Ancho máximo del contenido | — | 1120 |
| Encabezado: margen superior e inferior | 24 / 16 | 40 / 24 |
| Separación entre tarjetas | 16 | 20 |
| Relleno de tarjeta | 20 | 24 |
| Título de tarjeta al contenido | 16 | 16 |
| Filas: relleno vertical y separación interna | 12 / 12 | 12 / 12 |
| Formularios: entre campos y de la etiqueta al campo | 12 / 6 | 12 / 6 |
| Contadores: separación entre ellos y relleno | 8 / 12 | 12 / 16 |

**Alturas:**
- **Campos y botones:** 40 px.
- **Botones solo de icono:** 36 × 36 px. El mínimo de WCAG 2.2 AA (2.5.8) es 24 × 24.
- **Casilla:** 18 px.

## Radios

| Elemento | Radio |
|---|---|
| Tarjeta | 16 px |
| Contador | 14 px |
| Aviso del almacén, estado vacío y chip de materia oculta | 12 px |
| Campos, botones y botones de icono | 10 px |
| Etiqueta de estado y punto de materia | Redondos (999 px) |

## Sombras

| Elemento | Claro | Oscuro |
|---|---|---|
| Tarjeta y contador | `0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.4)` |
| Todo lo demás | Sin sombra | Sin sombra |

En modo oscuro la sombra casi no se ve; lo que separa la tarjeta del fondo es su `borde`.

## Iconos

Son de Lucide (`lucide-react` 1.57) con trazo de 2 px:
- **Junto a un texto:** el icono es decorativo y lleva `aria-hidden`.
- **Botones solo de icono:** llevan un nombre accesible, por ejemplo "Borrar Taller 3".

| Tamaño | Dónde |
|---|---|
| 14 px | Dentro de las etiquetas de estado |
| 16 px | Botones con texto y marca "Mi U" |
| 18 px | Botones solo de icono y contadores |
| 20 px | Título de cada tarjeta y aviso del almacén |
| 28 px | Estados vacíos, dentro de un círculo de 48 px |

| Uso | Icono |
|---|---|
| Entregas | `ClipboardList` |
| Clases virtuales | `Video` |
| Aula virtual (Moodle) | `GraduationCap` |
| Classroom | `School` |
| Drive | `FolderOpen` |
| Mis materias | `BookOpen` |
| Agregar y Guardar | `Plus` |
| Borrar entrega, quitar materia o enlace | `Trash` |
| Abrir enlace, Google Classroom o Google Drive | `ExternalLink` |
| Activar avisos del navegador | `BellRing` |
| Estados de entrega | Ver "Estados de las entregas" |
| Contadores | `CircleAlert`, `Clock` y `CalendarDays` |
| Editar y Listo (modo edición) | `Pencil` y `Check` |
| Mostrar una materia oculta y "todas ocultas" | `Eye` y `EyeOff` |
| Aviso del almacén | `TriangleAlert` |
| Estados vacíos | `ClipboardCheck` (Entregas), `BookPlus` (Mis materias y secciones de enlaces), `FolderPlus` (Drive) |
| Botón "Ir a Mis materias" | `ArrowDown` (los demás botones de estado vacío usan `Plus`) |
| Semana anterior, Esta semana y Semana siguiente | `ChevronLeft`, `CalendarCheck` y `ChevronRight` |
| Buscar entregas (dentro del campo), sin resultados y filtro vacío | `Search`, `SearchX` (botón `X`) y `ListFilter` |

## Movimiento

- **150 ms** para cambios de color, fondo, borde y sombra al pasar el puntero, enfocar o presionar.
- **200 ms** para el cambio de una entrega al marcarla como hecha.
- **Curva:** `cubic-bezier(0.2, 0, 0, 1)`.
- **Sin animación de posiciones.** Las filas no se desplazan con animación ni hay entradas animadas; la lista se reordena al instante, como ahora.
- **Con `prefers-reduced-motion: reduce`** se quitan todas las transiciones.

## Foco y teclado

- **Controles nativos.** Todos son nativos: botones, campos, lista desplegable y casillas. Tab los recorre en el orden visual y Espacio o Enter los activan. No hay controles hechos a mano.
- **Anillo de foco.** Es de 2 px en `foco`, separado 2 px del control (`outline` y `outline-offset`). Se ve en todos los controles cuando se navega con teclado (`:focus-visible`). En los campos, además, el borde pasa a `acento`.
- **Orden del recorrido:**
  1. Entregas: botón de avisos, formulario y lista (casilla y borrar).
  2. Clases virtuales.
  3. Aula virtual (Moodle).
  4. Classroom.
  5. Drive.
  6. Mis materias.
- **Estados vacíos.** Su botón lleva el foco al campo donde se empieza (ver "Estados vacíos").

## Estructura de la pantalla

### Encabezado

- **Marca.** "Mi U", con el ícono de la pestaña en 16 px.
- **Saludo según la hora de Bogotá.** Es el título principal de la página (`h1`):
  - de 5:00 a 11:59, "Buenos días";
  - de 12:00 a 18:59, "Buenas tardes";
  - de 19:00 a 4:59, "Buenas noches".
- **Fecha.** "Miércoles, 14 de octubre de 2026", en `tenue`.
- **Tres contadores.** Solo cuentan entregas pendientes:

| Contador | Qué cuenta | Icono | Color del icono |
|---|---|---|---|
| Vencidas | Estado "Vencida" | `CircleAlert` | `vencida` sobre `vencida-fondo` |
| Para hoy | Estado "Para hoy" | `Clock` | `hoy` sobre `hoy-fondo` |
| Próximos 7 días | Vencen de mañana en adelante, hasta 7 días de calendario ("Mañana" o "en 2…7 días"). No incluye vencidas ni para hoy. | `CalendarDays` | `acento` sobre `acento-suave` |

Detalles de los contadores:
- **Número y etiqueta.** El número va en `texto` y la etiqueta en `tenue`; el color de estado va solo en el icono.
- **En cero.** El icono pasa a `tenue` sobre `superficie`, para no mostrar una alarma roja cuando no hay nada vencido.
- **Sin acción.** Los contadores informan; no son botones (filtrar es parte de la hoja de ruta).
- **Disposición.** En escritorio, saludo y fecha van a la izquierda y los contadores a la derecha, en fila. En móvil todo va apilado y los contadores ocupan tres columnas iguales.

### Tarjetas y su orden

- **Orden.** El mismo de ahora: Entregas, Clases virtuales, Aula virtual (Moodle), Classroom, Drive y Mis materias.
- **Cabecera.** Cada tarjeta lleva su icono de 20 px en `acento`, el título y debajo la pista en `tenue`.
- **Escritorio (≥ 1024 px):** Entregas a todo el ancho; luego Clases virtuales, Moodle y Classroom en tres columnas; luego Drive y Mis materias en dos.
- **Tablet (768–1023 px):** dos columnas, con Entregas a todo el ancho.
- **Móvil (< 768 px):** una columna.

### Filas

| Fila | Contenido |
|---|---|
| Entrega | Casilla, título, línea secundaria (punto de materia, materia y fecha), etiqueta de estado y botón de borrar. La fecha nunca se parte: si no cabe, pasa entera a la línea siguiente. El nombre de la materia no se corta, y el separador "·" queda pegado a él para que nunca empiece una línea. En móvil la etiqueta baja debajo de la línea secundaria. |
| Enlace por materia | Punto y nombre arriba (cortado con puntos suspensivos y completo en el texto de ayuda); debajo, el campo y "Abrir". Va apilada en todos los tamaños: en escritorio estas tres tarjetas miden unos 290 px por dentro y en una sola línea cortarían casi todos los nombres. |
| Drive | Icono `FolderOpen`, nombre, "Abrir" y botón de quitar. |
| Materia | Punto, nombre y botón de quitar. |

Al pasar el puntero, la fila toma el fondo `superficie` en 150 ms.

### Formularios

- **Etiquetas visibles.** Cada campo lleva su etiqueta encima: "Materia", "Descripción" y "Fecha límite"; "Nombre" y "Enlace"; "Nueva materia". Los placeholders quedan solo como ejemplo, porque no sirven de etiqueta.
- **Formulario de entregas.** En escritorio va en una fila: Materia, Descripción (más ancha), Fecha límite y Agregar. En móvil va apilado.

### Estados vacíos

Van dentro de la tarjeta, en un recuadro con fondo `fondo` y radio de 12 px:
- círculo de 48 px en `acento-suave` con el icono de 28 px en `acento`;
- título de 15 px en peso 600;
- texto de 13 px en `tenue`;
- botón secundario.

| Dónde | Título | Texto | Botón y qué hace |
|---|---|---|---|
| Entregas sin entregas | Todavía no tienes entregas | Cuando agregues una, verás aquí cuánto falta para su fecha límite. | "Agregar entrega": lleva el foco a "Descripción" |
| Mis materias sin materias | Todavía no tienes materias | Agrégalas para organizar tus entregas y enlaces. | "Agregar materia": lleva el foco a "Nueva materia" |
| Clases virtuales, Moodle y Classroom sin materias | Primero agrega tus materias | Aquí aparecerá una fila por materia para guardar su enlace. | "Ir a Mis materias": lleva el foco a "Nueva materia" |
| Drive sin enlaces | Guarda aquí tus carpetas | Los enlaces que más usas quedan a un clic. | "Agregar enlace": lleva el foco a "Nombre" |

### Vista semanal

Es un bloque dentro de la tarjeta de Entregas, entre el formulario y la lista.
- **Semana.** Va de lunes a domingo, en días de calendario de Bogotá.
- **Título.** "Semana del 12 al 18 de octubre de 2026"; el mes y el año solo se repiten si cambian dentro de la semana.
- **Navegación.** Botones secundarios "Semana anterior", "Esta semana" y "Semana siguiente". En móvil, anterior y siguiente muestran solo la flecha, pero conservan su nombre accesible. "Esta semana" se deshabilita cuando ya se está en ella.
- **Días.** Siete columnas desde 1024 px; por debajo, cada día va apilado. Cada día tiene fondo `fondo` y muestra todas sus entregas, también las hechas: título, punto y nombre de la materia, etiqueta de estado y hora.
- **Hoy.** Fondo `acento-suave`, borde de 2 px en `acento`, la píldora "Hoy" y `aria-current="date"`, así que no depende solo del color.
- **Independencia.** Ni el filtro ni la búsqueda la afectan, y lo dice una línea de 12 px en `tenue` bajo el título: "Muestra todas las entregas de la semana: el filtro y la búsqueda solo cambian la lista de abajo."

### Filtro y búsqueda

Van entre la vista semanal y la lista.
- **Filtro.** Grupo de botones "Todas", "Pendientes", "Vencidas" y "Entregadas", con `aria-pressed` y la etiqueta visible "Filtrar por estado". Cada botón muestra cuántas entregas mostraría con la búsqueda actual.
  - Activo: fondo `acento` y texto `sobre-acento`.
  - Inactivo: fondo `tarjeta`, borde `borde-control` y el número en `tenue`.
- **Pendientes.** Son las que no están hechas ni vencidas (para hoy, mañana o en N días), así que los tres filtros reparten "Todas" sin solaparse.
- **Búsqueda.** Campo "Buscar entregas". Busca en la descripción y en el nombre de la materia, sin distinguir mayúsculas ni tildes; la "ñ" también cuenta como "n".
- **Sin resultados.** Estado vacío "Ninguna entrega coincide con la búsqueda", con "Limpiar búsqueda", que la borra y devuelve el foco al campo.
- **Filtro vacío.** Si el filtro no tiene entregas y no hay búsqueda, se muestra un estado vacío con "Ver todas".
- **Sin memoria.** Filtro y búsqueda viven en el estado de la pantalla y no se guardan al recargar.

### Aviso del almacén

Es una franja a todo el ancho, encima de las tarjetas:
- fondo `aviso-fondo`;
- icono `TriangleAlert` de 20 px en `aviso`;
- mensaje en `texto` de 14 px;
- radio de 12 px.

Conserva `role="alert"`, como ahora.

### Diálogo de confirmación

Se usa antes de quitar una materia, porque también borra sus enlaces y entregas, y antes de importar un respaldo, porque reemplaza todos los datos.
- **Aspecto.** Panel con el estilo de una tarjeta (fondo `tarjeta`, borde `borde`, radio de 16 px y su sombra), centrado sobre la página cubierta con `fondo` al 80 %.
- **Contenido.** Título de 18 px, explicación en `tenue` y dos botones: "Cancelar" (secundario) y la acción. "Quitar materia" va en botón de peligro (`peligro` sobre `peligro-suave`); "Importar" va en botón principal, porque antes se guarda una copia y se puede deshacer.
- **Teclado.** El foco empieza en "Cancelar", Tab no sale del diálogo y Esc lo cierra. Al cerrar, el foco vuelve al botón que lo abrió; si ese botón ya no existe, pasa a "Deshacer".

### Mensajes de error

Si falta un dato en un formulario (Entregas, Drive) o el archivo de respaldo no sirve, el mensaje aparece debajo, en la misma tarjeta: texto de 14 px en `peligro` con `role="alert"`. Se quita al cambiar un campo o al enviar bien. En el respaldo dice el motivo concreto, por ejemplo: Falta el campo "materias".

### Modo edición

Clases virtuales, Aula virtual (Moodle) y Classroom tienen un botón secundario "Editar" (`Pencil`) a la derecha del título, para quitar de esa sección las materias que no la usan. Si no hay materias, no aparece.
- **Estado de edición.** El botón pasa a "Listo" (`Check`) y el borde de la tarjeta pasa de `borde` a `acento` en 150 ms. La pista se reemplaza por "Quita una materia de esta sección. Su enlace se borra, pero la materia sigue en las demás.", unida a la tarjeta con `aria-describedby`. El relleno y el grosor del borde no cambian, así que la tarjeta no salta. Las filas y sus campos funcionan igual.
- **Botón de quitar.** Cada fila suma, después de "Abrir", un botón de icono `Trash` con el nombre "Quitar {materia} de {sección}". En reposo va en `tenue`; al pasar el puntero o al enfocarlo con el teclado, en `peligro` sobre `peligro-suave`. Abre el diálogo de confirmación con "Cancelar" y "Quitar". Al confirmar se borra el enlace de esa sección, la fila sale de la lista y el foco pasa a "Listo".
- **Ocultas aquí (N).** Solo en modo edición y si hay alguna, al final de la tarjeta y separada por una línea en `borde`. Cada materia es un chip (fondo `fondo`, borde `borde`) con su punto, su nombre y un botón secundario "Mostrar" (`Eye`). Al mostrarla vuelve a su lugar con el campo vacío, y el foco pasa a ese campo.
- **Todas ocultas.** En modo normal, un recuadro como el de los estados vacíos, con `EyeOff`, dice "Todas las materias están ocultas en esta sección. Usa Editar para mostrarlas de nuevo."
- **Datos.** Cada materia guarda en `ocultaEn` las secciones de las que se quitó. Sigue en las demás, en Entregas y en Mis materias; quitarla desde Mis materias la sigue borrando por completo.

## Pantallas de referencia

- **1100 px:** contenido de 1052 px de ancho (1100 menos 24 px por lado).
- **390 px:** una columna de 358 px. Nada produce scroll horizontal:
  - los nombres largos se cortan con puntos suspensivos;
  - las descripciones largas pasan a la línea siguiente;
  - los enlaces largos se desplazan dentro de su campo.

Se revisan las dos en modo claro y en modo oscuro.

## Fuera de este paso

Estas funciones quedan para el paso 5, si se quieren:
- elegir a mano el color de una materia;
- selector manual de modo claro u oscuro;
- contadores que filtren la lista de entregas.
