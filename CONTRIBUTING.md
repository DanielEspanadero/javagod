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
