# JavaGod — Visual Java documentation site

Static documentation site for Java, in Spanish, with illustrated and animated
diagrams. Reference for information architecture and presentation: angular.dev.

The previous attempt was deleted on request (see L5). This document starts the
project from an empty directory and is the only authoritative record of scope.

## Specs

S1: Static Astro site, no backend, deployable to Cloudflare Pages. Build must
stay reproducible with `pnpm install && pnpm build`.

S2: Native CSS design system organized as tokens / base / layout / page styles.
Every class used in markup must have a CSS rule; the build fails otherwise.

S3: Progressive but searchable. The site is read front to back as a course, and
any specific topic must be reachable directly (search + deep links + TOC).

S4: Illustrated diagrams as the core differentiator. Every diagram must be
readable as static SVG/HTML; animation is an enhancement layer, never the only
carrier of meaning, and must respect `prefers-reduced-motion`.

S5: Navigation and chrome modeled on angular.dev: sticky top bar with brand and
theme toggle, left nav tree, in-page TOC, breadcrumbs, previous/next.
Deliberately excluded: versioned docs and an in-browser code runner.

S6: The landing page ships before the documentation and must look polished on
its own ("una vista inicial muy pulida y que la gente alucine al verla").

S7: No dead links, ever. Nothing in the UI may point to a route that does not
exist. Placeholders are labeled as such, not rendered as broken links.

S8: Content language is Spain Spanish (español de España), addressed as `tú`.
No voseo, no Latin American regionalisms, no neutral-Spanish hedging. Code,
identifiers, and repository artifacts are English. Java baseline: 21 LTS, with
notes where 17 or 25 LTS differ.

S9: Content is data, navigation is derived. Adding a page must require creating
one Markdown file with valid frontmatter and nothing else: no component edit, no
sidebar edit, no manual index. Section titles and ordering live in a single
registry, never repeated per page.

S10: Every content rule is enforced by the build, not by discipline: missing or
invalid frontmatter, unknown section, duplicate order within a section, dead
links, and classes without CSS rules all fail the build.

S11: Java version evolution is handled by annotation, not duplication. One
canonical page per topic plus `since` metadata and a per-release "novedades"
section. A per-version content tree is explicitly rejected: it multiplies
maintenance cost by the number of supported releases.

S12: URLs are a public contract. The slug derives from the file path; renaming a
file requires an explicit redirect entry, never a silent break.

S13: The design system scales by composition: tokens for every value, reusable
components for repeated patterns, no page-specific CSS that another page cannot
reuse.

S14: Motion is narrative, not decoration. The landing choreographs an entrance
(staggered, orquestado, under ~800ms) and reveals each section as it enters the
viewport. Every animation must illustrate something about Java or guide
attention; loops that only add noise are rejected. No animation library: CSS
transitions plus one IntersectionObserver controller. Everything must be
disabled under `prefers-reduced-motion: reduce` and the page must remain
complete and readable with animation off.

S15: No em dashes (`\u2014`) or en dashes (`\u2013`) anywhere: not in published
copy, not in source comments. The build fails if one appears in any generated
page, naming the page and the surrounding text.

S16: Version support is a reading mode, not a content fork. Canonical content
stays single: one page per topic, each declaring the minimum version of the
topic itself, never the version of its newest example: a section that needs a
newer release is labelled with it inside the page, so the chapter keeps
existing for older readers. A version switcher filters what the reader sees
(hiding or marking content newer than the selected version) and persists in
`localStorage` plus a `?v=` query. It never creates a parallel URL tree.
Reading modes cover LTS releases only (8, 11, 17, 21, 25); non-LTS releases
appear only in the `novedades` section. Canonical examples use modern Java;
differences for older releases are shown inline as explicit "antes / desde"
snippets, never as separate pages.

S17: Commits carry no AI attribution. No `Co-authored-by` trailers, no tool
names, no signatures in the message; author and committer are always the
repository owner. A `commit-msg` hook rejects any commit message that violates
this, and the build does not depend on it.

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| F0.1 | S1,S2 | setup | Scaffold Astro 7, tsconfig, config, install | hecho |
| F0.2 | S2 | styles | Token system: color, fluid type, space, motion | hecho |
| F0.3 | S1,S2 | verify | Build audit: dead links, h1 count, orphan classes | hecho |
| F1.1 | S5,S6 | layout | Site shell: sticky header, brand, theme toggle, footer | hecho |
| F1.2 | S4,S6 | landing | Hero with animated JVM pipeline diagram | hecho |
| F1.3 | S3,S4 | landing | Progressive learning path section | hecho |
| F1.4 | S4,S6 | landing | Visualization showcase: animated thread states | hecho |
| F1.5 | S2,S6 | layout | Marca de JavaGod: logo en la cabecera y favicon | pendiente |
| F2.1 | S5 | docs | Documentation layout: nav tree, TOC, breadcrumbs, prev/next | hecho |
| F2.2 | S3 | docs | Content collection schema + section registry + first real chapter (Hello World) | hecho |
| F2.3 | S2 | docs | Prose styles: headings, code blocks with copy, callouts, tables | hecho |
| F2.4 | S9,S10 | tooling | Authoring scaffolder (`pnpm new:doc`) + build validation for content rules | hecho |
| F2.5 | S12 | docs | Slug and redirect contract | hecho |
| F3.1 | S4 | diagrams | Diagram primitives extracted from 3 real visualizations | hecho |
| F4.1 | S3,S8 | content | Content production by chapter, with owner review per batch | hecho |
| F4.2 | S11 | content | Version annotations (`since`) + "novedades por versión" section | hecho |
| F4.3 | S16 | docs | Version reading mode: selector, `localStorage` + `?v=`, filtering | hecho |
| F4.4 | S16 | content | `since` por capítulo: la versión del tema, no la del ejemplo | hecho |
| F5.1 | S3 | search | Búsqueda estática (Pagefind) con interfaz propia | hecho |
| F5.2 | S7 | docs | Página 404 propia | hecho |
| F5.3 | S1 | release | Deploy en Cloudflare Pages y documentación de la entrega | pendiente |
| F6.1 | S3,S8 | content | Objetos 1-2: clases y objetos, encapsulamiento | hecho |
| F6.2 | S3,S8 | content | Objetos 3-4: herencia y polimorfismo, interfaces | hecho |
| F6.3 | S3,S8 | content | Objetos 5-6: Object y sus contratos, records | hecho |
| F7.1 | S3,S8 | content | Colecciones 1-2: el marco de colecciones, listas | hecho |
| F7.2 | S3,S8 | content | Colecciones 3-4: conjuntos y el contrato de equals, mapas | hecho |
| F7.3 | S3,S8 | content | Colecciones 5-6: Stream, collectors y Optional | pendiente |

## Releases

| Tag | Contenido |
| --- | --- |
| `v0.1.0` | Base desplegable: portada con terminal, pipeline explorable, rail progresivo, simulador de hilos y auditoría de build |
| `v0.2.0` | Puente terminal-pipeline, tira de postura, cierre a ancho completo, atajo `/`, git flow, entornos y cabeceras de Cloudflare |

## Log

L1: (recovered from the deleted task file) Crear un proyecto desde cero llamado
javagod — documentación de Java lo más completa posible, visual y agradable.
Sitio web estático con visualizaciones animadas.

L2: Borra el proyecto y lo empezamos de cero. Lo empezó un modelo en local que no
es muy bueno y se ve que no lo hizo bien. Quiero una base para crear JavaGod

L3: te tiras media hora para borrar un puto repo. Si te digo todo fuera, es todo
fuera!

