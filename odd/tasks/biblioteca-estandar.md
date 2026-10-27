# JavaGod — Biblioteca estándar y autoría de la portada

Second documentation wave over the deployed site: the JDK APIs the course never
mentioned (dates first) plus the owner's name and channel in the shared footer.
Specs continue the project numbering from `odd/tasks/javagod.md` (S1 to S17).

## Specs

S18: A sixth section is added to the registry as `biblioteca`, titled
"Biblioteca estándar", placed after `concurrencia` and before `novedades`. It
appears in the docs index, the sidebar tree, breadcrumbs and the pager with no
component edit (S9), and its chapters follow the reading order derived from the
registry.

S19: The section publishes six chapters, each declaring `since: 8` because the
`java.time` and `java.nio.file` APIs used are the Java 8 shape (newer syntax
inside a chapter is labelled inline, never a reason to raise `since`, S16):
`fechas-java-time`, `zonas-horarias`, `duraciones-y-aritmetica`,
`formato-de-fechas`, `bigdecimal` and `archivos-nio`. Every chapter follows the
content rules of S8 and S15, composes its figures from the implemented diagram
primitives, and links only to routes that exist (S7).

S20: Three chapters close gaps in the existing sections:
`fundamentos/excepciones` (order 9), `objetos/genericos` (order 7) and
`objetos/enums` (order 8). Appending them keeps the published file order stable
and every earlier chapter keeps its URL (S12).

S21: The shared footer shows the owner's name as the link text and sends it to
the YouTube channel: exact name `Daniel Españadero`, exact target
`https://www.youtube.com/@danielespanadero`. Because the footer lives in
`BaseLayout.astro`, the landing and every chapter show it. The link opens in a
new tab with `rel="noopener noreferrer"`, the visible sentence still reads as
Spanish copy, and no CSS class is used without a rule (S2).

S22: The landing "El camino" lists the new section as a fifth step, with the
chapter count read from the collection like the rest, so the landing route never
stops at concurrency while the docs keep growing (S7).

S23: Documentation and delivery state stay true: `src/urls.json` registers the
new routes, `/docs/` lists the real number of sections and pages, and `README.md`
plus `CONTRIBUTING.md` quote the same counts. `pnpm build` is the proof: pages,
Pagefind index, audit and URL contract all green.

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| T1 | S18,S22 | content | Registry: `biblioteca` section and the fifth landing step | hecho |
| T2 | S21 | layout | Shared footer: name and channel link | hecho |
| T3 | S20 | content | Fundamentos: excepciones (order 9) | pendiente |
| T4 | S20 | content | Objetos: genéricos (order 7) | pendiente |
| T5 | S20 | content | Objetos: enums (order 8) | pendiente |
| T6 | S19 | content | Biblioteca: fechas y `java.time` (order 1) | pendiente |
| T7 | S19 | content | Biblioteca: zonas horarias (order 2) | pendiente |
| T8 | S19 | content | Biblioteca: duraciones y aritmética (order 3) | pendiente |
| T9 | S19 | content | Biblioteca: formato y análisis de fechas (order 4) | pendiente |
| T10 | S19 | content | Biblioteca: BigDecimal (order 5) | pendiente |
| T11 | S19 | content | Biblioteca: archivos con NIO.2 (order 6) | pendiente |
| T12 | S23 | release | URLs, recuentos y build verde | pendiente |

## Log

L1: Buenas, ya está desplegada la primera fase de la web, pero quiero aumentar
la documentación e ir a apis de Java que todavía no hemos mencionado, por
ejemplo el tema de fechas u otras cosas que creas que pueden ser importantes en
Java, tambien quiero arregar el footer de la landing principal, poniendo mi
nombre (Daniel Españadero) y un enlace en el mismo nombre a mi canal de YouTube.
