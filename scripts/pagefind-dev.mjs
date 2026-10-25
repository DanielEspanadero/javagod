// @ts-check
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Serve the Pagefind index built by `pnpm build` while `pnpm dev` runs.
 *
 * Pagefind indexes `dist/`, which the dev server never produces, so the search
 * dialog used to answer "no está disponible en este build" during development.
 * This middleware mounts `dist/pagefind` under `/pagefind` in serve mode only:
 * production keeps writing the index with the real command, and a missing
 * directory simply falls through to the usual 404.
 */
export function pagefindDevIndex() {
  const root = path.resolve('dist/pagefind');
  let announced = false;

  /** @type {Record<string, string>} */
  const types = {
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.pagefind': 'application/octet-stream',
    '.pf_fragment': 'application/octet-stream',
    '.pf_index': 'application/octet-stream',
    '.pf_meta': 'application/octet-stream',
    '.wasm': 'application/wasm',
  };

  return {
    name: 'javagod-pagefind-dev',
    apply: 'serve',
    /**
     * @param {{ middlewares: { use: (route: string, handler: (req: any, res: any, next: () => void) => void) => void } }} server
     */
    configureServer(server) {
      server.middlewares.use('/pagefind', (req, res, next) => {
        const requested = (req.url ?? '/').split('?')[0];
        const file = path.join(root, path.normalize(requested).replace(/^([/\\])+/, ''));

        if (!file.startsWith(root)) return next();

        stat(file)
          .then((info) => {
            if (!info.isFile()) return next();

            if (!announced) {
              announced = true;
              console.log(
                `\n  search: sirviendo el índice de ${path.relative(process.cwd(), root)}` +
                  ` (${new Date(info.mtimeMs).toLocaleString('es-ES')}).` +
                  '\n  search: si el contenido cambió, ejecuta `pnpm build` para refrescarlo.\n',
              );
            }

            res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-store');
            createReadStream(file).pipe(res);
          })
          .catch(() => next());
      });
    },
  };
}
