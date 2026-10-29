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

S19: The section publishes seven chapters, each declaring `since: 8` because the
`java.time` and `java.nio.file` APIs used are the Java 8 shape (newer syntax
inside a chapter is labelled inline, never a reason to raise `since`, S16):
`fechas-java-time`, `zonas-horarias`, `duraciones-y-aritmetica`,
`formato-de-fechas`, `bigdecimal`, `archivos-nio` and `java-io`. Every chapter follows the
content rules of S8 and S15, composes its figures from the implemented diagram
primitives, and links only to routes that exist (S7).

S20: Three chapters close gaps in the existing sections:
`fundamentos/excepciones` (order 9), `objetos/genericos` (order 7) and
`objetos/enums` (order 8). Appending them keeps the published file order stable
and every earlier chapter keeps its URL (S12).

S21: The shared footer shows the owner's name as the link text and sends it to
his portfolio: exact name `Daniel Españadero`, exact target
`https://daniel-espanadero.com/`. The YouTube channel keeps its own link in the
social row, so the name identifies the person and the row lists the platforms. Because the footer lives in
`BaseLayout.astro`, the landing and every chapter show it. The link opens in a
new tab with `rel="noopener noreferrer"`, the visible sentence still reads as
Spanish copy, and no CSS class is used without a rule (S2). The owner's correction is:
"El footer no me gusta, prefiero algo mas minimalista y que no esté tal cargado."
Keep only the site name and author credit, with compact spacing and no descriptive
paragraph, version metadata or emoji.

S22: The landing "El camino" lists the new section as a fifth step, with the
chapter count read from the collection like the rest, so the landing route never
stops at concurrency while the docs keep growing (S7).

S23: Documentation and delivery state stay true: `src/urls.json` registers the
new routes, `/docs/` lists the real number of sections and pages, and `README.md`
plus `CONTRIBUTING.md` quote the same counts. `pnpm build` is the proof: pages,
Pagefind index, audit and URL contract all green.

S24: "A parte de NIO también quiero Java IO ya que en algunos casos se sigue usando."
Add `biblioteca/java-io` (order 7, since 8), covering byte streams versus character
readers/writers, explicit encodings, buffering, resource management and how
`java.io` interoperates with NIO. Explain when existing APIs still require IO.

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| T1 | S18,S22 | content | Registry: `biblioteca` section and the fifth landing step | hecho |
| T2 | S21 | layout | Shared footer: minimal name and portfolio link | en curso |
| T3 | S20 | worker | Fundamentos: excepciones (order 9) | hecho |
| T4 | S20 | worker | Objetos: genéricos (order 7) | hecho |
| T5 | S20 | worker | Objetos: enums (order 8) | hecho |
| T6 | S19 | worker | Biblioteca: fechas y `java.time` (order 1) | hecho |
| T7 | S19 | worker | Biblioteca: zonas horarias (order 2) | hecho |
| T8 | S19 | worker | Biblioteca: duraciones y aritmética (order 3) | hecho |
| T9 | S19 | worker | Biblioteca: formato y análisis de fechas (order 4) | hecho |
| T10 | S19 | worker | Biblioteca: BigDecimal (order 5) | hecho |
| T11 | S19 | worker | Biblioteca: archivos con NIO.2 (order 6) | hecho |
| T12 | S23 | release | URLs, recuentos y build verde | hecho |
| T13 | S19,S24 | worker | Biblioteca: Java IO (order 7) | hecho |

## Execution

Active resume: T3-T11 are in progress as three parallel writer groups:
T3-T5 foundations/OOP, T6-T8 date concepts, T9-T11 formatting/decimal/files.
Only the coordinator edits this tracking file, URL manifests and global counts.
T13 runs as a fourth independent chapter writer after the owner's added IO
requirement; T12 follows integration of all ten chapters. The approved footer correction and explicit whitespace
are committed in `2d8f7e0` (full build and rendered footer assertions passed).
Writer group IDs: `mvr6ka0g-1-ecd8` (T3-T5), `mvr6ka0j-2-xfrp` (T6-T8),
`mvr6ka0k-3-x6l4` (T9-T11).

Resume 2026-10-27: T1 and the initial T2 are committed in `0e04927`. T2 reopened
for the owner's minimalism correction before any chapter workers launched.
Existing README and
CONTRIBUTING edits are preserved for T12. T3-T11 route to parallel bounded
writers: independent chapters, each requiring substantial content and executable
Java examples, with disjoint file surfaces. T12 routes inline after all chapters.
Each chapter is a separate reviewable commit (approximately 180-280 lines).
Content is passive documentation: meaningful RED is not applicable; compile and
run Java examples, then run the site build and public URL audit. No runtime,
shared parser, CLI or dependency changes are planned. Risk: none.

## Log

L1: Buenas, ya está desplegada la primera fase de la web, pero quiero aumentar
la documentación e ir a apis de Java que todavía no hemos mencionado, por
ejemplo el tema de fechas u otras cosas que creas que pueden ser importantes en
Java, tambien quiero arregar el footer de la landing principal, poniendo mi
nombre (Daniel Españadero) y un enlace en el mismo nombre a mi canal de YouTube.

