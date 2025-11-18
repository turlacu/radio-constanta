import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Heading, Body, Caption } from '../ui';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsTab({ token }) {
  const [currentStats, setCurrentStats] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [topArticles, setTopArticles] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Current month
  const [stationView, setStationView] = useState('current'); // 'current' or 'overtime'
  const [qualityView, setQualityView] = useState('current'); // 'current' or 'overtime'

  // Fetch statistics
  const fetchStats = async (isManual = false) => {
    try {
      // Only show full loading on initial load
      if (!currentStats && !isManual) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch current stats
      const currentRes = await fetch('/api/analytics/admin/current', { headers });
      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentStats(data);
      }

      // Fetch today's stats
      const todayRes = await fetch('/api/analytics/admin/today', { headers });
      if (todayRes.ok) {
        const data = await todayRes.json();
        setTodayStats(data);
      }

      // Fetch daily stats for selected month
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      const dailyRes = await fetch(`/api/analytics/admin/daily?start=${startDate}&end=${endDate}`, { headers });
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        setDailyStats(data);
      }

      // Fetch top articles
      const articlesRes = await fetch('/api/analytics/admin/articles?limit=10&days=30', { headers });
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setTopArticles(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      // No auto-refresh - only manual refresh via button
    }
  }, [token, selectedMonth]);

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const response = await fetch(
        `/api/analytics/admin/export?start=${startDate}&end=${endDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `radio-stats-${startDate}-to-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Body opacity="secondary">Loading statistics...</Body>
      </div>
    );
  }

  // Prepare chart data for Over Time views
  const getStationOverTimeData = () => {
    return {
      labels: dailyStats.map(stat => format(new Date(stat.date), 'MMM d')),
      datasets: [
        {
          label: 'FM',
          data: dailyStats.map(stat => stat.fm_listeners || 0),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Folclor',
          data: dailyStats.map(stat => stat.folclor_listeners || 0),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const getQualityOverTimeData = () => {
    return {
      labels: dailyStats.map(stat => format(new Date(stat.date), 'MMM d')),
      datasets: [
        {
          label: 'MP3 128',
          data: dailyStats.map(stat => stat.mp3_128_listeners || 0),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'MP3 256',
          data: dailyStats.map(stat => stat.mp3_256_listeners || 0),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'FLAC',
          data: dailyStats.map(stat => stat.flac_listeners || 0),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const listenersOverTimeData = {
    labels: dailyStats.map(stat => format(new Date(stat.date), 'MMM d')),
    datasets: [{
      label: 'Total Listeners',
      data: dailyStats.map(stat => stat.total_listeners),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#9CA3AF' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      },
      x: {
        ticks: { color: '#9CA3AF' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      }
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={3} className="text-2xl">Statistics</Heading>
          <div className="flex items-center gap-3 mt-2">
            <Body size="small" opacity="secondary">
              Real-time analytics and listener insights
            </Body>
            {lastUpdated && (
              <>
                <span className="text-text-tertiary">•</span>
                <Body size="small" opacity="secondary" className="flex items-center gap-2">
                  {isRefreshing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    `Last updated: ${format(lastUpdated, 'HH:mm:ss')}`
                  )}
                </Body>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh statistics"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Real-time Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Caption uppercase opacity="secondary" className="text-xs">Current Listeners</Caption>
            <span className="text-2xl">🎧</span>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <Body size="small" className="text-text-secondary">FM:</Body>
              <Heading level={3} className="text-2xl text-primary">{currentStats?.byStation?.fm || 0}</Heading>
            </div>
            <div className="flex items-center justify-between">
              <Body size="small" className="text-text-secondary">Folclor:</Body>
              <Heading level={3} className="text-2xl text-secondary">{currentStats?.byStation?.folclor || 0}</Heading>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Caption uppercase opacity="secondary" className="text-xs">Today's Total</Caption>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <Body size="small" className="text-text-secondary">FM:</Body>
              <Heading level={3} className="text-2xl text-primary">{todayStats?.fm_listeners || 0}</Heading>
            </div>
            <div className="flex items-center justify-between">
              <Body size="small" className="text-text-secondary">Folclor:</Body>
              <Heading level={3} className="text-2xl text-secondary">{todayStats?.folclor_listeners || 0}</Heading>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Caption uppercase opacity="secondary" className="text-xs">Article Views</Caption>
            <span className="text-2xl">📰</span>
          </div>
          <Heading level={2} className="text-4xl text-success">{todayStats?.article_views || 0}</Heading>
          <Body size="small" opacity="secondary" className="mt-1">Today</Body>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Station Distribution */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={4}>Listeners by Station</Heading>
            <select
              value={stationView}
              onChange={(e) => setStationView(e.target.value)}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
            >
              <option value="current">Current</option>
              <option value="overtime">Over Time</option>
            </select>
          </div>
          {stationView === 'current' ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#3B82F6]"></div>
                  <Body className="font-medium">FM</Body>
                </div>
                <Heading level={3} className="text-3xl text-primary">{currentStats?.byStation?.fm || 0}</Heading>
              </div>
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#8B5CF6]"></div>
                  <Body className="font-medium">Folclor</Body>
                </div>
                <Heading level={3} className="text-3xl text-secondary">{currentStats?.byStation?.folclor || 0}</Heading>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <Line data={getStationOverTimeData()} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Quality Distribution */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={4}>Stream Quality Preference</Heading>
            <select
              value={qualityView}
              onChange={(e) => setQualityView(e.target.value)}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
            >
              <option value="current">Current</option>
              <option value="overtime">Over Time</option>
            </select>
          </div>
          {qualityView === 'current' ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]"></div>
                  <Body className="font-medium">MP3 128</Body>
                </div>
                <Heading level={3} className="text-3xl text-[#10B981]">{currentStats?.byQuality?.mp3_128 || currentStats?.byQuality?.['128'] || 0}</Heading>
              </div>
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#F59E0B]"></div>
                  <Body className="font-medium">MP3 256</Body>
                </div>
                <Heading level={3} className="text-3xl text-[#F59E0B]">{currentStats?.byQuality?.mp3_256 || currentStats?.byQuality?.['256'] || 0}</Heading>
              </div>
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#EF4444]"></div>
                  <Body className="font-medium">FLAC</Body>
                </div>
                <Heading level={3} className="text-3xl text-[#EF4444]">{currentStats?.byQuality?.flac || 0}</Heading>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <Line data={getQualityOverTimeData()} options={chartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Listeners Over Time */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Heading level={4}>Listeners Over Time</Heading>
          <select
            value={selectedMonth.toISOString()}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="h-80">
          <Line data={listenersOverTimeData} options={chartOptions} />
        </div>
      </div>

      {/* Most Read Articles */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <Heading level={4} className="mb-4">Most Read Articles (Last 30 Days)</Heading>
        <div className="space-y-2">
          {topArticles.length > 0 ? (
            topArticles.map((article, index) => (
              <div
                key={article.article_id}
                className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <Body className="truncate">{article.article_title}</Body>
                </div>
                <Caption className="flex-shrink-0 ml-4 px-3 py-1 bg-primary/20 text-primary rounded-full font-semibold">
                  {article.view_count} views
                </Caption>
              </div>
            ))
          ) : (
            <Body opacity="secondary" className="text-center py-8">No article views yet</Body>
          )}
        </div>
      </div>
    </div>
  );
}
