# Cómo trabajar en JavaGod

## Modelo de ramas: git flow

| Rama | Qué es | Quién escribe en ella |
| --- | --- | --- |
| `main` | Producción | Solo merges de `release/*` y `hotfix/*` |
| `develop` | Integración y staging | Merges de `feature/*` |
| `feature/*` | Trabajo en curso | Una rama por unidad de trabajo |
| `release/*` | Preparación de versión | Ajustes de versión y correcciones finales |
| `hotfix/*` | Arreglo urgente | Sale de `main`, vuelve a `main` y a `develop` |

Reglas que no se negocian:

- Nadie commitea directo en `main`. Lo que llega a `main` es producción.
- Toda feature sale de `develop` y vuelve a `develop` con `--no-ff`.
- Los commits `docs` y `chore` que no tocan código publicado pueden ir directo a `develop`.
- Un hotfix sale de `main`, vuelve a `main` y también a `develop`.
- Las ramas se borran después del merge.

## Commits

Conventional Commits, con descripción en imperativo y en inglés:

```
tipo(alcance): descripción
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`.

Ejemplo real del repositorio: `feat(landing): turn terminal into a REPL`.

## Flujo de una feature

```bash
git checkout develop
git checkout -b feature/mi-cambio
# trabajo, con commits chicos
pnpm build
git checkout develop
git merge --no-ff feature/mi-cambio
git branch -d feature/mi-cambio
```

## Flujo de una versión

```bash
git checkout -b release/0.2.0 develop
# solo ajustes de versión y correcciones finales
git checkout main
git merge --no-ff release/0.2.0
git tag -a v0.2.0 -m "0.2.0"
git checkout develop
git merge --no-ff release/0.2.0
git branch -d release/0.2.0
```

## Flujo de un hotfix

```bash
git checkout -b hotfix/lo-que-sea main
# arreglo mínimo
git checkout main
git merge --no-ff hotfix/lo-que-sea
git tag -a v0.2.1 -m "0.2.1"
git checkout develop
git merge --no-ff hotfix/lo-que-sea
```

## Autoría de los commits

El autor y el committer son siempre el dueño del repositorio. Los mensajes no llevan
trailers de coautoría, ni nombres de herramientas, ni líneas del tipo "generado con".

Lo hace cumplir el hook `.githooks/commit-msg`, que rechaza el commit si el mensaje
contiene cualquier atribución. Se activa solo con `pnpm install` mediante el script
`prepare`; para hacerlo a mano:

```bash
git config core.hooksPath .githooks
```

## Añadir un capítulo

La documentación vive en `src/content/docs/<sección>/<slug>.md` y el path del archivo es la
URL: `src/content/docs/fundamentos/hola-mundo.md` se publica en
`/docs/fundamentos/hola-mundo/`. Renombrar un archivo cambia su URL, así que exige una
entrada en `public/_redirects` (S12).

Frontmatter obligatorio, sin claves extra:

```yaml
---
title: 'Hola, mundo'
description: 'Una frase que se ve en el índice y en los metadatos.'
section: fundamentos
order: 1
since: 8
---
```

- `section` tiene que ser una de las declaradas en `src/lib/sections.mjs` y coincidir con
  la carpeta donde vive el archivo: un capítulo en `objetos/` que declare
  `section: fundamentos` rompe el build.
- `order` es la posición dentro de la sección y no puede repetirse.
- `since` es la primera versión LTS en la que el capítulo se lee entero tal como está
  escrito. No es la versión en la que nació el tema: si el texto usa `var` o bloques de
  texto, el valor sube a la primera LTS que los admite, aunque el concepto sea anterior.
- `hasta` es opcional y marca la última versión LTS en la que el capítulo sigue valiendo.
  No puede ser anterior a `since`.
- Los dos campos aceptan solo versiones LTS: 8, 11, 17, 21 y 25. El build rechaza un
  `since` que falte, un valor que no esté en esa lista, un `hasta` menor que `since` y
  cualquier clave desconocida, y el error dice qué archivo y qué valor corregir.
