import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button, Heading, Body, Card } from './ui';

// Phosphor Icon SVGs
const PhosphorIcons = {
  Sun: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64 64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48 48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z"/></svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M233.54 142.23a8 8 0 0 0-8-2 88.08 88.08 0 0 1-109.8-109.8 8 8 0 0 0-10-10 104.84 104.84 0 0 0-52.91 37A104 104 0 0 0 136 224a103.09 103.09 0 0 0 62.52-20.88 104.84 104.84 0 0 0 37-52.91 8 8 0 0 0-1.98-7.98Zm-44.64 48.11A88 88 0 0 1 65.66 67.11a89 89 0 0 1 31.4-26A106 106 0 0 0 96 56a104.11 104.11 0 0 0 104 104 106 106 0 0 0 14.92-1.06 89 89 0 0 1-26.02 31.4Z"/></svg>
  ),
  Cloud: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M160 40a88.09 88.09 0 0 0-78.71 48.67A64 64 0 1 0 72 216h88a88 88 0 0 0 0-176Zm0 160H72a48 48 0 0 1 0-96c1.1 0 2.2 0 3.29.11A88 88 0 0 0 72 128a8 8 0 0 0 16 0 72 72 0 1 1 72 72Z"/></svg>
  ),
  CloudRain: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M158.66 196.44 153 213.17a8 8 0 1 1-15.27-4.94l5.66-16.73a8 8 0 0 1 15.27 4.94Zm-40 0a8 8 0 0 0-10.22 4.89l-5.66 16.73a8 8 0 1 0 15.27 4.94l5.66-16.73a8 8 0 0 0-5.05-10.83Zm-40 0a8 8 0 0 0-10.22 4.89l-5.66 16.73a8 8 0 1 0 15.27 4.94l5.66-16.73a8 8 0 0 0-5.05-10.83ZM228 92a76.08 76.08 0 0 1-76 76H76A52 52 0 1 1 86.2 64.37 76.09 76.09 0 0 1 228 92Zm-16 0a60.07 60.07 0 0 0-120-1.07A8 8 0 0 1 84 96a76.2 76.2 0 0 1-1.14 13 8 8 0 0 1-7.76 6.36A36 36 0 0 0 76 152h76a60.07 60.07 0 0 0 60-60Z"/></svg>
  ),
  Lightning: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M213.85 125.46l-112 120a8 8 0 0 1-13.69-7.3l16.79-73.27l-51.78-17.26a8 8 0 0 1-1.43-14.69l112-64a8 8 0 0 1 11.87 9.43l-17.45 76.09l52.34-17.45a8 8 0 0 1 3.35-15.55Z"/></svg>
  ),
  Snowflake: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M223.72 120.53 184 104l39.72-16.53a8 8 0 1 0-6.31-14.73L184 88.63V56a8 8 0 0 0-16 0v32.63l-33.41-15.89a8 8 0 1 0-6.31 14.73L168 104l-39.72 16.53a8 8 0 0 0 0 14.73L168 152l-39.72 16.53a8 8 0 1 0 6.31 14.73L168 167.37V200a8 8 0 0 0 16 0v-32.63l33.41 15.89a8 8 0 1 0 6.31-14.73L184 152l39.72-16.53a8 8 0 1 0 0-14.73ZM72 200a8 8 0 0 0 16 0v-32.63l33.41 15.89a8 8 0 1 0 6.31-14.73L88 152l39.72-16.53a8 8 0 0 0 0-14.73L88 104l39.72-16.53a8 8 0 1 0-6.31-14.73L88 88.63V56a8 8 0 0 0-16 0v32.63L38.59 72.74a8 8 0 1 0-6.31 14.73L72 104l-39.72 16.53a8 8 0 1 0 0 14.73L72 152l-39.72 16.53a8 8 0 1 0 6.31 14.73L72 167.37Z"/></svg>
  ),
  Drop: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M174 47.75a254.19 254.19 0 0 0-41.45-38.3 8 8 0 0 0-9.18 0A254.19 254.19 0 0 0 82 47.75C54.51 79.32 40 112.6 40 144a88 88 0 0 0 176 0c0-31.4-14.51-64.68-42-96.25ZM128 216a72.08 72.08 0 0 1-72-72c0-57.23 55.47-105 72-118c16.53 13 72 60.75 72 118a72.08 72.08 0 0 1-72 72Z"/></svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M128 64a40 40 0 1 0 40 40 40 40 0 0 0-40-40Zm0 64a24 24 0 1 1 24-24 24 24 0 0 1-24 24Zm0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.19 254.19 0 0 0 41.45 38.3 8 8 0 0 0 9.18 0A254.19 254.19 0 0 0 174 200.25c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88Zm0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118Z"/></svg>
  ),
  X: () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6"><path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/></svg>
  ),
};

