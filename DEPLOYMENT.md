# Deployment Guide for Radio Constanta App

## Deploying to Vercel

### Prerequisites
- Vercel account (free tier works)
- Vercel CLI installed: `npm i -g vercel`

### Step 1: Prepare for Deployment

The project is already configured with:
- `/api/news.js` - Serverless function for fetching articles
- `vercel.json` - Vercel configuration
- `cheerio` dependency for HTML parsing

### Step 2: Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from project root:**
   ```bash
   cd /home/turlacu/radio
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name: `radio-constanta` (or your choice)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Step 3: Configure Environment (Optional)

For local development with the deployed API:

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Add your Vercel URL:
   ```
   VITE_API_URL=https://your-app.vercel.app/api/news
   ```

3. When deployed, the app will automatically use the relative path `/api/news`

### Step 4: Verify Deployment

1. **Test the API endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/news?page=1&limit=5
   ```

2. **Visit your app:**
   - Open: `https://your-app.vercel.app`
   - Navigate to News section
   - Articles should load from Radio Constanta

### Features

The API scrapes and combines articles from:
- https://www.radioconstanta.ro/articole/stiri/
- https://www.radioconstanta.ro/articole/externe/

**API Parameters:**
- `page` - Page number (default: 1)
- `limit` - Articles per page (default: 20)
- `category` - Filter by category: 'stiri' or 'externe' (optional)

**Example:**
```
GET /api/news?page=1&limit=10&category=stiri
```

### Troubleshooting

**Issue: API returns 500 error**
- Check Vercel function logs: `vercel logs`
- Verify cheerio is installed in dependencies

**Issue: CORS errors**
- Verify `vercel.json` is in project root
- Check headers are configured correctly

**Issue: No articles returned**
- Website HTML structure may have changed
- Update selectors in `/api/news.js`

### Updating the Deployment

After making changes:
```bash
vercel --prod
```

### Local Development

The API won't work locally without deployment. Options:

1. **Use deployed Vercel URL** (recommended):
   - Set `VITE_API_URL` in `.env`

2. **Run Vercel dev server:**
   ```bash
   vercel dev
   ```
   This runs both Vite and Vercel functions locally.

## Alternative: Traditional Backend

If you prefer a traditional backend instead of Vercel:

1. Create Express server with the scraping logic
2. Deploy to any Node.js hosting (Railway, Render, etc.)
3. Update `VITE_API_URL` to point to your server
