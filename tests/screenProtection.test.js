import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindScreenProtectionInput,
  createScreenProtectionController,
  readScreenProtectionSettings,
} from '../src/utils/screenProtection.js';

function fakeClock() {
  let now = 0;
  let next = 0;
  const timers = new Map();
  return {
    now: () => now,
    pending: () => timers.size,
    setTimeout(fn, delay) {
      timers.set(++next, { fn, time: now + delay });
      return next;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    advance(ms) {
      const end = now + ms;
      while (timers.size) {
        const next = [...timers]
          .filter(([, value]) => value.time <= end)
          .sort((a, b) => a[1].time - b[1].time)[0];
        if (!next) break;
        now = next[1].time;
        timers.delete(next[0]);
        next[1].fn();
      }
      now = end;
    },
  };
}

function setup(mode = 'auto', timeoutMinutes = 2) {
  const clock = fakeClock();
  const changes = [];
  const controller = createScreenProtectionController({
    mode,
    timeoutMinutes,
    clock,
    onChange: stage => changes.push(stage),
  });
  controller.activity();
  return { clock, controller, changes };
}

test('new TV installs default to auto; desktop and mobile default to off', () => {
  const storage = { getItem: () => null };
  assert.deepEqual(readScreenProtectionSettings(storage, 'Web0S; Linux/SmartTV'), {
    mode: 'auto',
    timeoutMinutes: 2,
  });
  assert.equal(readScreenProtectionSettings(storage, 'Windows NT 10.0').mode, 'off');
  assert.equal(readScreenProtectionSettings(storage, 'Android 14; Pixel 8 Mobile').mode, 'off');
});

test('valid saved preferences override defaults and invalid or unavailable storage falls back', () => {
  const storage = { getItem: key => (key === 'screenProtectionMode' ? 'black' : '5') };
  assert.deepEqual(readScreenProtectionSettings(storage, ''), { mode: 'black', timeoutMinutes: 5 });
  assert.deepEqual(readScreenProtectionSettings({ getItem: () => 'invalid' }, ''), {
    mode: 'off',
    timeoutMinutes: 2,
  });
  assert.deepEqual(
    readScreenProtectionSettings(
      {
        getItem() {
          throw new Error('Storage blocked');
        },
      },
      'Android TV'
    ),
    { mode: 'auto', timeoutMinutes: 2 }
  );
});

test('auto enters text at two minutes and pure black at five minutes', () => {
  const { clock, controller } = setup();
  clock.advance(119999);
  assert.equal(controller.getStage(), 'awake');
  clock.advance(1);
  assert.equal(controller.getStage(), 'text');
  clock.advance(179999);
  assert.equal(controller.getStage(), 'text');
  clock.advance(1);
  assert.equal(controller.getStage(), 'black');
  assert.equal(clock.pending(), 0);
});

test('text stays text, black goes directly to black, and off never arms timers', () => {
  for (const mode of ['text', 'black', 'off']) {
    const { clock, controller } = setup(mode, 1);
    clock.advance(60000);
    assert.equal(controller.getStage(), mode === 'off' ? 'awake' : mode);
    clock.advance(3600000);
    assert.equal(controller.getStage(), mode === 'off' ? 'awake' : mode);
    assert.equal(clock.pending(), 0);
  }
});

test('activity restarts deadlines and wake cancels the pending black transition', () => {
  const { clock, controller } = setup();
  clock.advance(119000);
  controller.activity();
  clock.advance(119000);
  assert.equal(controller.getStage(), 'awake');
  clock.advance(1000);
  assert.equal(controller.getStage(), 'text');
  controller.activity();
  clock.advance(120000);
  assert.equal(controller.getStage(), 'text');
  clock.advance(60000);
  assert.equal(controller.getStage(), 'text');
});

test('video/admin/hidden suspension clears protection and resume starts a full timeout', () => {
  const { clock, controller } = setup();
  clock.advance(120000);
  controller.suspend(true);
  assert.equal(controller.getStage(), 'awake');
  controller.activity();
  clock.advance(3600000);
  assert.equal(controller.getStage(), 'awake');
  assert.equal(clock.pending(), 0);
  controller.suspend(false);
  clock.advance(119999);
  assert.equal(controller.getStage(), 'awake');
  clock.advance(1);
  assert.equal(controller.getStage(), 'text');
});

test('destroy clears all timers and prevents rearming', () => {
  const { clock, controller, changes } = setup();
  controller.destroy();
  controller.activity();
  clock.advance(3600000);
  assert.equal(clock.pending(), 0);
  assert.deepEqual(changes, ['awake']);
});

function inputSetup() {
  const state = setup();
  const target = new EventTarget();
  const unbind = bindScreenProtectionInput(state.controller, target, state.clock.now);
  let activations = 0;
  target.addEventListener('click', () => activations++);
  const send = (type, props = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, props);
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  state.clock.advance(120000);
  return { ...state, send, unbind, activations: () => activations };
}

test('wake consumes Enter, held repeats, keyup and synthesized click; the next gesture works', () => {
  const { send, activations, controller } = inputSetup();
  assert.equal(send('keydown', { code: 'Enter' }), true);
  assert.equal(controller.getStage(), 'awake');
  assert.equal(send('keydown', { code: 'Enter', repeat: true }), true);
  assert.equal(send('keyup', { code: 'Enter' }), true);
  assert.equal(send('click'), true);
  assert.equal(activations(), 0);
  assert.equal(send('keydown', { code: 'Enter' }), false);
  send('keyup', { code: 'Enter' });
  send('click');
  assert.equal(activations(), 1);
});

test('touch wake consumes compatibility mouse events without activating controls', () => {
  const { send, activations } = inputSetup();
  for (const type of ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
    assert.equal(send(type), true, type);
  }
  assert.equal(activations(), 0);
  send('pointerdown');
  send('pointerup');
  send('click');
  assert.equal(activations(), 1);
});

test('pointer wake consumes the click and a subsequent pointer gesture works', () => {
  const { send, activations } = inputSetup();
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
    assert.equal(send(type), true, type);
  assert.equal(activations(), 0);
  send('pointerdown');
  send('mousedown');
  send('pointerup');
  send('mouseup');
  send('click');
  assert.equal(activations(), 1);
});

test('real pointer movement wakes, stationary coordinates do not keep the UI awake', () => {
  const { send, clock, controller } = inputSetup();
  assert.equal(send('mousemove', { clientX: 10, clientY: 10 }), true);
  clock.advance(119000);
  send('mousemove', { clientX: 11, clientY: 11 });
  clock.advance(1000);
  assert.equal(controller.getStage(), 'text');
});

test('scroll and wheel are activity, and unbinding removes wake interception', () => {
  const { send, controller, clock, unbind } = inputSetup();
  assert.equal(send('wheel'), true);
  clock.advance(119000);
  send('scroll');
  clock.advance(119000);
  assert.equal(controller.getStage(), 'awake');
  clock.advance(1000);
  assert.equal(controller.getStage(), 'text');
  unbind();
  assert.equal(send('keydown', { code: 'Enter' }), false);
  assert.equal(controller.getStage(), 'text');
});
