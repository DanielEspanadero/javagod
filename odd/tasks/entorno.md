# JavaGod — Entorno y herramientas

Fifth wave. The site taught the language while assuming the toolchain already
existed: nothing explained which JDK to install, how to check it, or which editor
to open. Specs continue the numbering (`S1`-`S17`, `S18`-`S24`, `S25`-`S30`,
`S31`-`S39` in the earlier documents).

## Specs

S40: A new section is registered as `entorno`, titled "Entorno y herramientas",
placed **first**, before `fundamentos`, because choosing the toolchain is what a
newcomer needs before writing the first line. It appears in the docs index,
sidebar, breadcrumbs, pager and the landing "El camino", which lists it as the
first step with the chapter count read from the collection.

S41: `entorno/jdk-y-herramientas` (order 1, since 8) explains what a JDK is and
how it differs from a JRE and a JVM, how to choose a distribution without
partisan claims, three ways to install it (a version manager such as SDKMAN, a
package manager, or the official installer), how to verify the installation,
what `JAVA_HOME` and `PATH` do, and the command line tools a beginner meets:
`javac`, `java`, `jshell` and `jar`, plus the basic classpath idea. Every command
it publishes is run and its output matches, including the wording of a failed
command so a reader recognises it.

S42: `entorno/ides` (order 2, since 8) helps choose an editor with criteria
before any catalogue: cost and licence, support for the current LTS, refactoring,
debugging, Maven and Gradle integration, weight and responsiveness, plugin
ecosystem and community. It compares IntelliJ IDEA, VS Code with the Java
extension pack, Eclipse and NetBeans against those criteria, recommends by
profile instead of declaring a winner, reminds the reader that every IDE ends up
calling the same `javac`, and states the date the comparison was reviewed. No
screenshots: interfaces change every release and a stale image costs credibility.

S43: Both chapters follow the content rules already in force: Spain Spanish
addressed as tú (S8), no em or en dashes (S15), figures composed from the
implemented diagram primitives (S4), links only to routes that exist (S7), 200 to
280 lines, `since: 8` with anything newer labelled inline (S16). The IDE chapter
is the only one in the site whose claims are documentary rather than executable,
and it says so by dating the review.

S44: Delivery stays true: `src/urls.json` registers both routes, the docs index
lists the real section and page counts, `README.md` and `CONTRIBUTING.md` quote
the same numbers, and the landing path starts at the new section.

S45: `pnpm build` is the proof: pages, Pagefind index, audit and URL contract all
green, with the sitemap covering the two new routes.

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| T1 | S40 | registry | Register `entorno` first and add the first landing step | pendiente |
| T2 | S41 | worker | Entorno: JDK y herramientas (order 1) | pendiente |
| T3 | S42 | worker | Entorno: IDEs con criterios (order 2) | pendiente |
| T4 | S44 | release | URLs, recuentos y build verde | pendiente |

## Execution

Authorized by the owner, who judged exercises premature and named this gap
himself. Scope agreed: the section with the JDK chapter and the IDE chapter;
Maven and Gradle belong to a later wave because they are about building and
dependencies, not about choosing a tool.

Route: T1 and T4 inline, since the registry, the landing array, the manifest and
the counts are shared state the coordinator owns. T2 and T3 go to two bounded
writers in parallel with disjoint files. The IDE chapter carries an honest
verification limit: its claims cannot be executed, so it must date itself and
avoid version-specific feature matrices that rot.

Verification: passive documentation has no meaningful RED. The JDK chapter's
commands are run on the installed JDK 21 and compared against what the text
publishes; the IDE chapter is reviewed for dated, hedged, criterion-based claims.
The parent then checks the build, the URL contract, the derived navigation and
the rendered routes.

Risk: none foreseen. Two new Markdown files, one registry entry and one landing
step, with no shared parser, component API, dependency or stored data touched.

## Log

L1: Yo lo de los ejercicios lo dejaría para el final, ya que falta mucha teoría
por añadir. Algo que a alguien nuevo le puede abrumar y que no lo mencionamos es a
seleccionar las herramientas necesarias para trabajar con Java, empezando por los
diferentes IDEs que existen con sus ventajas e inconvenientes. Qué opinas?
