import { createContext, useContext, useState, useEffect } from 'react';

import { readScreenProtectionSettings } from '../utils/screenProtection';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Background animation setting: 'none', 'minimal', 'weather'
  const [backgroundAnimation, setBackgroundAnimation] = useState(() => {
    return localStorage.getItem('backgroundAnimation') || 'minimal';
  });

  const [screenProtectionMode, setScreenProtectionMode] = useState(
    () => readScreenProtectionSettings(localStorage, navigator.userAgent).mode
  );
  const [screenProtectionTimeoutMinutes, setScreenProtectionTimeoutMinutes] = useState(
    () => readScreenProtectionSettings(localStorage, navigator.userAgent).timeoutMinutes
  );

  // Weather settings
  const [weatherMode, setWeatherMode] = useState(() => {
    return localStorage.getItem('weatherMode') || 'auto';
  });

  const [weatherLocation, setWeatherLocation] = useState(() => {
    const saved = localStorage.getItem('weatherLocation');
    return saved ? JSON.parse(saved) : {
      lat: 44.1598,
      lon: 28.6348,
      name: 'Constanța, România'
    };
  });

  const [weatherPerformance, setWeatherPerformance] = useState(() => {
    return localStorage.getItem('weatherPerformance') || 'medium';
  });

  const [manualWeatherState, setManualWeatherState] = useState(() => {
    const saved = localStorage.getItem('manualWeatherState');
    return saved ? JSON.parse(saved) : {
      weatherType: 'sunny',
      timeOfDay: 'day'
    };
  });

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('backgroundAnimation', backgroundAnimation);
  }, [backgroundAnimation]);

  useEffect(() => {
    localStorage.setItem('weatherMode', weatherMode);
  }, [weatherMode]);

  useEffect(() => {
    localStorage.setItem('weatherLocation', JSON.stringify(weatherLocation));
  }, [weatherLocation]);

  useEffect(() => {
    localStorage.setItem('weatherPerformance', weatherPerformance);
  }, [weatherPerformance]);

  useEffect(() => {
    localStorage.setItem('manualWeatherState', JSON.stringify(manualWeatherState));
  }, [manualWeatherState]);

  useEffect(() => {
    try {
      localStorage.setItem('screenProtectionMode', screenProtectionMode);
      localStorage.setItem('screenProtectionTimeoutMinutes', String(screenProtectionTimeoutMinutes));
    } catch { /* Protection still works when storage is unavailable. */ }
  }, [screenProtectionMode, screenProtectionTimeoutMinutes]);

  const value = {
    screenProtectionMode,
    setScreenProtectionMode,
    screenProtectionTimeoutMinutes,
    setScreenProtectionTimeoutMinutes,
    backgroundAnimation,
    setBackgroundAnimation,
    weatherMode,
    setWeatherMode,
    weatherLocation,
    setWeatherLocation,
    weatherPerformance,
    setWeatherPerformance,
    manualWeatherState,
    setManualWeatherState
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
