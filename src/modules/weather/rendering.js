// Weather rendering budgets are independent of the user's saved quality setting.
export const TV_PROFILES = [
  { name: 'tv', maxWidth: 1280, maxHeight: 720, fps: 30, particleMultiplier: 0.6 },
  { name: 'tv-low', maxWidth: 960, maxHeight: 540, fps: 20, particleMultiplier: 0.3 },
];
export const STATIC_PROFILE = { name: 'static', static: true, fps: 0 };
export const DESKTOP_PROFILE = { name: 'full', fps: 0 };

export function isTvBrowser(userAgent = '') {
  return /tizen|web[0o]s|netcast|hbbtv|smart-tv|smarttv|google[ -]?tv|android[ -]?tv|appletv|bravia|viera|aquos|roku|aft|fire[ /]?tv|nettv|pov_tv|\bandroid\b.*\btv\b/i.test(
    userAgent
  );
}

export function getCanvasSize(width, height, dpr = 1, profile = DESKTOP_PROFILE) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const scale = profile.maxWidth
    ? Math.min(1, profile.maxWidth / safeWidth, profile.maxHeight / safeHeight)
    : Math.max(1, dpr);
  return {
    width: Math.max(1, Math.floor(safeWidth * scale)),
    height: Math.max(1, Math.floor(safeHeight * scale)),
  };
}

// Only submitted frames count. Reset after visibility changes or renderer restarts.
export function createFrameMonitor(onSlow) {
  let start = null;
  let frames = 0;
  let slowWindows = 0;
  return {
    reset() {
      start = null;
      frames = 0;
      slowWindows = 0;
    },
    frame(now) {
      if (start === null) {
        start = now;
        return;
      }
      frames += 1;
      const elapsed = now - start;
      if (elapsed < 5000) return;
      slowWindows = (frames * 1000) / elapsed < 15 ? slowWindows + 1 : 0;
      start = now;
      frames = 0;
      if (slowWindows >= 2) {
        slowWindows = 0;
        onSlow();
      }
    },
  };
}

// One owner per canvas; hidden documents have no pending animation frame.
export function startWeatherAnimation({
  draw,
  fps = 0,
  onFrame,
  onReset,
  onError,
  environment = window,
  page = document,
}) {
  let frameId = null;
  let lastDraw = null;
  let lastTick = null;
  let stopped = false;
  const interval = fps ? 1000 / fps : 0;
  const tick = now => {
    frameId = null;
    if (stopped || page.hidden) return;
    if (lastTick === null || now - lastTick >= interval - 0.5) {
      const delta = lastDraw === null ? 0 : Math.min((now - lastDraw) / 1000, 0.1);
      lastDraw = now;
      const elapsed = now - (lastTick ?? now);
      lastTick = interval && elapsed >= interval ? now - (elapsed % interval) : now;
      try {
        draw(delta, now);
        onFrame?.(now);
      } catch (error) {
        stopped = true;
        onError?.(error);
        return;
      }
    }
    frameId = environment.requestAnimationFrame(tick);
  };
  const visibility = () => {
    if (frameId !== null) environment.cancelAnimationFrame(frameId);
    frameId = null;
    lastDraw = null;
    lastTick = null;
    onReset?.();
    if (!stopped && !page.hidden) frameId = environment.requestAnimationFrame(tick);
  };
  page.addEventListener('visibilitychange', visibility);
  visibility();
  return () => {
    stopped = true;
    if (frameId !== null) environment.cancelAnimationFrame(frameId);
    page.removeEventListener('visibilitychange', visibility);
    onReset?.();
  };
}
