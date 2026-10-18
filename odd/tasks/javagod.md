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
| F2.5 | S12 | docs | Slug and redirect contract | pendiente |
| F3.1 | S4 | diagrams | Diagram primitives extracted from 3 real visualizations | pendiente |
| F4.1 | S3,S8 | content | Content production by chapter, with owner review per batch | pendiente |
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
