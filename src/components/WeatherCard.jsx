/**
 * WeatherCard Component
 * Displays current weather information for wide-screen layout
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { Heading, Body } from './ui';

// Phosphor Icon
const MapPinIcon = () => (
  <svg viewBox="0 0 256 256" className="w-4 h-4"><path fill="currentColor" d="M128 64a40 40 0 1 0 40 40 40 40 0 0 0-40-40Zm0 64a24 24 0 1 1 24-24 24 24 0 0 1-24 24Zm0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.19 254.19 0 0 0 41.45 38.3 8 8 0 0 0 9.18 0A254.19 254.19 0 0 0 174 200.25c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88Zm0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118Z"/></svg>
);

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
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  const getWeatherIconOWM = (icon) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[icon] || '🌤️';
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
    return date.toLocaleDateString('ro-RO', options);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-4 text-white drop-shadow-2xl"
    >
      {/* Temperature */}
      <div className="text-6xl font-light leading-none tracking-tight">
        {weatherData.temperature}°
      </div>

      {/* Icon */}
      <div className="text-5xl leading-none">
        {weatherData.icon}
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-white/30"></div>

      {/* Date and Location */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-medium opacity-95 tracking-wide">
          {getCurrentDate()}
        </div>
        <div className="text-sm font-medium opacity-95 flex items-center gap-1.5 tracking-wide">
          <MapPinIcon />
          <span>{weatherData.condition}, {weatherData.location}</span>
        </div>
      </div>
    </motion.div>
  );
}
