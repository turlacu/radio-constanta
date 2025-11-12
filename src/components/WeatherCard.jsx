/**
 * WeatherCard Component
 * Displays current weather information for wide-screen layout
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { Heading, Body } from './ui';

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
          condition: data.weather[0].main,
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
      0: 'Clear',
      1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
      45: 'Foggy', 48: 'Foggy',
      51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
      71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow',
      80: 'Rain Showers', 81: 'Rain Showers', 82: 'Heavy Showers',
      85: 'Snow Showers', 86: 'Snow Showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return wmoMap[code] || 'Unknown';
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

  // Get current date formatted like "Tuesday, 23 December"
  const getCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-bg-tertiary/90 backdrop-blur-xl rounded-xl p-4 border border-border/40 shadow-lg"
    >
      {/* Temperature & Icon */}
      <div className="flex items-start justify-between mb-2">
        <div className="text-4xl font-bold text-text-primary leading-none">
          {weatherData.temperature}°
        </div>
        <div className="text-3xl leading-none">
          {weatherData.icon}
        </div>
      </div>

      {/* Date */}
      <div className="text-[11px] text-text-tertiary mb-1.5 font-medium">
        {getCurrentDate()}
      </div>

      {/* Location with pin icon */}
      <div className="text-[11px] text-text-tertiary flex items-center gap-1 font-medium">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="truncate">{weatherData.condition}, {weatherData.location}</span>
      </div>
    </motion.div>
  );
}
