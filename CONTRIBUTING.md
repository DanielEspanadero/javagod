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
- `since` es la primera versión LTS en la que existe el **tema** del capítulo, no la
  versión de su ejemplo más moderno. Un capítulo de Fundamentos se lee desde Java 8 aunque
  use `var` o bloques de texto: esa parte va en su propia sección, con la versión en el
  título ("var: menos ruido, el mismo tipo (Java 10)"). Si el valor sube, el capítulo deja
  de existir para quien lee en una versión anterior, y ese hueco es peor que una anotación.
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
- La regla de filtrado es la misma en el selector y la búsqueda: `since` debe ser menor
  o igual que la versión elegida y, si hay `hasta`, debe ser mayor o igual que ella.
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

## Servidor de desarrollo

Astro 7 puede servir el sitio en segundo plano. Lo hace cuando el comando lo lanza un agente
y también con `--background`, y escribe el estado en `.astro/dev.json`. Cuando eso pasa,
`pnpm dev` vuelve al prompt sin banner y el sitio sigue en `http://localhost:4321`. Mientras
esa marca exista, un `pnpm dev` nuevo no arranca nada: contesta `Dev server already running`
y termina con salida 0.

| Comando | Qué hace |
| --- | --- |
| `pnpm dev:status` | Dice si hay servidor y en qué modo |
| `pnpm dev:logs` | Muestra lo que escribe el servidor en segundo plano |
| `pnpm dev:stop` | Lo para y limpia la marca |

Si el sitio responde pero un capítulo recién escrito no aparece en la búsqueda, falta
`pnpm build`: en desarrollo el índice de Pagefind es el de la última compilación.

## Búsqueda

La búsqueda es estática y la sirve Pagefind: el build indexa `dist/` y el navegador solo
descarga el índice cuando alguien abre el diálogo. El control vive en
`src/components/SiteSearch.astro`, en la cabecera, y se abre con el botón o con `Cmd`/`Ctrl`
+ `K`. La barra `/` no está tomada porque el terminal de la portada la usa para escribir.

- `pnpm build` corre `astro build`, después `pagefind --site dist --force-language es` y
después la auditoría y el contrato de URLs, en ese orden. Para reindexar sin recompilar:
`pnpm search:index`.
- Solo se indexa lo que lleve `data-pagefind-body`, y hoy eso es el artículo de un capítulo.
  La portada, el índice de documentación y el 404 quedan fuera: la búsqueda responde con
  capítulos, no con el escaparate del sitio.
- El chrome del capítulo se marca con `data-pagefind-ignore` (migas, aviso de versión y
  pager) para que el índice no mezcle navegación con prosa. El `h1` lleva
  `data-pagefind-meta="title"`, así el resultado se llama como el capítulo y no como el
  `<title>` completo.
- `DocsLayout.astro` pasa metadatos `since` y `hasta` al slot `head` de `BaseLayout.astro`.
  Pagefind los devuelve en `entry.data().meta`; la búsqueda filtra antes de limitar a ocho
  filas. Un resultado sin `since` sigue visible. El estado anuncia los disponibles, los
  mostrados (`8 de 15 resultados` si hay más de ocho) y los ocultos por el modo, sin
  nombrar capítulos ocultos.
- La búsqueda lee primero `?v=`, después `javagod:version` y, si no hay elección, usa
  la LTS más reciente del registro. Como el selector, admite `all` y trata un valor
  desconocido como `all`. El selector conserva su valor inicial de todas las versiones.
- Flecha abajo desde el campo enfoca el primer enlace; las flechas recorren los enlaces
  y flecha arriba desde el primero vuelve al campo. Intro en el campo abre el primer
  resultado visible; en un enlace conserva su comportamiento nativo. Tab sigue funcionando
  y Esc cierra y devuelve el foco al botón de búsqueda.
- En `pnpm dev` el servidor no genera índice, porque Pagefind trabaja sobre `dist/`:
  `scripts/pagefind-dev.mjs` monta el último `dist/pagefind` en `/pagefind` mientras dura el
  desarrollo y avisa por consola de la fecha del índice. Si todavía no hay build, el diálogo
  lo dice ("La búsqueda no está disponible todavía: ejecuta `pnpm build`") en vez de fallar
  en silencio. El índice del desarrollo es el de la última compilación, así que un capítulo
  recién escrito no aparece hasta `pnpm build`.
- Sin JavaScript el control no se ve, igual que el selector de versión: la página sigue
  navegable por el árbol, el índice y el pager.

## Página 404