L4: Me gusta tu idea. El punto 1 te diría de hacer una mezcla de ambas, que sea
progresivo, pero si alguien busca algo en concreto que pueda encontrarlo con
facilidad. El punto 2 son diagramas ilustrados, aunque me gustaría meter
animaciones para hacer más agradable la página. Me gustaría que tomes como
referencia la web de https://angular.dev/ pero en lugar de angular, aplicarlo a
Java. El punto 3 te diría que sin backend ya que es más sencillo de desplegar,
aunque si crees que un backend puede aportar, lo miramos. Punto 4 tiraría de
cloudflare. Punto 5 lo escribes tú y yo te puedo ir guiando. Creo que lo mejor
para que quede bien es ir haciendolo por fases. Antes de la documentación estaría
bien tener una vista inicial muy pulida y que la gente alucine al verla. Que
opinas de todo esto?

L5: Everything under the project directory deleted on explicit request. The
directory was left empty: no git history, no node_modules, no prior specs.

L6: Tambien hay que pensar en la escalabilidad y la mantenibilidad ya que Java
seguirá sacando versiones y se irán agregando cosas nuevas a la web
constantemente. Tiene que ser sencillo agregar contenido nuevo

L7: Hmmm, me gusta el concepto, pero no me gusta como queda para la página
inicial. También quiero que está página esté en Español neutro. Me gustaría que
la página tuviera más animación cuando un usuario entra en ella y cuando haga
scroll. No se si entiendes el concepto de lo que quiero?

L8: Ahora sí, me va gustando más. Adapta los textos al español de españa y evita
el uso de guiones. No quiero ver ni uno en toda la web: —

L9: Ahora, en lugar de Java 21, quiero dar servicio a todas las versiones (si es
posible). O ves viable otra opción?

L10: Importante, no te pongas bajo ningún concepto como coautor

L11: Perfecto, arrancamos con los siguientes pasos

L12: Decisiones de diseño para F2.1 y F2.2. Las rutas son
`/docs/` (índice derivado del contenido) y `/docs/<seccion>/<pagina>/` (el slug
sale del path del archivo, S12). El registro de secciones vive en
`src/lib/sections.ts` y es la única fuente de títulos y orden; el schema de la
colección lo importa para validar `section` como enum. El frontmatter es
estricto: claves desconocidas (incluido `slug`) rompen el build, de modo que un
slug no puede divergir del path. El orden duplicado dentro de una sección
falla al construir, igual que una sección fuera del registro. La navegación se
deriva de las entradas existentes: una sección sin capítulos no aparece en el
árbol ni enlaza a nada, así que nunca hay links muertos (S7) ni sidebar vacía.

L13: Verificación de F2.1 y F2.2 sobre `pnpm build` (3 páginas, auditoría limpia):
orden, salto de sección, prev/next y estado activo comprobados con un capítulo
extra en una copia de scratch, no en el repo. Las cuatro reglas de contenido
fallan el build con un mensaje útil: orden duplicado, sección fuera del registro,
frontmatter incompleto y clave desconocida (`slug`).

L14: Evidencia de F2.1 y F2.2 en `d56b1d8` (`feat(docs): add documentation shell
with derived navigation and first chapter`). El corte de entrega de esta unidad
son 1106 líneas autoradas, de las que 499 son `src/styles/docs.css`: es la
primera hoja de estilos del área de documentación, no hay lógica duplicada. Si
la unidad se publica como PR, conviene partirla en dos cortes revisables:
plataforma de contenido (schema, registro, `src/lib`, capítulo) y capa de
presentación (layout, rutas, estilos). El siguiente corte arranca en F2.3.

L15: F2.3 cerrada. Los callouts son citas con marcador (`[!NOTA]`, `[!OJO]`,
`[!AVISO]`, `[!TRUCO]`) y un marcador desconocido rompe el build. Los bloques de
código ganan barra con etiqueta de lenguaje y botón de copiar, renderizados en el
build; el botón solo se muestra con JavaScript. Decisión de infraestructura: se
añade `@astrojs/markdown-remark` 7.3.3 como devDependency y el procesador pasa a
`unified()`, porque Astro 7 ya no instala el pipeline remark/rehype por defecto y
sin él no hay plugins que permitan mantener la autoría en Markdown puro (S9). Ese
rehype corre después de Shiki: el `<pre>` llega con `class` como string y con
`data-language`, no con `className` en array. Hallazgo operativo que costó tiempo:
la caché de HTML renderizado vive en `node_modules/.astro` y no se invalida al
cambiar el código de un plugin, solo al cambiar el archivo fuente; hay que borrarla
para verificar un cambio de pipeline. Queda en CONTRIBUTING.

L16: Evidencia de F2.3 en `40bb403` (`feat(docs): add prose styles, callouts and
copyable code blocks`). Corte de ~430 líneas autoradas sin contar el lockfile:
dos plugins, la hoja de estilos y el contenido. Aquí el corte sí cabe en la guía
de revisión; el lockfile suma 1276 líneas por la dependencia nueva y no se revisa
línea a línea. Siguiente corte: F2.4 (scaffolder `pnpm new:doc` y validación de
contenido en build).

L17: F2.4 cerrada. `pnpm new:doc <sección> <slug> --title "…" [--description "…"]`
escribe el capítulo con frontmatter válido, calcula el `order` siguiente leyendo solo
el bloque de frontmatter de la sección y se niega a sobrescribir. Falla con exit 1 y
mensaje útil en sección desconocida, slug que ya existe, slug fuera de kebab-case,
falta de `--title` y opción desconocida. El build gana una regla de colección: la
primera carpeta del path tiene que coincidir con el `section` declarado, así que un
archivo movido de sitio rompe el build en vez de generar una URL incoherente. Para
que el scaffolder pueda leer el registro sin duplicarlo ni pedir un loader de
TypeScript, `src/lib/sections.ts` pasa a `src/lib/sections.mjs` con tipos en JSDoc y
`allowJs` en tsconfig (corrige la ruta que nombra L12). Hallazgo del worker: el pager
emitía `pager__link--previous` sin regla CSS, algo que la auditoría no veía porque
con un solo capítulo no se renderiza; se añadió la regla y verifiqué la auditoría
con dos capítulos en scratch. Siguiente corte: F3.1 (primitivas de diagrama).

L18: Evidencia de F2.4 en `1766eb2` (`feat(tooling): add the docs scaffolder and
the section path rule`), 294 líneas autoradas. Verificación propia en scratch con
`cacheDir` aislado: scaffold de `fundamentos/tipos-primitivos` con `order 2`, build de
4 páginas y auditoría limpia, prev/next renderizados en ambos sentidos y el capítulo
nuevo enlazado desde `/docs/`; los cinco rechazos del scaffolder con exit 1 y sin
archivos de más; y el build roto al mover el capítulo a otra carpeta conservando su
`section`. Las carpetas de scratch y las cachés movidas por el worker quedaron
borradas. Corrección a L17: el siguiente corte es F2.5 (contrato de slugs y
redirects), no F3.1.

L19: Sobre la portada de documentación en un monitor de 27 pulgadas: "creo que hay
demasiado margen a los bordes en un monitor de 27 pulgadas" y "también me gusta el
menú que hay a la izquierda en la de Angular donde puedes elegir la versión, docs
tutoriales y demás. Arregla eso antes de seguir". Se cambia el shell de documentación
de contenedor centrado de 74rem a ancho completo: rail de 17rem pegado al borde
izquierdo, artículo de 54rem pegado al rail y TOC de 15rem a la derecha, con la
cabecera en variante ancha para que la marca quede alineada con el rail. La portada
conserva su contenedor. Se añade "Volver arriba" al TOC, como en la referencia. El
selector de versión queda pendiente de decisión: es S16 y necesita los metadatos
`since` de F4.2 más el filtrado de F4.3, y un selector que no filtra sería un control
que promete lo que no hace.

