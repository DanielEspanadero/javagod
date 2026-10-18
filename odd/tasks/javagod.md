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
stays single: one page per topic, each declaring its minimum version. A version
switcher filters what the reader sees (hiding or marking content newer than the
selected version) and persists in `localStorage` plus a `?v=` query. It never
creates a parallel URL tree. Reading modes cover LTS releases only (8, 11, 17,
21, 25); non-LTS releases appear only in the `novedades` section. Canonical
examples use modern Java; differences for older releases are shown inline as
explicit "antes / desde" snippets, never as separate pages.

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
| F2.1 | S5 | docs | Documentation layout: nav tree, TOC, breadcrumbs, prev/next | hecho |
| F2.2 | S3 | docs | Content collection schema + section registry + first real chapter (Hello World) | hecho |
| F2.3 | S2 | docs | Prose styles: headings, code blocks with copy, callouts, tables | hecho |
| F2.4 | S9,S10 | tooling | Authoring scaffolder (`pnpm new:doc`) + build validation for content rules | hecho |
| F2.5 | S12 | docs | Slug and redirect contract | hecho |
| F3.1 | S4 | diagrams | Diagram primitives extracted from 3 real visualizations | hecho |
| F4.1 | S3,S8 | content | Content production by chapter, with owner review per batch | en curso |
| F4.2 | S11 | content | Version annotations (`since`) + "novedades por versión" section | pendiente |
| F4.3 | S16 | docs | Version reading mode: selector, `localStorage` + `?v=`, filtering | pendiente |
| F5.1 | S1,S3 | release | Search (Pagefind), Cloudflare deploy, 404, redirects | pendiente |

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