- No escribas `slug`: la URL sale del path y el build rechaza la clave.

El capítulo muestra su versión bajo la descripción (`Desde Java 17`, o
`Desde Java 11 hasta Java 17` cuando hay `hasta`), sin tocar ningún componente.

El resto es automático: el árbol lateral, el TOC, las migas y los enlaces anterior y
siguiente se derivan del contenido. No hay que tocar componentes ni índices (S9).

### Con `pnpm new:doc`

El scaffolder escribe el archivo con el frontmatter válido y el `order` siguiente de la
sección, así que no hay que calcularlo ni copiarlo de otro capítulo:

```bash
pnpm new:doc fundamentos tipos-primitivos --title "Tipos primitivos" --since 8 \
  --description "Los ocho tipos primitivos y cuándo usar cada uno."
```

- La sección tiene que existir en el registro; si no, el comando lista los ids válidos.
- El slug es kebab-case y no se puede repetir: el scaffolder no sobrescribe archivos.
- `--title` y `--since` son obligatorios, porque el build rechaza un capítulo sin versión.
  `--hasta` es opcional y no puede ser anterior a `--since`. Los tres valores de versión
  se validan contra el registro de LTS, así que un número que no sea 8, 11, 17, 21 o 25
  falla antes de escribir nada.
- Si no pasas `--description`, se usa el título y el comando lo avisa por pantalla.
- Imprime la ruta del archivo y su URL final, y crea la carpeta de la sección si todavía
  no existe.

Después de generarlo, escribe el contenido y comprueba con `pnpm build`.

### URLs y redirects

Una URL publicada no cambia nunca en silencio (S12). `src/urls.json` es el manifiesto de
lo que está publicado y se commitea junto con el contenido: es el contrato, no una
lista informativa.

- Página nueva con `pnpm new:doc`: el scaffolder registra la URL en el manifiesto, así que
  no hay que hacer nada más. Si creas el archivo a mano, `pnpm urls:update` añade las rutas
  que se generan y todavía no están en el manifiesto, en orden.
- Página renombrada o movida: añade la línea del redirect en `public/_redirects`
  (`/ruta-vieja/ /ruta-nueva/ 301`) y registra el slug nuevo con `pnpm urls:update`. El
  slug sale del path, así que mover el archivo cambia la URL: sin el redirect el build
  falla nombrando la URL desaparecida, y el manifiesto conserva la vieja como cubierta.

`pnpm build` corre `scripts/check-urls.mjs` después de la auditoría y falla si el
manifiesto nombra una URL que ya no se genera y ningún redirect la cubre, si un
redirect pisa una ruta viva, si el destino de un redirect no existe o si hay una ruta
generada que no está registrada.

Una entrada del manifiesto no se borra a mano salvo que el redirect ya cubra esa URL:
la lista es el registro de lo que alguna vez se publicó.

## Modo de lectura por versión

El selector que vive encima del árbol del rail (y encima de las tarjetas del índice) fija la
versión LTS con la que se lee el sitio. No crea un árbol de URLs paralelo: es un modo, y la
página canónica sigue siendo una sola (S16).

- Los valores son `all`, `8`, `11`, `17`, `21` y `25`, y salen de `src/lib/versions.mjs`.
  El servidor y el navegador leen el mismo registro, así que una LTS nueva se declara una vez
  y aparece sola en el selector.
- El estado vive en `javagod:version` de `localStorage`. Un `?v=` en la URL gana al valor
  guardado, y al cambiar el selector la URL se actualiza con `history.replaceState` para que
  el enlace compartido lleve el modo. Un valor desconocido o mal formado (`?v=99`, `?v=abc`)
  cae en `all`, y un `localStorage` bloqueado no rompe nada.
- La regla de filtrado está en un solo sitio: `appliesTo` de
  `src/components/VersionSwitcher.astro`. Un capítulo aplica cuando su `since` es menor o
  igual que la versión elegida y no tiene `hasta`, o cuando su `hasta` es mayor o igual.
  `all` aplica a todo.