L20: F2.5 cerrada. `src/urls.json` es el manifiesto commiteado de lo publicado y
`scripts/check-urls.mjs` (sin dependencias) lo contrasta con `dist` y con
`public/_redirects` en cada build. Cuatro reglas, un mensaje cada una: una URL del
manifiesto que ya no se genera ni está cubierta por un redirect, un redirect que pisa
una ruta viva, un destino que no existe y una ruta generada sin registrar. `pnpm
urls:update` solo agrega: nunca borra una entrada y sigue validando después de
escribir, así que un renombrado no se tapa registrando el slug nuevo. Un renombrado
necesita las dos cosas: la línea 301 en `public/_redirects` y el slug nuevo registrado.
Decisión: una entrada del manifiesto se conserva mientras un redirect la cubra, porque
el archivo es el registro de lo que alguna vez se publicó, no la lista de lo que se
publica hoy. Verificado en scratch aislado: capítulo nuevo sin registrar falla, update
lo registra, renombrado falla, redirect más update quedan limpios, destino roto y
origen tapado fallan.

L22: F3.1 cerrada con una desviación deliberada del enunciado. Las tres visualizaciones de
la portada (terminal, pipeline con disclosures, simulador de hilos) comparten solo la
etiqueta mono y el conector: son piezas interactivas a medida, ya aprobadas, y forzarlas
dentro de una primitiva habría cambiado su aspecto sin ganar nada. Lo que sí faltaba era
un contrato para figuras estáticas de capítulo, así que `src/styles/diagram.css` define
las clases (`diagram`, `diagram--framed`, `diagram__label`, `diagram__flow`,
`diagram__node`, `diagram__index`, `diagram__title`, `diagram__value`, `diagram__hint`,
`diagram__caption`) y el capítulo de Hola, mundo estrena el primer diagrama real escrito
como HTML dentro del Markdown. Decisión: las primitivas son CSS y no componentes porque los
capítulos son `.md` y no pueden importar componentes; si más adelante hacen falta
componentes con lógica, el punto de decisión es F4.1 y pasa por MDX. Unificar la portada
con las primitivas queda fuera de alcance y sería un cambio visual aparte.

L23: Evidencia de F3.1 en `568cde8` (`feat(docs): add diagram primitives and the
first chapter diagram`), 195 líneas autoradas. Build limpio: 3 páginas, 172 clases en
markup contra 191 reglas, un solo `h1` por página, contrato de URLs intacto. El
diagrama del capítulo se genera como HTML estático dentro del `.md` (el CSS se inlinea
en la página), con conectores por CSS y sin JavaScript, y la fila pasa a columna por
debajo de 40rem. Antes del corte: `feature/docs-shell` mergeada a `develop` con `--no-ff`
(`3cd8f95`) y la rama borrada, según el flujo del repositorio.

