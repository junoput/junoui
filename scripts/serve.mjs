// Tiny zero-dep static server for the showcase. The demo loads tokens via an
// ES module `import` (the same path a consumer uses), so it MUST be served over
// http — opening index.html as a file:// URL trips CORS and no JS runs. Run via
// `npm run showcase`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8137;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  if (path === '/') path = '/showcase/index.html';
  // contain to ROOT; reject path traversal
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
})
  .listen(PORT, () => {
    console.log(`\n  junoui showcase → http://localhost:${PORT}/showcase/index.html\n`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n  Port ${PORT} is already in use — a showcase server is probably still running` +
          `\n  (http://localhost:${PORT}/showcase/index.html).` +
          `\n  Stop it, or pick another port:  PORT=8138 npm run showcase\n`,
      );
      process.exit(1);
    }
    throw err;
  });
