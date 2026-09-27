import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`request failed: ${request.url()} (${request.failure()?.errorText})`);
  });
  return errors;
}

async function expectNoRuntimeErrors(errors: string[]) {
  await expect.poll(() => errors, { timeout: 1_000 }).toEqual([]);
}

test('rutas públicas principales y estudios aprobados responden', async ({ request }) => {
  const publicRoutes = [
    '/', '/biblioteca/', '/buscar/', '/cronologia/', '/leer/genesis/1/', '/planes/', '/marcas/',
    '/estudios/', '/estudios/eden/', '/estudios/babel/', '/estudios/abraham/',
    '/en/', '/en/library/', '/en/timeline/', '/en/read/juan/3/', '/en/studies/pablo/',
    '/de/', '/de/bibliothek/', '/de/zeitleiste/', '/de/lesen/juan/3/', '/de/studien/daniel/',
  ];
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} devolvió ${response.status()}`).toBeTruthy();
  }
});

test('navega por lector, selector de libro, idioma y estudio aprobado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'El flujo móvil se prueba por separado.');
  const errors = collectRuntimeErrors(page);

  await page.goto('/leer/genesis/1/');
  await expect(page.getByRole('heading', { name: /Capítulo 1/ })).toBeVisible();
  await expect(page.locator('.scripture .v')).not.toHaveCount(0);

  const bookSelect = page.locator('.reader-aside select').first();
  await expect.poll(async () => bookSelect.locator('option').count()).toBeGreaterThan(1);
  await bookSelect.selectOption('exodo');
  await page.waitForURL('**/leer/exodo/1/');
  await expect(page.getByRole('heading', { name: /Capítulo 1/ })).toBeVisible();

  await page.goto('/cronologia/');
  await page.getByRole('button', { name: 'Idioma y versión' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.waitForURL('**/en/timeline/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/timeline|sacred text/i);

  await page.goto('/estudios/eden/');
  const firstImage = page.locator('.context-image-open').first();
  await expect(firstImage).toBeVisible();
  await firstImage.click();
  await expect(page.locator('#contextImageDialog')).toHaveJSProperty('open', true);
  await expect(page.locator('#contextImageDialogImage')).toBeVisible();
  await page.getByRole('button', { name: /Cerrar imagen ampliada/i }).click();
  await expect(page.locator('#contextImageDialog')).not.toHaveAttribute('open', '');

  await expectNoRuntimeErrors(errors);
});

test('menú móvil permanece por encima del contenido y permite navegar', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Este flujo requiere el viewport móvil.');
  const errors = collectRuntimeErrors(page);
  await page.goto('/leer/genesis/1/');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toBeVisible();
  const menuBox = await menu.boundingBox();
  expect(menuBox?.height).toBeGreaterThan(300);
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  await menu.getByRole('link', { name: 'Línea de tiempo' }).click();
  await page.waitForURL('**/cronologia/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoRuntimeErrors(errors);
});




test('los fallos de almacenamiento se muestran sin romper la aplicación', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'Una ejecución de la capa común de almacenamiento es suficiente.');
  const errors = collectRuntimeErrors(page);
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () { throw new DOMException('Acceso bloqueado', 'SecurityError'); };
    Storage.prototype.setItem = function () { throw new DOMException('Cuota agotada', 'QuotaExceededError'); };
    Storage.prototype.removeItem = function () { throw new DOMException('Acceso bloqueado', 'SecurityError'); };
  });

  await page.goto('/leer/genesis/1/');
  await page.getByRole('button', { name: 'Aumentar texto' }).click();
  await expect(page.locator('.reader-aside .action-status')).toContainText('No se pudo guardar');

  await page.goto('/biblioteca/');
  await page.getByRole('button', { name: 'Exportar progreso' }).click();
  await expect(page.locator('.backup .action-status')).toContainText('No se pudo exportar');
  await expectNoRuntimeErrors(errors);
});
