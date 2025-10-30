# 🚀 Quick Start Guide

Get Radio Constanța running in 3 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages (~2 minutes).

## Step 2: Add Your Stream URLs

Edit `src/components/RadioPlayer.jsx` and find lines 7-20:

```javascript
const STATIONS = [
  {
    id: 'fm',
    name: 'Radio Constanța FM',
    streamUrl: 'YOUR_FM_STREAM_URL_HERE', // ← ADD YOUR URL
    coverArt: 'https://via.placeholder.com/400x400/1A1A1A/00BFFF?text=Radio+FM',
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    streamUrl: 'YOUR_FOLCLOR_STREAM_URL_HERE', // ← ADD YOUR URL
    coverArt: 'https://via.placeholder.com/400x400/1A1A1A/00BFFF?text=Folclor',
    color: 'from-purple-500/20 to-pink-500/20'
  }
];
```

Replace the placeholder URLs with your actual stream URLs.

**Example:**
```javascript
streamUrl: 'https://stream.radioconstanta.ro/fm',
```

## Step 3: Run the App

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

That's it! 🎉

## 📱 Testing on Mobile

### Option A: Access from phone (same network)

1. Find your computer's IP address:
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

2. Open on your phone: `http://YOUR_IP:3000`

### Option B: Use browser dev tools

1. Open Chrome DevTools (F12)
2. Click the device toolbar icon (or Ctrl+Shift+M)
3. Select a mobile device

## 🏗️ Build for Production

```bash
npm run build
```

The optimized app will be in the `dist/` folder.

## 🔧 Common Issues

### ❌ "Cannot find package..."
**Solution:** Run `npm install` again

### ❌ Audio not playing
**Solution:**
- Check stream URLs are correct
- Try playing URLs directly in browser
- Check browser console for CORS errors

### ❌ Port 3000 already in use
**Solution:** Stop other apps or change port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any free port
}
```

## 📚 Next Steps

1. ✅ **Customize colors** → `tailwind.config.js`
2. ✅ **Add station artwork** → Replace placeholder images
3. ✅ **Set up real news** → See README.md
4. ✅ **Deploy to production** → See README.md
5. ✅ **Wrap as Android app** → See README.md

## 💡 Tips

- The app uses **mock news data** by default
- Stream URLs must support CORS or be on same domain
- For best results, use `.mp3` or `.aac` streams
- Test on actual mobile devices before deployment

## 📖 Full Documentation

For detailed documentation, see:
- **README.md** - Complete setup and deployment guide
- **PROJECT_SUMMARY.md** - Technical overview and features

---

**Need help?** Check the browser console for error messages.

**Ready to deploy?** Follow the instructions in README.md!
