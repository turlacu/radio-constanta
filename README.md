# Radio Constanța Web App

Responsive web app for Radio Constanța live audio, news, weather-driven visuals, admin-managed station settings, cover scheduling, analytics, and optional live video embedding.

## Current Architecture

- The production app is served from `https://stream.turlacu.ro`.
- Express serves the built React frontend from `dist/` and exposes API routes under `/api/*`.
- Admin settings, uploaded covers, pre-roll videos, schedules, and stream URLs are persisted in `server/data/`.
- Live radio audio URLs are configured in the admin panel and played directly by the browser with an HTML audio element.
- News is fetched server-side from the configured WordPress REST API, normalized, cached, and returned to the frontend through `/api/news`.
- Live video is handled by an external streaming server, such as MediaMTX, and embedded from a public playback URL such as `https://video.turlacu.ro/live/constanta/`.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Express
- SQLite via `better-sqlite3`
- `hls.js` for HLS video schedule playback
- WebSocket/SSE for now-playing and cover updates

## Runtime Flows

### Audio

```text
Browser app
  -> admin-configured radio stream URL
  -> remote audio streaming server
```

The Node server stores and validates the stream URLs. It does not relay, transcode, or proxy live audio.

### Video

```text
OBS / VDO.Ninja
  -> WHIP/WebRTC ingest
  -> external video server
  -> public WebRTC playback URL
  -> embedded in the app
```

The current React video schedule player supports HLS/direct video URLs. A custom WHEP player can be added separately for tighter WebRTC integration.

### News

```text
React app
  -> /api/news
  -> Express backend
  -> WordPress REST API
  -> normalized cached JSON
```

External article images are proxied through `/api/image-proxy`; missing article images use local branded fallback assets.

## Environment Variables

Frontend metadata is build-time configurable through Vite:

```text
VITE_APP_NAME=Radio Constanța
VITE_APP_URL=https://stream.turlacu.ro/
VITE_OG_IMAGE_URL=https://stream.turlacu.ro/og-image.png
VITE_VIDEO_URL=https://video.turlacu.ro/live/constanta/
```

Backend production variables:

```text
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=https://stream.turlacu.ro
LOG_LEVEL=info
ADMIN_PASSWORD_HASH='optional-bcrypt-hash'
```

## Development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Run the backend in a second terminal:

```bash
npm run dev:server
```

The Vite dev server proxies `/api/*` to the backend on `http://localhost:3001`.

## Production

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

For Coolify deployment, use `COOLIFY.md`. For broader deployment details, use `DEPLOY.md`.

## PWA Support

The app includes:

- `public/manifest.json`
- `public/sw.js`
- manifest/mobile metadata in `index.html`
- production-only service worker registration

The service worker caches the app shell and uses network-first behavior for API requests.

## Admin

Open:

```text
/admin
```

Admin settings include:

- radio stream URLs and quality labels
- WordPress news source
- weather provider/settings
- cover and video schedules
- pre-roll videos
- now-playing overrides
- analytics and NTP settings

Default fallback admin password is:

```text
admin123
```

Set `ADMIN_PASSWORD_HASH` in production.

## Verification

```bash
npm run lint
npm run build
```

Known lint policy note: the repo still has many `no-console` and `react/prop-types` warnings. Treat lint errors as blockers; warning cleanup can be handled in a separate pass.
