# 📻 Radio Constanța - Mobile Web App

Modern, mobile-first dark mode web application for Radio Constanța featuring live radio streaming and latest news.

![Radio Constanța](https://via.placeholder.com/800x400/0C0C0C/00BFFF?text=Radio+Constanta)

## ✨ Features

- 🎵 **Live Radio Streaming** - Listen to Radio Constanța FM and Folclor
- 📰 **Latest News** - Read the latest news from Constanța
- 🌙 **Dark Mode Only** - Optimized for comfortable viewing
- 📱 **Mobile-First Design** - Perfect for portrait mode, optimized for Android
- ⚡ **Fast & Smooth** - Built with React + Vite for lightning-fast performance
- 🎨 **Modern UI** - Clean design with smooth animations

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (current version: 18.20.6)
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure radio stream URLs:**

Edit `src/components/RadioPlayer.jsx` and add your stream URLs:

```javascript
const STATIONS = [
  {
    id: 'fm',
    name: 'Radio Constanța FM',
    streamUrl: 'YOUR_FM_STREAM_URL_HERE', // Add your stream URL
    // ...
  },
  {
    id: 'folclor',
    name: 'Radio Constanța Folclor',
    streamUrl: 'YOUR_FOLCLOR_STREAM_URL_HERE', // Add your stream URL
    // ...
  }
];
```

3. **Run development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 📱 Wrapping as Android App

There are several ways to wrap this web app as an Android application:

### Option 1: Google Bubblewrap (Recommended)

Bubblewrap creates a Trusted Web Activity (TWA) for your Progressive Web App.

1. **Install Bubblewrap:**

```bash
npm install -g @bubblewrap/cli
```

2. **Initialize your project:**

```bash
bubblewrap init --manifest https://your-domain.com/manifest.json
```

3. **Build the Android app:**

```bash
bubblewrap build
```

4. **The APK will be generated in the project folder**

[Learn more about Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)

### Option 2: Apache Cordova

1. **Install Cordova:**

```bash
npm install -g cordova
```

2. **Create Cordova project:**

```bash
cordova create RadioConstanta com.radioconstanta.app RadioConstanta
cd RadioConstanta
cordova platform add android
```

3. **Copy your dist/ folder to www/**

4. **Build:**

```bash
cordova build android
```

### Option 3: Capacitor (Recommended for React)

1. **Install Capacitor:**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
```

2. **Build and sync:**

```bash
npm run build
npx cap sync
npx cap open android
```

3. **Build APK in Android Studio**

## 📰 Setting Up Real News Feed

Currently, the app uses mock data. To fetch real news from radioconstanta.ro:

### Option 1: Backend Proxy (Recommended)

Create a simple Node.js backend:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/news', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.radioconstanta.ro/articole/stiri/actualitate/');
    const $ = cheerio.load(data);
    const articles = [];

    // Parse HTML - adjust selectors based on actual website structure
    $('.article-selector').each((i, elem) => {
      articles.push({
        title: $(elem).find('.title-selector').text(),
        link: $(elem).find('a').attr('href'),
        image: $(elem).find('img').attr('src'),
        // ... extract other fields
      });
    });

    res.json({ articles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(3001, () => console.log('Proxy running on port 3001'));
```

Then update `src/utils/fetchNews.js` to call your backend:

```javascript
export const fetchNews = async (page = 1, limit = 20) => {
  const response = await fetch(`http://localhost:3001/api/news?page=${page}&limit=${limit}`);
  return response.json();
};
```

### Option 2: RSS Feed

If Radio Constanța provides an RSS feed, use a library like `rss-parser`:

```bash
npm install rss-parser
```

### Option 3: Official API

Contact Radio Constanța to request API access for official integration.

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change colors:

```javascript
colors: {
  primary: '#00BFFF',        // Main accent color
  'dark-bg': '#0C0C0C',      // Background
  'dark-surface': '#1A1A1A', // Surface color
  'dark-card': '#1F1F1F',    // Card background
}
```

### Fonts

Edit `index.html` to change fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Station Art

Replace placeholder images in `src/components/RadioPlayer.jsx`:

```javascript
coverArt: '/path/to/your/station-artwork.jpg'
```

## 📂 Project Structure

```
radio-constanta/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── BottomNav.jsx
│   │   ├── Loader.jsx
│   │   ├── NewsArticle.jsx
│   │   ├── NewsList.jsx
│   │   └── RadioPlayer.jsx
│   ├── pages/            # Page components
│   │   ├── News.jsx
│   │   └── Radio.jsx
│   ├── styles/           # Global styles
│   │   └── globals.css
│   ├── utils/            # Utility functions
│   │   └── fetchNews.js
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── index.html            # HTML template
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
└── vite.config.js        # Vite configuration
```

## 🔧 Configuration

### Stream URLs

Update stream URLs in `src/components/RadioPlayer.jsx`

### News Source

Update news fetching logic in `src/utils/fetchNews.js`

### App Metadata

Update `index.html` for SEO and PWA:

```html
<meta name="description" content="Your description">
<meta name="theme-color" content="#0C0C0C">
<title>Your Title</title>
```

## 🐛 Troubleshooting

### Audio not playing

- Check that stream URLs are correct and accessible
- Ensure CORS is properly configured on the stream server
- Test stream URLs directly in browser

### News not loading

- Check browser console for errors
- Verify network requests in DevTools
- Ensure mock data is being generated correctly

### Build errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📄 License

This project is created for Radio Constanța.

## 🤝 Contributing

For contributions or issues, please contact the development team.

## 📞 Support

For questions or support, please contact Radio Constanța.

---

Built with ❤️ for Radio Constanța
