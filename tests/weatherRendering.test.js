import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFrameMonitor,
  getCanvasSize,
  isTvBrowser,
  startWeatherAnimation,
  TV_PROFILES,
} from '../src/modules/weather/rendering.js';

test('TV detection recognizes Android, webOS and Fire TV without classifying desktop Android as TV', () => {
  for (const ua of [
    'Mozilla/5.0 (Web0S; Linux/SmartTV) Chrome/108.0',
    'Mozilla/5.0 (webOS; Linux) AppleWebKit/537.36',
    'Mozilla/5.0 (Linux; Android 11; BRAVIA 4K VH2) Safari/537.36',
    'Mozilla/5.0 (Linux; Android 12; Android TV) Chrome/120.0',
    'Mozilla/5.0 (Linux; Android 9; AFTMM) Silk/80',
    'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0)',
  ])
    assert.equal(isTvBrowser(ua), true, ua);
  for (const ua of [
    'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
  ])
    assert.equal(isTvBrowser(ua), false, ua);
});

test('TV backing sizes ignore high DPR, obey both bounds and preserve aspect ratio', () => {
  assert.deepEqual(getCanvasSize(3840, 2160, 2, TV_PROFILES[0]), { width: 1280, height: 720 });
  assert.deepEqual(getCanvasSize(3840, 2160, 2, TV_PROFILES[1]), { width: 960, height: 540 });
  assert.deepEqual(getCanvasSize(1080, 1920, 3, TV_PROFILES[0]), { width: 405, height: 720 });
  assert.deepEqual(getCanvasSize(640, 360, 3, TV_PROFILES[0]), { width: 640, height: 360 });
  assert.deepEqual(getCanvasSize(1920, 1080, 2), { width: 3840, height: 2160 });
  assert.deepEqual(getCanvasSize(0, 0, 2, TV_PROFILES[0]), { width: 1, height: 1 });
});

test('fallback needs consecutive slow windows, ignores isolated stalls, and resets on resume', () => {
  let downgrades = 0;
  const monitor = createFrameMonitor(() => downgrades++);
  let now = 0;
  monitor.frame(now);
  const windowAt = fps => {
    const start = now;
    for (let i = 1; i <= fps * 5; i++) monitor.frame(start + (i * 1000) / fps);
    now += 5000;
  };
  windowAt(10);
  assert.equal(downgrades, 0);
  windowAt(30);
  windowAt(10);
  assert.equal(downgrades, 0);
  windowAt(10);
  assert.equal(downgrades, 1);
  monitor.reset();
  now += 60000;
  monitor.frame(now);
  windowAt(10);
  assert.equal(downgrades, 1);
  windowAt(10);
  assert.equal(downgrades, 2);
});

function scheduler(hidden = false) {
  let next = 0;
  const pending = new Map();
  const listeners = new Map();
  const page = {
    hidden,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: type => listeners.delete(type),
  };
  const environment = {
    requestAnimationFrame: fn => {
      pending.set(++next, fn);
      return next;
    },
    cancelAnimationFrame: id => pending.delete(id),
  };
  return {
    page,
    environment,
    pending,
    listeners,
    tick(now) {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach(fn => fn(now));
    },
    hide(value) {
      page.hidden = value;
      listeners.get('visibilitychange')?.();
    },
  };
}

test('frame caps preserve movement speed and leave only one scheduled callback', () => {
  for (const fps of [20, 30]) {
    const fake = scheduler();
    let frames = 0;
    let seconds = 0;
    const stop = startWeatherAnimation({
      ...fake,
      fps,
      draw(delta) {
        frames++;
        seconds += delta;
      },
    });
    for (let i = 0; i <= 120; i++) fake.tick((i * 1000) / 60);
    assert.ok(frames >= fps * 2 && frames <= fps * 2 + 1, `${fps}: ${frames}`);
    assert.ok(Math.abs(seconds - 2) < 0.02, `${fps}: ${seconds}`);
    assert.equal(fake.pending.size, 1);
    stop();
    assert.equal(fake.pending.size, 0);
    assert.equal(fake.listeners.size, 0);
  }
});

test('hidden pages stop drawing, resume without a time jump, and cleanup prevents restart', () => {
  const fake = scheduler();
  const deltas = [];
  const stop = startWeatherAnimation({ ...fake, fps: 30, draw: delta => deltas.push(delta) });
  fake.tick(0);
  fake.tick(34);
  fake.hide(true);
  assert.equal(fake.pending.size, 0);
  fake.tick(60000);
  assert.equal(deltas.length, 2);
  fake.hide(false);
  fake.tick(60034);
  assert.equal(deltas.at(-1), 0);
  stop();
  fake.hide(false);
  assert.equal(fake.pending.size, 0);
});

test('initially hidden pages allocate no animation frame; draw errors stop the loop', () => {
  const fake = scheduler(true);
  let errors = 0;
  const stop = startWeatherAnimation({
    ...fake,
    draw() {
      throw new Error('Context lost');
    },
    onError() {
      errors++;
    },
  });
  assert.equal(fake.pending.size, 0);
  fake.hide(false);
  fake.tick(0);
  assert.equal(errors, 1);
  assert.equal(fake.pending.size, 0);
  fake.hide(true);
  fake.hide(false);
  assert.equal(fake.pending.size, 0);
  stop();
});