export default function SettingsModal({ isOpen, onClose }) {
  const {
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
  } = useSettings();

  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  const weatherTypes = [
    { id: 'sunny', label: 'Sunny', icon: 'Sun' },
    { id: 'cloudy', label: 'Cloudy', icon: 'Cloud' },
    { id: 'rain', label: 'Rain', icon: 'CloudRain' },
    { id: 'storm', label: 'Storm', icon: 'Lightning' },
    { id: 'snow', label: 'Snow', icon: 'Snowflake' },
    { id: 'fog', label: 'Fog', icon: 'Drop' }
  ];

  if (!isOpen) return null;

  const backgroundOptions = [
    { value: 'none', label: 'None', description: 'Solid color background' },
    { value: 'minimal', label: 'Minimal', description: 'Current animated gradient' },
    { value: 'weather', label: 'Weather Reactive', description: 'Dynamic weather-based animation' }
  ];

  const performanceOptions = [
    { value: 'low', label: 'Low', description: 'Minimal effects, best for older devices' },
    { value: 'medium', label: 'Medium', description: 'Balanced performance (recommended)' },
    { value: 'high', label: 'High', description: 'Full effects, for powerful devices' }
  ];

  const handleLocationChange = async () => {
    if (!locationInput.trim()) return;

    setIsSearchingLocation(true);
    setLocationError('');

    try {
      // Use OpenStreetMap Nominatim API for geocoding (free, no API key required)
      const query = encodeURIComponent(locationInput.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'RadioConstanta/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search location');
      }

      const data = await response.json();

      if (data.length === 0) {
        setLocationError('Location not found. Please try a different search.');
        setIsSearchingLocation(false);
        return;
      }

      const result = data[0];
      setWeatherLocation({
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        name: result.display_name.split(',')[0] // Use first part of display name
      });

      setLocationInput('');
      setLocationError('');
    } catch (error) {
      console.error('Error geocoding location:', error);
      setLocationError('Failed to search location. Please try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingCurrentLocation(true);
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Try to get city name via reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          {
            headers: {
              'User-Agent': 'RadioConstanta/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const cityName = data.address?.city ||
                          data.address?.town ||
                          data.address?.village ||
                          data.address?.county ||
                          'Your Location';

          setWeatherLocation({
            lat,
            lon,
            name: cityName
          });
        } else {
          // Fallback if reverse geocoding fails
          setWeatherLocation({
            lat,
            lon,
            name: 'Your Location'
          });
        }
      } catch (geocodeError) {
        // Fallback if reverse geocoding fails
        console.warn('Reverse geocoding failed:', geocodeError);
        setWeatherLocation({
          lat,
          lon,
          name: 'Your Location'
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);

      let errorMessage = 'Failed to get your location. ';
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage += 'Please allow location access in your browser.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage += 'Location information is unavailable.';
          break;
        case 3: // TIMEOUT
          errorMessage += 'Location request timed out.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      setLocationError(errorMessage);
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-bg-primary border border-border shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Heading level={4}>Settings</Heading>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
              aria-label="Close settings"
            >
              <PhosphorIcons.X />
            </button>
          </div>

          {/* Content - All settings in one scrollable view */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-5">
            {/* Background Animation */}
            <div>
              <Heading level={6} className="mb-2 text-sm">Background Animation</Heading>
              <div className="space-y-2">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBackgroundAnimation(option.value)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      backgroundAnimation === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-text-primary text-sm">{option.label}</div>
                    <div className="text-xs text-text-tertiary mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance (only show if weather is selected) */}
            {backgroundAnimation === 'weather' && (
              <div>
                <Heading level={6} className="mb-2 text-sm">Performance</Heading>
                <div className="flex gap-2">
                  {performanceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setWeatherPerformance(option.value)}
                      className={`flex-1 p-2 rounded-lg border transition-all ${
                        weatherPerformance === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary text-xs">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Mode (only show if weather is selected) */}
            {backgroundAnimation === 'weather' && (
              <>
                <div>
                  <Heading level={6} className="mb-2 text-sm">Weather Mode</Heading>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWeatherMode('auto')}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        weatherMode === 'auto'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary text-sm">Auto</div>
                      <div className="text-xs text-text-tertiary mt-0.5">Real weather</div>
                    </button>
                    <button
                      onClick={() => setWeatherMode('manual')}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        weatherMode === 'manual'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-text-primary text-sm">Manual</div>
                      <div className="text-xs text-text-tertiary mt-0.5">Choose type</div>
                    </button>
                  </div>
                </div>

                {/* Location (only show in auto mode) */}
                {weatherMode === 'auto' && (
                  <div>
                    <Heading level={6} className="mb-2 text-sm flex items-center gap-1">
                      <PhosphorIcons.MapPin />
                      Location
                    </Heading>
                    <div className="p-3 rounded-lg bg-bg-secondary border border-border mb-2">
                      <Body size="small" className="font-medium">{weatherLocation.name}</Body>
                      <Body size="small" opacity="secondary" className="mt-0.5 text-xs">
                        {weatherLocation.lat.toFixed(4)}, {weatherLocation.lon.toFixed(4)}
                      </Body>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="City name..."
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isSearchingLocation) handleLocationChange();
                        }}
                        disabled={isSearchingLocation}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      <button
                        onClick={handleLocationChange}
                        disabled={isSearchingLocation || !locationInput.trim()}
                        className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSearchingLocation ? 'Searching...' : 'Set'}
                      </button>
                    </div>
                    {locationError && (
                      <Body size="small" className="text-red-500 mb-2 text-xs">{locationError}</Body>
                    )}
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isGettingCurrentLocation}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-bg-secondary border border-border text-text-primary font-medium hover:bg-bg-tertiary disabled:opacity-50 transition-colors"
                    >
                      {isGettingCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                    </button>
                  </div>
                )}

                {/* Manual Weather Settings */}
                {weatherMode === 'manual' && (
                  <>
                    <div>
                      <Heading level={6} className="mb-2 text-sm">Time of Day</Heading>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setManualWeatherState({ ...manualWeatherState, timeOfDay: 'day' })}
                          className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center ${
                            manualWeatherState.timeOfDay === 'day'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <PhosphorIcons.Sun />
                          <div className="font-medium text-text-primary text-xs mt-1">Day</div>
                        </button>
                        <button
                          onClick={() => setManualWeatherState({ ...manualWeatherState, timeOfDay: 'night' })}
                          className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center ${
                            manualWeatherState.timeOfDay === 'night'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <PhosphorIcons.Moon />
                          <div className="font-medium text-text-primary text-xs mt-1">Night</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <Heading level={6} className="mb-2 text-sm">Weather Type</Heading>
                      <div className="grid grid-cols-3 gap-2">
                        {weatherTypes.map((type) => {
                          const IconComponent = PhosphorIcons[type.icon];
                          return (
                            <button
                              key={type.id}
                              onClick={() => setManualWeatherState({ ...manualWeatherState, weatherType: type.id })}
                              className={`p-3 rounded-lg border transition-all flex flex-col items-center ${
                                manualWeatherState.weatherType === type.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <IconComponent />
                              <div className="font-medium text-text-primary text-xs mt-1">{type.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-bg-secondary text-text-primary font-medium hover:bg-bg-tertiary transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