- Lo que no aplica se oculta con el atributo `hidden`, nunca borrando nodos: sin JavaScript
  la página está completa y todos los enlaces existen. Se ocultan las entradas del árbol, las
  tarjetas del índice y los enlaces anterior y siguiente, y el pager entero si se quedan los
  dos ocultos.
- Si el capítulo abierto no aplica, se sigue viendo y aparece un aviso sobre la prosa con su
  versión, la que estás leyendo y un botón para cambiar a la del capítulo.
- El selector solo se ve cuando hay JavaScript: sin él no puede filtrar, así que prometería
  algo que no hace.

Cualquier superficie nueva que dependa de la versión necesita dos cosas y nada más:
`data-since` (y `data-hasta` cuando el capítulo lo declare) tomados del frontmatter, y
`data-version-item` en el elemento que se oculta. El script recorre esos atributos. El
artículo de la página lleva `data-version-page` con su rango, que es lo que lee el aviso.

## Diagramas en un capítulo

Un diagrama se escribe como HTML dentro del Markdown, sin componentes ni imports (S4). La
figura tiene que entenderse sin JavaScript y sin animación:

```html
<figure class="diagram diagram--framed">
  <p class="diagram__label">El viaje de un programa</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Fuente</span>
      <code class="diagram__value">HolaMundo.java</code>
      <span class="diagram__hint">Lo que escribes.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Qué muestra la figura.</figcaption>
</figure>
```

Las clases viven en `src/styles/diagram.css`. El marco es opcional (`diagram--framed`), la
fila se apila en pantallas pequeñas y los conectores los dibuja el CSS. La auditoría del
build rechaza cualquier clase de diagrama que no tenga regla. Las tres visualizaciones de
la portada mantienen sus piezas interactivas propias: estas primitivas son para figuras
estáticas de capítulo.

## Callouts y bloques de código

Un callout es una cita con un marcador en la primera línea. Los marcadores válidos son
`[!NOTA]`, `[!OJO]`, `[!AVISO]` y `[!TRUCO]`; cualquier otro rompe el build:

```md
> [!OJO]
> El nombre del archivo tiene que coincidir con la clase pública.
```

Los bloques de código se escriben como siempre. El build les añade la barra con el
lenguaje y el botón de copiar, que solo aparece cuando hay JavaScript.

El procesador de Markdown es `unified()`, del paquete `@astrojs/markdown-remark`,
porque Astro 7 ya no instala el pipeline de remark y rehype por defecto y sin él los
plugins no corren. Si tocas la parte de Markdown de `astro.config.mjs`, borra
`node_modules/.astro` antes de verificar: ahí vive la caché de HTML renderizado y no
se invalida al cambiar el código de un plugin.

## Entornos

| Entorno | Rama | URL | Quién lo genera |
| --- | --- | --- | --- |
| Local | cualquiera | http://localhost:4321 | `pnpm dev` |
| Preview | cualquier rama | URL única por deploy | Cloudflare Pages |
| Staging | `develop` | URL estable de preview | Cloudflare Pages |
| Producción | `main` | dominio final | Cloudflare Pages |

Configuración en Cloudflare Pages:

- Rama de producción: `main`.
- Previews automáticos para el resto de las ramas.
- `JAVAGOD_SITE_URL` define el dominio canónico en producción. Si no está, se usa la URL del deploy.
- La versión de Node está fijada en `.node-version`.
- `public/_headers` controla caché y cabeceras de seguridad. `public/_redirects` es donde van los cambios de URL, que según la spec S12 nunca pueden romper un enlace existente.

## Antes de mergear

```bash
pnpm build
```

El build corre `astro build`, después `scripts/audit.mjs` y por último
`scripts/check-urls.mjs`. La auditoría falla si hay enlaces internos rotos, más de un
`h1` por página, clases sin regla CSS o guiones largos. La comprobación de URLs falla si
el contrato de `src/urls.json` y `public/_redirects` no cuadra con lo que se generó.
