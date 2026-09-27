import { expect, test, type Browser, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

async function startServer(port: number) {
  const child = spawn(process.execPath, [path.resolve('tests/browser/static-server.cjs'), String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor offline de prueba no inició.')), 10_000);
    child.once('error', reject);
    child.stdout!.on('data', (chunk) => {
      if (String(chunk).includes(`READY ${port}`)) { clearTimeout(timer); resolve(); }
    });
  });
  return child;
}

async function stopServer(child: ChildProcess) {
  if (child.exitCode !== null) return;
  child.kill();
  await new Promise<void>((resolve) => { child.once('exit', () => resolve()); setTimeout(resolve, 5_000); });
}

async function waitForOfflinePreparation(page: Page) {
  await expect(page.locator('.offline-status')).toHaveClass(/is-ready/, { timeout: 45_000 });
}

async function runOfflineChapterTest(browser: Browser) {
  const port = 4177;
  const origin = `http://127.0.0.1:${port}`;
  const server = await startServer(port);
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/`);
    await waitForOfflinePreparation(page);

    const preparedCatalog = await page.evaluate(async () => {
      const names = await caches.keys();
      const requests = (await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))).flat();
      const request = requests.find((item) => new URL(item.url).pathname === '/content/books-es-onbv.json');
      if (!request) return null;
      const response = await caches.match(request);
      if (!response) return null;
      const data = await response.json();
      const book = data.books?.find((item: { id: string }) => item.id === 'levitico');
      return {
        book: book?.title,
        hasChapter: book?.chapters?.some((chapter: { number: number }) => chapter.number === 13),
        version: new URL(request.url).searchParams.get('v'),
      };
    });
    expect(preparedCatalog).toEqual({ book: 'Levítico', hasChapter: true, version: expect.stringMatching(/^[a-f0-9]{16}$/) });

    const neverVisited = `/leer/levitico/13/?offline-smoke=${Date.now()}`;
    const cachedBefore = await page.evaluate(async (path) => Boolean(await caches.match(new URL(path, location.origin).pathname)), neverVisited);
    expect(cachedBefore).toBe(false);

    await stopServer(server);
    await page.goto(`${origin}${neverVisited}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Capítulo 13/ })).toBeVisible();
    await expect(page.locator('.chapter-book')).toContainText('Levítico');
    await expect(page.locator('.chapter-meta')).toContainText('Estás sin conexión');
    await expect(page.locator('.scripture .v')).not.toHaveCount(0);
  } finally {
    await stopServer(server);
    await context.close();
  }
}

test('un capítulo nunca visitado se abre desde el catálogo al quedar sin conexión', async ({ browser }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Una ejecución por navegador es suficiente para el Service Worker.');
  await runOfflineChapterTest(browser);
});
