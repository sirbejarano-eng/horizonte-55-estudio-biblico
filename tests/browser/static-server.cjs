const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', 'dist');
const port = Number(process.argv[2] || 4177);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { response.writeHead(400).end(); return; }
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = path.resolve(root, `.${relative}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const fallback = path.join(root, '404.html');
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fs.readFileSync(fallback));
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
});
server.listen(port, '127.0.0.1', () => console.log(`READY ${port}`));
