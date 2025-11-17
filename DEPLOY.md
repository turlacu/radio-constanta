# Deployment Guide: Radio Constanța

This guide covers deploying the Radio Constanța app on your own server using **Coolify** or any Docker-compatible hosting platform.

---

## Architecture Overview

The app consists of:
- **Frontend**: React + Vite (SPA)
- **Backend**: Express.js API server
  - `/api/news` - Fetches articles from WordPress REST API
  - `/api/article` - Scrapes full article content from Radio Constanța website
  - `/api/admin` - Admin panel for configuration

In production, the Express server serves both the API and the static frontend files.

---

## Data Persistence (IMPORTANT!)

The app stores configuration data and uploads that must persist across deployments:

- **Radio stream configurations** (URLs, enable/disable settings)
- **Uploaded cover images**
- **Cover schedules**
- **Admin settings**

All of this data is stored in `server/data/` which is **NOT tracked in git** (intentionally, since it contains user data).

### Why Volume Mounting is Critical

During Docker deployments, the container is rebuilt from source code, which means:
- ❌ Without volumes: `server/data/` is reset to defaults on each deployment
- ✅ With volumes: `server/data/` persists across deployments and updates

**All deployment methods below include proper volume configuration to ensure your data persists.**

---

## Deployment Options

### Option 1: Coolify (Recommended)

Coolify is a self-hosted PaaS that makes deploying Docker apps easy.

