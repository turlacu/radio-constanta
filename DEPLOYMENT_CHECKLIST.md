# ✅ Deployment Checklist

Use this checklist to ensure everything is configured before deploying to production.

## 📋 Pre-Deployment Checklist

### 🔧 Required Configuration

- [ ] **Add Radio Stream URLs**
  - File: `src/components/RadioPlayer.jsx` (lines 11, 18)
  - FM stream URL: `_____________________`
  - Folclor stream URL: `_____________________`
  - Test URLs work in browser

- [ ] **Test Audio Playback**
  - [ ] FM stream plays successfully
  - [ ] Folclor stream plays successfully
  - [ ] No CORS errors in console
  - [ ] Play/pause works correctly
  - [ ] Station switching works

### 🎨 Optional Configuration

- [ ] **Replace Station Artwork**
  - File: `src/components/RadioPlayer.jsx` (lines 11, 18)
  - Upload actual station logos/artwork
  - Recommended size: 400x400px or larger
  - Format: JPG, PNG, or WebP

- [ ] **Set Up Real News Feed**
  - File: `src/utils/fetchNews.js`
  - Option 1: Create backend proxy
  - Option 2: Use RSS feed
  - Option 3: Get API access
  - Currently using mock data ⚠️

- [ ] **Update App Metadata**
  - File: `index.html`
  - Meta description
  - Open Graph tags
  - Favicon (already included)
  - App title

### 🧪 Testing

- [ ] **Browser Testing**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (iOS)
  - [ ] Chrome Mobile (Android)

- [ ] **Device Testing**
  - [ ] Android phone (real device)
  - [ ] iPhone (if possible)
  - [ ] Different screen sizes
  - [ ] Portrait orientation

- [ ] **Functionality Testing**
  - [ ] Radio plays on mobile
  - [ ] News feed loads
  - [ ] Articles open correctly
  - [ ] Navigation works
  - [ ] Animations smooth
  - [ ] No console errors

- [ ] **Network Testing**
  - [ ] Works on WiFi
  - [ ] Works on 4G/5G
  - [ ] Handles slow connection
  - [ ] Handles offline state

### 🚀 Build & Deploy

- [ ] **Build for Production**
  ```bash
  npm run build
  ```
  - [ ] Build completes without errors
  - [ ] Check `dist/` folder created
  - [ ] Test production build locally:
    ```bash
    npm run preview
    ```

- [ ] **Choose Deployment Method**
  - [ ] Web hosting (Netlify, Docker, etc.)
  - [ ] Android app (Bubblewrap, Capacitor, etc.)
  - [ ] Both

### 🌐 Web Deployment

#### Option 1: Docker/Coolify (Recommended)
- [ ] Build Docker image
- [ ] Deploy via Coolify or Docker Compose
- [ ] Configure environment variables
- [ ] Get deployment URL
- [ ] Test deployed app

#### Option 2: Netlify
- [ ] Create account at netlify.com
- [ ] Drag & drop `dist/` folder
- [ ] Get deployment URL
- [ ] Test deployed app

#### Option 3: Traditional Hosting
- [ ] Upload `dist/` folder to server
- [ ] Configure web server (Apache/Nginx)
- [ ] Set up SSL certificate
- [ ] Test deployed app

### 📱 Android App Deployment

#### Option 1: Bubblewrap (TWA)
- [ ] Install: `npm i -g @bubblewrap/cli`
- [ ] Create manifest.json
- [ ] Run: `bubblewrap init`
- [ ] Build: `bubblewrap build`
- [ ] Test APK on device
- [ ] Sign APK for Play Store

#### Option 2: Capacitor
- [ ] Install: `npm i @capacitor/core @capacitor/cli`
- [ ] Initialize: `npx cap init`
- [ ] Add Android: `npx cap add android`
- [ ] Build: `npm run build`
- [ ] Sync: `npx cap sync`
- [ ] Open in Android Studio: `npx cap open android`
- [ ] Build APK in Android Studio
- [ ] Test on device

#### Option 3: Cordova
- [ ] Install: `npm i -g cordova`
- [ ] Create project: `cordova create RadioConstanta`
- [ ] Add platform: `cordova platform add android`
- [ ] Copy dist/ to www/
- [ ] Build: `cordova build android`
- [ ] Test on device