L24: Índice acordado para Fundamentos, en orden de lectura: 1 Hola, mundo (ya
publicado), 2 Tipos primitivos, 3 Variables y constantes, 4 Operadores y expresiones,
5 Control de flujo, 6 Strings, 7 Arrays, 8 Métodos. El usuario prefiere corregir textos
antes que escribirlos ("si tengo que escribir yo a mano, me da algo... prefiero corregir
tus textos") y pide contrastar los datos para no alucinar. Primer lote publicado: los
capítulos 2 y 3. Datos verificados contra docs.oracle.com y openjdk.org antes de escribir
(tamaños y rangos JLS 4.2, literales, división JLS 15.17.2, desbordamiento silencioso JLS
4.2.2 y `Math.addExact`, `char` como tipo numérico JLS 5.6, cache de `Integer` JLS 5.1.7
con el matiz de que fuera de -128..127 no hay garantía, `var` JEP 286, `final`, autoboxing
y NPE al desboxar `null` JLS 5.1.8). Dos matices de la investigación aplicados al texto:
el tamaño de `boolean` no lo fija la especificación de la JVM, y el cache de `Integer`
solo está garantizado para expresiones constantes.

L25: Evidencia del primer lote de F4.1: `81f1928` (`feat(tooling): register the
chapter URL when scaffolding`) y `f761c11` (`feat(content): add tipos primitivos and
variables y constantes`). Build limpio con 5 rutas: auditoría con 179 clases en markup y
191 reglas, contrato de URLs limpio, pager anterior/siguiente correcto en los tres
capítulos, el diagrama de familias primitivas y la tabla de tamaños renderizados, cero
guiones largos o medios. En scratch se comprobó que el scaffolder registra la URL en
`src/urls.json` y sigue negándose a sobrescribir un capítulo existente. F4.1 sigue en
curso: quedan los capítulos 4 a 8 del índice.

L21: Evidencia de F2.5 en `dae5b2e` (`feat(tooling): enforce the published URL
contract on every build`), 347 líneas autoradas. Verificación propia en scratch con
`cacheDir` aislado: (1) capítulo nuevo generado sin registrar, build y check en rojo por
la regla del registro; (2) `--update` agrega la URL y el build queda verde con 4 rutas;
(3) renombrado sin redirect, rojo por URL desaparecida; (4) redirect 301 más `--update`,
verde; (5) destino inexistente, rojo; (6) origen tapado por una ruta viva, rojo. Las
carpetas de scratch y los restos en `/tmp` del worker quedaron borradas. La rama suma
2353 líneas en cinco unidades (shell, prosa, tooling de autoría, ancho completo y
contrato de URLs); para publicar, un PR encadenado por unidad.

L26: Segundo lote de F4.1: capítulos 4, 5 y 6 del índice (Operadores y expresiones, Control
de flujo, Strings). Los tres se escribieron en línea en la sesión principal: el guard del
writer exige una referencia `Spec: odd/tasks/javagod.md, T<n>` y este documento numera con
`F<n>`, así que la delegación se rechazó y no se reintentó. Datos contrastados antes de
escribir: JLS 15.17.3 (signo del resto), 15.18.2 (desbordamiento) y 15.19 (máscara de la
distancia de desplazamiento), 15.26.2 (cast implícito de la asignación compuesta), 14.21 y
14.22 (alcanzabilidad de `while(true)` y de `if(false)`), 14.15 y 14.16 (etiquetas sin saltos
no locales), JEP 441 (exhaustividad, `case null`, guardas `when`, dominancia), JEP 394
(patrón en `instanceof`), JLS 3.10.5 (literales internados), API de `String` de Java 21
(`strip` con `Character.isWhitespace` contra `trim` con `<= U+0020`, `isBlank`, `repeat`,
`lines`, `indent`, `formatted`, `join`, `split` con límite cero, `intern`, `compareTo`) y
JEP 378 (bloques de texto). Cada capítulo lleva un diagrama estático de las primitivas de
F3.1 y cierra con `Qué te llevas`, como los anteriores.

L27: Evidencia del segundo lote de F4.1: `517a3f0` (`feat(content): add the operators and
expressions chapter`), `2014458` (`feat(content): add the control flow chapter`) y `c4980db`
(`feat(content): add the strings chapter`). Cada commit lleva su capítulo y su línea en
`src/urls.json`, así que el contrato queda verde en cada corte y no solo en el último. Build
limpio con 8 rutas: auditoría con 180 clases en markup contra 191 reglas, 111 enlaces
internos, un solo `h1` por página, cero guiones largos o medios en el HTML. Contrato de URLs:
8 de 8 registradas y sin redirects. Revisión del HTML generado: los tres capítulos emiten su
`figure` (los valores del diagrama de Control de flujo llegan escapados como
`i &#x3C; nombres.size()`), una tabla en Operadores y otra en Strings, y los bloques de código
con su barra. F4.1 sigue en curso: quedan los capítulos 7 y 8 (Arrays, Métodos).

L28: Corte de entrega de la rama. `feature/diagram-primitives` suma 22 commits y 3666 líneas
autoradas desde `main`, muy por encima del corte revisable de ~400. Inventario por unidad,
en orden: contrato de URLs (F2.5), prosa y callouts (F2.3), scaffolder y regla de carpeta
(F2.4), shell de documentación (F2.1, F2.2), ancho completo del shell, primitivas de diagrama
(F3.1), primer lote de contenido (capítulos 2 y 3) y segundo lote (capítulos 4 a 6). La
entrega es un PR encadenado por unidad, no uno solo: cada eslabón es un corte verde con su
build, y los capítulos van con su línea de `src/urls.json` para que ningún eslabón rompa el
contrato. Esa decisión de publicación es del dueño del repositorio: aquí solo queda
registrada la frontera.

L29: Fallo visual reportado por el dueño: en los bloques de código se ve una línea en blanco
entre cada línea, aunque al copiar el texto sale bien. Causa: Shiki emite un `span.line` por
línea y los separa con un salto de línea real dentro de `<pre>`; con `white-space: pre` ese
salto ya es un salto de línea, y la regla `.astro-code .line { display: block }` añadía un
segundo, así que cada línea ocupaba dos renglones. La copia no se veía afectada porque el
botón escribe `pre.textContent`, que son los saltos del texto y no el layout. Arreglo en
`e083e57` (`fix(docs): stop doubling the line height in code blocks`): el `span.line` pasa a
`display: inline` con el porqué comentado. La regla se queda porque la auditoría exige una
regla para cada clase del markup, y aquí se cumplen las dos cosas con la misma declaración.
Lección para cualquier bloque de código futuro: en `<pre>` el salto de línea del HTML es el
salto de línea de la pantalla, y añadir `display: block` a los spans lo duplica.

L30: Tercer y último lote de F4.1: capítulos 7 (Arrays) y 8 (Métodos), con lo que el índice
acordado en L24 queda completo. Igual que el lote anterior, escritos en línea. Datos
contrastados antes de escribir: API de `java.util.Arrays` de Java 21 (quicksort de doble pivote
sin estabilidad para primitivos contra TimSort estable para objetos, precondición de
`binarySearch`, retorno `-(punto de inserción) - 1`, `copyOf` y `copyOfRange` con relleno,
`deepEquals` y `deepToString`, `asList` como vista de tamaño fijo con `set` permitido y `add`
rechazado), JLS 10.2 y 10.5 (covarianza, longitud inmutable, `ArrayStoreException`), JLS 10.3 y
10.4 (`length` como campo final y `ArrayIndexOutOfBoundsException`), JLS 8.4.1 (los parámetros
se inicializan con el valor de los argumentos), JLS 8.4.2 (la firma es nombre más tipos de
parámetro) y la estructura de §15.12.2 en tres fases (estricta, laxa con boxing, aridad
variable) con la elección del método más específico. Dos matices que quedaron en el texto: una
sobrecarga `int...` choca con su `int[]` porque la firma es la misma, y `f(null)` entre dos
tipos referencia es ambiguo en compilación.

L31: Evidencia del tercer lote de F4.1: `d3423c0` (`feat(content): add the arrays chapter`) y
`065d121` (`feat(content): add the methods chapter`), cada uno con su línea en `src/urls.json`.
Build limpio con 10 rutas: auditoría con 180 clases en markup contra 191 reglas, 161 enlaces
internos, un solo `h1` por página, cero guiones largos o medios. Contrato de URLs 10 de 10, sin
redirects. Revisión del HTML generado: un `figure` por capítulo con sus valores de diagrama
(`notas[i]`, `length - 1`, `ArrayIndexOutOfBoundsException` en Arrays; los tres nodos del paso
por valor en Métodos) y los bloques de código con su barra. Con esto F4.1 queda cerrado: los
ocho capítulos del índice están publicados y el siguiente corte es F4.2 (anotaciones `since` y
la sección de novedades por versión).

L32: El dueño pidió mirar el sitio con Playwright en vez de suponer. Monté un runner en
`/tmp/javagod-visual` (playwright 1.64.1 con el Chromium que ya estaba en la caché de
`ms-playwright`) con tres scripts: capturas de las 10 rutas en claro y oscuro y a 1440, 1024 y
390, un auditor que mide `scrollWidth` contra `clientWidth`, rectángulos que pasan el borde
teniendo en cuenta el contenedor con scroll, líneas por bloque de código y desbordes de los
nodos de diagrama, y un localizador del culpable que nombra el contenedor de cada hoja que se
sale. Resultado de la primera pasada: confirmado que el arreglo de L29 deja un renglón por
línea (relación 1.0 en las 10 rutas y los tres tamaños), y aparecieron dos bugs reales que
nadie había reportado. (1) Las tablas de Markdown no pueden encogerse por debajo de su
contenido y no tenían contenedor con scroll: en móvil `tipos-primitivos` medía 525 de ancho
contra 390, `strings` 508 y `hola-mundo` 398, o sea scroll horizontal de página entera. (2)
`.diagram__value` era un chip que se ajustaba al contenido, así que `ArrayIndexOutOfBoundsException`
medía 302 dentro de un nodo de 220 y en `arrays` a 1024 la página entera medía 1059.

L33: Arreglo en `caf253c` (`fix(docs): keep wide tables and long diagram values inside the
viewport`). Tablas: `src/lib/rehype-table-wrap.ts` envuelve cada `<table>` en `div.table-wrap`
en el build, registrado como último plugin de rehype, con `overflow-x: auto` y anillo de foco
porque el contenedor lleva `tabindex="0"` (un contenedor con scroll tiene que poder moverse sin
ratón); en pantallas estrechas la tabla usa `inline-size: max(100%, 40rem)` para que las
columnas no se aplasten y las filas no queden medio vacías, que era el primer intento y se veía
peor. Diagramas: `.diagram__value` gana `max-inline-size: 100%` y `overflow-wrap: anywhere`, así
que el chip conserva su marco y parte el identificador. Verificado con el auditor tras build en
frío: cero desbordes de página en las 10 rutas por 1440, 1024 y 390, y las dos líneas que
quedaban eran falsos positivos del propio auditor (los nodos non-últimos sumaban exactamente 16
píxeles por la flecha decorativa posicionada fuera de la caja, y las tablas ya estaban dentro de
su contenedor). El auditor quedó corregido para medir desborde horizontal real: cero problemas.

L34: F4.2, primera mitad (`88299a7`, `feat(docs): add version metadata and the chapter version
line`). `src/lib/versions.mjs` es el único registro de las LTS (8, 11, 17, 21, 25); el schema
exige `since` y admite `hasta`, los dos validados contra ese registro, y `assertContentRules`
gana la regla de que `hasta` no puede ser anterior a `since`, con mensaje que nombra archivo y
valores. Los ocho capítulos de Fundamentos declaran su versión, y la línea se ve bajo la
descripción. Decisión de semántica: `since` es la primera LTS en la que el capítulo se lee
entero tal como está escrito, no la versión en la que nació el tema. El worker subió
`hola-mundo` de 8 a 11 y lo verifiqué: el capítulo menciona el lanzador de archivo único
(JEP 330, Java 11), así que el valor alto es el correcto. Dos correcciones sobre lo entregado:
la línea de versión era texto suelto con un `·` decorativo delante, que se leía como una viñeta
huérfana, y pasó a chip como los demás datos mono del sitio; y el mensaje del schema decía "año
entero" para 8 y 11, que no son años. Cuatro rechazos probados en copias aparte con build en
rojo: falta `since`, `since: 9`, `hasta` menor que `since` y clave desconocida.

L35: Hueco que el worker no podía tocar y encontré al revisar: `scripts/new-doc.mjs` escribía
frontmatter sin `since`, así que el próximo capítulo generado no compilaba. Arreglo en
`c7a2041` (`feat(tooling): ask the scaffolder for the chapter version`): el scaffolder pide
`--since` obligatorio y `--hasta` opcional, valida los tres casos contra el registro de LTS
antes de escribir, y el `--hasta` menor que `--since` falla con su mensaje. Verificado en una
copia con `node_modules` por enlaces duros: los tres rechazos con exit 1, el caso feliz escribe
`since: 21`, y con `--hasta 25` el build genera el chip "Desde Java 11 hasta Java 25".
CONTRIBUTING quedó con los campos nuevos, el registro de LTS y la regla de qué rechaza el
build.

L36: F4.2, segunda mitad (`f42945a`, `feat(content): add the per-release novedades pages`).
Sección nueva `novedades` en el registro y una página por LTS (8, 11, 17, 21, 25), cada una con
`since` igual a su release: así el modo de lectura de F4.3 podrá ocultar la página de Java 25 a
quien lea en 17 sin inventar nada. Cada página tiene intro, las piezas que cambian el modelo
mental, un aviso de lo que se quedó por el camino, la tabla de JEP por área y el cierre de
siempre. Datos de `openjdk.org` para las cinco versiones, con las JEP de cada release y las
notas de retiradas y cambios de comportamiento; las JEP que el investigador no pudo confirmar
se dejaron fuera en vez de rellenarlas. Dos datos que verifiqué aparte antes de publicar:
`import module java.base;` es la sintaxis de la JEP 511 (no `import java.base.*;`) y los
archivos fuente compactos de la JEP 512 declaran la clase de forma implícita, admiten `main`
estático o de instancia con o sin `String[]`, e importan `java.base` solos. El sitio pasa de 10
a 15 rutas: auditoría limpia con 182 clases en markup contra 193 reglas, 15 de 15 URL en el
contrato, un `h1` por página y cero guiones largos o medios; el auditor temporal de Playwright
pasa las 15 rutas por 1440, 1024 y 390 sin un desborde.

L37: F4.3 cerrada (`c54db66`, `feat(docs): add the version reading mode`). El modo de
lectura es un `select` en `src/components/VersionSwitcher.astro` que se renderiza desde el
registro de LTS, encima del árbol del rail y encima de las tarjetas del índice. El estado vive
en `javagod:version` de `localStorage` y en un `?v=`; el query gana, un valor desconocido cae en
`all`, y al cambiar el selector la URL se reescribe con `history.replaceState`. La regla de qué
aplica está una sola vez (`appliesTo`) y la preguntan el árbol, las tarjetas, el pager y el
aviso. Se oculta con `hidden`, nunca borrando nodos, así que sin JavaScript la página está
completa; el control queda oculto bajo la clase `js` porque un selector que no filtra promete
lo que no hace. Un capítulo fuera del rango se sigue viendo y avisa sobre la prosa con su rango,
la versión en lectura y un botón que salta al límite más cercano. Contrato para superficies
nuevas: `data-since`/`data-hasta` del frontmatter más `data-version-item` en lo que se oculta.
Verificado con Playwright sobre `dist` en 9 casos: (a) carga limpia con las 13 entradas
visibles, sin aviso y sin nada guardado; (b) Java 17 esconde `java-25`, `java-21` y
`control-de-flujo` del árbol y del índice, y el pager de `java-17` deja de ofrecer `java-21`
manteniendo el anterior; (c) `/docs/novedades/java-25/?v=17` muestra el aviso con las dos
versiones y el botón pasa a 25, guarda y actualiza la URL; (d) `arrays?v=11` aplica sin aviso
con `variables-y-constantes` visible y `control-de-flujo` oculto; (e) `?v=99` y `?v=abc` caen
en "todas" aunque haya un 11 guardado; (f) el 11 guardado sobrevive a una recarga sin query y
avisa en `control-de-flujo`; (g) sin JavaScript las 13 entradas están visibles, no hay aviso y
el control no se ve; extra: con los dos enlaces del pager ocultos desaparece la barra entera.
Build y auditoría limpias: 15 rutas, 321 enlaces, 188 clases en markup contra 199 reglas, un
`h1` por página, contrato de URLs intacto y cero desbordes en las 15 rutas por 1440, 1024 y 390.
La rama `feature/version-reading-mode` va por su primera unidad; con la deuda de la rama
anterior ya mergeada, la entrega (PR encadenado por unidad) sigue siendo decisión del dueño.

L38: F5.2 cerrada (`0bb7087`, `feat(docs): add a not-found page`). `src/pages/404.astro`
genera `dist/404.html`, que es lo que Cloudflare Pages sirve para una ruta que no existe; sus
estilos viven en `layout.css` con el resto del shell. Verificado sobre `dist`: una ruta
inventada (`/docs/fundamentos/no-existe/`) responde 404 con la página nueva, un solo `h1`, los
dos enlaces seguros (`/docs/` y `/`) y cero enlaces rotos. La auditoría y el contrato de URLs
no cuentan el 404 como ruta publicada, así que no hay nada que registrar en `src/urls.json`.

L39: F5.1 cerrada en dos unidades (`d7420d0`, `feat(search): index the chapters with Pagefind`;
`9367480`, `feat(search): add the search dialog to the header`). Pagefind 1.5.2 como
devDependency: el build encadena `astro build`, `pagefind --site dist --force-language es`,
auditoría y contrato de URLs, y `pnpm search:index` reindexa sin recompilar. Solo el artículo
del capítulo lleva `data-pagefind-body`, así que se indexan 13 páginas (las de capítulo) y
quedan fuera la portada, el índice y el 404; el chrome se marca con `data-pagefind-ignore` y el
`h1` con `data-pagefind-meta="title"`. El diálogo es propio en `src/components/SiteSearch.astro`
más `src/styles/search.css`, con Pagefind solo como índice y runtime: se carga en la primera
apertura, la escritura va con debounce de 140 ms y cada consulta lleva token para que una
respuesta lenta no pise otra nueva. `Cmd`/`Ctrl`+`K` abre y cierra; `/` sigue libre para el
terminal de la portada. Trampa encontrada en `pnpm dev`: Vite 8 resuelve un `import()` con
literal aunque lleve `@vite-ignore` y rompía el arranque con "Failed to resolve import
/pagefind/pagefind.js", así que la ruta del bundle pasa por una variable. Verificado con
Playwright sobre el build servido: (1) el control abre el diálogo, "ArrayList" encuentra Arrays
con el término resaltado y el resultado navega al capítulo; (2) `Cmd+K` abre y enfoca, `Esc`
cierra, `Ctrl+K` reabre y el botón cierra; (3) consulta vacía deja la pista, una palabra
inexistente da "Sin resultados" y vaciar restaura la pista; (4) a 390 px el control queda en
icono, sin desborde horizontal y el diálogo entra en el viewport y encuentra "hilos"; (5) sin
JavaScript no hay control usable ni diálogo; (6) la ruta inventada sirve el 404; (7) ningún
resultado apunta a la portada ni al índice. En dev y sin índice el diálogo avisa que la
búsqueda no está disponible en ese build. Auditoría limpia (16 páginas, 209 clases en markup
contra 357 reglas) y las 15 rutas del contrato pasan el auditor visual por 1440, 1024 y 390 sin
desbordes.

L40: F5.3 queda pendiente y no se puede cerrar desde el repositorio: el proyecto no tiene
remoto git configurado y el deploy en Cloudflare Pages necesita la cuenta y las credenciales del
dueño (producción desde `main`, previews por rama, `JAVAGOD_SITE_URL` en producción, que es lo
que ya describe `CONTRIBUTING` en "Entornos"). Los dos redirects y las cabeceras ya están en
`public/` y el contrato de URLs los valida en cada build, así que la parte de configuración
estática está lista: falta conectar el repositorio y el dominio. Decisión pendiente del dueño.

L41: Corrección del enunciado de S16 por indicación del dueño: "Está bien, pero hay cosas que
desaparecen en algunas versines que tienen que estar, revisa eso. Por ejemplo en Java 8
desaparece el hola mundo". La causa no estaba en el modo de lectura sino en los datos y en la
regla que los guiaba: `CONTRIBUTING` decía que `since` era "la primera versión LTS en la que el
capítulo se lee entero tal como está escrito" y que el valor subía si el texto usaba `var` o
bloques de texto. Así, cinco capítulos declaraban la versión de su feature más moderna:
Hola, mundo 11 (sin nada de 11 dentro), variables 11 por `var`, operadores 17 por el patrón de
`instanceof`, strings 17 por los bloques de texto y control de flujo 21 por el `switch` moderno.
Leídos en Java 8 desaparecía el capítulo entero, incluida la primera página del sitio. Lo
corregido: `since` declara la versión del tema (los ocho de Fundamentos pasan a 8) y la feature
nueva se queda donde ya estaba, anotada en su sección. Dos muestras necesitaban el mismo
tratamiento para que un lector de Java 8 nunca vea código que no compila sin etiqueta: el
ejemplo de `final` usa tipo explícito en vez de `final var`, y en strings el consejo de
`parseInt` admite `trim()` antes de Java 11 y la tabla marca `lines()` como Java 11. El
enunciado de S16 recoge la regla (la versión mínima del tema, no la del ejemplo más moderno) y
el bullet de `since` en CONTRIBUTING la explica con el motivo: un hueco es peor que una
anotación. Verificado con Playwright sobre `dist`: con Java 8 se ven los ocho capítulos de
Fundamentos, `Hola, mundo` incluido, con chip "Desde Java 8", sin aviso, y en Novedades solo
`java-8`; el índice muestra las ocho tarjetas más las tres secciones pendientes y `java-8`, con
las cuatro versiones nuevas ocultas; con Java 17 se ven los ocho más Novedades 8, 11 y 17 y el
pager sigue ofreciendo el capítulo siguiente; `/docs/novedades/java-25/?v=8` sigue avisando y
ofreciendo el salto a 25. Comprobado además que el mecanismo no se rompió con los datos nuevos:
el modo guardado sobrevive a una recarga sin query, `?v=abc` cae en "todas" conservando el 8
guardado, `java-17` leído como 11 avisa con las dos versiones y leído como 17 no dice nada,
`java-21` leído como 8 esconde los dos enlaces del pager y la barra entera, y sin JavaScript el
árbol está completo con las 13 entradas y sin control. Build, auditoría y contrato de URLs
limpios. El caso (b) de L37 usaba `control-de-flujo` como ejemplo de capítulo oculto y ya no
aplica: ahora se ocultan solo las páginas de `novedades` posteriores a la versión elegida.

L42: "si, mergea a develop, borra landing-stance y continuamos". `feature/release-and-search`
mergeada a `develop` con `--no-ff` (`b457aab`) y borrada en local y en remoto; `feature/landing-stance`
borrada en local y en remoto. `develop` queda publicado (`b457aab`) y el remoto ya solo tiene
`main` y `develop`. Rama nueva para contenido: `feature/oop-chapters` desde `develop`. Índice
propuesto para Orientación a Objetos (pendiente de revisión del dueño, como en L24): 1 Clases y
objetos; 2 Encapsulamiento y modificadores de acceso; 3 Herencia y polimorfismo; 4 Interfaces y
abstracción; 5 Object y sus contratos; 6 Records y clases de datos. Primer lote: capítulos 1 y 2.

L43: F6.1 cerrada en dos unidades, `3968dac` (`feat(content): add the clases y objetos chapter`)
y `d19d389` (`feat(content): add the encapsulamiento chapter`). Los dos capítulos se escribieron
en paralelo con dos `gentle-ai-worker` de superficie disjunta, con el encargo de leer
`arrays.md` como plantilla y `diagram.css` como único catálogo de clases; ninguno tocó el build
ni `src/urls.json`, y el manifiesto lo registré yo con `pnpm urls:update` después. Revisión del
padre antes de commitear, cuatro correcciones en el capítulo 1 y dos en el 2. En `clases-y-objetos`:
una línea que explica por qué la primera `Cuenta` no lleva modificadores y remite a
encapsulamiento; el mensaje de `NullPointerException` que nombra el acceso es de Java 14 (JEP
358), no de "JVM modernas"; `finalize` es obsoleto desde Java 9, con su versión; y una clase cuyo
inicializador estático falla queda errónea, así que los usos siguientes dan
`NoClassDefFoundError`, no solo "inservible". En `encapsulamiento`: el ejemplo de `protected`
recibía `Producto` sin calificar, que no compila por un motivo distinto del que enseña la sección
(ahora es `tienda.Producto`), y `vender` daba el mensaje de "no hay stock" también para unidades
no positivas (ahora son dos comprobaciones con su mensaje). Datos verificados: `Math.addExact` es
de Java 8, `List.copyOf` de Java 10 (contrastado con el `@since` del JDK), la regla de `protected`
es la de JLS 6.6.2, y el recolector se explicó por alcanzabilidad, sin afirmar cuándo recoge.
Verificado con Playwright sobre `dist`: (1) `clases-y-objetos` con un `h1`, chip "Desde Java 8",
migas "Orientación a Objetos", nueve apartados, diagrama de tres nodos, TOC de nueve entradas,
pager anterior Métodos y siguiente Encapsulamiento; (2) `encapsulamiento` con nueve apartados,
diagrama de cuatro nodos, enlace a variables y constantes resuelto y pager que llega a Java 8;
(3) el índice lista Objetos con sus dos capítulos y sin marca de pendiente, y el árbol enlaza
los dos; (4) con `?v=8` los dos aplican sin aviso y la búsqueda devuelve encapsulamiento al
buscar "invariante"; (5) a 390 px los cuatro nodos del diagrama entran apilados y la tabla de
accesos vive en su contenedor con scroll, sin desborde del documento. Dos expectativas de la
prueba estaban mal y se corrigieron: el árbol no existe en el índice (hay que mirarlo en un
capítulo) y la tabla ancha se mide por su contenedor, no por la tabla. Build completo: 18
páginas, 15 indexadas, auditoría limpia con 209 clases en markup contra 356 reglas y 17 de 17
URL en el contrato. El índice propuesto en L42 sigue pendiente de revisión del dueño: los
capítulos 3 a 6 (herencia y polimorfismo, interfaces, Object, records) son F6.2 y F6.3.

L44: Renombrada la sección a "Programación Orientada a Objetos" a propuesta del dueño ("Me
gustaría cambiar el título por Programación Orientada a Objetos (POO) que yo creo que es más
estandard, no crees?"). Decisión: el título lleva el nombre completo y las siglas quedan fuera
del rótulo, porque se repite en cuatro superficies (árbol, migas, índice y pager) y alargaría una
etiqueta que hoy es corta como sus vecinas; el acrónimo vive en el resumen de la sección y en el
primer párrafo del capítulo 1, que es lo que además indexa Pagefind. El id sigue siendo `objetos`
y las URLs no cambian (S12). De paso, la portada dejó de duplicar los cuatro títulos de sección:
`src/pages/index.astro` los lee del registro con `findSection` (S9), y eso corrigió un
"Collections & Streams" que no coincidía con el registro. Verificado en navegador a 1440 y 390:
el título completo entra en el rail partido en dos líneas sin desbordar, migas y eyebrow lo
llevan, el índice y la portada muestran el nombre del registro, y buscar "POO" llega al capítulo
de clases y objetos. Build y auditoría limpios.

L45: Dos arreglos pedidos por el dueño en la misma tanda ("Justo te iba a decir eso, lo veía
incompleto. Que se entienda que las propiedades de la POO son esas", y después "Me gusta tu
planteamiento, adelante"). Primero, la portada dejó de mentir: cada paso del recorrido saca su
chip del contenido con `groupDocs(await getDocs())`, así que una sección con capítulos enlaza a
su ancla del índice (`/docs/#objetos`) y dice cuántos son, y una sin capítulos mantiene "En
preparación". Los dos estados además intercambiaron el énfasis: el disponible lleva el acento
relleno y el pendiente queda con borde discontinuo y texto apagado, porque antes destacaba más lo
que falta que lo que se puede leer. Segundo, los cuatro pilares quedaron explícitos: el resumen
de la sección en el registro dice "Clases y objetos, y los cuatro pilares: encapsulamiento,
herencia, polimorfismo y abstracción", y el capítulo 1 cierra con un apartado "Los cuatro
pilares" con un diagrama de cuatro nodos que da a cada propiedad su palabra clave (`private`,
`extends`, `@Override`, `interface`) y el capítulo donde se cubre, más la aclaración de que los
records no son un quinto pilar. Verificado con Playwright en 1440 y 390: la portada muestra "8
capítulos" y "2 capítulos" como enlaces y deja "En preparación" en Collections y Concurrencia, el
chip lleva a `/docs/#objetos` y deja a la vista las dos tarjetas, el capítulo 1 tiene el apartado
en el TOC, el diagrama con las cuatro propiedades y el resumen del índice nombra los pilares, sin
desbordes en ninguno de los dos anchos. Build y auditoría limpios (18 páginas, 408 enlaces
internos, 210 clases en markup contra 357 reglas).

L46: F6.2 cerrada en dos unidades, `ab022e5` (`feat(content): add the inheritance and polymorphism
chapter`) y `75b5942` (`feat(content): add the interfaces and abstraction chapter`). Otra vez dos
`gentle-ai-worker` en paralelo con superficies disjuntas y el mismo encargo de plantilla; el de
interfaces leyó el de herencia en cuanto apareció para no solapar el `instanceof` ni el despacho
polimórfico, y así quedó. Revisión del padre: el capítulo 3 no necesitó correcciones de datos (el
`super()` implícito, la ocultación de campos frente a la sobrescritura de métodos, los `static`
que se eligen por el tipo declarado, el orden de inicialización cuando el constructor del padre
llama a un método sobrescrito y la regla covariante del retorno están bien); en el 4 corregí dos
cosas: `@FunctionalInterface` admite los métodos públicos de `Object` además de ignorar `default`
y `static`, y el ejemplo llamaba `cuenta.titular()`, un accesor que el capítulo 1 no exponía, así
que lo agregué a la `Cuenta` final del capítulo 1 (viaja en el commit del capítulo 4 por ser su
motivo). Datos contrastados de la tanda: `default`, `static` en interfaces y las lambdas son Java
8; los métodos `private` de interfaz son Java 9; el patrón de `instanceof` es Java 16; las reglas
de conflicto de `default` son las tres de JLS 9.4.1.3 (gana la clase, después la interfaz más
específica, y sin ganador hay que sobrescribir) y `Interfaz.super.metodo()` solo vale con una
superinterfaz directa. Verificado con Playwright sobre `dist`: los cuatro capítulos de la sección
renderizan con un `h1`, chip "Desde Java 8", sus diagramas (2 figuras y 3 nodos en el primero,
una de 4 y una de 3 en los demás) y TOC de 9 a 10 entradas; el pager encadena Métodos, clases,
encapsulamiento, herencia, interfaces y Java 8; a 390 px ningún capítulo desborda, todos los nodos
de diagrama entran y las tablas quedan dentro de su contenedor con scroll; árbol, índice y portada
coinciden en los cuatro capítulos (el chip de la portada ya dice "4 capítulos"); con `?v=8` no se
oculta ninguno y la búsqueda encuentra herencia al buscar "polimorfismo". Build completo: 20
páginas, 17 indexadas, 19 de 19 URL en el contrato, auditoría limpia con 210 clases en markup
contra 357 reglas. La sección queda a falta de F6.3 (Object y records).

L47: F6.3 cerrada en dos unidades, `bcb181c` (`feat(content): add the Object contracts chapter`) y
`2bab9f9` (`feat(content): add the records chapter`), con la sección Programación Orientada a
Objetos completa en seis capítulos. Tercer lote de dos `gentle-ai-worker` en paralelo: el de records
leyó el de Object en cuanto apareció y aplicó sus reglas en vez de repetirlas. Revisión del padre:
en el capítulo 5 solo cayeron dos retoques de redacción (la celda de `hashCode` decía "un entero que
decide la implementación", que se lee al revés, y "de ella dependen `instanceof` y los `cast`"
insinuaba una llamada que no existe); el resto verificado: plegado de literales de `String`, la
asimetría `teclado.equals(rebajado)` / `rebajado.equals(teclado)` por el `instanceof` de cada clase,
las tres reglas de `hashCode`, el `HashMap` que guarda la clave y devuelve `null` con `size 1`, el
`equals` paso a paso y el intercambio `getClass()` / `instanceof` sin veredicto. En el capítulo 6
corregí la costura de apertura: la excepción del capítulo 2 es el campo público, así que el texto
ahora dice que la alternativa sin trampa pide cinco piezas. Decisión de datos de este lote, la
primera vez que la restricción de LTS muerde: records son estándar desde Java 16, pero `since` solo
admite LTS, así que la página declara `since: 17` y el cuerpo lo explica (vista previa en 14 y 15,
estándar en 16, esta página desde 17). Es exactamente lo que pide la regla corregida en F4.4: el
valor describe el tema y la lectura va por LTS. El worker comprobó los ejemplos con `javac 21.0.10`
en `/tmp`: imprimen lo que dicen sus comentarios, y los rechazos (`private int z` en un record,
`extends` en la cabecera, `this.x = x` en el constructor compacto) dan los errores esperados.
Verificado con Playwright sobre `dist`: (1) los seis capítulos renderizan con un `h1`, chip correcto
(Java 8 en los cinco primeros, Java 17 en records), sus diagramas y TOC de 9 a 11 entradas, y el
pager encadena Métodos, clases, encapsulamiento, herencia, interfaces, Object, records y Java 8;
(2) el modo de lectura esconde records con `?v=8` y `?v=11`, lo muestra desde 17, y deja Object
visible en las cinco versiones; (3) `/docs/objetos/records/?v=8` avisa con las dos versiones y
ofrece el salto a 17; (4) a 390 px los dos capítulos nuevos no desbordan, con diagramas y tablas
contenidos; (5) árbol, índice (6 tarjetas), chip de la portada ("6 capítulos") y búsqueda coinciden,
y "constructor compacto" encuentra records. Build: 22 páginas, 19 indexadas, 21 de 21 URL en el
contrato, auditoría limpia con 210 clases en markup contra 357 reglas.

L48: "buenas, continuamos con las tareas correspondientes. Abre una rama desde dev y dale caña.
Abierta `feature/collections-streams` desde `develop` y empezada la sección `colecciones`
("Collections y Streams", la tercera del registro). F5.3 sigue pendiente y no entra aquí: no se
puede cerrar desde el repositorio porque el proyecto de Cloudflare todavía no existe (L40). Índice
acordado para la sección, en orden de lectura: 1 El marco de colecciones, 2 Listas: orden e índice,
3 Conjuntos y el contrato de equals, 4 Mapas: claves y valores, 5 Stream: el pipeline perezoso,
6 Collectors, Optional y agregación. Los seis declaran `since: 8` porque el tema (el marco de
colecciones, Stream y Optional) nace en Java 8; las APIs posteriores que aparezcan en los ejemplos
(`List.of` y `Map.of` de Java 9, `List.copyOf` de Java 10, `Stream.toList` de Java 16) se etiquetan
dentro del cuerpo, nunca suben el `since`, que es la regla de F4.4. Tres lotes de dos capítulos, con
dos `gentle-ai-worker` en paralelo por lote y superficies disjuntas, como en la sección anterior: el
capítulo 1 fija el vocabulario y los demás lo leen en vez de repetirlo. Las seis unidades llevan
además numeración de entrega T1 a T6: T1 el marco de colecciones y T2 listas (F7.1), T3 conjuntos y
T4 mapas (F7.2), T5 Stream y T6 collectors y Optional (F7.3).

L49: "Tengo un logo de Javagod que puede encajar bien en la web, te lo paso por aquí:
/Users/daniel/Downloads/Java cup with golden halo.png". El original es un PNG de 1254 px con
transparencia, con el dibujo casi a sangre (caja 1201x1211). Decisión: va a la marca de la cabecera
(`SiteHeader.astro`), en el hueco del cuadro con la "J", y sustituye al favicon SVG, que se retira.
En el repo quedan solo dos assets recortados y reducidos: `public/logo.png` de 256 px (cabecera a
`--badge-size`, `object-fit: contain`) y `public/favicon.png` de 64 px. No se versiona el original de
1254 px ni se generan en build. La imagen lleva `alt` vacío porque el nombre ya lo pone la palabra
`JavaGod` al lado. El logo no recolorea con el tema: azules, naranjas y halo amarillo se leen sobre
claro y sobre oscuro. Queda documentado en CONTRIBUTING ("Marca y logo").

L50: F7.1 cerrada en dos unidades, `ab21dbb` (`feat(content): add the collections framework
chapter`) y `5d45ff3` (`feat(content): add the lists chapter`), de 268 y 251 líneas. Dos
`gentle-ai-worker` en paralelo; el de listas leyó el de marco de colecciones en cuanto apareció y se
apoyó en él en vez de repetir la jerarquía. Revisión del padre: quité de la unidad 1 la tabla de
sobrecargas de `remove`, que tiene su propia sección en la unidad 2 y dejaba al capítulo 1 compitiendo
con el 2; alineé el cierre de las dos unidades (`## Lo que viene` antes de `## Qué te llevas`) y
sustituí en la unidad 2 el ejemplo de borrado durante la iteración, duplicado del capítulo 1, por un
recordatorio que remite a él. Correcciones de precisión en la unidad 2: el ejemplo de capacidad
declara `ArrayList` porque `ensureCapacity` no está en `List` y ahora lo dice; la relación entre
estabilidad y `thenComparing` estaba al revés (la estabilidad permite ordenar dos veces; componer es la
alternativa, no la razón de que el método exista); y la ventaja de `null` de `LinkedList` es frente a
`ArrayDeque`, no frente a `ArrayList`. Verificación: los 11 bloques Java de las dos unidades
compilados y ejecutados con `javac 21.0.10`; los rechazos del texto (`List<Object> = ArrayList<String>`,
`List<int>`, `instanceof List<String>`, `Set.get`, `Set.of` con duplicado, `Map.of` con clave
duplicada, `List.of` con `null`) dan el error o la excepción que anuncian. Playwright sobre `dist` en
1440 y 390: los dos capítulos renderizan con un `h1`, chip "Desde Java 8", figuras de 6 y 3 nodos,
TOC de 10 entradas y el pager encadenado; a 390 px el capítulo 2 desbordaba a 547 px por un `code` en
línea de 526 px, y se arregló en `docs.css` con `.prose :not(pre) > code { overflow-wrap: anywhere }`,
así que las dos páginas quedan en 390 exactos (el código de bloque no cambia: su `pre` scrollea).
Build: 24 páginas, 21 indexadas, 23 de 23 URL en el contrato, auditoría limpia con 210 clases en
markup contra 357 reglas. Corte de entrega de la rama hasta aquí: cuatro commits, de los que dos son
los capítulos (268 y 251 líneas) y uno la marca (`1deb58e`, 33 líneas más los dos PNG); el commit de
spec (`744d480`, 18 líneas) abre el lote. Nada supera el corte de 400 líneas autoradas.

L51: F7.2 cerrada en dos unidades, `4eceda5` (`feat(content): add the sets chapter`) y `dfe8829`
(`feat(content): add the maps chapter`), de 281 y 279 líneas, con dos `gentle-ai-worker` en paralelo.
Hallazgo del worker de conjuntos que corrige mi enunciado: con un comparador incoherente con `equals`,
un `TreeSet` NO guarda las dos grafías, guarda una y `contains` contesta `true` para la otra; el texto
quedó con el comportamiento observado, que es el que se comprobó ejecutando
`String.CASE_INSENSITIVE_ORDER`. Revisión del padre en los conjuntos: la frase de `headSet` y `tailSet`
decía que los dos excluyen el límite y contradecía el ejemplo de arriba (`tailSet(6)` incluye el 6); el
árbol rojo-negro del cubo quedó precisado con las dos condiciones (tabla de 64 cubos y cubo de ocho
entradas); el coste de `LinkedHashSet` decía a la vez "lo mismo" y "un poco más"; y "el que viene
ahora" quedó sustituido por el criterio explícito. En los mapas solo cayó el género de "caché". Datos
contrastados en esta tanda: `HashSet` con 16 cubos, factor 0,75 y umbral 12 comprobado con reflexión
sobre el JDK 21; `TreeMap.put(null)` con orden natural da NPE; `compute`, `computeIfPresent` y `merge`
borran la pareja cuando la función devuelve `null`; `putIfAbsent` trata como ausente un valor `null`;
`Map.of` llega a diez parejas y `Map.ofEntries` no tiene tope; `Set.copyOf` descarta duplicados y
`Set.of` los rechaza; una clave o un elemento mutado deja de encontrarse sin excepción. Playwright
sobre `dist` en 1440 y 390: los dos capítulos renderizan con un `h1`, chip "Desde Java 8", figura de
tres nodos, TOC de 12 y 11 entradas, árbol de 23 enlaces, y ninguno desborda (390 exactos). Build: 26
páginas, 23 indexadas, 25 de 25 URL en el contrato, auditoría limpia con 210 clases en markup contra
357 reglas. Corte de entrega: dos commits de ~280 líneas cada uno, por debajo del límite de 400.
