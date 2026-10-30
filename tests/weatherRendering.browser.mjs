const { chromium } = await import(process.env.WEATHER_BROWSER_MODULE || 'playwright');
import assert from 'node:assert/strict';
const report = (...parts) => process.stdout.write(parts.join(' ') + '\n');
const browser = await chromium.launch({
  executablePath: process.env.WEATHER_BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ['--no-sandbox'],
});
const html = `<!doctype html><html><head><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script></head><body style="margin:0"><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import WeatherBackground from '/src/components/WeatherBackground.jsx';
import {SettingsProvider} from '/src/contexts/SettingsContext.jsx';
import '/src/styles/globals.css';
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SettingsProvider,null,React.createElement(WeatherBackground)));
</script></body></html>`;
async function open({
  type = 'rain',
  night = false,
  ua = 'Mozilla/5.0 (Web0S; Linux/SmartTV) Chrome/108.0',
  reducedMotion = 'no-preference',
  slow = false,
  fail = false,
} = {}) {
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 2,
    userAgent: ua,
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/weather-test', r => r.fulfill({ contentType: 'text/html', body: html }));
  await page.addInitScript(
    ({ type, night, slow, fail }) => {
      localStorage.setItem('backgroundAnimation', 'weather');
      localStorage.setItem('weatherMode', 'manual');
      localStorage.setItem('weatherPerformance', 'high');
      localStorage.setItem(
        'manualWeatherState',
        JSON.stringify({ weatherType: type, timeOfDay: night ? 'night' : 'day' })
      );
      if (slow) {
        const native = window.requestAnimationFrame;
        window.requestAnimationFrame = callback => native.call(window, time => callback(time * 30));
      }
      if (fail) HTMLCanvasElement.prototype.getContext = () => null;
    },
    { type, night, slow, fail }
  );
  await page.goto(`${process.env.WEATHER_TEST_URL || 'http://127.0.0.1:3000'}/weather-test`);
  await page.waitForSelector('#root > div', { state: 'attached', timeout: 10000 });
  return { context, page, errors };
}
try {
  for (const type of ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog'])
    for (const night of [false, true]) {
      const { context, page, errors } = await open({ type, night });
      await page.waitForFunction(() => document.querySelector('canvas')?.width === 1280);
      const canvases = await page
        .locator('canvas')
        .evaluateAll(cs =>
          cs.map(c => ({ w: c.width, h: c.height, filter: getComputedStyle(c).filter }))
        );
      assert.equal(await page.locator('html').getAttribute('data-weather-rendering'), 'tv');
      assert.ok(canvases.every(c => c.w <= 1280 && c.h <= 720 && c.filter === 'none'));
      assert.deepEqual(errors, []);
      await page.waitForFunction(() => {
        const c = document.querySelector('canvas');
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        return data.some((v, i) => i % 4 === 3 && v > 0);
      });
      if (type === 'snow' && !night) {
        await page.waitForFunction(
          () =>
            Number(getComputedStyle(document.querySelector('canvas').parentElement).opacity) > 0.95
        );
        if (process.env.WEATHER_SCREENSHOT)
          await page.screenshot({ path: process.env.WEATHER_SCREENSHOT });
      }
      report('PASS TV', type, night ? 'night' : 'day', JSON.stringify(canvases));
      await context.close();
    }
  {
    const { context, page, errors } = await open({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('html').getAttribute('data-weather-rendering'), 'static');
    assert.equal(await page.locator('canvas').count(), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('canvas')?.width === 1280);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(
      () => document.documentElement.dataset.weatherRendering === 'static'
    );
    assert.equal(await page.locator('canvas').count(), 0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.documentElement.dataset.weatherRendering === 'tv');
    assert.deepEqual(errors, []);
    report('PASS reduced motion and visibility resume');
    await context.close();
  }
  {
    const { context, page, errors } = await open({ slow: true });
    await page.waitForFunction(
      () => document.documentElement.dataset.weatherRendering === 'static',
      {},
      { timeout: 15000 }
    );
    assert.equal(await page.locator('canvas').count(), 0);
    assert.deepEqual(errors, []);
    report('PASS slow-rendering fallback to static');
    await context.close();
  }
  {
    const { context, page, errors } = await open({ fail: true });
    await page.waitForFunction(
      () => document.documentElement.dataset.weatherRendering === 'static'
    );
    assert.equal(await page.locator('canvas').count(), 0);
    assert.deepEqual(errors, []);
    report('PASS unavailable canvas fallback');
    await context.close();
  }
  {
    const { context, page, errors } = await open({
      ua: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/132.0',
    });
    await page.waitForFunction(() => document.querySelector('canvas')?.width === 7680);
    assert.equal(await page.locator('html').getAttribute('data-weather-rendering'), null);
    assert.deepEqual(errors, []);
    report('PASS desktop retains full resolution');
    await context.close();
  }
} finally {
  await browser.close();
}
