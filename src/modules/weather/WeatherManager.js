/**
 * WeatherManager
 * Fetches live weather data and determines the current visual state
 * Supports both auto mode (real weather) and manual mode (for testing)
 */

import { VISUAL_STATES, WEATHER_CODE_MAP, WMO_CODE_MAP, TIME_CONFIG } from '../../config/weather/visualStates';

export class WeatherManager {
  constructor() {
    this.weatherProvider = 'openmeteo'; // Default to Open-Meteo (free, no key needed)
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY || 'demo';

    // API URLs for different providers
    this.openWeatherMapUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.openMeteoUrl = 'https://api.open-meteo.com/v1/forecast';

    this.currentWeather = null;
    this.currentVisualState = null;
    this.isAutoMode = true;
    this.updateInterval = null;
    this.listeners = [];

    // Default location (will be updated with user's location)
    this.location = {
      lat: 37.7749,
      lon: -122.4194,
      name: 'San Francisco'
    };

    // Offline fallback
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  /**
   * Fetch weather provider and API key from admin settings
   */
  async fetchApiKeyFromSettings() {
    try {
      const response = await fetch('/api/admin/public-settings');
      if (response.ok) {
        const settings = await response.json();

        // Set weather provider
        if (settings.weatherProvider) {
          this.weatherProvider = settings.weatherProvider;
          console.log('Using weather provider from admin settings:', this.weatherProvider);
        }

        // Use admin API key if it exists and is not empty (for OpenWeatherMap)
        if (settings.weatherApiKey && settings.weatherApiKey !== '') {
          this.apiKey = settings.weatherApiKey;
          console.log('Using weather API key from admin settings');
        }
      }
    } catch (error) {
      console.warn('Could not fetch settings from admin:', error);
    }
  }

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.isAutoMode) {
        this.fetchWeather();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize weather manager
   * Gets user location and fetches initial weather
   */
  async initialize(skipGeolocation = false) {
    // Try to fetch API key from admin settings first
    await this.fetchApiKeyFromSettings();

    // Only try geolocation if not explicitly skipped (e.g., when location set from settings)
    if (!skipGeolocation) {
      try {
        // Try to get user's location
        await this.getUserLocation();
      } catch (error) {
        console.warn('Could not get user location, using default:', error);
      }
    }

    // Fetch initial weather
    // Open-Meteo doesn't need an API key, OpenWeatherMap does
    const canFetchWeather = this.isAutoMode && (this.weatherProvider === 'openmeteo' || this.apiKey !== 'demo');

    if (canFetchWeather) {
      try {
        await this.fetchWeather();
      } catch (error) {
        console.warn('Could not fetch weather, using placeholder:', error);
        // Only set placeholder if weather fetch fails
        this.setPlaceholderWeather();
      }

      // Set up auto-refresh every 10 minutes
      this.updateInterval = setInterval(() => {
        this.fetchWeather();
      }, 10 * 60 * 1000);
    } else {
      // If we can't fetch weather (no API key for OpenWeatherMap), use placeholder
      this.setPlaceholderWeather();
    }

    return this.currentVisualState;
  }

  /**
   * Get user's location using Geolocation API
   */
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Your Location'
          };
          resolve(this.location);
        },
        (error) => {
          reject(error);
        },
        {
          timeout: 5000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    });
  }

  /**
   * Fetch weather data from configured provider
   */
  async fetchWeather() {
    if (!this.isOnline) {
      this.setPlaceholderWeather();
      return;
    }

    try {
      if (this.weatherProvider === 'openmeteo') {
        await this.fetchWeatherOpenMeteo();
      } else if (this.weatherProvider === 'openweathermap') {
        await this.fetchWeatherOpenWeatherMap();
      } else {
        // Default to Open-Meteo
        await this.fetchWeatherOpenMeteo();
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      this.setPlaceholderWeather();
    }
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  async fetchWeatherOpenWeatherMap() {
    if (this.apiKey === 'demo') {
      console.warn('OpenWeatherMap requires an API key');
      this.setPlaceholderWeather();
      return;
    }

    const url = `${this.openWeatherMapUrl}?lat=${this.location.lat}&lon=${this.location.lon}&appid=${this.apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    this.processOpenWeatherMapData(data);
  }

  /**
   * Fetch weather data from Open-Meteo API (free, no key required)
   */
  async fetchWeatherOpenMeteo() {
    // Open-Meteo API: https://api.open-meteo.com/v1/forecast
    // Parameters: latitude, longitude, current weather variables, timezone
    const params = new URLSearchParams({
      latitude: this.location.lat,
      longitude: this.location.lon,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover',
      daily: 'sunrise,sunset',
      timezone: 'auto',
      forecast_days: 1
    });

    const url = `${this.openMeteoUrl}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    this.processOpenMeteoData(data);
  }

  /**
   * Process OpenWeatherMap data
   */
  processOpenWeatherMapData(data) {
    // Extract relevant weather information
    this.currentWeather = {
      condition: data.weather[0].main.toLowerCase(),
      conditionCode: data.weather[0].id,
      description: data.weather[0].description,
      temp: Math.round(data.temp || data.main.temp),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      clouds: data.clouds.all,
      timestamp: data.dt,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: data.timezone,
      cityName: data.name
    };

    // Update location name
    this.location.name = data.name;

    // Determine visual state
    this.updateVisualState();
  }

  /**
   * Process Open-Meteo data
   */
  processOpenMeteoData(data) {
    const current = data.current;
    const daily = data.daily;

    // Convert ISO 8601 sunrise/sunset times to Unix timestamps
    const sunriseTime = new Date(daily.sunrise[0]).getTime() / 1000;
    const sunsetTime = new Date(daily.sunset[0]).getTime() / 1000;

    // Extract relevant weather information
    this.currentWeather = {
      condition: this.getWmoConditionName(current.weather_code),
      conditionCode: current.weather_code,
      description: this.getWmoConditionDescription(current.weather_code),
      temp: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      clouds: current.cloud_cover,
      timestamp: Math.floor(new Date(current.time).getTime() / 1000),
      sunrise: Math.floor(sunriseTime),
      sunset: Math.floor(sunsetTime),
      timezone: data.utc_offset_seconds,
      cityName: this.location.name,
      isPlaceholder: false
    };

    console.log('Open-Meteo weather data:', this.currentWeather);

    // Determine visual state
    this.updateVisualState();
  }

  /**
   * Get condition name from WMO code
   */
  getWmoConditionName(code) {
    const map = {
      0: 'clear',
      1: 'cloudy', 2: 'cloudy', 3: 'cloudy',
      45: 'fog', 48: 'fog',
      51: 'rain', 53: 'rain', 55: 'rain', 56: 'rain', 57: 'rain',
      61: 'rain', 63: 'rain', 65: 'rain', 66: 'rain', 67: 'rain',
      71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
      80: 'rain', 81: 'rain', 82: 'rain',
      85: 'snow', 86: 'snow',
      95: 'storm', 96: 'storm', 99: 'storm'
    };
    return map[code] || 'clear';
  }

  /**
   * Get human-readable description from WMO code
   */
  getWmoConditionDescription(code) {
    const descriptions = {
      0: 'clear sky',
      1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
      45: 'fog', 48: 'depositing rime fog',
      51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
      56: 'light freezing drizzle', 57: 'dense freezing drizzle',
      61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
      66: 'light freezing rain', 67: 'heavy freezing rain',
      71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow', 77: 'snow grains',
      80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
      85: 'slight snow showers', 86: 'heavy snow showers',
      95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
    };
    return descriptions[code] || 'unknown';
  }

  /**
   * Set placeholder weather for offline/demo mode
   */
  setPlaceholderWeather() {
    const hour = new Date().getHours();
    const isDay = hour >= TIME_CONFIG.dayStart && hour < TIME_CONFIG.dayEnd;

    this.currentWeather = {
      condition: 'clear',
      conditionCode: 800,
      description: 'clear sky',
      temp: 22,
      humidity: 60,
      windSpeed: 3.5,
      clouds: 0,
      timestamp: Math.floor(Date.now() / 1000),
      sunrise: Math.floor(Date.now() / 1000) - 3600,
      sunset: Math.floor(Date.now() / 1000) + 3600,
      timezone: 0,
      cityName: this.location.name,
      isPlaceholder: true
    };

    this.updateVisualState();
  }

  /**
   * Determine the current visual state based on weather and time
   */
  updateVisualState() {
    const weather = this.currentWeather;

    // Determine time of day - use current time, not weather data timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    const isNight = this.isNightTime(currentTime, weather.sunrise, weather.sunset, weather.timezone);

    // Map weather condition to base weather type based on provider
    let weatherType;

    // In manual mode, the condition field already contains the weather type directly
    if (!this.isAutoMode) {
      weatherType = weather.condition;
    } else if (this.weatherProvider === 'openmeteo') {
      weatherType = WMO_CODE_MAP[weather.conditionCode] || 'sunny';
      console.log('Open-Meteo code:', weather.conditionCode, '-> weather type:', weatherType);
    } else {
      weatherType = WEATHER_CODE_MAP[weather.conditionCode] || 'sunny';
      console.log('OpenWeatherMap code:', weather.conditionCode, '-> weather type:', weatherType);
    }

    // Combine weather and time to get visual state key
    let stateKey;
    if (isNight) {
      stateKey = weatherType === 'sunny' ? 'clear_night' : `${weatherType}_night`;
    } else {
      stateKey = weatherType === 'sunny' ? 'sunny_day' : `${weatherType}_day`;
    }

    console.log('Visual state key:', stateKey, 'isNight:', isNight, 'weatherType:', weatherType);

    // Get visual state from configuration
    const visualState = VISUAL_STATES[stateKey];

    if (!visualState) {
      console.warn(`Visual state not found: ${stateKey}, using default`);
      this.currentVisualState = VISUAL_STATES[isNight ? 'clear_night' : 'sunny_day'];
    } else {
      this.currentVisualState = {
        ...visualState,
        weatherType,
        isNight,
        stateKey,
        weather: {
          temp: weather.temp,
          condition: weather.description,
          cityName: weather.cityName,
          isPlaceholder: weather.isPlaceholder || false
        }
      };
    }

    console.log('Updated visual state to:', this.currentVisualState.stateKey);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Determine if it's night time
   * @param {number} currentTime - Current Unix timestamp in seconds
   * @param {number} sunrise - Sunrise Unix timestamp in seconds (UTC)
   * @param {number} sunset - Sunset Unix timestamp in seconds (UTC)
   * @param {number} timezone - Timezone offset in seconds from UTC
   */
  isNightTime(currentTime, sunrise, sunset, timezone) {
    // If we don't have sunrise/sunset data, use time-based logic
    if (!sunrise || !sunset) {
      const hour = new Date().getHours();
      return hour < TIME_CONFIG.dayStart || hour >= TIME_CONFIG.dayEnd;
    }

    // Use actual sunrise/sunset times
    // All times from API are in UTC, so comparison is straightforward
    const isNight = currentTime < sunrise || currentTime >= sunset;

    console.log('Night detection:', {
      currentTime: new Date(currentTime * 1000).toISOString(),
      sunrise: new Date(sunrise * 1000).toISOString(),
      sunset: new Date(sunset * 1000).toISOString(),
      isNight
    });

    return isNight;
  }

  /**
   * Manually set weather condition (for testing)
   */
  setManualWeather(weatherType, isNight = false) {
    this.isAutoMode = false;

    // Stop auto-refresh
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Create mock weather data
    this.currentWeather = {
      condition: weatherType,
      conditionCode: this.getCodeForWeatherType(weatherType),
      description: weatherType,
      temp: 20,
      humidity: 60,
      windSpeed: 3,
      clouds: 50,
      timestamp: Math.floor(Date.now() / 1000),
      sunrise: Math.floor(Date.now() / 1000) - 3600,
      sunset: Math.floor(Date.now() / 1000) + (isNight ? -100 : 3600),
      timezone: 0,
      cityName: 'Manual Mode',
      isPlaceholder: false
    };

    this.updateVisualState();
  }

  /**
   * Helper to get weather code for manual weather type
   */
  getCodeForWeatherType(type) {
    const codeMap = {
      sunny: 800,
      cloudy: 803,
      rain: 500,
      storm: 211,
      snow: 600,
      fog: 741
    };
    return codeMap[type] || 800;
  }

  /**
   * Enable auto mode (real weather)
   */
  enableAutoMode(skipGeolocation = false) {
    this.isAutoMode = true;
    this.initialize(skipGeolocation);
  }

  /**
   * Subscribe to visual state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);

    // Immediately notify with current state
    if (this.currentVisualState) {
      listener(this.currentVisualState);
    }

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.currentVisualState);
    });
  }

  /**
   * Get current visual state
   */
  getVisualState() {
    return this.currentVisualState;
  }

  /**
   * Get current weather data
   */
  getWeatherData() {
    return this.currentWeather;
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.listeners = [];
  }
}

// Export singleton instance
let weatherManagerInstance = null;

export const getWeatherManager = () => {
  if (!weatherManagerInstance) {
    weatherManagerInstance = new WeatherManager();
  }
  return weatherManagerInstance;
};

export default WeatherManager;