### 🔐 Security

- [ ] **SSL Certificate**
  - [ ] HTTPS enabled (required for audio)
  - [ ] Valid certificate
  - [ ] No mixed content warnings

- [ ] **API Keys** (if applicable)
  - [ ] Environment variables configured
  - [ ] Keys not in source code
  - [ ] .env file in .gitignore

- [ ] **CORS Configuration**
  - [ ] Audio streams allow cross-origin
  - [ ] News API allows cross-origin
  - [ ] Proper headers set

### 📊 Performance

- [ ] **Optimize Assets**
  - [ ] Images compressed
  - [ ] Fonts optimized
  - [ ] Code minified (automatic with Vite)

- [ ] **Test Performance**
  - [ ] Run Lighthouse audit
  - [ ] Performance score > 90
  - [ ] Accessibility score > 95
  - [ ] Best Practices score > 95

- [ ] **Monitor Load Times**
  - [ ] First Contentful Paint < 1s
  - [ ] Time to Interactive < 2s
  - [ ] Total load time < 3s

### 🎯 Post-Deployment

- [ ] **Verify Functionality**
  - [ ] Visit production URL
  - [ ] Test all features
  - [ ] Check on mobile device
  - [ ] Verify analytics (if configured)

- [ ] **Share with Team**
  - [ ] Send production URL
  - [ ] Share Android APK (if applicable)
  - [ ] Document any issues
  - [ ] Collect feedback

- [ ] **Monitor**
  - [ ] Check error logs
  - [ ] Monitor stream uptime
  - [ ] Track user feedback
  - [ ] Plan updates

### 📝 Documentation

- [ ] **Update README**
  - [ ] Add production URL
  - [ ] Document any custom changes
  - [ ] Update configuration steps

- [ ] **Create User Guide** (optional)
  - [ ] How to use the app
  - [ ] Features overview
  - [ ] Troubleshooting

---

## 🎉 Launch Checklist

### Day Before Launch
- [ ] Final testing on all devices
- [ ] Verify stream URLs work
- [ ] Check news feed loads
- [ ] Review analytics setup
- [ ] Prepare announcement

### Launch Day
- [ ] Deploy to production
- [ ] Verify live site works
- [ ] Test on mobile devices
- [ ] Share with stakeholders
- [ ] Monitor for issues
- [ ] Celebrate! 🎊

### Week After Launch
- [ ] Monitor analytics
- [ ] Collect user feedback
- [ ] Fix any urgent bugs
- [ ] Plan feature updates
- [ ] Document learnings

---

## 🐛 Common Issues & Solutions

### Audio won't play
- ✅ Check stream URLs are correct
- ✅ Ensure HTTPS is enabled
- ✅ Verify CORS headers on stream
- ✅ Test stream URL directly in browser

### News not loading
- ✅ Check browser console for errors
- ✅ Verify fetchNews.js is working
- ✅ Test API endpoint (if using real data)
- ✅ Check network tab in DevTools

### Build errors
- ✅ Delete node_modules and reinstall
- ✅ Clear Vite cache
- ✅ Check Node version (18+)
- ✅ Review error messages carefully

### Mobile issues
- ✅ Test on real device, not just emulator
- ✅ Check touch targets are large enough
- ✅ Verify viewport meta tag
- ✅ Test on different Android versions

---

## 📞 Need Help?

1. Review README.md for detailed documentation
2. Check browser console for error messages
3. Review code comments in source files
4. Test components individually
5. Reach out to development team

---

## ✅ Quick Reference

### Essential Files to Configure
```
src/components/RadioPlayer.jsx  → Stream URLs (lines 11, 18)
src/utils/fetchNews.js          → News source (entire file)
index.html                      → App metadata
```

### Essential Commands
```bash
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Essential URLs
```
Development:  http://localhost:3000
Production:   [Your deployment URL]
Docs:         README.md
```

---

**Status**: ⏳ Ready for configuration and deployment

**Last Updated**: October 28, 2024

**Next Action**: Add stream URLs and test!
