/**
 * WeatherCard Component
 * Displays current weather information for wide-screen layout
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { Heading, Body } from './ui';

// Phosphor Icons
const PhosphorIcons = {
  Sun: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64 64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48 48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z"/></svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M233.54 142.23a8 8 0 0 0-8-2 88.08 88.08 0 0 1-109.8-109.8 8 8 0 0 0-10-10 104.84 104.84 0 0 0-52.91 37A104 104 0 0 0 136 224a103.09 103.09 0 0 0 62.52-20.88 104.84 104.84 0 0 0 37-52.91 8 8 0 0 0-1.98-7.98Zm-44.64 48.11A88 88 0 0 1 65.66 67.11a89 89 0 0 1 31.4-26A106 106 0 0 0 96 56a104.11 104.11 0 0 0 104 104 106 106 0 0 0 14.92-1.06 89 89 0 0 1-26.02 31.4Z"/></svg>
  ),
  Cloud: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M160 40a88.09 88.09 0 0 0-78.71 48.67A64 64 0 1 0 72 216h88a88 88 0 0 0 0-176Zm0 160H72a48 48 0 0 1 0-96c1.1 0 2.2 0 3.29.11A88 88 0 0 0 72 128a8 8 0 0 0 16 0 72 72 0 1 1 72 72Z"/></svg>
  ),
  CloudRain: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M158.66 196.44 153 213.17a8 8 0 1 1-15.27-4.94l5.66-16.73a8 8 0 0 1 15.27 4.94Zm-40 0a8 8 0 0 0-10.22 4.89l-5.66 16.73a8 8 0 1 0 15.27 4.94l5.66-16.73a8 8 0 0 0-5.05-10.83Zm-40 0a8 8 0 0 0-10.22 4.89l-5.66 16.73a8 8 0 1 0 15.27 4.94l5.66-16.73a8 8 0 0 0-5.05-10.83ZM228 92a76.08 76.08 0 0 1-76 76H76A52 52 0 1 1 86.2 64.37 76.09 76.09 0 0 1 228 92Zm-16 0a60.07 60.07 0 0 0-120-1.07A8 8 0 0 1 84 96a76.2 76.2 0 0 1-1.14 13 8 8 0 0 1-7.76 6.36A36 36 0 0 0 76 152h76a60.07 60.07 0 0 0 60-60Z"/></svg>
  ),
  Lightning: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M213.85 125.46l-112 120a8 8 0 0 1-13.69-7.3l16.79-73.27l-51.78-17.26a8 8 0 0 1-1.43-14.69l112-64a8 8 0 0 1 11.87 9.43l-17.45 76.09l52.34-17.45a8 8 0 0 1 3.35-15.55Z"/></svg>
  ),
  Snowflake: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M223.72 120.53 184 104l39.72-16.53a8 8 0 1 0-6.31-14.73L184 88.63V56a8 8 0 0 0-16 0v32.63l-33.41-15.89a8 8 0 1 0-6.31 14.73L168 104l-39.72 16.53a8 8 0 0 0 0 14.73L168 152l-39.72 16.53a8 8 0 1 0 6.31 14.73L168 167.37V200a8 8 0 0 0 16 0v-32.63l33.41 15.89a8 8 0 1 0 6.31-14.73L184 152l39.72-16.53a8 8 0 1 0 0-14.73ZM72 200a8 8 0 0 0 16 0v-32.63l33.41 15.89a8 8 0 1 0 6.31-14.73L88 152l39.72-16.53a8 8 0 0 0 0-14.73L88 104l39.72-16.53a8 8 0 1 0-6.31-14.73L88 88.63V56a8 8 0 0 0-16 0v32.63L38.59 72.74a8 8 0 1 0-6.31 14.73L72 104l-39.72 16.53a8 8 0 1 0 0 14.73L72 152l-39.72 16.53a8 8 0 1 0 6.31 14.73L72 167.37Z"/></svg>
  ),
  Drop: () => (
    <svg viewBox="0 0 256 256" className="w-10 h-10"><path fill="currentColor" d="M174 47.75a254.19 254.19 0 0 0-41.45-38.3 8 8 0 0 0-9.18 0A254.19 254.19 0 0 0 82 47.75C54.51 79.32 40 112.6 40 144a88 88 0 0 0 176 0c0-31.4-14.51-64.68-42-96.25ZM128 216a72.08 72.08 0 0 1-72-72c0-57.23 55.47-105 72-118c16.53 13 72 60.75 72 118a72.08 72.08 0 0 1-72 72Z"/></svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 256 256" className="w-4 h-4"><path fill="currentColor" d="M128 64a40 40 0 1 0 40 40 40 40 0 0 0-40-40Zm0 64a24 24 0 1 1 24-24 24 24 0 0 1-24 24Zm0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.19 254.19 0 0 0 41.45 38.3 8 8 0 0 0 9.18 0A254.19 254.19 0 0 0 174 200.25c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88Zm0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118Z"/></svg>
  ),
};

export default function WeatherCard() {
  const settings = useSettings();
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeatherData();

    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.weatherLocation]);

  const fetchWeatherData = async () => {
    try {
      const { lat, lon, name } = settings.weatherLocation;

      // Fetch from admin settings
      const settingsResponse = await fetch('/api/admin/public-settings');
      const adminSettings = await settingsResponse.json();

      const provider = adminSettings.weatherProvider || 'openmeteo';

      if (provider === 'openmeteo') {
        // Use Open-Meteo API
        const params = new URLSearchParams({
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature',
          timezone: 'auto'
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        const data = await response.json();

        setWeatherData({
          location: name,
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          condition: getConditionFromWMO(data.current.weather_code),
          icon: getWeatherIcon(data.current.weather_code)
        });
      } else if (provider === 'openweathermap' && adminSettings.weatherApiKey) {
        // Use OpenWeatherMap API
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${adminSettings.weatherApiKey}&units=metric`
        );
        const data = await response.json();

        setWeatherData({
          location: name,
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
          condition: translateOWMCondition(data.weather[0].main),
          icon: getWeatherIconOWM(data.weather[0].icon)
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch weather for card:', error);
      setIsLoading(false);
    }
  };

  const getConditionFromWMO = (code) => {
    const wmoMap = {
      0: 'Senin',
      1: 'Predominant Senin', 2: 'Parțial Noros', 3: 'Înnorat',
      45: 'Ceață', 48: 'Ceață',
      51: 'Burniță Ușoară', 53: 'Burniță', 55: 'Burniță Abundentă',
      61: 'Ploaie Ușoară', 63: 'Ploaie', 65: 'Ploaie Torențială',
      71: 'Ninsoare Ușoară', 73: 'Ninsoare', 75: 'Ninsoare Abundentă', 77: 'Ninsoare',
      80: 'Averse de Ploaie', 81: 'Averse de Ploaie', 82: 'Averse Puternice',
      85: 'Lapoviță', 86: 'Lapoviță',
      95: 'Furtună', 96: 'Furtună', 99: 'Furtună'
    };
    return wmoMap[code] || 'Necunoscut';
  };

  const translateOWMCondition = (condition) => {
    const translations = {
      'Clear': 'Senin',
      'Clouds': 'Înnorat',
      'Rain': 'Ploaie',
      'Drizzle': 'Burniță',
      'Thunderstorm': 'Furtună',
      'Snow': 'Ninsoare',
      'Mist': 'Ceață',
      'Smoke': 'Fum',
      'Haze': 'Ceață',
      'Dust': 'Praf',
      'Fog': 'Ceață',
      'Sand': 'Nisip',
      'Ash': 'Cenușă',
      'Squall': 'Vijelie',
      'Tornado': 'Tornadă'
    };
    return translations[condition] || condition;
  };

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return 'Sun';
    if (code === 2 || code === 3) return 'Cloud';
    if (code === 45 || code === 48) return 'Drop'; // fog/mist
    if (code >= 51 && code <= 67) return 'CloudRain';
    if (code >= 71 && code <= 77) return 'Snowflake';
    if (code >= 80 && code <= 82) return 'CloudRain';
    if (code >= 85 && code <= 86) return 'Snowflake';
    if (code >= 95) return 'Lightning';
    return 'Cloud';
  };

  const getWeatherIconOWM = (icon) => {
    const iconMap = {
      '01d': 'Sun', '01n': 'Moon',
      '02d': 'Cloud', '02n': 'Cloud',
      '03d': 'Cloud', '03n': 'Cloud',
      '04d': 'Cloud', '04n': 'Cloud',
      '09d': 'CloudRain', '09n': 'CloudRain',
      '10d': 'CloudRain', '10n': 'CloudRain',
      '11d': 'Lightning', '11n': 'Lightning',
      '13d': 'Snowflake', '13n': 'Snowflake',
      '50d': 'Drop', '50n': 'Drop' // fog/mist
    };
    return iconMap[icon] || 'Cloud';
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-tertiary/60 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-2xl"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-secondary/50 rounded w-3/4"></div>
          <div className="h-24 bg-bg-secondary/50 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-bg-secondary/50 rounded"></div>
            <div className="h-4 bg-bg-secondary/50 rounded w-5/6"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!weatherData) {
    return null;
  }

  // Get current date formatted like "Miercuri, 12 Noiembrie"
  const getCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateString = date.toLocaleDateString('ro-RO', options);

    // Capitalize first letter of each word
    return dateString.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-4 text-white drop-shadow-2xl"
    >
      {/* Temperature */}
      <div className="text-5xl font-light leading-none tracking-tight">
        {weatherData.temperature}°
      </div>

      {/* Icon */}
      <div className="leading-none">
        {PhosphorIcons[weatherData.icon] ? (
          PhosphorIcons[weatherData.icon]()
        ) : (
          <PhosphorIcons.Cloud />
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-white/30"></div>

      {/* Date and Location */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-medium opacity-95 tracking-wide">
          {getCurrentDate()}
        </div>
        <div className="text-sm font-medium opacity-95 flex items-center gap-1.5 tracking-wide">
          <PhosphorIcons.MapPin />
          <span>{weatherData.condition}, {weatherData.location}</span>
        </div>
      </div>
    </motion.div>
  );
}
