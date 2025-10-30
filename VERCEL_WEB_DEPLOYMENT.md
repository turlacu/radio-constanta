# Complete Vercel Web Deployment Guide

This guide walks you through deploying the Radio Constanta app using only the Vercel website (no CLI needed).

## Prerequisites

- GitHub, GitLab, or Bitbucket account
- Vercel account (free tier is fine)

---

## Step 1: Push Your Code to Git Repository

### Option A: Using GitHub (Recommended)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `radio-constanta` (or your choice)
   - Make it Public or Private
   - **Do NOT initialize with README** (your code already has files)
   - Click "Create repository"

2. **Initialize Git in your project** (if not already done):
   ```bash
   cd /home/turlacu/radio
   git init
   ```

3. **Add all files:**
   ```bash
   git add .
   ```

4. **Create first commit:**
   ```bash
   git commit -m "Initial commit - Radio Constanta app"
   ```

5. **Add remote and push:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/radio-constanta.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your actual GitHub username.

### Option B: Using GitLab or Bitbucket

Similar process - create repo, initialize git, commit, and push.

---

## Step 2: Import Project to Vercel

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Click "Login" or "Sign Up"
   - Sign in with your Git provider (GitHub recommended)

2. **Import your project:**
   - Click "Add New..." → "Project"
   - You'll see "Import Git Repository"
   - Find your `radio-constanta` repository in the list
   - Click "Import"

---

## Step 3: Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

### Framework Preset
- **Framework:** `Vite`
- Should be auto-detected

### Build and Output Settings

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### Root Directory
- Leave as `./` (root)

### Environment Variables
- **Leave empty** - not needed for this app!

---

## Step 4: Deploy

1. **Review settings** - everything should look correct

2. **Click "Deploy"**
   - Vercel will:
     - Install dependencies (`npm install`)
     - Build your app (`npm run build`)
     - Deploy the `/api/news.js` serverless function
     - Deploy the static Vite app

3. **Wait for deployment** (usually 1-2 minutes)
   - You'll see a progress indicator
   - Green checkmarks when each step completes

---

## Step 5: Verify Deployment

### After deployment succeeds:

1. **You'll see a congratulations screen** with your deployment URL:
   ```
   https://radio-constanta.vercel.app
   ```
   (Your actual URL will be different)

2. **Click "Visit"** or copy the URL

3. **Test the app:**
   - App should load
   - Radio streams should work
   - **Click "News" section**
   - Articles should load from Radio Constanta

4. **Test the API directly:**
   - Visit: `https://your-app.vercel.app/api/news?page=1&limit=5`
   - You should see JSON with articles

---

## Step 6: Custom Domain (Optional)

If you want a custom domain like `radio.yourdomain.com`:

1. **Go to your project settings:**
   - Click on your project in Vercel dashboard
   - Go to "Settings" → "Domains"

2. **Add domain:**
   - Enter your domain name
   - Click "Add"
   - Follow DNS configuration instructions
   - Vercel provides automatic HTTPS

---

## Step 7: Future Updates

When you make changes to your code:

1. **Commit and push to Git:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Vercel auto-deploys!**
   - Every push to `main` branch triggers automatic deployment
   - No need to manually deploy again
   - Takes 1-2 minutes

3. **View deployment progress:**
   - Go to Vercel dashboard
   - Click your project
   - See "Deployments" tab

---

## Troubleshooting

### Problem: Build fails with "Module not found"

**Solution:**
- Check that `package.json` includes all dependencies
- Verify `cheerio` is in dependencies (not devDependencies)

### Problem: API returns 404

**Solution:**
- Verify `/api/news.js` file exists in your Git repo
- Check Vercel Functions tab in dashboard
- Should see `news` function listed

### Problem: API returns 500 error

**Solution:**
1. Go to Vercel dashboard
2. Click your project
3. Click "Functions" tab
4. Click on `news` function
5. Check logs for errors
6. Likely issue: Radio Constanta website HTML structure changed

### Problem: CORS errors in browser

**Solution:**
- Verify `vercel.json` is in your Git repo
- Redeploy if you just added it

### Problem: Images not loading

**Solution:**
- Check browser console for errors
- May need to update image selectors in `/api/news.js`
- Test API endpoint directly to see what data is returned

---

## Monitoring Your App

### Check deployment status:
1. Go to https://vercel.com/dashboard
2. Click your project
3. See recent deployments

### View function logs:
1. Project → Functions → `news`
2. See execution logs
3. Monitor errors and performance

### Analytics:
- Vercel provides free analytics
- See visitor stats, performance metrics

---

## Project Structure on Vercel

```
your-app.vercel.app/
├── /                    → React app (Vite build)
├── /api/news           → Serverless function
└── All static assets   → Images, CSS, JS
```

---

## Cost

**Free tier includes:**
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100GB-hours)
- ✅ Automatic HTTPS
- ✅ Auto deployments from Git

This should be more than enough for a personal radio app!

---

## Quick Reference

| Action | URL |
|--------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Your App | https://YOUR-PROJECT.vercel.app |
| API Endpoint | https://YOUR-PROJECT.vercel.app/api/news |
| Deployment Logs | Dashboard → Project → Deployments |
| Function Logs | Dashboard → Project → Functions |

---

## Summary

1. ✅ Push code to GitHub
2. ✅ Import to Vercel (auto-detects settings)
3. ✅ Click "Deploy"
4. ✅ Done! Auto-deploys on every push

No environment variables needed, no complex configuration - it just works! 🎉
