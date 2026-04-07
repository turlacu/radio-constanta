# Radio Constanța Web App

Modern web app for Radio Constanța with live radio streaming, news, admin-managed station settings, cover scheduling, and weather-driven backgrounds.

![Radio Constanța](https://via.placeholder.com/800x400/0C0C0C/00BFFF?text=Radio+Constanta)

## ✨ Features

- 🎵 **Live Radio Streaming** - Listen to Radio Constanța FM and Folclor
- 📰 **Latest News** - Read the latest news from Constanța
- 🌙 **Dark Mode Only** - Optimized for comfortable viewing
- 📱 **Mobile-First Design** - Perfect for portrait mode, optimized for Android
- ⚡ **Fast & Smooth** - Built with React + Vite for lightning-fast performance
- 🎨 **Modern UI** - Clean design with smooth animations

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Express
- SQLite via `better-sqlite3`

## Deployment

For the current production deployment flow, use:

- `COOLIFY.md` for Coolify
- `DEPLOY.md` for the broader deployment notes

## Getting Started

### Prerequisites

- Node.js 18+ (current version: 18.20.6)
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Run the frontend dev server:**

```bash
npm run dev
```

3. **Run the backend server in a second terminal:**

```bash
npm run dev:server
```

The app expects the API server on `http://localhost:3001` in development.

4. **Configure streams and admin settings:**

- Start the app, open `/admin`, and sign in.
- Update stream URLs from the admin settings UI instead of editing frontend source files.
- Settings are stored in `server/data/admin-settings.json`.

Default fallback admin password:

```text
admin123
```

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

## Runtime Notes

### News

- News is already fetched server-side from the configured WordPress API.
- The source is managed from admin settings.
- Manual cache refresh is an authenticated admin action.

### Weather

- Open-Meteo works without an API key.
- If you switch to OpenWeatherMap, the API key is stored server-side and requests go through `/api/weather/current`.
- The public settings endpoint no longer exposes the weather API key.

### Settings Validation

- Admin settings writes are schema-validated on the server.
- Invalid payloads now fail with `400 Invalid settings payload` instead of being saved partially.
- If you edit `server/data/admin-settings.json` manually, keep the structure aligned with `server/admin-settings.template.json`.

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

Replace the fallback public images in `public/` or update cover/default-cover settings from the admin UI.

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

- Update stream URLs from the admin panel

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

- Check that configured stream URLs in admin settings are correct and accessible
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
