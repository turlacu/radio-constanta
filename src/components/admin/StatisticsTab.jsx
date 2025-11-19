import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, subMonths, getDaysInMonth } from 'date-fns';
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
  const [periodStats, setPeriodStats] = useState([]); // Stats for period calculations
  const [topArticles, setTopArticles] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Current month
  const [stationPeriod, setStationPeriod] = useState(7); // 7 or 30 days
  const [qualityPeriod, setQualityPeriod] = useState(7); // 7 or 30 days

  // Fetch period stats (for 7/30 day calculations)
  const fetchPeriodStats = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get the maximum period needed (30 days)
      const maxPeriod = Math.max(stationPeriod, qualityPeriod);
      const periodEnd = format(new Date(), 'yyyy-MM-dd');
      const periodStart = format(subDays(new Date(), maxPeriod), 'yyyy-MM-dd');

      const periodRes = await fetch(`/api/analytics/admin/daily?start=${periodStart}&end=${periodEnd}`, { headers });
      if (periodRes.ok) {
        const data = await periodRes.json();
        setPeriodStats(data);
      }
    } catch (error) {
      console.error('Error fetching period statistics:', error);
    }
  };

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

      // Fetch period stats for period calculations
      await fetchPeriodStats();

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

  // Re-fetch period stats when period selection changes
  useEffect(() => {
    if (token && currentStats) {
      fetchPeriodStats();
    }
  }, [stationPeriod, qualityPeriod]);

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

  // Calculate aggregated stats for periods
  const getStationPeriodStats = () => {
    // Get last N days from period stats
    const lastNDays = periodStats.slice(-stationPeriod);

    // Sum up FM and Folclor listeners
    const fmTotal = lastNDays.reduce((sum, stat) => sum + (stat.fm_listeners || 0), 0);
    const folclorTotal = lastNDays.reduce((sum, stat) => sum + (stat.folclor_listeners || 0), 0);

    return { fm: fmTotal, folclor: folclorTotal };
  };

  const getQualityPeriodStats = () => {
    // Get last N days from period stats
    const lastNDays = periodStats.slice(-qualityPeriod);

    // Calculate quality stats per station using proportional distribution
    const stats = {
      fm_mp3_128: 0,
      fm_mp3_256: 0,
      fm_flac: 0,
      folclor_mp3_128: 0,
      folclor_mp3_256: 0,
      folclor_flac: 0
    };

    // Aggregate quality stats proportionally by station
    lastNDays.forEach(stat => {
      const totalListeners = stat.total_listeners || 0;
      if (totalListeners === 0) return;

      const fmRatio = (stat.fm_listeners || 0) / totalListeners;
      const folclorRatio = (stat.folclor_listeners || 0) / totalListeners;

      // Distribute quality counts proportionally
      stats.fm_mp3_128 += Math.round((stat.mp3_128_listeners || 0) * fmRatio);
      stats.fm_mp3_256 += Math.round((stat.mp3_256_listeners || 0) * fmRatio);
      stats.fm_flac += Math.round((stat.flac_listeners || 0) * fmRatio);

      stats.folclor_mp3_128 += Math.round((stat.mp3_128_listeners || 0) * folclorRatio);
      stats.folclor_mp3_256 += Math.round((stat.mp3_256_listeners || 0) * folclorRatio);
      stats.folclor_flac += Math.round((stat.flac_listeners || 0) * folclorRatio);
    });

    return stats;
  };

  // Fill missing days with complete month data
  const fillMissingDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const monthStart = startOfMonth(selectedMonth);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();

    // Create a map of existing data by day number
    const dataMap = {};
    dailyStats.forEach(stat => {
      const date = new Date(stat.date);
      const day = date.getDate();
      dataMap[day] = stat;
    });

    // Generate complete data for all days
    const completeData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (dataMap[day]) {
        completeData.push(dataMap[day]);
      } else {
        // Create empty data for missing days
        const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
        completeData.push({
          date: dateStr,
          fm_listeners: 0,
          folclor_listeners: 0,
          total_listeners: 0
        });
      }
    }

    return completeData;
  };

  const completeMonthData = fillMissingDays();

  const listenersOverTimeData = {
    labels: completeMonthData.map((_, index) => (index + 1).toString()),
    datasets: [
      {
        label: 'FM',
        data: completeMonthData.map(stat => stat.fm_listeners || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1
      },
      {
        label: 'Folclor',
        data: completeMonthData.map(stat => stat.folclor_listeners || 0),
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        borderWidth: 1
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} listeners`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9CA3AF' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      },
      x: {
        ticks: {
          color: '#9CA3AF',
          font: { size: 10 },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0
        },
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
            <svg className="w-6 h-6 text-primary" viewBox="0 0 256 256" fill="currentColor">
              <path d="M201.89,62.11a104,104,0,1,0,0,131.78,8,8,0,1,0-11.78-10.89,88,88,0,1,1,0-110,8,8,0,1,0,11.78-10.89ZM232,128a104.11,104.11,0,0,1-104,104,8,8,0,0,1,0-16,88.1,88.1,0,0,0,88-88,8,8,0,0,1,16,0Zm-104,0a24,24,0,1,1-24-24A24,24,0,0,1,128,128Z"/>
            </svg>
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
            <svg className="w-6 h-6 text-secondary" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"/>
            </svg>
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
            <svg className="w-6 h-6 text-success" viewBox="0 0 256 256" fill="currentColor">
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z"/>
            </svg>
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
              value={stationPeriod}
              onChange={(e) => setStationPeriod(Number(e.target.value))}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#3B82F6]"></div>
                <Body className="font-medium">FM</Body>
              </div>
              <Heading level={3} className="text-3xl text-primary">{getStationPeriodStats().fm}</Heading>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#8B5CF6]"></div>
                <Body className="font-medium">Folclor</Body>
              </div>
              <Heading level={3} className="text-3xl text-secondary">{getStationPeriodStats().folclor}</Heading>
            </div>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={4}>Stream Quality Preference</Heading>
            <select
              value={qualityPeriod}
              onChange={(e) => setQualityPeriod(Number(e.target.value))}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          <div className="space-y-3 py-4">
            {/* FM Station */}
            <div>
              <Body size="small" className="text-text-tertiary mb-2 uppercase text-xs font-semibold">FM</Body>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                    <Body size="small" className="font-medium">MP3 128</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#10B981]">{getQualityPeriodStats().fm_mp3_128}</Heading>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                    <Body size="small" className="font-medium">MP3 256</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#F59E0B]">{getQualityPeriodStats().fm_mp3_256}</Heading>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                    <Body size="small" className="font-medium">FLAC</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#EF4444]">{getQualityPeriodStats().fm_flac}</Heading>
                </div>
              </div>
            </div>
            {/* Folclor Station */}
            <div className="pt-2">
              <Body size="small" className="text-text-tertiary mb-2 uppercase text-xs font-semibold">Folclor</Body>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                    <Body size="small" className="font-medium">MP3 128</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#10B981]">{getQualityPeriodStats().folclor_mp3_128}</Heading>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                    <Body size="small" className="font-medium">MP3 256</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#F59E0B]">{getQualityPeriodStats().folclor_mp3_256}</Heading>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                    <Body size="small" className="font-medium">FLAC</Body>
                  </div>
                  <Heading level={5} className="text-xl text-[#EF4444]">{getQualityPeriodStats().folclor_flac}</Heading>
                </div>
              </div>
            </div>
          </div>
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
          <Bar data={listenersOverTimeData} options={barChartOptions} />
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
