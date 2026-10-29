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
how it differs from a JRE and a JVM as a dedicated early section, not a passing
mention: what each one contains, which one you actually install, why the JRE
alone no longer ships as a separate download for most vendors, what `jshell` and
`jar` tell you about which layer you have, and a comparison the reader can keep.
It then explains how to choose a distribution without
partisan claims, three ways to install it (a version manager such as SDKMAN, a
package manager, or the official installer), how to verify the installation,
what `JAVA_HOME` and `PATH` do, and the command line tools a beginner meets:
`javac`, `java`, `jshell` and `jar`, plus the basic classpath idea. The `jar`
part goes beyond the command: a JAR is a ZIP with a manifest, an executable JAR
needs `Main-Class`, `java -jar` reads that manifest, and the chapter names the
idea of a fat or uber JAR without building one. Every command it publishes is run
and its output matches, including the wording of a failed command so a reader
recognises it.

S42b: The same chapter carries one short orientation note on JAR against WAR,
clearly marked as forward looking: a WAR is not another tool but a web
application layout (its own WEB-INF structure) that a servlet container such as
Tomcat deploys, and many current Java web projects ship an executable JAR
instead. The note resolves the reader's confusion without opening servlets,
Jakarta EE or deployment, which belong to a later wave, and it contains no link
to a route that does not exist.

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
| T2 | S41 | worker | Entorno: JDK y herramientas (order 1) | hecho |
| T3 | S42 | worker | Entorno: IDEs con criterios (order 2) | hecho |
| T4 | S44 | release | URLs, recuentos y build verde | hecho |

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

L2: También creo que conviene explicar la diferencia entre JDK, JRE y JVM.

L3: S41 rewritten so the JDK, JRE and JVM difference is a dedicated early section
with its own comparison, not a passing mention, and the running writer for T2 was
steered to cover it that way.

L4: tambien explicar la diferencia entre jar y war, o crees que eso va más adelante?

L5: Decision: JAR is deepened in the environment chapter, because it is a JDK tool
and the packaging format of any Java application. WAR does not become a topic: it
is a deployment layout for a servlet container, so the chapter gets one short
forward-looking orientation note (recorded as S42b) and full treatment is left to
a future wave on web applications and deployment, together with Maven and Gradle.

L6: T3 delivered by `mvthgybf-b-339t` and accepted: 224 lines, order 2, review dated
2026-10-29, eight comparison criteria before the table, hedged wording with no
superlatives, no prices, no screenshots, one link to an existing route and no
banned dashes. It also notes that Eclipse compiles with ECJ, so the chapter does
not claim every IDE calls `javac` without nuance. Commit `8f6d0bd`.

L7: T2 delivered by `mvthgybe-a-2ty8` and accepted after the three steering
messages landed. The chapter is 280 lines with the JDK, JRE and JVM comparison as
a dedicated early section, `jar` covering the ZIP layout, the manifest and the
executable JAR, and the short forward-looking WAR note. The parent re-ran the
toolchain by hand in a scratch directory: `javac -d out Hello.java`, `java -cp
out Hello` printing `JDK listo`, the missing-class failure wording matching the
published text exactly, `jshell 21.0.10`, `jar cf` and `jar cfe` producing real
ZIP files whose executable manifest carries `Main-Class: Hello`, and `java -jar`
running it. Commit `81f63f2`.

L8: T4 closed. `pnpm build` first failed with two unregistered routes (exit 1);
`pnpm urls:update` registered them and the full build passed: 49 routes generated
and registered, 50 pages, 2825 internal links, 215 classes all with rules, sitemap
with 49 entries. Rendered checks: the docs index opens with `entorno` and its two
chapters, the landing starts at Entorno y herramientas with the derived `2
capítulos` chip, and the pager runs `jdk-y-herramientas` -> `ides` ->
`fundamentos/hola-mundo`. Counts corrected to seven content sections and 42
chapters in README, eight sections and 47 pages in CONTRIBUTING. Commit `c1e61e7`.

L9: Feature closed: T1-T4 done across four work-unit commits on
`feature/entorno`. Not done, owner's decision: push, pull request, merge, release
and deploy. Known limits: the JDK chapter was verified on JDK 21 only, the IDE
chapter is documentary and dated, and no browser check ran.
