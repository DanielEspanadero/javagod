# JavaGod — Portada atractiva y presencia social

Fourth wave. Turns the landing into something worth sharing and gives the owner a
restrained social block in the footer, without losing the minimalist footer the
owner approved. Specs continue the project numbering (`S1`-`S17` in
`odd/tasks/javagod.md`, `S18`-`S24` in `odd/tasks/biblioteca-estandar.md`,
`S25`-`S30` in `odd/tasks/frente-conceptual.md`).

## Specs

S31: Every page declares its own metadata: `canonical` built from `Astro.site`,
`og:title`, `og:description`, `og:type`, `og:url`, `og:site_name`, `og:locale`
`es_ES`, `og:image` and `og:image:alt` pointing at one committed 1200x630 image,
plus `twitter:card` `summary_large_image` and its image and alt. URLs are
absolute, never relative, and each page reuses its own `title` and `description`.

S32: The build emits `sitemap.xml` and `robots.txt` into `dist` from the same
route manifest the URL contract already validates, using the configured origin
and adding no runtime dependency and no new package. `robots.txt` points at the
sitemap.

S33: The landing shows a proof row with real numbers read from the content
collection, never hand-typed: chapters, content sections and the supported
version range. A number that the collection cannot confirm is not shown.

S34: The landing shows a sample of a real chapter: a short code fragment, its
real output, and a link to that chapter. The output is the one the chapter
publishes and the link resolves.

S35: The landing explains the reading mode, the strongest difference from the
official documentation: one fragment shown as it filters for two LTS versions,
with the reason a reader cares (hide what did not exist yet, without duplicate
URLs), and a link to the documentation index.

S36: Landing copy stays honest and stops repeating itself: the "El camino" title
derives its ending from the registry so it cannot go stale, the privacy line
appears once instead of twice, and the search shortcut is mentioned so the
capability is discoverable.

S37: The footer gains a social block driven by one data file: networks in the
owner's stated order (YouTube, Instagram, TikTok, X, LinkedIn, Twitch, Kick,
Discord), each with an icon, an accessible name and an external link that opens
in a new tab with `rel="noopener noreferrer"` and `rel="me"`. Only entries with a
confirmed URL render, so no dead link ships, and the visual order always matches
the declared order.

S38: The whole wave follows design standards rather than taste: colours, spacing
and type come from the token file only, text keeps AA contrast in both themes,
every control keeps a visible focus ring and a 44x44 touch target, motion is
short and disabled under `prefers-reduced-motion`, landmarks and headings stay
semantic, and new blocks reserve their space so the page does not shift while
loading.

S39: The wave ships green: `pnpm build` passes with the audit and the URL
contract, the new routes of `sitemap.xml` match the generated pages, the sitemap
and robots exist in `dist`, and the rendered landing and footer are checked on
the built HTML.

## Tasks

| ID | Specs | Route | Task | Estado |
| -- | ----- | ----- | ---- | ------ |
| T1 | S31 | parent | Share image asset and social data source | hecho |
| T2 | S31,S37 | worker | Head metadata and footer social block | hecho |
| T3 | S33,S34,S35,S36 | worker | Landing sections and copy | hecho |
| T4 | S32 | parent | Sitemap and robots generation | hecho |
| T5 | S37 | parent | Fill the confirmed social URLs | hecho |
| T6 | S39 | parent | Build, render checks and closure | hecho |

## Execution

Authorized by the owner answering the landing review with approval and adding the
social requirement. The landing review found: no social metadata, no sitemap, no
link to a single chapter, the strongest differentiator unmentioned, the same
privacy message twice, a section title that ignored the newest section, and no
human presence.

Route: T2 and T3 are two independent units with disjoint surfaces (shared chrome
versus landing), so both go to bounded writers in parallel. T4 and T6 are the
coordinator's shared state (build script, manifest, build and render checks). T5
is blocked until the owner supplies the profile URLs: only the YouTube channel
`https://www.youtube.com/@danielespanadero` is confirmed today, and guessing a
handle would ship a dead or wrong-person link (S7).

Design constraints for both writers: brand icons come from the fetched Simple
Icons paths (LinkedIn from Bootstrap Icons because Simple Icons removed it),
committed locally as inline SVG; no icon library, no new dependency, no new
colour outside `tokens.css`, no brand-coloured icon soup (muted by default,
`--text` on hover, brand only on focus).

Verification: passive presentation work, so no meaningful RED; the audit is the
regression net (classes have rules, one `h1`, no long dashes, no dead internal
links) and the parent re-checks the built HTML for every declared tag, for the
social order and for the sitemap. No browser screenshot is available because the
project has no Playwright installation.

