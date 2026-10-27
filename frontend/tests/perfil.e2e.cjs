const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const os = require('node:os');
const path = require('node:path');

const baseURL = process.env.FRONTEND_URL || 'http://localhost:5173';

test('el perfil y la contraseña se guardan de forma independiente', { timeout: 120_000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  });
  try {
    const context = await browser.newContext({ baseURL, viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    const email = `perfil-e2e-${Date.now()}@example.com`;
    const anterior = 'prueba1234';
    const nueva = 'prueba5678';

    await page.goto('/registro');
    await page.getByLabel('Nombre', { exact: false }).fill('Ana');
    await page.getByLabel('Apellido', { exact: false }).fill('Prueba');
    await page.getByLabel('Email', { exact: false }).fill(email);
    await page.locator('[name="password"]').fill(anterior);
    await page.locator('[name="confirmacion"]').fill(anterior);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/');
    await page.goto('/perfil');
    await page.getByRole('heading', { name: 'Mi perfil', exact: true }).waitFor();

    const perfil = page.locator('form').filter({ has: page.getByRole('button', { name: 'Guardar cambios', exact: true }) });
    const seguridad = page.locator('form').filter({ has: page.getByRole('button', { name: 'Cambiar contraseña', exact: true }) });
    assert.equal(await perfil.locator('input[type="password"]').count(), 0);
    await perfil.locator('[name="nombre"]').fill('Ana Actualizada');
    await perfil.locator('[name="telefono"]').fill('1199887766');
    const guardado = page.waitForResponse(r => r.request().method() === 'PUT' && /\/api\/clientes\/\d+$/.test(r.url()));
    await perfil.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    const respuesta = await guardado;
    assert.equal(respuesta.status(), 200);
    assert.equal(Object.hasOwn(respuesta.request().postDataJSON(), 'password'), false);
    assert.equal((await respuesta.json()).telefono, '1199887766');
    const login = password => context.request.post('/api/auth/login', { data: { email, password } });
    assert.equal((await login(anterior)).status(), 200);

    let intentosPassword = 0;
    page.on('request', req => {
      if (req.method() === 'PUT' && req.url().endsWith('/password')) intentosPassword++;
    });
    const completarPassword = async (actual, passwordNueva, confirmacion = passwordNueva) => {
      await seguridad.locator('[name="passwordActual"]').fill(actual);
      await seguridad.locator('[name="passwordNueva"]').fill(passwordNueva);
      await seguridad.locator('[name="confirmacion"]').fill(confirmacion);
    };
    await completarPassword(anterior, nueva, 'diferente');
    await seguridad.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
    await seguridad.getByText('Las contraseñas no coinciden.', { exact: true }).waitFor();
    assert.equal(intentosPassword, 0);

    await completarPassword('incorrecta', nueva);
    const rechazo = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith('/password'));
    await seguridad.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
    assert.equal((await rechazo).status(), 401);
    await seguridad.getByText('Revisá tu contraseña actual y que tu cuenta esté activa.', { exact: true }).waitFor();
    assert.equal((await login(anterior)).status(), 200);

    await completarPassword(anterior, nueva);
    const cambio = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith('/password'));
    await seguridad.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
    assert.equal((await cambio).status(), 204);
    await page.getByText('Contraseña actualizada', { exact: true }).waitFor();
    assert.equal(await seguridad.locator('[name="passwordActual"]').inputValue(), '');
    assert.equal(await seguridad.locator('[name="passwordNueva"]').inputValue(), '');
    assert.equal(await seguridad.locator('[name="confirmacion"]').inputValue(), '');
    assert.equal((await login(anterior)).status(), 401);
    assert.equal((await login(nueva)).status(), 200);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.screenshot({ path: path.join(os.tmpdir(), 'cineclick-perfil-desktop.png'), fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(os.tmpdir(), 'cineclick-perfil-mobile.png'), fullPage: true, animations: 'disabled' });
    assert.deepEqual(errores, []);

    // La contraseña nueva también funciona desde una sesión de navegador nueva.
    const nuevoContexto = await browser.newContext({ baseURL });
    const ingreso = await nuevoContexto.newPage();
    await ingreso.goto('/login');
    await ingreso.locator('[name="email"]').fill(email);
    await ingreso.locator('[name="password"]').fill(nueva);
    await ingreso.getByRole('button', { name: /Ingresar|Ingresá|Entrar/, exact: false }).click();
    await ingreso.waitForURL(url => url.pathname === '/');
    await nuevoContexto.close();
    await context.close();
  } finally {
    await browser.close();
  }
});
