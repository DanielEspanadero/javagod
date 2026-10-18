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
---
```

- `section` tiene que ser una de las declaradas en `src/lib/sections.mjs` y coincidir con
  la carpeta donde vive el archivo: un capítulo en `objetos/` que declare
  `section: fundamentos` rompe el build.
- `order` es la posición dentro de la sección y no puede repetirse.
- No escribas `slug`: la URL sale del path y el build rechaza la clave.

El resto es automático: el árbol lateral, el TOC, las migas y los enlaces anterior y
siguiente se derivan del contenido. No hay que tocar componentes ni índices (S9).

### Con `pnpm new:doc`

El scaffolder escribe el archivo con el frontmatter válido y el `order` siguiente de la
sección, así que no hay que calcularlo ni copiarlo de otro capítulo:

```bash
pnpm new:doc fundamentos tipos-primitivos --title "Tipos primitivos" \
  --description "Los ocho tipos primitivos y cuándo usar cada uno."
```

- La sección tiene que existir en el registro; si no, el comando lista los ids válidos.
- El slug es kebab-case y no se puede repetir: el scaffolder no sobrescribe archivos.
- `--title` es obligatorio. Si no pasas `--description`, se usa el título y el comando lo
  avisa por pantalla.
- Imprime la ruta del archivo y su URL final, y crea la carpeta de la sección si todavía
  no existe.

Después de generarlo, escribe el contenido y comprueba con `pnpm build`.

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

El build corre `astro build` y después `scripts/audit.mjs`. La auditoría falla si hay enlaces internos rotos, más de un `h1` por página, clases sin regla CSS o guiones largos.
