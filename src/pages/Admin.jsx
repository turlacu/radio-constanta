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

  // Cover scheduling state
  const [selectedStation, setSelectedStation] = useState('fm');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    coverPath: '',
    days: [],
    startTime: '09:00',
    endTime: '17:00',
    priority: 0
  });

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

  // Cover scheduling functions
  const handleCoverUpload = async (event, station) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('cover', file);
      formData.append('name', file.name);
      formData.append('label', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/covers/${station}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

        // Update settings with new cover
        const newSettings = { ...settings };
        if (!newSettings.coverScheduling) {
          newSettings.coverScheduling = { fm: { covers: [] }, folclor: { covers: [] } };
        }
        if (!newSettings.coverScheduling[station].covers) {
          newSettings.coverScheduling[station].covers = [];
        }
        newSettings.coverScheduling[station].covers.push(data.cover);
        setSettings(newSettings);

        setSaveMessage('Cover uploaded successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to upload cover');
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      setSaveMessage('Error uploading cover');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteCover = async (station, coverId) => {
    if (!confirm('Are you sure you want to delete this cover?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/covers/${station}/${coverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update settings to remove cover
        const newSettings = { ...settings };
        newSettings.coverScheduling[station].covers =
          newSettings.coverScheduling[station].covers.filter(c => c.id !== coverId);
        setSettings(newSettings);

        setSaveMessage('Cover deleted successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to delete cover');
      }
    } catch (error) {
      console.error('Error deleting cover:', error);
      setSaveMessage('Error deleting cover');
    }
  };

  const handleAddSchedule = () => {
    // Validate form
    if (!scheduleForm.name.trim()) {
      setSaveMessage('Schedule name is required');
      return;
    }
    if (!scheduleForm.coverPath) {
      setSaveMessage('Please select a cover');
      return;
    }
    if (scheduleForm.days.length === 0) {
      setSaveMessage('Please select at least one day');
      return;
    }

    const newSettings = { ...settings };
    if (!newSettings.coverScheduling[selectedStation].schedules) {
      newSettings.coverScheduling[selectedStation].schedules = [];
    }

    const scheduleData = {
      name: scheduleForm.name,
      coverPath: scheduleForm.coverPath,
      days: scheduleForm.days,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      priority: scheduleForm.priority
    };

    if (editingSchedule) {
      // Update existing schedule
      const index = newSettings.coverScheduling[selectedStation].schedules.findIndex(
        s => s.id === editingSchedule.id
      );
      if (index !== -1) {
        newSettings.coverScheduling[selectedStation].schedules[index] = {
          ...scheduleData,
          id: editingSchedule.id
        };
      }
    } else {
      // Add new schedule
      newSettings.coverScheduling[selectedStation].schedules.push({
        ...scheduleData,
        id: `schedule-${Date.now()}`
      });
    }

    setSettings(newSettings);
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setSaveMessage('Schedule saved! Remember to click "Save All Settings" to persist changes.');
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const handleDeleteSchedule = (station, scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const newSettings = { ...settings };
    newSettings.coverScheduling[station].schedules =
      newSettings.coverScheduling[station].schedules.filter(s => s.id !== scheduleId);
    setSettings(newSettings);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-bg-secondary border border-border shadow-2xl p-6"
        >
          <div className="text-center mb-6">
            <Heading level={4}>Admin Panel</Heading>
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
                className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <Body size="small" className="text-red-500 text-xs">
                {error}
              </Body>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-bg-secondary p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={4}>Admin Panel</Heading>
            <Body size="small" opacity="secondary" className="mt-1 text-xs">
              Manage app settings and configuration
            </Body>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {settings && (
          <div className="space-y-4">
            {/* Weather Configuration */}
            <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
              <Heading level={6} className="mb-3 text-sm">Weather Configuration</Heading>
              <div className="space-y-3">
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Weather Data Provider</Body>
                  <select
                    value={settings.weatherProvider || 'openmeteo'}
                    onChange={(e) => setSettings({ ...settings, weatherProvider: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="openmeteo">Open-Meteo (Free, no API key required)</option>
                    <option value="openweathermap">OpenWeatherMap (API key required)</option>
                  </select>
                </div>

                {settings.weatherProvider === 'openweathermap' && (
                  <div>
                    <Body size="small" opacity="secondary" className="mb-2 text-xs">
                      OpenWeatherMap API Key
                    </Body>
                    <input
                      type="text"
                      value={settings.weatherApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, weatherApiKey: e.target.value })}
                      placeholder="Enter OpenWeatherMap API key"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                    />
                    <Body size="small" opacity="secondary" className="mt-2 text-xs">
                      Get your free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openweathermap.org</a>
                    </Body>
                  </div>
                )}

                {settings.weatherProvider === 'openmeteo' && (
                  <Body size="small" opacity="secondary" className="text-xs">
                    Open-Meteo provides free weather data without requiring an API key. Data is sourced from national weather services.
                  </Body>
                )}
              </div>
            </div>

            {/* Default Location */}
            <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
              <Heading level={6} className="mb-3 text-sm">Default Location</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">City Name</Body>
                  <input
                    type="text"
                    value={settings.defaultLocation?.name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Latitude</Body>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.defaultLocation?.lat || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, lat: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Longitude</Body>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.defaultLocation?.lon || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLocation: { ...settings.defaultLocation, lon: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Radio Streams - FM */}
            <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Heading level={6} className="text-sm">Radio Constanța FM Streams</Heading>
                <button
                  onClick={() => addStreamQuality('fm')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors"
                >
                  + Add Quality
                </button>
              </div>
              <div className="space-y-3">
                {settings.radioStreams?.fm?.map((stream, index) => (
                  <div key={index} className="p-3 rounded-lg bg-bg-tertiary border border-border space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <input
                        type="text"
                        value={stream.id}
                        onChange={(e) => updateStreamQuality('fm', index, 'id', e.target.value)}
                        placeholder="ID (e.g., 320)"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.label}
                        onChange={(e) => updateStreamQuality('fm', index, 'label', e.target.value)}
                        placeholder="Label (e.g., 320 kbps)"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.format}
                        onChange={(e) => updateStreamQuality('fm', index, 'format', e.target.value)}
                        placeholder="Format (MP3/AAC)"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.bitrate}
                        onChange={(e) => updateStreamQuality('fm', index, 'bitrate', e.target.value)}
                        placeholder="Bitrate"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => removeStreamQuality('fm', index)}
                        className="px-2 py-1.5 text-xs rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={stream.url}
                      onChange={(e) => updateStreamQuality('fm', index, 'url', e.target.value)}
                      placeholder="Stream URL"
                      className="w-full px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Radio Streams - Folclor */}
            <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Heading level={6} className="text-sm">Radio Constanța Folclor Streams</Heading>
                <button
                  onClick={() => addStreamQuality('folclor')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors"
                >
                  + Add Quality
                </button>
              </div>
              <div className="space-y-3">
                {settings.radioStreams?.folclor?.map((stream, index) => (
                  <div key={index} className="p-3 rounded-lg bg-bg-tertiary border border-border space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <input
                        type="text"
                        value={stream.id}
                        onChange={(e) => updateStreamQuality('folclor', index, 'id', e.target.value)}
                        placeholder="ID"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.label}
                        onChange={(e) => updateStreamQuality('folclor', index, 'label', e.target.value)}
                        placeholder="Label"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.format}
                        onChange={(e) => updateStreamQuality('folclor', index, 'format', e.target.value)}
                        placeholder="Format"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={stream.bitrate}
                        onChange={(e) => updateStreamQuality('folclor', index, 'bitrate', e.target.value)}
                        placeholder="Bitrate"
                        className="px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => removeStreamQuality('folclor', index)}
                        className="px-2 py-1.5 text-xs rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={stream.url}
                      onChange={(e) => updateStreamQuality('folclor', index, 'url', e.target.value)}
                      placeholder="Stream URL"
                      className="w-full px-2 py-1.5 text-xs rounded bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Scheduling */}
            {settings.coverScheduling && (
              <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
                <Heading level={6} className="mb-3 text-sm">Cover Scheduling</Heading>

                {/* Station Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedStation('fm')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      selectedStation === 'fm'
                        ? 'bg-primary text-white'
                        : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                    }`}
                  >
                    Radio Constanța FM
                  </button>
                  <button
                    onClick={() => setSelectedStation('folclor')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      selectedStation === 'folclor'
                        ? 'bg-primary text-white'
                        : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                    }`}
                  >
                    Radio Constanța Folclor
                  </button>
                </div>

                {settings.coverScheduling[selectedStation] && (
                  <div className="space-y-4">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border">
                      <div>
                        <Body size="small" className="font-medium text-xs">Enable Dynamic Covers</Body>
                        <Body size="small" opacity="secondary" className="text-xs mt-0.5">
                          Automatically change covers based on schedule
                        </Body>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.coverScheduling[selectedStation].enabled || false}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.coverScheduling[selectedStation].enabled = e.target.checked;
                            setSettings(newSettings);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Default Cover */}
                    <div>
                      <Body size="small" opacity="secondary" className="mb-2 text-xs">Default Cover</Body>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={settings.coverScheduling[selectedStation].defaultCover || ''}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.coverScheduling[selectedStation].defaultCover = e.target.value;
                            setSettings(newSettings);
                          }}
                          placeholder="/rcfm.png"
                          className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                        />
                        {settings.coverScheduling[selectedStation].defaultCover && (
                          <img
                            src={settings.coverScheduling[selectedStation].defaultCover}
                            alt="Default cover"
                            className="w-12 h-12 rounded object-cover border border-border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Transition Settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">Transition Effect</Body>
                        <select
                          value={settings.coverScheduling[selectedStation].transitionEffect || 'fade'}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.coverScheduling[selectedStation].transitionEffect = e.target.value;
                            setSettings(newSettings);
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                        >
                          <option value="fade">Fade</option>
                          <option value="slide-left">Slide Left</option>
                          <option value="slide-right">Slide Right</option>
                          <option value="zoom-in">Zoom In</option>
                          <option value="zoom-out">Zoom Out</option>
                          <option value="crossfade">Crossfade</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">Duration (ms)</Body>
                        <input
                          type="number"
                          value={settings.coverScheduling[selectedStation].transitionDuration || 500}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.coverScheduling[selectedStation].transitionDuration = parseInt(e.target.value);
                            setSettings(newSettings);
                          }}
                          min="0"
                          max="2000"
                          step="100"
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Cover Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Body size="small" opacity="secondary" className="text-xs">Covers Library</Body>
                        <label className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-medium hover:bg-primary-dark cursor-pointer transition-colors">
                          {uploadingCover ? 'Uploading...' : '+ Upload Cover'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCoverUpload(e, selectedStation)}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Covers Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {settings.coverScheduling[selectedStation].covers?.map((cover) => (
                          <div key={cover.id} className="relative group">
                            <img
                              src={cover.path}
                              alt={cover.label}
                              className="w-full aspect-square object-cover rounded border border-border"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteCover(selectedStation, cover.id)}
                                className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="mt-1 text-xs text-text-secondary truncate">{cover.label}</div>
                          </div>
                        ))}
                        {(!settings.coverScheduling[selectedStation].covers ||
                          settings.coverScheduling[selectedStation].covers.length === 0) && (
                          <div className="col-span-4 text-center py-6 text-xs text-text-tertiary">
                            No covers uploaded yet. Upload a cover to get started.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedules List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Body size="small" opacity="secondary" className="text-xs">Active Schedules</Body>
                        <button
                          onClick={() => {
                            setEditingSchedule(null);
                            setScheduleForm({
                              name: '',
                              coverPath: '',
                              days: [],
                              startTime: '09:00',
                              endTime: '17:00',
                              priority: 0
                            });
                            setShowScheduleModal(true);
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors"
                        >
                          + Add Schedule
                        </button>
                      </div>

                      <div className="space-y-2">
                        {settings.coverScheduling[selectedStation].schedules?.map((schedule) => (
                          <div key={schedule.id} className="p-3 rounded-lg bg-bg-tertiary border border-border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-xs text-text-primary">{schedule.name}</div>
                                <div className="text-xs text-text-tertiary mt-1">
                                  {schedule.days?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} | {schedule.startTime} - {schedule.endTime}
                                </div>
                                {schedule.coverPath && (
                                  <div className="mt-2">
                                    <img src={schedule.coverPath} alt="Schedule cover" className="w-16 h-16 rounded object-cover border border-border" />
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSchedule(schedule);
                                    setScheduleForm({
                                      name: schedule.name || '',
                                      coverPath: schedule.coverPath || '',
                                      days: schedule.days || [],
                                      startTime: schedule.startTime || '09:00',
                                      endTime: schedule.endTime || '17:00',
                                      priority: schedule.priority || 0
                                    });
                                    setShowScheduleModal(true);
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-bg-secondary text-text-primary hover:bg-bg-secondary/80 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(selectedStation, schedule.id)}
                                  className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!settings.coverScheduling[selectedStation].schedules ||
                          settings.coverScheduling[selectedStation].schedules.length === 0) && (
                          <div className="text-center py-6 text-xs text-text-tertiary border border-dashed border-border rounded-lg">
                            No schedules created yet. Add a schedule to start.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Base URL */}
            <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-4">
              <Heading level={6} className="mb-3 text-sm">API Base URL</Heading>
              <div className="space-y-3">
                <Body size="small" opacity="secondary" className="text-xs">
                  Optional base URL for API endpoints (leave empty for relative paths)
                </Body>
                <input
                  type="text"
                  value={settings.apiBaseUrl || ''}
                  onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                  placeholder="https://your-domain.com or leave empty"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isSaving ? 'Saving...' : 'Save All Settings'}
              </button>
              {saveMessage && (
                <Body className={`${saveMessage.includes('success') ? 'text-green-500' : 'text-red-500'} text-xs`}>
                  {saveMessage}
                </Body>
              )}
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowScheduleModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-bg-secondary border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Heading level={5} className="text-base">
                  {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
                </Heading>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Schedule Name */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Schedule Name</Body>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="e.g., Morning Show, Weekend Special"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Cover Selection */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Select Cover</Body>
                  <div className="grid grid-cols-4 gap-2">
                    {settings.coverScheduling[selectedStation].covers?.map((cover) => (
                      <div
                        key={cover.id}
                        onClick={() => setScheduleForm({ ...scheduleForm, coverPath: cover.path })}
                        className={`relative cursor-pointer rounded border-2 transition-all ${
                          scheduleForm.coverPath === cover.path
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={cover.path}
                          alt={cover.label}
                          className="w-full aspect-square object-cover rounded"
                        />
                        {scheduleForm.coverPath === cover.path && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="mt-1 text-xs text-text-secondary truncate">{cover.label}</div>
                      </div>
                    ))}
                    {(!settings.coverScheduling[selectedStation].covers ||
                      settings.coverScheduling[selectedStation].covers.length === 0) && (
                      <div className="col-span-4 text-center py-4 text-xs text-text-tertiary border border-dashed border-border rounded">
                        No covers available. Upload covers first.
                      </div>
                    )}
                  </div>
                </div>

                {/* Days of Week */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Active Days</Body>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const newDays = scheduleForm.days.includes(index)
                            ? scheduleForm.days.filter(d => d !== index)
                            : [...scheduleForm.days, index].sort();
                          setScheduleForm({ ...scheduleForm, days: newDays });
                        }}
                        className={`px-2 py-2 text-xs rounded-lg font-medium transition-colors ${
                          scheduleForm.days.includes(index)
                            ? 'bg-primary text-white'
                            : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Body size="small" opacity="secondary" className="mb-2 text-xs">Start Time</Body>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <Body size="small" opacity="secondary" className="mb-2 text-xs">End Time</Body>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">
                    Priority (higher numbers take precedence when schedules overlap)
                  </Body>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={scheduleForm.priority}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, priority: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-text-primary w-8 text-center">
                      {scheduleForm.priority}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleAddSchedule}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm"
                  >
                    {editingSchedule ? 'Update Schedule' : 'Add Schedule'}
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
