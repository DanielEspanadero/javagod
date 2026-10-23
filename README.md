# JavaGod

Documentación visual de Java en español: un curso que se lee del principio al final, con
diagramas que se entienden sin JavaScript y una búsqueda que lleva directo al tema que
buscabas.

El sitio se genera como HTML estático, no tiene backend y se despliega en Cloudflare Pages.

## Qué hay dentro

- Tres secciones y dieciocho capítulos: Fundamentos, Orientación a Objetos, Colecciones y
  Concurrencia.
- Diagramas en HTML y CSS, legibles en estático, con animación solo como capa extra.
- Modo de lectura por versión: un `since` por capítulo y un selector que filtra lo que aún no
  existía en la versión elegida, sin duplicar contenido ni URLs.
- Búsqueda estática con Pagefind, construida en cada `pnpm build`.
- Reglas del contenido comprobadas por el build: frontmatter, enlaces, `h1` único, clases CSS
  sin regla y guiones prohibidos.

## Stack

- [Astro](https://astro.build) 7 con salida estática y colecciones de contenido.
- CSS nativo con tokens, sin framework de estilos.
- [Pagefind](https://pagefind.app) para el índice de búsqueda.
- pnpm 11 y Node 22.12 o superior (`.node-version` fija la versión exacta).

Las tipografías van autoalojadas: Inter y JetBrains Mono, ambas con licencia SIL Open Font
License, que está en `public/fonts`.

## Arrancar en un minuto

```bash
pnpm install
pnpm dev
```

`pnpm dev` sirve el sitio en `http://localhost:4321` con recarga en caliente. Si el comando
vuelve al prompt sin banner, Astro está sirviendo en segundo plano o ya había un servidor
arrancado: `pnpm dev:status` lo dice y `pnpm dev:stop` lo para.

## Compilar y comprobar

```bash
pnpm build
```

Ese comando es el contrato de calidad del repositorio. Encadena cuatro pasos y se detiene en
el primero que falle:

1. `astro build` genera `dist`.
2. Pagefind indexa el sitio publicado.
3. `scripts/audit.mjs` comprueba enlaces internos, un solo `h1` por página, clases sin regla CSS
   y guiones largos.
4. `scripts/check-urls.mjs` verifica que el manifiesto `src/urls.json` y `public/_redirects`
   cuadren con las rutas generadas.

Para ver lo que se despliega, `pnpm preview` sirve `dist` sin reconstruirlo.

Comandos sueltos útiles:

| Comando | Qué hace |
| --- | --- |
| `pnpm dev:status` | Dice si hay servidor de desarrollo y en qué modo |
| `pnpm dev:logs` | Muestra la salida del servidor en segundo plano |
| `pnpm dev:stop` | Para el servidor de desarrollo |
| `pnpm new:doc` | Crea un capítulo nuevo con el frontmatter correcto |
| `pnpm audit` | Solo la auditoría del HTML generado |
| `pnpm urls:update` | Registra en `src/urls.json` las rutas nuevas de `dist` |
| `pnpm search:index` | Reconstruye el índice de Pagefind |

## Estructura

```text
src/
  components/     Piezas de la interfaz (cabecera, árbol, TOC, buscador, diagramas)
  content/docs/   Los capítulos, un Markdown por tema y sección
  layouts/        Base y documentación
  pages/          Portada, índice de documentación, 404
  styles/         tokens, base, layout y estilos por área
  urls.json       Manifiesto público de rutas
scripts/          Auditoría, contrato de URLs y andamiaje de capítulos
public/           Assets estáticos, tipografías y cabeceras de Cloudflare
odd/tasks/        Registro de alcance, decisiones y evidencias del proyecto
```

## Escribir contenido

Un capítulo es un archivo Markdown con frontmatter. No hay que tocar componentes ni el menú:
la navegación se deriva del contenido. `CONTRIBUTING.md` explica el formato, los diagramas, los
callouts, las reglas de idioma y el flujo de trabajo por ramas.

## Entrega

Cloudflare Pages conecta el repositorio, compila con `pnpm build` y publica `dist`. La rama de
producción es `main` y el resto generan previews. `CONTRIBUTING.md` detalla la configuración,
las cabeceras de `public/_headers` y las comprobaciones que se hacen tras el primer despliegue.

## Antes de tocar nada

`odd/tasks/javagod.md` es el registro autoritativo: specs, tareas y el porqué de cada decisión.
Si algo del código no encaja con lo que explica ese documento, gana el documento y hay que
actualizarlo con la evidencia del cambio.
