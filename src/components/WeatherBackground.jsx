/**
 * WeatherBackground Component
 * Integrates weather animation system with app settings
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WeatherManager } from '../modules/weather/WeatherManager';
import { getCrossfadeTransition } from '../modules/weather/TransitionController';
import BackgroundRenderer from './weather/BackgroundRenderer';
import ParticleLayer from './weather/ParticleLayer';
import AuroraLayer from './weather/AuroraLayer';
import { useSettings } from '../contexts/SettingsContext';

// Singleton instance
let weatherManagerInstance = null;

export default function WeatherBackground() {
  const settings = useSettings();
  const [visualState, setVisualState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only initialize if weather animation is enabled
    if (settings.backgroundAnimation !== 'weather') {
      return;
    }

    // Create singleton instance
    if (!weatherManagerInstance) {
      weatherManagerInstance = new WeatherManager();
    }

    const weatherManager = weatherManagerInstance;

    // Initialize weather manager
    const initWeather = async () => {
      try {
        // Set location from settings BEFORE initializing
        weatherManager.location = {
          lat: settings.weatherLocation.lat,
          lon: settings.weatherLocation.lon,
          name: settings.weatherLocation.name
        };

        // Initialize with skipGeolocation=true since we already have location from settings
        await weatherManager.initialize(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize weather:', error);
        setIsLoading(false);
      }
    };

    initWeather();

    // Subscribe to weather updates
    const unsubscribe = weatherManager.subscribe((newState) => {
      console.log('Weather visual state updated:', newState);
      setVisualState(newState);
    });

    // Set mode based on settings
    if (settings.weatherMode === 'auto') {
      // Skip geolocation since we already set location from settings
      weatherManager.enableAutoMode(true);
    } else if (settings.weatherMode === 'manual') {
      // Set manual weather state
      const isNight = settings.manualWeatherState.timeOfDay === 'night';
      weatherManager.setManualWeather(settings.manualWeatherState.weatherType, isNight);
    }

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [settings.backgroundAnimation, settings.weatherMode, settings.weatherLocation, settings.manualWeatherState]);

  // Don't render if not using weather animation
  if (settings.backgroundAnimation !== 'weather') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-bg-primary" />
      )}

      {/* Background Layer - Animated Gradients */}
      <AnimatePresence mode="wait">
        {visualState && (
          <motion.div
            key={visualState.stateKey}
            className="absolute inset-0"
            {...getCrossfadeTransition(settings.weatherPerformance)}
          >
            <BackgroundRenderer
              visualState={visualState}
              performanceLevel={settings.weatherPerformance}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aurora Layer (Night Mode Only) */}
      <AnimatePresence>
        {visualState?.aurora?.enabled && (
          <motion.div
            key="aurora"
            className="absolute inset-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 3,
              ease: [0.43, 0.13, 0.23, 0.96],
              delay: 0.3
            }}
          >
            <AuroraLayer
              visualState={visualState}
              performanceLevel={settings.weatherPerformance}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle Layer */}
      <AnimatePresence mode="wait">
        {visualState && (
          <motion.div
            key={`particles-${visualState.stateKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: [0.43, 0.13, 0.23, 0.96],
              delay: 0.5
            }}
          >
            <ParticleLayer
              visualState={visualState}
              performanceLevel={settings.weatherPerformance}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
