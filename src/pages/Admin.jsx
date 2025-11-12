import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heading, Body, Button, Card } from '../components/ui';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('adminToken');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);

        // Fetch settings
        const settingsResponse = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setSettings(null);
    setPassword('');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings');
      }
    } catch (error) {
      setSaveMessage('Error saving settings');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStreamQuality = (station, index, field, value) => {
    const newSettings = { ...settings };
    newSettings.radioStreams[station][index][field] = value;
    setSettings(newSettings);
  };

  const addStreamQuality = (station) => {
    const newSettings = { ...settings };
    newSettings.radioStreams[station].push({
      id: '',
      label: '',
      format: 'MP3',
      bitrate: '',
      url: ''
    });
    setSettings(newSettings);
  };

  const removeStreamQuality = (station, index) => {
    const newSettings = { ...settings };
    newSettings.radioStreams[station].splice(index, 1);
    setSettings(newSettings);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card variant="elevated" radius="large" padding="large">
            <div className="text-center mb-6">
              <Heading level={3}>Admin Panel</Heading>
              <Body size="small" opacity="secondary" className="mt-2">
                Enter password to access admin settings
              </Body>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <Body size="small" className="text-red-500">
                  {error}
                </Body>
              )}

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                disabled={loading || !password}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={2}>Admin Panel</Heading>
            <Body size="small" opacity="secondary" className="mt-1">
              Manage app settings and configuration
            </Body>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {settings && (
          <div className="space-y-6">
            {/* Weather Configuration */}
            <Card variant="elevated" radius="large" padding="large">
              <Heading level={4} className="mb-4">Weather Configuration</Heading>
              <div className="space-y-4">
                <div>
                  <Body size="small" opacity="secondary" className="mb-2">Weather Data Provider</Body>
                  <select
                    value={settings.weatherProvider || 'openmeteo'}
                    onChange={(e) => setSettings({ ...settings, weatherProvider: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="openmeteo">Open-Meteo (Free, no API key required)</option>
                    <option value="openweathermap">OpenWeatherMap (API key required)</option>
                  </select>
                </div>

                {settings.weatherProvider === 'openweathermap' && (
                  <div>
                    <Body size="small" opacity="secondary" className="mb-2">
                      OpenWeatherMap API Key
                    </Body>
                    <input
                      type="text"
                      value={settings.weatherApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, weatherApiKey: e.target.value })}
                      placeholder="Enter OpenWeatherMap API key"
                      className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                    />
                    <Body size="small" opacity="secondary" className="mt-2">
                      Get your free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openweathermap.org</a>
                    </Body>
                  </div>
                )}

                {settings.weatherProvider === 'openmeteo' && (
                  <Body size="small" opacity="secondary">
                    Open-Meteo provides free weather data without requiring an API key. Data is sourced from national weather services.
                  </Body>
                )}
              </div>
            </Card>

            {/* Default Location */}
            <Card variant="elevated" radius="large" padding="large">
              <Heading level={4} className="mb-4">Default Location</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Body size="small" opacity="secondary" className="mb-2">City Name</Body>
                  <input
                    type="text"
                    value={settings.defaultLocation?.name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, name: e.target.value }
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <Body size="small" opacity="secondary" className="mb-2">Latitude</Body>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.defaultLocation?.lat || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, lat: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <Body size="small" opacity="secondary" className="mb-2">Longitude</Body>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.defaultLocation?.lon || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, lon: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </Card>

            {/* Radio Streams - FM */}
            <Card variant="elevated" radius="large" padding="large">
              <div className="flex items-center justify-between mb-4">
                <Heading level={4}>Radio Constanța FM Streams</Heading>
                <Button variant="secondary" size="small" onClick={() => addStreamQuality('fm')}>
                  + Add Quality
                </Button>
              </div>
              <div className="space-y-4">
                {settings.radioStreams?.fm?.map((stream, index) => (
                  <div key={index} className="p-4 rounded-lg bg-bg-secondary border border-border space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        value={stream.id}
                        onChange={(e) => updateStreamQuality('fm', index, 'id', e.target.value)}
                        placeholder="ID (e.g., 320)"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.label}
                        onChange={(e) => updateStreamQuality('fm', index, 'label', e.target.value)}
                        placeholder="Label (e.g., 320 kbps)"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.format}
                        onChange={(e) => updateStreamQuality('fm', index, 'format', e.target.value)}
                        placeholder="Format (MP3/AAC)"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.bitrate}
                        onChange={(e) => updateStreamQuality('fm', index, 'bitrate', e.target.value)}
                        placeholder="Bitrate"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => removeStreamQuality('fm', index)}
                        className="px-3 py-2 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={stream.url}
                      onChange={(e) => updateStreamQuality('fm', index, 'url', e.target.value)}
                      placeholder="Stream URL"
                      className="w-full px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Radio Streams - Folclor */}
            <Card variant="elevated" radius="large" padding="large">
              <div className="flex items-center justify-between mb-4">
                <Heading level={4}>Radio Constanța Folclor Streams</Heading>
                <Button variant="secondary" size="small" onClick={() => addStreamQuality('folclor')}>
                  + Add Quality
                </Button>
              </div>
              <div className="space-y-4">
                {settings.radioStreams?.folclor?.map((stream, index) => (
                  <div key={index} className="p-4 rounded-lg bg-bg-secondary border border-border space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        value={stream.id}
                        onChange={(e) => updateStreamQuality('folclor', index, 'id', e.target.value)}
                        placeholder="ID"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.label}
                        onChange={(e) => updateStreamQuality('folclor', index, 'label', e.target.value)}
                        placeholder="Label"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.format}
                        onChange={(e) => updateStreamQuality('folclor', index, 'format', e.target.value)}
                        placeholder="Format"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.bitrate}
                        onChange={(e) => updateStreamQuality('folclor', index, 'bitrate', e.target.value)}
                        placeholder="Bitrate"
                        className="px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => removeStreamQuality('folclor', index)}
                        className="px-3 py-2 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={stream.url}
                      onChange={(e) => updateStreamQuality('folclor', index, 'url', e.target.value)}
                      placeholder="Stream URL"
                      className="w-full px-3 py-2 rounded bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* API Base URL */}
            <Card variant="elevated" radius="large" padding="large">
              <Heading level={4} className="mb-4">API Base URL</Heading>
              <div className="space-y-3">
                <Body size="small" opacity="secondary">
                  Optional base URL for API endpoints (leave empty for relative paths)
                </Body>
                <input
                  type="text"
                  value={settings.apiBaseUrl || ''}
                  onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                  placeholder="https://your-domain.com or leave empty"
                  className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                size="large"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save All Settings'}
              </Button>
              {saveMessage && (
                <Body className={saveMessage.includes('success') ? 'text-green-500' : 'text-red-500'}>
                  {saveMessage}
                </Body>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
