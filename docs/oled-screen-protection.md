# OLED screen protection

Settings includes **Protecție ecran OLED** for every device. The mobile layout
provides a **Setări** button in its bottom navigation. Recognized TV user
agents default to **Automat**; other devices default to **Dezactivat**. Screen
size alone does not enable protection. The browser cannot identify an OLED panel.
The selected mode and 1, 2, 5 or 10 minute timeout are saved in localStorage as
`screenProtectionMode` and `screenProtectionTimeoutMinutes`.

- **Automat**: dim station name on black after the idle timeout; completely black
  after another three minutes. Defaults are two and five minutes of inactivity.
- **Text în mișcare**: dim station name on black, repositioned every 25 seconds.
- **Ecran negru**: completely black at the idle timeout.
- **Dezactivat**: no inactivity overlay.

Positions change immediately between different quadrants, without continuous
animation. Text stays inside the viewport and truncates long station names.
The overlay covers the app viewport, including Settings and news, and works
whether radio is playing or paused. It does not turn off the physical panel or
cover browser/system chrome. It reduces static display exposure without
promising to prevent burn-in.

Weather, floating particles, the spectrum visualizer, live indicator pulses and
covered CSS animations suspend during protection. The player, its audio element,
news scroll position, and form state stay mounted. The first keyboard, remote,
pointer or touch gesture wakes the interface without activating its controls;
held-key repeats and compatibility clicks are suppressed. The prior control
regains focus. Only remote events delivered to the browser can be handled;
system power/volume controls remain under the TV's control.

Visible live video and preroll are exempt after their `playing` event, including
subsequent buffering. Pause, end, failure, source teardown or layout removal ends
the exemption and restarts the full timeout. Simply configuring a video URL does
not exempt a failed stream. The admin area is excluded. Hidden documents clear
the overlay and timers and start a fresh timeout when visible again.

## Checks

Run `node tests/screenProtection.test.js` for deterministic timer, defaults,
cleanup and wake-gesture tests. Run `npm run lint` and `npm run build` for project
checks.

For Chromium component integration checks, start `npm run dev` and run
`node tests/screenProtection.browser.mjs` with an existing Playwright install.
`BROWSER_MODULE` can point to its absolute `index.mjs`; `BROWSER_EXECUTABLE` can
select an existing Chromium binary. `SCREEN_PROTECTION_TEST_URL` defaults to
`http://127.0.0.1:3000`. The harness uses real Settings and RadioPlayer components,
a real looping silent WAV for audio continuity, controlled time for inactivity,
and native video events to simulate live playback without an external stream.

Before deployment acceptance, test Android TV and webOS remote wake-up with OK,
directions and Back, including holding a key. Confirm the first press only wakes,
the second press works, and Settings/article position returns intact. Leave radio
playing for at least one hour through text and black stages, wake it repeatedly,
and check that playback does not pause or reconnect. Repeat with paused radio,
live video, video failure, standby/resume, and a long station name. Confirm the TV's
own panel-care features remain enabled; browser tests do not establish hardware
burn-in protection or standby playback behavior.
