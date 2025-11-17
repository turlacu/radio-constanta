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
  const [scheduleError, setScheduleError] = useState(''); // Error message for schedule modal

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    coverPath: '',
    days: [],
    startTime: '09:00',
    endTime: '17:00',
    priority: 0,
    type: 'regular', // 'regular' or 'news'
    newsHours: [], // For news type: array of hours when news airs (e.g., [7, 9, 12, 18])
    duration: 3 // For news type: duration in minutes
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState('weather');

  // Server time state (Romania timezone)
  const [serverTime, setServerTime] = useState(new Date());

  // Update server time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setServerTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const updateStreamConfig = (station, streamType, field, value) => {
    const newSettings = { ...settings };
    if (!newSettings.radioStreams[station]) {
      newSettings.radioStreams[station] = {};
    }
    if (!newSettings.radioStreams[station][streamType]) {
      newSettings.radioStreams[station][streamType] = {};
    }
    newSettings.radioStreams[station][streamType][field] = value;
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

        // Update settings with new cover - create proper deep copy
        setSettings(prevSettings => ({
          ...prevSettings,
          coverScheduling: {
            ...prevSettings.coverScheduling,
            [station]: {
              ...prevSettings.coverScheduling[station],
              covers: [...(prevSettings.coverScheduling[station].covers || []), data.cover]
            }
          }
        }));

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

  const handleDefaultCoverUpload = async (event, station) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('cover', file);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/covers/${station}/upload-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

        // Update settings with new default cover path
        setSettings(prevSettings => ({
          ...prevSettings,
          coverScheduling: {
            ...prevSettings.coverScheduling,
            [station]: {
              ...prevSettings.coverScheduling[station],
              defaultCover: data.coverPath
            }
          }
        }));

        setSaveMessage('Default cover uploaded successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to upload default cover');
      }
    } catch (error) {
      console.error('Error uploading default cover:', error);
      setSaveMessage('Error uploading default cover');
    } finally {
      setUploadingCover(false);
      // Reset the input
      event.target.value = '';
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
        // Update settings to remove cover - create proper deep copy
        setSettings(prevSettings => ({
          ...prevSettings,
          coverScheduling: {
            ...prevSettings.coverScheduling,
            [station]: {
              ...prevSettings.coverScheduling[station],
              covers: prevSettings.coverScheduling[station].covers.filter(c => c.id !== coverId)
            }
          }
        }));

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

  const handleAddSchedule = async () => {
    console.log('[Admin] handleAddSchedule called');
    console.log('[Admin] Schedule form data:', scheduleForm);
    console.log('[Admin] Selected station:', selectedStation);

    // Clear previous errors
    setScheduleError('');

    // Validate form
    if (!scheduleForm.name.trim()) {
      console.log('[Admin] ❌ Validation failed: name is required');
      setScheduleError('Schedule name is required');
      return;
    }
    if (!scheduleForm.coverPath) {
      console.log('[Admin] ❌ Validation failed: coverPath is required');
      setScheduleError('Please select a cover from the library below. Upload a cover first if needed.');
      return;
    }
    if (scheduleForm.days.length === 0) {
      console.log('[Admin] ❌ Validation failed: no days selected');
      setScheduleError('Please select at least one day');
      return;
    }
    if (scheduleForm.type === 'news' && scheduleForm.newsHours.length === 0) {
      console.log('[Admin] ❌ Validation failed: news type needs hours');
      setScheduleError('Please select at least one hour for news');
      return;
    }

    console.log('[Admin] ✅ Validation passed');

    const scheduleData = {
      name: scheduleForm.name,
      coverPath: scheduleForm.coverPath,
      days: scheduleForm.days,
      type: scheduleForm.type,
      priority: scheduleForm.type === 'news' ? 100 : scheduleForm.priority, // News always has highest priority
      ...(scheduleForm.type === 'news' ? {
        newsHours: scheduleForm.newsHours,
        duration: scheduleForm.duration
      } : {
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime
      })
    };

    console.log('[Admin] Schedule data to save:', scheduleData);

    let updatedSettings;

    if (editingSchedule) {
      console.log('[Admin] Updating existing schedule:', editingSchedule.id);
      // Update existing schedule
      updatedSettings = {
        ...settings,
        coverScheduling: {
          ...settings.coverScheduling,
          [selectedStation]: {
            ...settings.coverScheduling[selectedStation],
            schedules: settings.coverScheduling[selectedStation].schedules.map(s =>
              s.id === editingSchedule.id ? { ...scheduleData, id: s.id } : s
            )
          }
        }
      };
    } else {
      console.log('[Admin] Adding new schedule');
      // Add new schedule
      updatedSettings = {
        ...settings,
        coverScheduling: {
          ...settings.coverScheduling,
          [selectedStation]: {
            ...settings.coverScheduling[selectedStation],
            schedules: [
              ...(settings.coverScheduling[selectedStation].schedules || []),
              { ...scheduleData, id: `schedule-${Date.now()}` }
            ]
          }
        }
      };
    }

    console.log('[Admin] Updated settings:', updatedSettings.coverScheduling[selectedStation]);

    setSettings(updatedSettings);
    setShowScheduleModal(false);
    setEditingSchedule(null);

    // Auto-save to server
    console.log('[Admin] Sending settings to server...');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log('[Admin] Token exists:', !!token);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      console.log('[Admin] Server response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] ✅ Server response:', data);
        setSaveMessage('Schedule saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const errorText = await response.text();
        console.log('[Admin] ❌ Server error:', response.status, errorText);
        setSaveMessage('Failed to save schedule');
      }
    } catch (error) {
      console.error('[Admin] ❌ Network error:', error);
      setSaveMessage('Error saving schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (station, scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const updatedSettings = {
      ...settings,
      coverScheduling: {
        ...settings.coverScheduling,
        [station]: {
          ...settings.coverScheduling[station],
          schedules: settings.coverScheduling[station].schedules.filter(s => s.id !== scheduleId)
        }
      }
    };

    setSettings(updatedSettings);

    // Auto-save to server
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setSaveMessage('Schedule deleted successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to delete schedule');
      }
    } catch (error) {
      setSaveMessage('Error deleting schedule');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
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

  // Tab definitions
  const tabs = [
    { id: 'weather', name: 'Weather', icon: 'CloudSun' },
    { id: 'streams', name: 'Radio Streams', icon: 'Radio' },
    { id: 'covers', name: 'Cover Scheduling', icon: 'Images' },
    { id: 'api', name: 'API Settings', icon: 'Database' }
  ];

  // Phosphor icons (inline SVG for simplicity)
  const PhosphorIcons = {
    CloudSun: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,56V16a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm80,72a72,72,0,0,1-72,72H88A64,64,0,1,1,75.42,80.62a72,72,0,0,1,124.73,31.34A71.68,71.68,0,0,1,200,128Zm-16,0a56.06,56.06,0,0,0-56-56,57.27,57.27,0,0,0-9.6.84,8,8,0,0,1-9.4-9.4A56.06,56.06,0,0,0,72,8a56,56,0,0,0,0,112h56A56.06,56.06,0,0,0,184,128ZM69.17,64.59a71.88,71.88,0,0,1,42.07-35.5,72.75,72.75,0,0,1,8.48-1.84,72.36,72.36,0,0,1,11.51-.93,8,8,0,0,1,0,16,56.44,56.44,0,0,0-9.17.76,56.84,56.84,0,0,0-48.15,61.71A56,56,0,1,0,88,184h40a56,56,0,0,0,0-112,57.27,57.27,0,0,0-9.6.84,8,8,0,0,1-9.4-9.4,56.24,56.24,0,0,0-.84-9.17ZM216.49,111.51a8,8,0,0,0-11.31,0L192,124.69l-13.17-13.18a8,8,0,0,0-11.31,11.31L180.69,136l-13.18,13.17a8,8,0,0,0,11.31,11.31L192,147.31l13.17,13.18a8,8,0,0,0,11.31-11.31L203.31,136l13.18-13.17A8,8,0,0,0,216.49,111.51ZM88,56a8,8,0,0,0,5.66-2.34l8-8a8,8,0,0,0-11.32-11.32l-8,8A8,8,0,0,0,88,56Zm-.49,96.49a8,8,0,0,0-11.31,0l-8,8a8,8,0,0,0,11.31,11.31l8-8A8,8,0,0,0,87.51,152.49ZM40,120H16a8,8,0,0,0,0,16H40a8,8,0,0,0,0-16Z"/>
      </svg>
    ),
    Radio: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M104,72a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,72Zm128,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128ZM128,176a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,176Zm0-80a32,32,0,1,0,32,32A32,32,0,0,0,128,96Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z"/>
      </svg>
    ),
    Images: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z"/>
      </svg>
    ),
    Database: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24C74.17,24,32,48.6,32,80v96c0,31.4,42.17,56,96,56s96-24.6,96-56V80C224,48.6,181.83,24,128,24Zm80,104c0,9.62-7.88,19.43-21.61,26.92C170.93,163.35,150.19,168,128,168s-42.93-4.65-58.39-13.08C55.88,147.43,48,137.62,48,128V111.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64ZM69.61,53.08C85.07,44.65,105.81,40,128,40s42.93,4.65,58.39,13.08C200.12,60.57,208,70.38,208,80s-7.88,19.43-21.61,26.92C170.93,115.35,150.19,120,128,120s-42.93-4.65-58.39-13.08C55.88,99.43,48,89.62,48,80S55.88,60.57,69.61,53.08ZM186.39,202.92C170.93,211.35,150.19,216,128,216s-42.93-4.65-58.39-13.08C55.88,195.43,48,185.62,48,176V159.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64V176C208,185.62,200.12,195.43,186.39,202.92Z"/>
      </svg>
    ),
    SignOut: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"/>
      </svg>
    )
  };

  // Admin panel
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sidebar - Fixed */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-bg-secondary border-r border-border flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <Heading level={5} className="text-lg">Admin Panel</Heading>
          <Body size="small" opacity="secondary" className="mt-1 text-xs">
            Radio Constanța
          </Body>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = PhosphorIcons[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <Icon />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-error transition-colors"
          >
            <PhosphorIcons.SignOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - With left margin to account for fixed sidebar */}
      <div className="ml-64 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">

        {settings && (
          <div className="space-y-6">
            {/* Weather Tab */}
            {activeTab === 'weather' && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">Weather Configuration</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Configure weather data provider and location settings
                  </Body>
                </div>

                <div className="space-y-6">
                  {/* Weather Configuration */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Weather Data Provider</Heading>
                    <div className="space-y-4">
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2">Provider</Body>
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
                          <Body size="small" opacity="secondary" className="mb-2">
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
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Default Location</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </div>
            )}

            {/* Streams Tab */}
            {activeTab === 'streams' && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">Radio Streams Configuration</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Configure stream URLs and enable/disable stream qualities. FLAC streams will automatically use ALAC format on Apple devices.
                  </Body>
                </div>

                <div className="space-y-6">
                  {/* Radio Streams - FM */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="text-base mb-4">Radio Constanța FM Streams</Heading>

                    <div className="space-y-4">
                      {/* MP3 128 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.fm?.mp3_128?.enabled || false}
                                onChange={(e) => updateStreamConfig('fm', 'mp3_128', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">MP3 128 kbps</Body>
                              <Body size="small" opacity="secondary">Standard quality</Body>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={settings.radioStreams?.fm?.mp3_128?.url || ''}
                          onChange={(e) => updateStreamConfig('fm', 'mp3_128', 'url', e.target.value)}
                          placeholder="Stream URL (e.g., https://live.radioconstanta.ro/stream-128)"
                          disabled={!settings.radioStreams?.fm?.mp3_128?.enabled}
                          className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* MP3 256 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.fm?.mp3_256?.enabled || false}
                                onChange={(e) => updateStreamConfig('fm', 'mp3_256', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">MP3 256 kbps</Body>
                              <Body size="small" opacity="secondary">High quality</Body>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={settings.radioStreams?.fm?.mp3_256?.url || ''}
                          onChange={(e) => updateStreamConfig('fm', 'mp3_256', 'url', e.target.value)}
                          placeholder="Stream URL (e.g., https://live.radioconstanta.ro/stream-256)"
                          disabled={!settings.radioStreams?.fm?.mp3_256?.enabled}
                          className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* FLAC/ALAC 1024 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.fm?.flac?.enabled || false}
                                onChange={(e) => updateStreamConfig('fm', 'flac', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">FLAC/ALAC 1024 kbps</Body>
                              <Body size="small" opacity="secondary">Lossless quality (FLAC for most devices, ALAC for Apple)</Body>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Body size="small" opacity="secondary" className="mb-1">FLAC Stream URL (Android, Windows, Linux)</Body>
                            <input
                              type="text"
                              value={settings.radioStreams?.fm?.flac?.url || ''}
                              onChange={(e) => updateStreamConfig('fm', 'flac', 'url', e.target.value)}
                              placeholder="FLAC Stream URL (e.g., https://live.radioconstanta.ro/stream-flac)"
                              disabled={!settings.radioStreams?.fm?.flac?.enabled}
                              className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Body size="small" opacity="secondary" className="mb-1">ALAC Stream URL (iOS, macOS)</Body>
                            <input
                              type="text"
                              value={settings.radioStreams?.fm?.flac?.alacUrl || ''}
                              onChange={(e) => updateStreamConfig('fm', 'flac', 'alacUrl', e.target.value)}
                              placeholder="ALAC Stream URL (e.g., https://live.radioconstanta.ro/stream-alac)"
                              disabled={!settings.radioStreams?.fm?.flac?.enabled}
                              className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Radio Streams - Folclor */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="text-base mb-4">Radio Constanța Folclor Streams</Heading>

                    <div className="space-y-4">
                      {/* MP3 128 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.folclor?.mp3_128?.enabled || false}
                                onChange={(e) => updateStreamConfig('folclor', 'mp3_128', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">MP3 128 kbps</Body>
                              <Body size="small" opacity="secondary">Standard quality</Body>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={settings.radioStreams?.folclor?.mp3_128?.url || ''}
                          onChange={(e) => updateStreamConfig('folclor', 'mp3_128', 'url', e.target.value)}
                          placeholder="Stream URL (e.g., https://stream4.srr.ro:8443/radio-constanta-am)"
                          disabled={!settings.radioStreams?.folclor?.mp3_128?.enabled}
                          className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* MP3 256 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.folclor?.mp3_256?.enabled || false}
                                onChange={(e) => updateStreamConfig('folclor', 'mp3_256', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">MP3 256 kbps</Body>
                              <Body size="small" opacity="secondary">High quality</Body>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={settings.radioStreams?.folclor?.mp3_256?.url || ''}
                          onChange={(e) => updateStreamConfig('folclor', 'mp3_256', 'url', e.target.value)}
                          placeholder="Stream URL (e.g., https://stream4.srr.ro:8443/radio-constanta-folclor-256)"
                          disabled={!settings.radioStreams?.folclor?.mp3_256?.enabled}
                          className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* FLAC/ALAC 1024 kbps */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.radioStreams?.folclor?.flac?.enabled || false}
                                onChange={(e) => updateStreamConfig('folclor', 'flac', 'enabled', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <div>
                              <Body className="font-medium">FLAC/ALAC 1024 kbps</Body>
                              <Body size="small" opacity="secondary">Lossless quality (FLAC for most devices, ALAC for Apple)</Body>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Body size="small" opacity="secondary" className="mb-1">FLAC Stream URL (Android, Windows, Linux)</Body>
                            <input
                              type="text"
                              value={settings.radioStreams?.folclor?.flac?.url || ''}
                              onChange={(e) => updateStreamConfig('folclor', 'flac', 'url', e.target.value)}
                              placeholder="FLAC Stream URL (e.g., https://stream4.srr.ro:8443/radio-constanta-folclor-flac)"
                              disabled={!settings.radioStreams?.folclor?.flac?.enabled}
                              className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Body size="small" opacity="secondary" className="mb-1">ALAC Stream URL (iOS, macOS)</Body>
                            <input
                              type="text"
                              value={settings.radioStreams?.folclor?.flac?.alacUrl || ''}
                              onChange={(e) => updateStreamConfig('folclor', 'flac', 'alacUrl', e.target.value)}
                              placeholder="ALAC Stream URL (e.g., https://stream4.srr.ro:8443/radio-constanta-folclor-alac)"
                              disabled={!settings.radioStreams?.folclor?.flac?.enabled}
                              className="w-full px-3 py-2 text-sm rounded bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Scheduling Tab */}
            {activeTab === 'covers' && settings.coverScheduling && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">Cover Scheduling</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Schedule different cover arts for each station based on day and time
                  </Body>
                </div>

                {/* Server Time Display */}
                <div className="mb-6 p-4 rounded-xl bg-bg-secondary border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Body size="small" className="font-medium text-xs text-text-secondary mb-1">
                        🕐 Server Time (Europe/Bucharest)
                      </Body>
                      <div className="flex items-baseline gap-3">
                        <Body className="text-2xl font-bold text-primary font-mono">
                          {serverTime.toLocaleString('en-US', {
                            timeZone: 'Europe/Bucharest',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </Body>
                        <Body size="small" className="text-text-tertiary">
                          {serverTime.toLocaleString('en-US', {
                            timeZone: 'Europe/Bucharest',
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Body>
                      </div>
                    </div>
                    <div className="text-right">
                      <Body size="small" className="text-xs text-text-tertiary mb-1">
                        Timezone
                      </Body>
                      <Body size="small" className="text-xs font-medium text-text-secondary">
                        UTC{serverTime.toLocaleString('en-US', {
                          timeZone: 'Europe/Bucharest',
                          timeZoneName: 'short'
                        }).match(/UTC([+-]\d+)/)?.[1] || '+2/+3'}
                      </Body>
                      <Body size="small" className="text-xs text-green-500 mt-1">
                        ✓ Auto-adjusts for DST
                      </Body>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">

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
                          onChange={async (e) => {
                            const enabled = e.target.checked;
                            const updatedSettings = {
                              ...settings,
                              coverScheduling: {
                                ...settings.coverScheduling,
                                [selectedStation]: {
                                  ...settings.coverScheduling[selectedStation],
                                  enabled
                                }
                              }
                            };
                            setSettings(updatedSettings);

                            // Auto-save to server
                            setIsSaving(true);
                            try {
                              const token = localStorage.getItem('adminToken');
                              const response = await fetch('/api/admin/settings', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(updatedSettings)
                              });

                              if (response.ok) {
                                setSaveMessage(`Cover scheduling ${enabled ? 'enabled' : 'disabled'} successfully!`);
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
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Default Cover */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Body size="small" opacity="secondary" className="text-xs">Default Cover</Body>
                        <label className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-medium hover:bg-primary-dark cursor-pointer transition-colors">
                          {uploadingCover ? 'Uploading...' : 'Upload New'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDefaultCoverUpload(e, selectedStation)}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>
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
                      <Body size="small" opacity="secondary" className="text-xs mt-1">
                        This is the main station cover shown when dynamic covers are disabled or no schedule matches.
                      </Body>
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
                              priority: 0,
                              type: 'regular',
                              newsHours: [],
                              duration: 3
                            });
                            setScheduleError('');
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
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-xs text-text-primary">{schedule.name}</div>
                                  {schedule.type === 'news' && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 font-medium">
                                      📰 News
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-text-tertiary mt-1">
                                  {schedule.days?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                                  {schedule.type === 'news' ? (
                                    <> | Hours: {schedule.newsHours?.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')} ({schedule.duration || 3}min)</>
                                  ) : (
                                    <> | {schedule.startTime} - {schedule.endTime}</>
                                  )}
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
                                      priority: schedule.priority || 0,
                                      type: schedule.type || 'regular',
                                      newsHours: schedule.newsHours || [],
                                      duration: schedule.duration || 3
                                    });
                                    setScheduleError('');
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
                </div>
              </div>
            )}

            {/* API Settings Tab */}
            {activeTab === 'api' && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">API Settings</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Configure API endpoints and external integrations
                  </Body>
                </div>

                <div className="space-y-6">
                  {/* API Base URL */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">API Base URL</Heading>
                    <div className="space-y-4">
                      <Body size="small" opacity="secondary">
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
                </div>
              </div>
            )}

            {/* Save Button - Always visible */}
            <div className="sticky bottom-0 bg-bg-primary border-t border-border p-6 flex items-center gap-3 -mx-8 -mb-8">
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
        </div>
      </div>

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
                {/* Schedule Type */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Schedule Type</Body>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, type: 'regular' })}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        scheduleForm.type === 'regular'
                          ? 'bg-primary text-white'
                          : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                      }`}
                    >
                      Regular Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, type: 'news' })}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        scheduleForm.type === 'news'
                          ? 'bg-primary text-white'
                          : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                      }`}
                    >
                      📰 News Bulletin
                    </button>
                  </div>
                </div>

                {/* Schedule Name */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Schedule Name</Body>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder={scheduleForm.type === 'news' ? 'e.g., Morning News, Evening News' : 'e.g., Morning Show, Weekend Special'}
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

                {/* Days of Week - Starting with Monday */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Active Days</Body>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                      // Map to JS day numbers: Mon=1, Tue=2, ..., Sun=0
                      const dayNum = idx === 6 ? 0 : idx + 1;
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            const newDays = scheduleForm.days.includes(dayNum)
                              ? scheduleForm.days.filter(d => d !== dayNum)
                              : [...scheduleForm.days, dayNum].sort();
                            setScheduleForm({ ...scheduleForm, days: newDays });
                          }}
                          className={`px-2 py-2 text-xs rounded-lg font-medium transition-colors ${
                            scheduleForm.days.includes(dayNum)
                              ? 'bg-primary text-white'
                              : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Regular Schedule: Time Range */}
                {scheduleForm.type === 'regular' && (
                  <>
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
                  </>
                )}

                {/* News Bulletin: Hour Selection */}
                {scheduleForm.type === 'news' && (
                  <>
                    <div>
                      <Body size="small" opacity="secondary" className="mb-2 text-xs">
                        News Hours (select hours when news airs - starts at :00)
                      </Body>
                      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-bg-tertiary rounded-lg">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              const newHours = scheduleForm.newsHours.includes(hour)
                                ? scheduleForm.newsHours.filter(h => h !== hour)
                                : [...scheduleForm.newsHours, hour].sort((a, b) => a - b);
                              setScheduleForm({ ...scheduleForm, newsHours: newHours });
                            }}
                            className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                              scheduleForm.newsHours.includes(hour)
                                ? 'bg-primary text-white'
                                : 'bg-bg-secondary text-text-primary hover:bg-bg-primary/80'
                            }`}
                          >
                            {String(hour).padStart(2, '0')}:00
                          </button>
                        ))}
                      </div>
                      {scheduleForm.newsHours.length > 0 && (
                        <div className="mt-2 text-xs text-text-secondary">
                          Selected: {scheduleForm.newsHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <Body size="small" opacity="secondary" className="mb-2 text-xs">
                        Duration (minutes)
                      </Body>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={scheduleForm.duration}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-text-primary w-16 text-center">
                          {scheduleForm.duration} min
                        </span>
                      </div>
                      <Body size="small" opacity="secondary" className="mt-1 text-xs">
                        News bulletin will show from :00 to :{String(scheduleForm.duration).padStart(2, '0')}
                      </Body>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <Body size="small" className="text-xs text-blue-400">
                        ℹ️ News bulletins automatically have the highest priority and will override any other schedules during the selected hours.
                      </Body>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {scheduleError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Body size="small" className="text-xs text-red-400">
                      ⚠️ {scheduleError}
                    </Body>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleAddSchedule}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm"
                  >
                    {editingSchedule ? 'Update Schedule' : 'Add Schedule'}
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduleError('');
                    }}
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
  );
}
