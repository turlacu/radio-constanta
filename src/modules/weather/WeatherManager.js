/**
 * WeatherManager
 * Fetches live weather data and determines the current visual state
 * Supports both auto mode (real weather) and manual mode (for testing)
 */

import { VISUAL_STATES, WEATHER_CODE_MAP, TIME_CONFIG } from '../../config/weather/visualStates';

export class WeatherManager {
  constructor() {
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY || 'demo';
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

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
  async initialize() {
    // Set placeholder weather immediately so we always have a state
    this.setPlaceholderWeather();

    try {
      // Try to get user's location
      await this.getUserLocation();
    } catch (error) {
      console.warn('Could not get user location, using default:', error);
    }

    // Fetch initial weather
    if (this.isAutoMode && this.apiKey !== 'demo') {
      try {
        await this.fetchWeather();
      } catch (error) {
        console.warn('Could not fetch weather, using placeholder:', error);
      }

      // Set up auto-refresh every 10 minutes
      this.updateInterval = setInterval(() => {
        this.fetchWeather();
      }, 10 * 60 * 1000);
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
   * Fetch weather data from OpenWeatherMap API
   */
  async fetchWeather() {
    if (!this.isOnline) {
      this.setPlaceholderWeather();
      return;
    }

    try {
      const url = `${this.apiUrl}?lat=${this.location.lat}&lon=${this.location.lon}&appid=${this.apiKey}&units=metric`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      this.processWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      this.setPlaceholderWeather();
    }
  }

  /**
   * Process weather data and determine visual state
   */
  processWeatherData(data) {
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

    // Determine time of day
    const isNight = this.isNightTime(weather.timestamp, weather.sunrise, weather.sunset, weather.timezone);

    // Map weather condition to base weather type
    const weatherType = WEATHER_CODE_MAP[weather.conditionCode] || 'sunny';

    // Combine weather and time to get visual state key
    let stateKey;
    if (isNight) {
      stateKey = weatherType === 'sunny' ? 'clear_night' : `${weatherType}_night`;
    } else {
      stateKey = weatherType === 'sunny' ? 'sunny_day' : `${weatherType}_day`;
    }

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

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Determine if it's night time
   */
  isNightTime(timestamp, sunrise, sunset, timezone) {
    // If we don't have sunrise/sunset data, use time-based logic
    if (!sunrise || !sunset) {
      const hour = new Date().getHours();
      return hour < TIME_CONFIG.dayStart || hour >= TIME_CONFIG.dayEnd;
    }

    // Use actual sunrise/sunset times
    return timestamp < sunrise || timestamp >= sunset;
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
  enableAutoMode() {
    this.isAutoMode = true;
    this.initialize();
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

export default WeatherManager;