`src/pages/404.astro` genera `dist/404.html`, que es lo que Cloudflare Pages sirve para
cualquier ruta que no exista. Es una página normal del sitio: misma cabecera, mismo pie, un
solo `h1` y solo enlaces que resuelven (S7). Si algún día el sitio pasa a tener rutas
retiradas, el aviso de esa página es lo que ve quien llega por un enlace viejo.

## Marca y logo

La marca es la taza de café con halo, derivada del original del dueño (1254 px). En el repositorio
viven solo las piezas que el sitio usa, recortadas al contenido y con un 3 por ciento de margen:

- `public/logo.webp`, 64 px: marca de la cabecera que pinta `SiteHeader.astro`, con una caja de
  `--badge-size` y `object-fit: contain`. Va en WebP porque se pinta a 32 px y pesa 3 KB, frente a
  los 30 KB que ocupaba el PNG de 256 px.
- `public/favicon.png`, 64 px: icono de la pestaña, declarado en `BaseLayout.astro`.

Los dos son assets estáticos y el build no los genera. Si el original cambia, recórtalo y redúcelo
desde el archivo grande, nunca amplíes el pequeño. La imagen lleva `alt` vacío porque el nombre lo
pone la palabra `JavaGod` al lado: un `alt` con texto haría que un lector de pantalla lo leyera dos
veces. La marca no cambia con el tema; sus azules, naranjas y el amarillo del halo se leen sobre
claro y sobre oscuro.

## Tipografías

Inter y JetBrains Mono se sirven desde el propio dominio, en `public/fonts`, como un archivo
variable latino por familia: Google devuelve los mismos bytes para todos los pesos, así que una
sola petición cubre de 400 a 700 en Inter y de 400 a 500 en JetBrains Mono. Las declaraciones viven
en `src/styles/fonts.css` con `font-display: swap`, e Inter se precarga desde `BaseLayout.astro`
porque pinta la primera pantalla. Si algún día hace falta otro alfabeto, añade el archivo de esa
familia y su `unicode-range` en vez de volver al enlace externo: la hoja de Google bloqueaba el
primer pintado y dependía de un tercero.

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

### Puesta en marcha del proyecto

1. En Cloudflare, Pages > Connect to Git, y elige el repositorio.
2. Build command `pnpm build`, output directory `dist`. La versión de Node sale de
   `.node-version`.
3. Rama de producción `main`; el resto generan previews automáticos.
4. Define `JAVAGOD_SITE_URL` con el dominio final, sin barra al final.

El primer deploy tiene que publicar un sitio completo, no un esqueleto: si `dist` no trae
el índice de Pagefind o las cabeceras de `public/_headers`, el build local tampoco las
estaba generando.

### Comprobación tras desplegar

- `/` carga la portada con el logo y el pipeline.
- `/docs/` lista las tres secciones y los dieciocho capítulos.
- Un capítulo profundo, por ejemplo `/docs/concurrencia/hilos-virtuales/`, abre con su
  TOC y muestra el aviso de versión al cambiar el modo de lectura a Java 17.
- `/404.html` responde con la página propia, no con la de Cloudflare.
- `curl -I https://<dominio>/logo.webp` devuelve las cabeceras de caché de
  `public/_headers`.
- La búsqueda devuelve resultados: el índice vive en `dist/pagefind`.

`pnpm preview` sirve lo mismo que se despliega, así que sirve para ensayar estas
comprobaciones antes de conectar el repositorio.

## Antes de mergear

```bash
pnpm build
```

El build corre `astro build`, después `pagefind`, después `scripts/audit.mjs` y por último
`scripts/check-urls.mjs`. La auditoría falla si hay enlaces internos rotos, más de un
`h1` por página, clases sin regla CSS, guiones largos, recursos de terceros en el HTML, una
tipografía que no está en `dist` o una página que se pasa del presupuesto de tamaño: 150 KB de
HTML por página y 70 KB para el CSS propio de `_astro` (las hojas de Pagefind no cuentan, solo se
cargan al abrir el buscador). La comprobación de URLs falla si
el contrato de `src/urls.json` y `public/_redirects` no cuadra con lo que se generó.
Si el paso de Pagefind falla, el build se detiene ahí: una búsqueda sin índice sería un
control que promete lo que no hace.

El presupuesto no viene de Lighthouse ni de un número redondo: sale de lo que mide el sitio hoy
con margen para crecer. Si de verdad hace falta subirlo, se sube en `scripts/audit.mjs` en el
mismo commit que lo justifica, no se desactiva la comprobación.
