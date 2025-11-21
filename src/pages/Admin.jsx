import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heading, Body, Button, Card } from '../components/ui';
import StatisticsTab from '../components/admin/StatisticsTab';

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
  const [uploadCategory, setUploadCategory] = useState('scheduling'); // 'default' or 'scheduling'
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
  const [activeTab, setActiveTab] = useState('statistics');


  // NTP Server modal state
  const [showNtpModal, setShowNtpModal] = useState(false);
  const [editingNtpServer, setEditingNtpServer] = useState(null);
  const [ntpServerForm, setNtpServerForm] = useState({
    hostname: '',
    port: 123,
    priority: 1,
    enabled: true
  });
  const [ntpFormError, setNtpFormError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [testingServerId, setTestingServerId] = useState(null);

  // News cache refresh state
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [newsRefreshMessage, setNewsRefreshMessage] = useState('');

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

  // NTP Server management functions
  const openNtpModal = (server = null) => {
    if (server) {
      // Edit mode
      setEditingNtpServer(server);
      setNtpServerForm({
        hostname: server.hostname,
        port: server.port,
        priority: server.priority,
        enabled: server.enabled
      });
    } else {
      // Add mode
      setEditingNtpServer(null);
      // Find next available priority
      const maxPriority = settings.timeSynchronization?.ntpServers?.length > 0
        ? Math.max(...settings.timeSynchronization.ntpServers.map(s => s.priority))
        : 0;
      setNtpServerForm({
        hostname: '',
        port: 123,
        priority: maxPriority + 1,
        enabled: true
      });
    }
    setNtpFormError('');
    setShowNtpModal(true);
  };

  const closeNtpModal = () => {
    setShowNtpModal(false);
    setEditingNtpServer(null);
    setNtpFormError('');
  };

  const validateNtpForm = () => {
    // Validate hostname
    if (!ntpServerForm.hostname.trim()) {
      setNtpFormError('Hostname is required');
      return false;
    }

    // Validate port
    if (ntpServerForm.port < 1 || ntpServerForm.port > 65535) {
      setNtpFormError('Port must be between 1 and 65535');
      return false;
    }

    // Check for duplicate hostname:port (except when editing the same server)
    const isDuplicate = settings.timeSynchronization?.ntpServers?.some(server => {
      if (editingNtpServer && server.id === editingNtpServer.id) {
        return false; // Skip checking against itself when editing
      }
      return server.hostname === ntpServerForm.hostname.trim() && server.port === ntpServerForm.port;
    });

    if (isDuplicate) {
      setNtpFormError('This NTP server is already configured');
      return false;
    }

    return true;
  };

  const handleSaveNtpServer = () => {
    if (!validateNtpForm()) {
      return;
    }

    if (editingNtpServer) {
      // Update existing server
      setSettings({
        ...settings,
        timeSynchronization: {
          ...settings.timeSynchronization,
          ntpServers: settings.timeSynchronization.ntpServers.map(s =>
            s.id === editingNtpServer.id
              ? { ...s, ...ntpServerForm, hostname: ntpServerForm.hostname.trim() }
              : s
          )
        }
      });
    } else {
      // Add new server
      const newServer = {
        id: `ntp-${Date.now()}`,
        hostname: ntpServerForm.hostname.trim(),
        port: ntpServerForm.port,
        priority: ntpServerForm.priority,
        enabled: ntpServerForm.enabled
      };
      setSettings({
        ...settings,
        timeSynchronization: {
          ...settings.timeSynchronization,
          ntpServers: [...(settings.timeSynchronization?.ntpServers || []), newServer]
        }
      });
    }

    closeNtpModal();
  };

  const handleDeleteNtpServer = (serverId) => {
    if (confirm('Are you sure you want to delete this NTP server?')) {
      setSettings({
        ...settings,
        timeSynchronization: {
          ...settings.timeSynchronization,
          ntpServers: settings.timeSynchronization.ntpServers.filter(s => s.id !== serverId)
        }
      });
    }
  };

  const handleToggleNtpServer = (serverId, enabled) => {
    setSettings({
      ...settings,
      timeSynchronization: {
        ...settings.timeSynchronization,
        ntpServers: settings.timeSynchronization.ntpServers.map(s =>
          s.id === serverId ? { ...s, enabled } : s
        )
      }
    });
  };

  const handleToggleNtpSync = (enabled) => {
    setSettings({
      ...settings,
      timeSynchronization: {
        ...settings.timeSynchronization,
        enabled
      }
    });
  };

  const handleUpdateSyncInterval = (interval) => {
    setSettings({
      ...settings,
      timeSynchronization: {
        ...settings.timeSynchronization,
        syncInterval: parseInt(interval) || 3600
      }
    });
  };

  const handleTestNtpServer = async (server) => {
    setTestingServerId(server.id);
    setSyncMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ntp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostname: server.hostname,
          port: server.port
        })
      });

      const data = await response.json();

      if (data.success) {
        setSyncMessage(`✓ ${server.hostname}: Connected successfully (${data.responseTime}ms)`);
      } else {
        setSyncMessage(`✗ ${server.hostname}: ${data.message || data.error}`);
      }

      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(''), 5000);

    } catch (error) {
      console.error('Test NTP server error:', error);
      setSyncMessage(`✗ Failed to test ${server.hostname}: ${error.message}`);
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setTestingServerId(null);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ntp/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update settings with new sync status
        setSettings({
          ...settings,
          timeSynchronization: {
            ...settings.timeSynchronization,
            syncStatus: data.syncStatus,
            lastSync: data.lastSync
          }
        });
        setSyncMessage(`✓ ${data.message}`);
      } else {
        // Update with error status
        setSettings({
          ...settings,
          timeSynchronization: {
            ...settings.timeSynchronization,
            syncStatus: 'error'
          }
        });
        setSyncMessage(`✗ ${data.message}`);
      }

      // Clear message after 10 seconds
      setTimeout(() => setSyncMessage(''), 10000);

    } catch (error) {
      console.error('Sync NTP error:', error);
      setSyncMessage(`✗ Failed to synchronize: ${error.message}`);
      setTimeout(() => setSyncMessage(''), 10000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cover scheduling functions
  const handleCoverUpload = async (event, station, category = 'scheduling') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('cover', file);
      formData.append('name', file.name);
      formData.append('label', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      formData.append('category', category); // Add category: 'default' or 'scheduling'

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

        setSaveMessage(`Cover uploaded successfully to ${category === 'default' ? 'Default Covers' : 'Covers Library'}!`);
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
    { id: 'statistics', name: 'Statistics', icon: 'ChartBar' },
    { id: 'weather', name: 'Weather', icon: 'CloudSun' },
    { id: 'streams', name: 'Radio Streams', icon: 'Radio' },
    { id: 'covers', name: 'Cover Scheduling', icon: 'Images' },
    { id: 'news', name: 'News Source', icon: 'Newspaper' },
    { id: 'time', name: 'Time Sync', icon: 'Clock' }
  ];

  // Phosphor icons (inline SVG for simplicity)
  const PhosphorIcons = {
    ChartBar: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"/>
      </svg>
    ),
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
    Clock: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
      </svg>
    ),
    Newspaper: () => (
      <svg className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z"/>
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
            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <StatisticsTab token={localStorage.getItem('adminToken')} />
            )}

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
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">Provider</Body>
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
                    {/* Default Cover */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <Body size="small" opacity="secondary" className="text-xs font-medium">Default Cover</Body>
                          <Body size="small" opacity="secondary" className="text-xs mt-1">
                            Select the main station cover shown when dynamic covers are disabled or no schedule matches
                          </Body>
                        </div>
                        <label className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-medium hover:bg-primary-dark cursor-pointer transition-colors">
                          {uploadingCover ? 'Uploading...' : '+ Upload Default Cover'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCoverUpload(e, selectedStation, 'default')}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Default Cover Grid - Shows original defaults + covers uploaded as 'default' category */}
                      <div className="grid grid-cols-4 gap-2">
                        {(() => {
                          // Create array with original default cover + uploaded default covers only
                          const originalDefaultCover = {
                            id: `original-default-${selectedStation}`,
                            label: selectedStation === 'fm' ? 'Radio Constanța FM (Original)' : 'Radio Constanța Folclor (Original)',
                            path: selectedStation === 'fm' ? '/rcfm.png' : '/rcf.png',
                            isOriginal: true
                          };

                          const uploadedCovers = settings.coverScheduling[selectedStation].covers || [];
                          const defaultCovers = uploadedCovers.filter(c => c.category === 'default');
                          const allCovers = [originalDefaultCover, ...defaultCovers];

                          return allCovers.map((cover) => {
                            const isDefault = settings.coverScheduling[selectedStation].defaultCover === cover.path;
                            return (
                              <div key={cover.id} className="relative group">
                                <div
                                  onClick={async () => {
                                    // Set this cover as default
                                    const updatedSettings = {
                                      ...settings,
                                      coverScheduling: {
                                        ...settings.coverScheduling,
                                        [selectedStation]: {
                                          ...settings.coverScheduling[selectedStation],
                                          defaultCover: cover.path
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
                                        setSaveMessage('Default cover updated successfully!');
                                        setTimeout(() => setSaveMessage(''), 3000);
                                      } else {
                                        setSaveMessage('Failed to update default cover');
                                      }
                                    } catch (error) {
                                      setSaveMessage('Error updating default cover');
                                      console.error('Save error:', error);
                                    } finally {
                                      setIsSaving(false);
                                    }
                                  }}
                                  className={`relative cursor-pointer rounded border transition-all overflow-hidden ${
                                    isDefault
                                      ? 'border-primary ring-2 ring-primary/30'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <img
                                    src={cover.path}
                                    alt={cover.label}
                                    className="w-full aspect-square object-cover"
                                  />
                                  {/* Default Badge */}
                                  {isDefault && (
                                    <div className="absolute top-0 left-0 right-0 bg-primary px-2 py-1">
                                      <div className="text-white text-xs font-bold text-center">DEFAULT</div>
                                    </div>
                                  )}
                                  {/* Original Badge */}
                                  {cover.isOriginal && !isDefault && (
                                    <div className="absolute top-0 left-0 right-0 bg-blue-500/80 px-2 py-1">
                                      <div className="text-white text-xs font-medium text-center">ORIGINAL</div>
                                    </div>
                                  )}
                                  {/* Hover overlay - Set as Default + Delete */}
                                  {!isDefault && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="text-white text-xs font-medium text-center px-2">
                                          Set as Default
                                        </div>
                                        {/* Delete button - only for uploaded covers, not original */}
                                        {!cover.isOriginal && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCover(selectedStation, cover.id);
                                            }}
                                            className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-text-secondary truncate">
                                  {cover.label}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

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
                        <Body size="small" opacity="secondary" className="text-xs">Covers Library (for scheduling)</Body>
                        <label className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-medium hover:bg-primary-dark cursor-pointer transition-colors">
                          {uploadingCover ? 'Uploading...' : '+ Upload Cover'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCoverUpload(e, selectedStation, 'scheduling')}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Covers Grid - Only show scheduling covers */}
                      <div className="grid grid-cols-4 gap-2">
                        {settings.coverScheduling[selectedStation].covers?.filter(c => c.category === 'scheduling' || !c.category).map((cover) => (
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
                          settings.coverScheduling[selectedStation].covers.filter(c => c.category === 'scheduling' || !c.category).length === 0) && (
                          <div className="col-span-4 text-center py-6 text-xs text-text-tertiary">
                            No scheduling covers uploaded yet. Upload a cover to get started.
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
                                    <> | Hours: {schedule.newsHours?.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')} ({(() => {
                                      const duration = schedule.duration || 3;
                                      const minutes = Math.floor(duration);
                                      const seconds = Math.round((duration - minutes) * 60);
                                      if (seconds === 0) return `${minutes}min`;
                                      return `${minutes}m ${seconds}s`;
                                    })()})</>
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

            {/* News Source Tab */}
            {activeTab === 'news' && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">News Source Configuration</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Configure WordPress API and news source settings
                  </Body>
                </div>

                <div className="space-y-6">
                  {/* WordPress API URL */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">WordPress API</Heading>
                    <div className="space-y-4">
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">
                          WordPress REST API URL
                        </Body>
                        <input
                          type="text"
                          value={settings.newsSource?.wordpressApiUrl || ''}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            // Auto-extract domain from URL
                            let domain = '';
                            try {
                              const urlObj = new URL(newUrl.replace('/wp-json/wp/v2/posts', ''));
                              domain = urlObj.hostname.replace('www.', '');
                            } catch {
                              // Invalid URL, keep domain empty
                            }
                            setSettings({
                              ...settings,
                              newsSource: {
                                ...settings.newsSource,
                                wordpressApiUrl: newUrl,
                                siteDomain: domain || settings.newsSource?.siteDomain || '',
                                // Auto-update allowed image domains
                                allowedImageDomains: domain ? [
                                  'i0.wp.com',
                                  'i1.wp.com',
                                  'i2.wp.com',
                                  domain,
                                  `www.${domain}`
                                ] : settings.newsSource?.allowedImageDomains || []
                              }
                            });
                          }}
                          placeholder="https://www.example.com/wp-json/wp/v2/posts"
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                        />
                        <Body size="small" opacity="secondary" className="mt-1 text-xs">
                          Full URL to your WordPress REST API posts endpoint
                        </Body>
                      </div>
                    </div>
                  </div>

                  {/* Site Configuration */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Site Configuration</Heading>
                    <div className="space-y-4">
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">
                          Site Name
                        </Body>
                        <input
                          type="text"
                          value={settings.newsSource?.siteName || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            newsSource: {
                              ...settings.newsSource,
                              siteName: e.target.value
                            }
                          })}
                          placeholder="Radio Constanța"
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                        />
                        <Body size="small" opacity="secondary" className="mt-1 text-xs">
                          Display name for the news source (used as fallback author name)
                        </Body>
                      </div>

                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">
                          Site Domain
                        </Body>
                        <input
                          type="text"
                          value={settings.newsSource?.siteDomain || ''}
                          onChange={(e) => {
                            const domain = e.target.value;
                            setSettings({
                              ...settings,
                              newsSource: {
                                ...settings.newsSource,
                                siteDomain: domain,
                                // Auto-update allowed image domains
                                allowedImageDomains: domain ? [
                                  'i0.wp.com',
                                  'i1.wp.com',
                                  'i2.wp.com',
                                  domain,
                                  `www.${domain}`
                                ] : settings.newsSource?.allowedImageDomains || []
                              }
                            });
                          }}
                          placeholder="radioconstanta.ro"
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                        />
                        <Body size="small" opacity="secondary" className="mt-1 text-xs">
                          Domain used for article URL validation (without www)
                        </Body>
                      </div>
                    </div>
                  </div>

                  {/* Image Proxy Domains */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Allowed Image Domains</Heading>
                    <div className="space-y-4">
                      <Body size="small" opacity="secondary" className="text-xs">
                        These domains are allowed for image proxying. WordPress CDN domains (i0-i2.wp.com) are included by default.
                      </Body>
                      <div className="flex flex-wrap gap-2">
                        {(settings.newsSource?.allowedImageDomains || []).map((domain, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary border border-border rounded-lg text-sm"
                          >
                            <span>{domain}</span>
                            <button
                              onClick={() => {
                                const newDomains = [...(settings.newsSource?.allowedImageDomains || [])];
                                newDomains.splice(index, 1);
                                setSettings({
                                  ...settings,
                                  newsSource: {
                                    ...settings.newsSource,
                                    allowedImageDomains: newDomains
                                  }
                                });
                              }}
                              className="text-text-tertiary hover:text-error transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="newImageDomain"
                          placeholder="example.com"
                          className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target;
                              const newDomain = input.value.trim();
                              if (newDomain && !(settings.newsSource?.allowedImageDomains || []).includes(newDomain)) {
                                setSettings({
                                  ...settings,
                                  newsSource: {
                                    ...settings.newsSource,
                                    allowedImageDomains: [...(settings.newsSource?.allowedImageDomains || []), newDomain]
                                  }
                                });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('newImageDomain');
                            const newDomain = input.value.trim();
                            if (newDomain && !(settings.newsSource?.allowedImageDomains || []).includes(newDomain)) {
                              setSettings({
                                ...settings,
                                newsSource: {
                                  ...settings.newsSource,
                                  allowedImageDomains: [...(settings.newsSource?.allowedImageDomains || []), newDomain]
                                }
                              });
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Add Domain
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Refresh Cache */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Refresh News Cache</Heading>
                    <div className="space-y-4">
                      <Body size="small" opacity="secondary" className="text-xs">
                        After changing the WordPress API URL, click the button below to immediately load news from the new source.
                      </Body>
                      <button
                        onClick={async () => {
                          setIsRefreshingNews(true);
                          setNewsRefreshMessage('');
                          try {
                            const token = localStorage.getItem('adminToken');
                            const response = await fetch('/api/news/refresh-cache', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            const data = await response.json();
                            if (data.success) {
                              setNewsRefreshMessage(`✓ ${data.message}`);
                            } else {
                              setNewsRefreshMessage(`✗ ${data.message || 'Failed to refresh cache'}`);
                            }
                          } catch (error) {
                            setNewsRefreshMessage(`✗ Error: ${error.message}`);
                          } finally {
                            setIsRefreshingNews(false);
                          }
                        }}
                        disabled={isRefreshingNews}
                        className="w-full px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        {isRefreshingNews ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh News Cache Now
                          </>
                        )}
                      </button>
                      {newsRefreshMessage && (
                        <div className={`p-3 rounded-lg text-xs ${
                          newsRefreshMessage.startsWith('✓')
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                          {newsRefreshMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-6">
                    <Heading level={6} className="mb-3 text-base text-blue-400">How it works</Heading>
                    <Body size="small" className="text-xs text-blue-300 space-y-2">
                      <p>1. Enter your WordPress REST API URL (usually: yoursite.com/wp-json/wp/v2/posts)</p>
                      <p>2. The site domain will be auto-extracted and used for article validation</p>
                      <p>3. Image domains are auto-configured to include WordPress CDN and your site</p>
                      <p>4. Click "Save All Settings" to apply changes</p>
                      <p>5. Click "Refresh News Cache Now" to immediately load news from the new source</p>
                    </Body>
                  </div>
                </div>
              </div>
            )}

            {/* Time Synchronization Tab */}
            {activeTab === 'time' && (
              <div>
                <div className="mb-6">
                  <Heading level={3} className="text-2xl">Time Synchronization</Heading>
                  <Body size="small" opacity="secondary" className="mt-2">
                    Configure NTP servers and time synchronization settings
                  </Body>
                </div>

                <div className="space-y-6">
                  {/* Current Server Time */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Current Server Time</Heading>
                    <div className="space-y-3">
                      <div className="text-2xl font-semibold text-text-primary">
                        {serverTime.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'Europe/Bucharest'
                        })}
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {serverTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZone: 'Europe/Bucharest'
                        })} EET
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            settings.timeSynchronization?.syncStatus === 'synced' ? 'bg-green-500' :
                            settings.timeSynchronization?.syncStatus === 'error' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <Body size="small" opacity="secondary" className="text-xs">
                            Status: {
                              settings.timeSynchronization?.syncStatus === 'synced' ? 'Synced' :
                              settings.timeSynchronization?.syncStatus === 'error' ? 'Error' :
                              'Unknown'
                            }
                          </Body>
                        </div>
                        {settings.timeSynchronization?.lastSync && (
                          <Body size="small" opacity="secondary" className="text-xs">
                            Last sync: {new Date(settings.timeSynchronization.lastSync).toLocaleString('en-US', {
                              timeZone: 'Europe/Bucharest'
                            })}
                          </Body>
                        )}
                      </div>

                      {/* Sync Now Button */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <button
                          onClick={handleSyncNow}
                          disabled={isSyncing || !settings.timeSynchronization?.enabled}
                          className="w-full px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          {isSyncing ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              Synchronizing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Sync Now
                            </>
                          )}
                        </button>

                        {/* Sync Message */}
                        {syncMessage && (
                          <div className={`mt-3 p-3 rounded-lg text-xs ${
                            syncMessage.startsWith('✓')
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                          }`}>
                            {syncMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Synchronization Settings */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <Heading level={6} className="mb-4 text-base">Time Synchronization Settings</Heading>
                    <div className="space-y-4">
                      {/* Enable NTP Toggle */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.timeSynchronization?.enabled || false}
                          onChange={(e) => handleToggleNtpSync(e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-bg-tertiary text-primary focus:ring-primary"
                        />
                        <Body size="small" className="text-sm font-medium">
                          Enable NTP Synchronization
                        </Body>
                      </div>

                      {/* Sync Interval */}
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">
                          Sync Interval (seconds)
                        </Body>
                        <input
                          type="number"
                          min="60"
                          max="86400"
                          value={settings.timeSynchronization?.syncInterval || 3600}
                          onChange={(e) => handleUpdateSyncInterval(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                        />
                        <Body size="small" opacity="secondary" className="mt-1 text-xs">
                          Recommended: 3600-86400 seconds (1-24 hours)
                        </Body>
                      </div>

                      {/* Timezone Display */}
                      <div>
                        <Body size="small" opacity="secondary" className="mb-2 text-xs">
                          Timezone
                        </Body>
                        <input
                          type="text"
                          value={settings.timeSynchronization?.timezone || 'Europe/Bucharest'}
                          disabled
                          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-secondary cursor-not-allowed"
                        />
                        <Body size="small" opacity="secondary" className="mt-1 text-xs">
                          Server timezone (read-only)
                        </Body>
                      </div>
                    </div>
                  </div>

                  {/* NTP Servers */}
                  <div className="rounded-2xl bg-bg-secondary border border-border shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Heading level={6} className="text-base">NTP Servers</Heading>
                      <Button
                        onClick={() => openNtpModal()}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        + Add NTP Server
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {settings.timeSynchronization?.ntpServers?.length > 0 ? (
                        settings.timeSynchronization.ntpServers
                          .sort((a, b) => a.priority - b.priority)
                          .map((server) => (
                            <div
                              key={server.id}
                              className={`p-4 rounded-lg border ${
                                server.enabled
                                  ? 'bg-bg-tertiary border-border'
                                  : 'bg-bg-tertiary/50 border-border/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={server.enabled}
                                    onChange={(e) => handleToggleNtpServer(server.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-border bg-bg-primary text-primary focus:ring-primary"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-text-primary text-sm">
                                      {server.hostname}:{server.port}
                                    </div>
                                    <Body size="small" opacity="secondary" className="text-xs mt-1">
                                      Priority: {server.priority}
                                    </Body>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTestNtpServer(server)}
                                    disabled={testingServerId === server.id || !server.enabled}
                                    className="px-3 py-1 text-xs rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {testingServerId === server.id ? 'Testing...' : 'Test'}
                                  </button>
                                  <button
                                    onClick={() => openNtpModal(server)}
                                    className="px-3 py-1 text-xs rounded-lg bg-bg-primary border border-border text-text-primary hover:bg-bg-secondary transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNtpServer(server.id)}
                                    className="px-3 py-1 text-xs rounded-lg bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <Body size="small" opacity="secondary" className="text-center py-8 text-xs">
                          No NTP servers configured. Click "Add NTP Server" to get started.
                        </Body>
                      )}
                    </div>
                  </div>

                  {/* Recommended NTP Servers */}
                  <div className="rounded-2xl bg-bg-tertiary border border-border p-6">
                    <Heading level={6} className="mb-3 text-base">Recommended NTP Servers</Heading>
                    <Body size="small" opacity="secondary" className="text-xs space-y-2">
                      <div>• <span className="font-medium">pool.ntp.org</span> - NTP Pool Project (Global)</div>
                      <div>• <span className="font-medium">time.google.com</span> - Google Public NTP</div>
                      <div>• <span className="font-medium">time.cloudflare.com</span> - Cloudflare NTP</div>
                      <div>• <span className="font-medium">ntp.ubuntu.com</span> - Ubuntu NTP Pool</div>
                      <div>• <span className="font-medium">ro.pool.ntp.org</span> - Romania NTP Pool</div>
                      <div>• <span className="font-medium">europe.pool.ntp.org</span> - European NTP Pool</div>
                    </Body>
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
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">Select Cover (from Covers Library)</Body>
                  <div className="grid grid-cols-4 gap-2">
                    {settings.coverScheduling[selectedStation].covers?.filter(c => c.category === 'scheduling' || !c.category).map((cover) => (
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
                      settings.coverScheduling[selectedStation].covers.filter(c => c.category === 'scheduling' || !c.category).length === 0) && (
                      <div className="col-span-4 text-center py-4 text-xs text-text-tertiary border border-dashed border-border rounded">
                        No scheduling covers available. Upload covers to the Covers Library first.
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
                        Duration (minutes and seconds)
                      </Body>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={scheduleForm.duration}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseFloat(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-text-primary w-24 text-center">
                          {(() => {
                            const minutes = Math.floor(scheduleForm.duration);
                            const seconds = Math.round((scheduleForm.duration - minutes) * 60);
                            if (seconds === 0) {
                              return `${minutes} min`;
                            }
                            return `${minutes}m ${seconds}s`;
                          })()}
                        </span>
                      </div>
                      <Body size="small" opacity="secondary" className="mt-1 text-xs">
                        News bulletin will show from :00 to :{(() => {
                          const totalSeconds = Math.round(scheduleForm.duration * 60);
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        })()}
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

        {/* NTP Server Modal */}
        {showNtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeNtpModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-bg-secondary border border-border shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Heading level={5} className="text-base">
                  {editingNtpServer ? 'Edit NTP Server' : 'Add NTP Server'}
                </Heading>
                <button
                  onClick={closeNtpModal}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {ntpFormError && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                  <Body size="small" className="text-xs text-error">
                    {ntpFormError}
                  </Body>
                </div>
              )}

              <div className="space-y-4">
                {/* Hostname */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">
                    Hostname or IP Address *
                  </Body>
                  <input
                    type="text"
                    value={ntpServerForm.hostname}
                    onChange={(e) => setNtpServerForm({ ...ntpServerForm, hostname: e.target.value })}
                    placeholder="pool.ntp.org"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Port */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">
                    Port
                  </Body>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={ntpServerForm.port}
                    onChange={(e) => setNtpServerForm({ ...ntpServerForm, port: parseInt(e.target.value) || 123 })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                  <Body size="small" opacity="secondary" className="mt-1 text-xs">
                    Default NTP port is 123
                  </Body>
                </div>

                {/* Priority */}
                <div>
                  <Body size="small" opacity="secondary" className="mb-2 text-xs">
                    Priority
                  </Body>
                  <input
                    type="number"
                    min="1"
                    value={ntpServerForm.priority}
                    onChange={(e) => setNtpServerForm({ ...ntpServerForm, priority: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                  <Body size="small" opacity="secondary" className="mt-1 text-xs">
                    Lower numbers = higher priority
                  </Body>
                </div>

                {/* Enabled */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={ntpServerForm.enabled}
                    onChange={(e) => setNtpServerForm({ ...ntpServerForm, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-bg-tertiary text-primary focus:ring-primary"
                  />
                  <Body size="small" className="text-sm">
                    Enable this server
                  </Body>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveNtpServer}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm"
                >
                  {editingNtpServer ? 'Update Server' : 'Add Server'}
                </button>
                <button
                  onClick={closeNtpModal}
                  className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-primary font-medium hover:bg-bg-tertiary/80 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
}
