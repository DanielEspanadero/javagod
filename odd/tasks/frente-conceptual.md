# JavaGod — Frente conceptual: funcional, metaprogramación y calidad

Third documentation wave. Closes the three explanation gaps that made the course
skip ideas the reader meets in real code every day: lambdas used before they are
taught, frameworks built on reflection, and code nobody shows how to verify.
Specs continue the project numbering (`S1`-`S17` in `odd/tasks/javagod.md`,
`S18`-`S24` in `odd/tasks/biblioteca-estandar.md`).

## Specs

S25: A new section is registered as `calidad`, titled "Calidad", placed after
`biblioteca` and before `novedades`, because verification is neither library nor
syntax. It appears in the docs index, sidebar, breadcrumbs and pager with no
component edit (S9), and the landing "El camino" lists it as the sixth step with
the chapter count read from the collection (S22).

S26: `objetos/lambdas-y-api-funcional` (order 9, since 8) teaches behavior as a
value before Stream is read: functional interfaces, the lambda form and its
limits, method references of the four kinds, effectively final captures, and
composition through `Predicate`, `Function` and `Comparator`. It closes by
forwarding to the Stream chapter that already exists, and it states that a chunk
of `java.util.function` arrived in Java 8 while the whole chapter remains
readable in that release.

S27: `objetos/anotaciones-y-reflexion` (order 10, since 8) covers declaring and
consuming annotations, `@Retention`/`@Target`/inheritance, runtime reflection
over classes, fields, methods and records, the cost and safety limits of
reflective access, and why frameworks depend on it. Access that needs module
opens is labelled as Java 9 and later inline (S16).

S28: `calidad/diseno-de-pruebas` (order 1, since 8) teaches what a test must
assert: observable behavior through the public interface, arrange-act-assert,
one reason to fail per test, boundary and error cases, deterministic inputs
instead of clock or randomness, and doubles only where an outside system exists.

S29: `calidad/junit-5` (order 2, since 8) teaches JUnit 5 as a tool: annotated
lifecycle, assertions and messages, parameterized tests, exception assertions,
naming, and how a suite is run from the command line. Every claim is proven
against a real JUnit 5 run; the artifact used for that verification is scratch,
never a project dependency (S1 stays dependency free).

S30: Delivery stays true: `src/urls.json` registers the new routes, the docs
index lists the real section and page counts, and `README.md` plus
`CONTRIBUTING.md` quote the same numbers. `pnpm build` is the proof: pages,
Pagefind index, audit and URL contract all green (S23).

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| T1 | S25 | registry | Register the `calidad` section and the sixth landing step | hecho |
| T2 | S26 | worker | Objetos: lambdas y API funcional (order 9) | hecho |
| T3 | S27 | worker | Objetos: anotaciones y reflexión (order 10) | hecho |
| T4 | S28 | worker | Calidad: diseño de pruebas (order 1) | hecho |
| T5 | S29 | worker | Calidad: JUnit 5 (order 2) | hecho |
| T6 | S30 | release | URLs, recuentos y build verde | hecho |

## Execution

Authorized by the owner's answer to the coverage review, which asked whether the
site was already at official-documentation level: it is pedagogically ahead and
materially behind in coverage. The approved scope is the conceptual front only,
not the workplace-API front (`JDBC`, `HttpClient`, build tools) nor the product
front (exercises, glossary, learning paths). Those remain unstarted and are not
implied by this wave.

Route: T1 and T6 inline (registry, counts, manifests and the build are shared
state the coordinator owns). T2-T5 route to parallel bounded writers with
disjoint file surfaces, each chapter a separate work unit of roughly 220-280
lines. Workers do not touch the registry, `src/urls.json`, global counts or
commits.

Verification: passive documentation has no meaningful RED. Each worker compiles
and runs its Java examples with the installed JDK 21, uses `--release 8` for the
Java 8 baseline, and labels newer syntax inline. JUnit snippets are proven with a
real JUnit 5 run from a temporary directory; the JUnit artifacts stay out of the
repository. The parent then verifies the full build, the URL contract, the
derived navigation and the rendered routes.

