# Weather rendering on TVs

Recognized TV browsers start with a 1280×720 maximum particle backing buffer,
30 FPS and at most Medium particle density. The existing Low setting still
reduces density further. Resolution limits preserve aspect ratio, ignore device
pixel ratio, and never upscale the backing buffer above the CSS viewport size.
Desktop quality preferences remain in effect.

Two consecutive visible five-second windows below 15 submitted FPS select
960×540 / 20 FPS / Low density. Two more slow windows select static weather for
the remainder of the page session, including playback and route remounts. There
is no automatic upgrade. Reloading starts a fresh session. Reduced motion,
hidden pages and unavailable canvas contexts also select static weather. Hidden
pages resume at their previous budget; animation timing resets on resume.

Weather colors and day/night mapping are unchanged. Gradients use CSS plus a
64×64 static noise tile; fog, stars and bokeh reuse small sprites. Aurora, when
enabled in visual-state configuration, uses a cached canvas capped at 640×360
with transform-only movement. No full-screen pixel readback or aurora blur is
needed. TV glass surfaces use translucent fills without backdrop filtering.

## Automated checks

- `node tests/weatherRendering.test.js` checks TV identification, resolution
  budgets, consecutive slow windows, elapsed-time motion, visibility, cleanup
  and rendering failures without additional dependencies.
- Start `npm run dev`, then run `node tests/weatherRendering.browser.mjs` with an
  existing Playwright installation. `WEATHER_BROWSER_MODULE` can point to its
  absolute `index.mjs`; `WEATHER_BROWSER_EXECUTABLE` can select an existing
  Chromium binary. `WEATHER_TEST_URL` defaults to `http://127.0.0.1:3000`.
  These component checks cover every configured day/night state in a 4K / 2×
  viewport, visible particle pixels, reduced motion, hide/resume, simulated slow
  frames, canvas failure and full-resolution desktop rendering. They use an
  isolated manual-weather harness and do not exercise streaming playback.
- `npm run lint` and `npm run build` remain the project-wide checks.

## Hardware acceptance

On the affected Android TV and webOS devices, select weather backgrounds and
check each manual weather type in day and night modes. Confirm weather changes,
settings/news navigation, contrast of controls, standby/resume and remote input
remain responsive. Run audio playback for at least one hour, then repeat while
live video is active where available. Watch for interruptions, memory growth or
browser termination. Browser emulation does not establish TV hardware stability.

In remote DevTools, `document.documentElement.dataset.weatherRendering` reports
`tv`, `tv-low` or `static`. Inspect canvas backing dimensions rather than their
full-screen CSS dimensions. Aurora is currently disabled in the configured
weather states, but its renderer remains available.
