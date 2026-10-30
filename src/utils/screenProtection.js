import { isTvBrowser } from '../modules/weather/rendering.js';

export const SCREEN_PROTECTION_MODES = ['auto', 'text', 'black', 'off'];
export const SCREEN_PROTECTION_TIMEOUTS = [1, 2, 5, 10];

export function readScreenProtectionSettings(storage, userAgent) {
  let mode;
  let timeout;
  try {
    mode = storage.getItem('screenProtectionMode');
    timeout = Number(storage.getItem('screenProtectionTimeoutMinutes'));
  } catch {
    /* Restricted storage still gets safe device defaults. */
  }
  return {
    mode: SCREEN_PROTECTION_MODES.includes(mode) ? mode : isTvBrowser(userAgent) ? 'auto' : 'off',
    timeoutMinutes: SCREEN_PROTECTION_TIMEOUTS.includes(timeout) ? timeout : 2,
  };
}

export function createScreenProtectionController({
  mode,
  timeoutMinutes,
  onChange,
  clock = window,
}) {
  let stage = 'awake';
  let timer = null;
  let suspended = false;
  let destroyed = false;
  const change = value => {
    stage = value;
    onChange(value);
  };
  const clear = () => {
    if (timer !== null) clock.clearTimeout(timer);
    timer = null;
  };
  const activity = () => {
    clear();
    if (destroyed) return;
    change('awake');
    if (suspended || mode === 'off') return;
    timer = clock.setTimeout(() => {
      timer = null;
      change(mode === 'black' ? 'black' : 'text');
      if (mode === 'auto')
        timer = clock.setTimeout(() => {
          timer = null;
          change('black');
        }, 180000);
    }, timeoutMinutes * 60000);
  };
  return {
    getStage: () => stage,
    activity,
    suspend(value) {
      suspended = value;
      activity();
    },
    destroy() {
      destroyed = true;
      clear();
    },
  };
}

// Capture before React and D-pad handlers. Keep the entire wake gesture inert,
// including key repeats and the compatibility click after a touch or Enter key.
export function bindScreenProtectionInput(controller, target = window, now = () => Date.now()) {
  const heldKeys = new Set();
  let pointerGesture = false;
  let suppressClickUntil = 0;
  let lastPoint = null;
  const consume = event => {
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  };
  const handle = event => {
    const type = event.type;
    const key = event.code || event.key || event.keyCode;
    if (type === 'keyup' && heldKeys.delete(key)) {
      suppressClickUntil = now() + 500;
      consume(event);
      return;
    }
    if (type === 'keydown' && heldKeys.has(key)) {
      consume(event);
      return;
    }
    if (type === 'click' && (pointerGesture || now() < suppressClickUntil)) {
      consume(event);
      pointerGesture = false;
      suppressClickUntil = 0;
      return;
    }
    if (now() < suppressClickUntil && /^(mousedown|mouseup|pointerup|touchend)$/.test(type)) {
      consume(event);
      return;
    }
    if (/^(pointerup|mouseup|touchend|pointercancel|touchcancel)$/.test(type) && pointerGesture) {
      pointerGesture = false;
      suppressClickUntil = now() + 500;
      consume(event);
      return;
    }
    if (pointerGesture && /^(pointermove|mousemove|mousedown|touchstart|touchmove)$/.test(type)) {
      consume(event);
      return;
    }
    if (type === 'keyup' || /^(pointerup|mouseup|touchend|pointercancel|touchcancel)$/.test(type))
      return;
    if (/^(pointermove|mousemove)$/.test(type)) {
      const point = [event.clientX, event.clientY];
      if (lastPoint && Math.hypot(point[0] - lastPoint[0], point[1] - lastPoint[1]) < 3) return;
      lastPoint = point;
    }
    const waking = controller.getStage() !== 'awake';
    if (waking) {
      if (type === 'keydown') heldKeys.add(key);
      if (/^(pointerdown|mousedown|touchstart)$/.test(type)) pointerGesture = true;
      consume(event);
    } else if (type === 'keydown' || type === 'pointerdown' || type === 'mousedown') {
      suppressClickUntil = 0;
    }
    controller.activity();
  };
  const events = [
    'keydown',
    'keyup',
    'pointerdown',
    'pointerup',
    'pointercancel',
    'pointermove',
    'mousedown',
    'mouseup',
    'mousemove',
    'click',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'wheel',
    'scroll',
  ];
  events.forEach(type => target.addEventListener(type, handle, { capture: true, passive: false }));
  const reset = () => {
    heldKeys.clear();
    pointerGesture = false;
    suppressClickUntil = 0;
    lastPoint = null;
  };
  target.addEventListener('blur', reset);
  return () => {
    events.forEach(type => target.removeEventListener(type, handle, { capture: true }));
    target.removeEventListener('blur', reset);
  };
}
