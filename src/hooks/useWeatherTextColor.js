/**
 * useWeatherTextColor Hook
 * Returns the appropriate text color based on the current weather background
 *
 * Returns 'light' for white text on dark backgrounds
 * Returns 'dark' for dark text on light backgrounds
 */

import { useState, useEffect } from 'react';
import { getWeatherManager } from '../modules/weather/WeatherManager';
import { useSettings } from '../contexts/SettingsContext';

export function useWeatherTextColor() {
  const settings = useSettings();
  const [textColor, setTextColor] = useState('light'); // Default to white text

  useEffect(() => {
    // If not using weather background, use default light text
    if (settings.backgroundAnimation !== 'weather') {
      setTextColor('light');
      return;
    }

    // Get shared singleton instance
    const weatherManager = getWeatherManager();

    // Subscribe to weather updates
    const unsubscribe = weatherManager.subscribe((visualState) => {
      if (visualState && visualState.textColor) {
        setTextColor(visualState.textColor);
      }
    });

    // Get initial state if available
    const currentVisualState = weatherManager.getVisualState();
    if (currentVisualState && currentVisualState.textColor) {
      setTextColor(currentVisualState.textColor);
    }

    return () => {
      unsubscribe();
    };
  }, [settings.backgroundAnimation]);

  return textColor;
}