L2: El footer no me gusta, prefiero algo mas minimalista y que no esté tal cargado.

L3: T2 correction verified: only JavaGod and the author credit remain; neutral
background, smaller vertical padding, one type style. Channel target and external
link attributes preserved. Structural check observed RED then GREEN; rendered
landing and chapter footer checks passed. `pnpm build` passed: 34 pages, 1363
internal links, 33 contracted URLs. `git diff --check` passed. Native assessment:
medium, reviewDue false, self-verification sufficient. Browser screenshot check
unavailable: no project Playwright installation. No chapter workers were started;
T3-T12 remained pending while this footer correction took priority.

L4: Entre el por y Daniel Españadero falta un espacio

L5: Explicit Astro whitespace corrected the missing author spacing. Observed
RED on built HTML, then GREEN on landing and chapter after a full passing build.

L6: Perfecto, continúa con las tareas pendientes

L7: A parte de NIO también quiero Java IO ya que en algunos casos se sigue usando.

L8: T3-T5 delivered by `mvr6ka0g-1-ecd8` and accepted after parent spot checks:
234, 244 and 256 lines, unique orders 9/7/8, four internal links resolving to
existing routes, no long dashes, 23 worker compile/run checks with exact output
assertions. Parent independently compiled and ran the generics `MethodExample`
with `javac --release 8`: stdout `Java` and `8`, exit 0. Commits `00d7965`,
`8f18fd4`, `45f8124`. Worker limitation: `--release 8` ran on JVM 21, so there
is no independent JVM 8 execution. Delivery strategy: one commit per chapter
continues past the nominal 400-line slice because each chapter is an independent
documentation unit the owner requested as one wave; the native review candidate
is a chapter commit or PR slice, never the accumulated branch.

L9: T6-T8 delivered by `mvr6ka0j-2-xfrp` and accepted: 238, 227 and 234 lines,
orders 1-3, `since: 8`, no internal links, no long dashes. The worker compiled and
ran all 12 examples with `javac --release 8`. Parent independently compiled and
ran `DayOrHours` against `Europe/Madrid`, obtaining the DST crossing exactly as
published (`2024-03-31T12:00+02:00`, `13:00+02:00`, 23 and 24 hours). Commits
`b0a83ae`, `76dca9c`, `95c1f8b`. Regional output depends on the bundled tzdb, as
the chapter states.

L10: T13 delivered by `mvr6qg64-4-vike` and accepted: 276 lines, order 7, one link
to the now existing exceptions route, no long dashes, Java 9 syntax labelled
inline (`transferTo`, `readAllBytes`). Parent independently compiled and ran
`Utf8Bridge` with `javac --release 8`, observing exactly `España` and `café`.
Commit `a8414df`. IO is presented as a current API, not as obsolete.

L11: T9-T11 delivered by `mvr6ka0k-3-x6l4` and accepted: 222, 241 and 242 lines,
orders 4-6, `since: 8`, all links to existing routes, no long dashes. Ten worker
examples compiled with `--release 8` and matched documented output; file examples
ran in an isolated `java.io.tmpdir`. Parent independently compiled and ran the
BigDecimal scale example, observing `false` from `equals` and `0` from `compareTo`.
Commits `0c2696e`, `0b64af9`, `32353a5`.

L12: T12 closed. `pnpm build` first failed with the documented URL contract RED:
10 generated routes were missing from `src/urls.json` (exit 1). `pnpm urls:update`
registered all 10 and a full `pnpm build` then passed: 44 pages generated, 2213
internal links verified, 208 classes all with rules, one h1 per page, no long
dashes, 43 generated routes matching 43 manifest entries with no redirect drift.
Rendered checks: docs index lists 41 entries with seven under `biblioteca`, the
left nav and breadcrumb name the section, the pager orders `java-io` after
`archivos-nio`, the landing path lists the five content sections with the new one
last, and Pagefind indexed 41 pages. Corrected counts to 36 chapters plus 5 release
pages (README) and six sections plus 41 pages (CONTRIBUTING). Commit `8ad8654`.

L13: Feature closed. All thirteen tasks done on `feature/biblioteca-estandar`,
13 work-unit commits from `0e04927` to `8ad8654`. Delivery strategy recorded above:
commits stay per chapter; the native review candidate is a chapter commit or PR
slice, never the accumulated branch. Not done here, by owner decision: push, pull
request, merge and deploy. Known limitation of the whole wave: Java 8
compatibility was proven with `javac --release 8` on JDK 21, never on a real JVM 8;
no browser screenshot check ran because the project has no Playwright install.

L14: En lugar de que mi nombre apunte a youtube (ya están los logos de las redes
sociales al lado) podemos hacer que apunte a mi portfolio, que opinas?:
https://daniel-espanadero.com/

L15: T2 reopened and closed again for S21: the author credit now targets
`https://daniel-espanadero.com/` (verified 200) with `rel="noopener noreferrer me"`,
and the screen-reader text inside the link changed from "en YouTube" to
"(se abre en una pestaña nueva)" so it no longer announces the wrong destination.
No visual change. The YouTube channel keeps its own icon in the social row.
Reopened by the owner's L14.