Risk: item 3 only if a shared contract changes. The head metadata, the footer of
`BaseLayout.astro` and the landing sections are read by every page, so the
existing page contract is the thing to preserve; task T6 runs the differential
check by building before and after and comparing the routes and the preserved
headings, links and classes.

## Log

L1: Me gustan tus propuestas. El tema de las redes sociales, creo que puede
encajar mejor puliendo el footer y poniendo todas mis redes en orden de
importancia (YouTube, Instagram, TikTok, X, LinkedIn, Twitch, Kick, Discord).
Cuidado con el diseño, creo que es importante ceñirnos a estandares de diseño
para hacer que a la gente le resulte agradable quedarse en la web.

L2: T1 done: `public/og-image.png` (1200x630, 72 KB) composed from the brand
tokens and the real logo, rendered with the project's own sharp build dependency
and committed as a static asset, so no runtime dependency was added. Icon paths
for the eight networks fetched from Simple Icons 15 (LinkedIn from Bootstrap
Icons, because Simple Icons removed it) and handed to the writer as inline paths.

L3: T4 done: `scripts/sitemap.mjs` derives `sitemap.xml` and `robots.txt` from
`src/urls.json`, reusing the same origin chain as `astro.config.mjs`, skipping
the 404 page and adding no dependency. Wired into `pnpm build` right after
`astro build`. Verified: 47 routes, robots pointing at the sitemap.

L4: T2 and T3 launched in parallel as `mvrupmf4-8-qkmx` (shared chrome: metadata
and social footer) and `mvrupmf5-9-ivpo` (landing sections and copy), with
disjoint surfaces. T5 stays blocked on the owner: only the YouTube channel is
confirmed, and guessing a handle would ship a wrong-person or dead link (S7).

L5: T2 delivered by `mvrupmf4-8-qkmx` and T3 by `mvrupmf5-9-ivpo`. Both reported the
same blocker, the audit rejecting the absolute canonical links as third-party
resources; the coordinator fixed `scripts/audit.mjs` by excluding metadata link
relations from that rule and recorded why. After the fix `pnpm build` passed.

L6: T5 done: the owner supplied seven URLs. All eight links, in the declared
order, answered HTTP 200 with a desktop user agent (YouTube, Instagram, TikTok,
X, LinkedIn, Twitch, Kick, Discord). `src/lib/social.mjs` holds the URLs and the
component renders every confirmed entry without placeholders.

L7: Copy correction: the derived "El camino" title read "del Hola, mundo a
Calidad", which is ungrammatical because section titles are nouns in title case.
The title now states the derived step count instead ("Un recorrido progresivo en
6 etapas: del Hola, mundo al código que se sostiene"), so it still cannot go
stale and reads correctly.

L8: Differential check for the shared chrome (Risk item 3), run as required by
the harness policy: a scratch worktree at the previous commit was built with the
same lockfile and its `dist` compared against the new build for `/`, `/docs/`,
`/docs/concurrencia/hilos/` and `/docs/calidad/junit-5/`. Titles, descriptions
and h1 came out identical; the only differences were the intended ones (the CSS
hash, one new landing link to the BigDecimal chapter and two new landing
sections). No documentation page lost a heading or a link. Worktree removed.

L9: T6 closed. `pnpm build` green at the closing HEAD: 48 pages, 2614 internal
links, 215 classes all with rules, sitemap with 47 routes matching the manifest,
robots pointing at it. Rendered checks over all 48 pages: every page has an
absolute canonical, an absolute og:image, `summary_large_image`, one `h1`, a
JSON-LD block, and exactly eight social links in the declared order with
`rel="noopener noreferrer me"`. Footer redesign: the credit and the icon row are
grouped in `.site-footer__aside` and aligned to the right, so the footer reads as
two groups instead of three floating pieces; the minimal text stays `JavaGod` and
`Por Daniel Españadero`. Commits: `3c6d49d` (share metadata and social footer),
`a001aa2` (sitemap and robots plus the audit fix), `c85d69c` (landing),
`113dc39` (footer grouping).

L10: Feature closed. Not done, owner's decision: push, PR, merge and deploy, so
the public origin keeps `javagod.com` and no verification happened against the
deployed site. Known limitations: no browser screenshot or keyboard run (no
Playwright in the project), the eight profile URLs were confirmed by the owner
and answered HTTP 200 with a desktop user agent, and the sitemap carries the
build date as `lastmod` because the repository has no per-page change history to
derive a truer date.