#### Prerequisites
- Ubuntu server (20.04+ recommended)
- Coolify installed on your server ([installation guide](https://coolify.io/docs/installation))
- Domain name (optional, but recommended)

#### Steps

1. **Push your code to a Git repository** (GitHub, GitLab, etc.)

2. **Log into Coolify dashboard**
   - Access at `http://your-server-ip:8000` or your configured domain

3. **Create a new project**
   - Click "New Project"
   - Give it a name (e.g., "Radio Constanța")

4. **Add a new resource**
   - Choose "Docker Compose" or "Dockerfile"
   - Select "Dockerfile" option

5. **Configure the deployment**
   - **Repository**: Connect your Git repository
   - **Branch**: `main` (or your deployment branch)
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `./Dockerfile`
   - **Port**: `3001`
   - **Build Command**: (leave empty, Dockerfile handles it)
   - **Start Command**: (leave empty, Dockerfile handles it)

6. **Configure persistent storage** (CRITICAL for data persistence)
   - In Coolify, go to "Storages" or "Volumes" section
   - Add a new volume:
     - **Name**: `radio-data` (or any name you prefer)
     - **Mount Path**: `/app/server/data`
     - **Type**: Persistent Volume
   - This ensures admin settings, covers, and schedules survive app updates

7. **Environment variables** (optional)
   - `NODE_ENV=production` (already set in Dockerfile)
   - `PORT=3001` (if you want to change the port)
   - `ADMIN_PASSWORD_HASH` - Custom admin password hash
   - `JWT_SECRET` - Custom JWT secret

8. **Domain configuration** (optional)
   - Add your domain in the "Domains" section
   - Coolify will automatically configure SSL with Let's Encrypt

9. **Deploy**
   - Click "Deploy"
   - Coolify will:
     - Pull your code from Git
     - Build the Docker image
     - Start the container
     - Set up reverse proxy with SSL

10. **Monitor**
    - Check logs in Coolify dashboard
    - Access your app at `http://your-domain` or `http://your-server-ip:3001`

#### Coolify Auto-Deploy

Enable webhook for automatic deployments on Git push:
- In Coolify, go to your app settings
- Copy the webhook URL
- Add it to your Git repository (GitHub: Settings → Webhooks)

---

### Option 2: Manual Docker Deployment

If you prefer manual control without Coolify:

#### On your Ubuntu server:

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/radio-constanta.git
   cd radio-constanta
   ```

3. **Build the Docker image**
   ```bash
   docker build -t radio-constanta .
   ```

4. **Run the container**
   ```bash
   docker run -d \
     --name radio-constanta \
     --restart unless-stopped \
     -p 3001:3001 \
     -v radio-data:/app/server/data \
     radio-constanta
   ```

   **Important:** The `-v radio-data:/app/server/data` flag creates a persistent volume that stores:
   - Admin settings (radio stream configurations)
   - Uploaded cover images
   - Cover schedules

   This ensures your data **survives container restarts and rebuilds**.

5. **Set up Nginx reverse proxy** (optional, for SSL)
   ```nginx
   # /etc/nginx/sites-available/radio-constanta
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site and get SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/radio-constanta /etc/nginx/sites-enabled/
   sudo certbot --nginx -d your-domain.com
   sudo systemctl reload nginx
   ```

6. **View logs**
   ```bash
   docker logs -f radio-constanta
   ```

7. **Update deployment**
   ```bash
   git pull
   docker stop radio-constanta
   docker rm radio-constanta
   docker build -t radio-constanta .
   docker run -d \
     --name radio-constanta \
     --restart unless-stopped \
     -p 3001:3001 \
     -v radio-data:/app/server/data \
     radio-constanta
   ```

   **Note:** The `radio-data` volume is preserved when you remove the container, so your settings and uploads persist.

---

### Option 3: Docker Compose (Recommended for Production)

A `docker-compose.yml` file is included in the repository with proper data persistence configured.

**Deploy:**
```bash
docker-compose up -d
```

**Update:**
```bash
git pull
docker-compose up -d --build
```

**Important:** The docker-compose configuration includes a persistent volume (`radio-data`) that stores:
- Admin settings (radio stream configurations)
- Uploaded cover images
- Cover schedules

This ensures your configuration and uploads **survive app updates and container rebuilds**.

---

## Local Development

For local development without Docker:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development servers**

   Terminal 1 (Frontend - Vite):
   ```bash
   npm run dev
   ```

   Terminal 2 (Backend - Express):
   ```bash
   npm run dev:server
   ```

3. **Access the app**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001/api/news

The Vite dev server proxies API requests to the Express server automatically.

---

## Production Build & Run (Without Docker)

If you don't want to use Docker:

1. **Install dependencies**
   ```bash
   npm ci --only=production
   ```

2. **Build frontend**
   ```bash
   npm run build
   ```

3. **Start server**
   ```bash
   npm start
   ```

4. **Use PM2 for production** (recommended)
   ```bash
   npm install -g pm2
   pm2 start npm --name "radio-constanta" -- start
   pm2 save
   pm2 startup
   ```

---

## Environment Variables

The app works without any environment variables. Optional ones:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

---

## Troubleshooting

### Port already in use
```bash
# Find what's using port 3001
sudo lsof -i :3001
# Kill the process or change PORT environment variable
```

### Container won't start
```bash
# Check logs
docker logs radio-constanta

# Check if port is exposed
docker port radio-constanta
```

### API endpoints return 404
- Make sure `npm run build` completed successfully
- Check that `/dist` folder exists and contains `index.html`
- Verify Express server is serving static files in production mode

### CORS errors
- The Express server has CORS enabled by default
- If using a reverse proxy, ensure proper headers are forwarded

---

## Monitoring & Logs

**With Docker:**
```bash
docker logs -f radio-constanta
```

**With PM2:**
```bash
pm2 logs radio-constanta
```

**With Coolify:**
- View logs in Coolify dashboard
- Real-time streaming available

---

## Updating the App

**With Coolify:**
- Push to Git → Webhook triggers auto-deploy
- Or click "Deploy" button in Coolify
- Your data persists automatically (if you configured the volume in step 6)

**With Docker Compose:**
```bash
git pull
docker-compose up -d --build
```
Note: Your data in the `radio-data` volume is preserved automatically.

**With Manual Docker:**
```bash
git pull
docker stop radio-constanta
docker rm radio-constanta
docker build -t radio-constanta .
docker run -d \
  --name radio-constanta \
  --restart unless-stopped \
  -p 3001:3001 \
  -v radio-data:/app/server/data \
  radio-constanta
```
Note: The `radio-data` volume preserves your settings and uploads.

---

## Support

For issues or questions:
- Check server logs
- Verify Docker container is running: `docker ps`
- Test API directly: `curl http://localhost:3001/api/news`
- Check frontend build: `ls -la dist/`

---

## Performance Tips

- The app includes 10-minute caching for news articles
- Use a CDN for static assets (optional)
- Enable Gzip/Brotli compression in Nginx
- Consider Redis for shared caching if running multiple instances

---

## Security Notes

- The app doesn't require authentication
- CORS is open (`*`) - restrict if needed in `server/index.js`
- Keep dependencies updated: `npm audit fix`
- Use HTTPS in production (Coolify/Let's Encrypt handle this automatically)
