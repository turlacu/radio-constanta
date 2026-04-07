# Coolify Deployment Guide

This guide matches the current application code.

## What Coolify Is Deploying

In production, this app runs as a single Node.js container:

- Express serves the built frontend from `dist/`
- Express serves the API under `/api/*`
- Express listens on port `3001`
- Health check endpoint is `/api/health`
- Persistent app data is stored in `/app/server/data`

## Before You Start

You need:

- A GitHub repository containing this project
- A Coolify instance with access to that repository
- A domain or subdomain you want to use

## Create the Coolify App

1. In Coolify, create a new application from your Git repository.
2. Choose the `main` branch, or the branch you actually deploy from.
3. Select `Dockerfile` as the build type.
4. Set the Dockerfile path to `./Dockerfile`.
5. Set the exposed port to `3001`.
6. Leave build and start commands empty. The Dockerfile already handles both.

## Add Persistent Storage

This step is required.

Create a persistent storage/volume and mount it at:

```text
/app/server/data
```

Without that mount, the following data is lost on redeploy:

- admin settings
- uploaded covers
- cover schedules
- persisted password overrides in `admin-settings.json`

## Environment Variables

Set these in Coolify before the first production deploy.

### Required

`JWT_SECRET`

- Must be at least 32 characters
- Do not use the default placeholder

Example:

```text
JWT_SECRET=replace-this-with-a-long-random-secret
```

### Recommended

`ALLOWED_ORIGINS`

- Comma-separated list
- Use your production URL(s)
- If omitted, the server allows all origins in production

Example:

```text
ALLOWED_ORIGINS=https://radio.example.com,https://www.radio.example.com
```

`LOG_LEVEL`

- Optional
- Use `info` for normal production logging

Example:

```text
LOG_LEVEL=info
```

### Optional

`ADMIN_PASSWORD_HASH`

- Use a bcrypt hash
- In Coolify, wrap the value in quotes so the `$` characters survive intact
- If this is omitted, the app falls back to the built-in default password `admin123`
- If your persistent `server/data/admin-settings.json` contains `security.passwordHash`, the environment variable takes precedence in current code

Example:

```text
ADMIN_PASSWORD_HASH='$2b$10$your-full-bcrypt-hash-goes-here'
```

Generate a hash locally with:

```bash
node scripts/generate-password-hash.js "your-password"
```

`PORT`

- Optional
- Leave it at `3001` unless you have a specific reason to change it

`NODE_ENV`

- Optional
- The Dockerfile already sets `NODE_ENV=production`

## Variables You Usually Do Not Need

`VITE_API_URL`

- Do not set this for the normal Coolify deployment
- The frontend and API are served from the same container and same domain
- The frontend already defaults to `/api/news`

`VITE_WEATHER_API_KEY`

- Not used by the current app
- Weather API keys are kept server-side
- If you switch to OpenWeatherMap, configure the API key in the admin panel and the server will proxy `/api/weather/current`

## Deploy

1. Save the storage mount.
2. Save the environment variables.
3. Add your domain in Coolify.
4. Trigger a deploy.

## Verify the Deployment

After the deploy finishes, verify:

1. `https://your-domain/api/health` returns JSON with `status: "ok"`.
2. The homepage loads.
3. News requests work.
4. Audio streams play.
5. `https://your-domain/admin` loads.

## First Admin Login

Use the password that matches `ADMIN_PASSWORD_HASH`.

If you did not set `ADMIN_PASSWORD_HASH`, the fallback password is:

```text
admin123
```

Important:

- if a persistent `server/data/admin-settings.json` already exists and contains `security.passwordHash`, the app still prefers `ADMIN_PASSWORD_HASH` when it is set
- changing `ADMIN_PASSWORD_HASH` lets operators recover access without editing the volume data

## Updating the App

For normal updates:

1. Push changes to GitHub.
2. Let Coolify redeploy automatically, or trigger a manual deploy.

Your volume mounted at `/app/server/data` keeps the saved app data across deployments.

## Troubleshooting

### Admin login says `Invalid password`

Check these in order:

1. Make sure `ADMIN_PASSWORD_HASH` is quoted in Coolify.
2. Make sure the stored value is a real bcrypt hash.
3. Check whether `/app/server/data/admin-settings.json` already contains `security.passwordHash`.
4. If it does, update or remove that stored hash.

### Admin login says password is misconfigured

The configured password hash is malformed.

Most common causes:

- the bcrypt hash was pasted without quotes in Coolify
- the value was truncated
- a non-bcrypt value was stored in `admin-settings.json`

### Changes disappear after redeploy

Your volume mount is missing or mounted to the wrong path.

The correct mount path is:

```text
/app/server/data
```

### Browser can open the site but API calls fail

Check:

- `ALLOWED_ORIGINS`
- that the app is deployed as one service and not split across different domains
- that your reverse proxy forwards traffic correctly

### Weather does not show live data

This is not a deployment failure by itself.

The app works with Open-Meteo by default. If you switched to OpenWeatherMap, add the API key in the admin settings and save.

Weather requests for keyed providers are now proxied through the backend. Verify:

1. `https://your-domain/api/weather/current?lat=44.1598&lon=28.6348` returns JSON.
2. The selected weather provider is correct in admin settings.
3. The saved API key is valid.

### Admin settings fail to save

Admin settings are schema-validated on the server.

If save fails with `Invalid settings payload`:

1. Check the response body for the invalid field path.
2. Compare your stored settings with `server/admin-settings.template.json`.
3. Correct malformed numeric values, missing nested objects, or invalid URLs.