Risk: none foreseen. New chapter files, one registry entry and one landing step;
no shared parser, component API, dependency or stored-data change. The build
audit is the regression net for links, classes and heading structure.

## Log

L2: T1 committed as `f3c669b`; full build green with the sixth landing step and
`calidad` registered. First writer launch was refused because the handoff used
the provisional `C` task ids; the runtime requires `Spec: <doc>, T<n>`, so the
ids were normalised to T1-T6 and the same three units relaunched, nothing written.

L1: Sí, arranca con el frente conceptual, en ese sentido sí que quiero que la web
sea un referente.

L3: T2 delivered by `mvrtwqa1-5-qxm5` and accepted: 280 lines, order 9, since 8, one
link to the existing Stream chapter, no banned dashes. The worker compiled and ran
its five examples twice, default and `--release 8 -Xlint:-options`. The parent
re-extracted all five blocks from the chapter source, compiled them with
`--release 8` and ran them: stdout matched every documented claim exactly
(`true`/`false`, `21`/`prevista`/`true`/`nuevo`, `true`/`[revisado]`,
`false`/`true`/`4`/`4`, `[Ana, Eva, Luis]`). Commit `82dcb16`.

L4: T3 delivered by `mvrtwqa2-6-239b` and accepted: 273 lines, order 10, since 8, two
links to existing routes, no banned dashes. The parent re-extracted the three
examples and reproduced the documented outputs exactly (`service:1`/`service`/`null`,
`Ada`/`Hola, Luz`/`[greet, reset]`/`true`, `true`/`x:int=2`/`y:int=5`), the two
Java 8 examples under `--release 8` and the record example under `--release 21`.
The worker leftover scratch directory was removed. Commit `8924288`.

L5: T4 and T5 delivered by `mvrtwqa3-7-n3f5` and accepted: 263 and 278 lines, orders
1-2, since 8, three links to existing routes, no banned dashes, no project
dependency added. The parent re-extracted the three plain-Java programs under
`--release 8` and reproduced `reservation OK`, `boundaries OK` and `expiry OK`.
The parent also re-ran JUnit with a freshly downloaded
`junit-platform-console-standalone:1.12.2` in a scratch directory: `SeatsTest`
alone reported 7 tests successful with 0 failures, and adding `BrokenTest`
reported 8 found, 7 successful, 1 failed, exactly as the chapter claims. Commits
`d92f2f2` and `25898c4`.

L6: T6 closed. `pnpm build` first failed with the documented RED: four generated
routes missing from `src/urls.json` (exit 1). After `pnpm urls:update` the full
build passed: 47 routes generated and 47 registered, 2612 internal links, one h1
per page, no banned dashes. Rendered checks: the docs index lists 45 pages with
two under Calidad, the landing shows the sixth step, and the pager flows
`diseno-de-pruebas` -> `junit-5` -> `novedades/java-8`, with `anotaciones-y-reflexion`
-> `colecciones/el-marco-de-colecciones` confirming lambdas read before Stream.
Pagefind indexed 45 pages. Counts corrected to six content sections plus
`novedades`, 40 chapters and 45 pages. Commit `951e067`.

L7: Feature closed: T1-T6 done, six work-unit commits from `f3c669b` to `951e067`
on top of the previous wave. Not done, owner's decision: push, PR, merge, deploy.
Known limitations: Java 8 claims are proven with `--release 8` on JDK 21, never on
a real JVM 8; the JUnit chapter's versions were verified with Console Standalone
1.12.2 and Jupiter 5.12.2 only; no browser screenshot check ran (no Playwright in
the project). The remaining fronts from the coverage review stay unstarted:
workplace APIs (JDBC, HttpClient, build tools, logging) and product work
(exercises, glossary, learning paths, search filters, CI visual checks).
