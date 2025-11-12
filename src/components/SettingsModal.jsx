import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button, Heading, Body, Card } from './ui';

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

  const [activeTab, setActiveTab] = useState('background');
  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  const weatherTypes = [
    { id: 'sunny', label: 'Sunny', icon: '☀️' },
    { id: 'cloudy', label: 'Cloudy', icon: '☁️' },
    { id: 'rain', label: 'Rain', icon: '🌧️' },
    { id: 'storm', label: 'Storm', icon: '⛈️' },
    { id: 'snow', label: 'Snow', icon: '❄️' },
    { id: 'fog', label: 'Fog', icon: '🌫️' }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
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
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Card variant="elevated" radius="large" padding="none">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Heading level={4}>Settings</Heading>
              <Button
                variant="ghost"
                icon
                onClick={onClose}
                aria-label="Close settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-bg-secondary">
              <button
                onClick={() => setActiveTab('background')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'background'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Background
              </button>
              {backgroundAnimation === 'weather' && (
                <button
                  onClick={() => setActiveTab('weather')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'weather'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Weather
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {activeTab === 'background' && (
                <div className="space-y-6">
                  <div>
                    <Heading level={5} className="mb-3">
                      Background Animation
                    </Heading>
                    <div className="space-y-3">
                      {backgroundOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setBackgroundAnimation(option.value)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            backgroundAnimation === option.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium text-text-primary mb-1">
                            {option.label}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {backgroundAnimation === 'weather' && (
                    <div>
                      <Heading level={5} className="mb-3">
                        Performance
                      </Heading>
                      <div className="space-y-3">
                        {performanceOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setWeatherPerformance(option.value)}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              weatherPerformance === option.value
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="font-medium text-text-primary mb-1">
                              {option.label}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'weather' && backgroundAnimation === 'weather' && (
                <div className="space-y-6">
                  <div>
                    <Heading level={5} className="mb-3">
                      Weather Mode
                    </Heading>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setWeatherMode('auto')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          weatherMode === 'auto'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-text-primary">Auto</div>
                        <div className="text-sm text-text-secondary mt-1">
                          Use real weather data
                        </div>
                      </button>
                      <button
                        onClick={() => setWeatherMode('manual')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          weatherMode === 'manual'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-text-primary">Manual</div>
                        <div className="text-sm text-text-secondary mt-1">
                          Choose weather manually
                        </div>
                      </button>
                    </div>
                  </div>

                  {weatherMode === 'auto' && (
                    <div>
                      <Heading level={5} className="mb-3">
                        Location
                      </Heading>
                      <div className="p-4 rounded-lg bg-bg-secondary border border-border mb-3">
                        <Body size="small" className="font-medium">
                          Current: {weatherLocation.name}
                        </Body>
                        <Body size="small" opacity="secondary" className="mt-1">
                          {weatherLocation.lat.toFixed(4)}, {weatherLocation.lon.toFixed(4)}
                        </Body>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Enter city name (e.g., Paris, New York)..."
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSearchingLocation) handleLocationChange();
                          }}
                          disabled={isSearchingLocation}
                          className="flex-1 px-4 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                        <Button
                          variant="primary"
                          size="normal"
                          onClick={handleLocationChange}
                          disabled={isSearchingLocation || !locationInput.trim()}
                        >
                          {isSearchingLocation ? 'Searching...' : 'Set'}
                        </Button>
                      </div>
                      {locationError && (
                        <Body size="small" className="text-red-500 mb-3">
                          {locationError}
                        </Body>
                      )}
                      <Button
                        variant="secondary"
                        size="normal"
                        fullWidth
                        onClick={handleUseCurrentLocation}
                        disabled={isGettingCurrentLocation}
                      >
                        {isGettingCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                      </Button>
                    </div>
                  )}

                  {weatherMode === 'manual' && (
                    <div>
                      <Heading level={5} className="mb-3">
                        Time of Day
                      </Heading>
                      <div className="flex gap-3 mb-6">
                        <button
                          onClick={() => setManualWeatherState({ ...manualWeatherState, timeOfDay: 'day' })}
                          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                            manualWeatherState.timeOfDay === 'day'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">☀️</div>
                          <div className="font-medium text-text-primary text-sm">Day</div>
                        </button>
                        <button
                          onClick={() => setManualWeatherState({ ...manualWeatherState, timeOfDay: 'night' })}
                          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                            manualWeatherState.timeOfDay === 'night'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">🌙</div>
                          <div className="font-medium text-text-primary text-sm">Night</div>
                        </button>
                      </div>

                      <Heading level={5} className="mb-3">
                        Weather Type
                      </Heading>
                      <div className="grid grid-cols-3 gap-3">
                        {weatherTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setManualWeatherState({ ...manualWeatherState, weatherType: type.id })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              manualWeatherState.weatherType === type.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="text-3xl mb-2">{type.icon}</div>
                            <div className="font-medium text-text-primary text-sm">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="secondary" size="normal" onClick={onClose}>
                Close
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
