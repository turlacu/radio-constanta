// Analytics utility for tracking user events
// Minimal tracking - only session counts, no personal data

const isDebugEnabled = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
const debugLog = (...args) => {
  if (isDebugEnabled) {
    console.log(...args);
  }
};

class AnalyticsClient {
  constructor() {
    this.userId = this.getUserId();
    this.sessionId = this.generateSessionId();
    this.heartbeatInterval = null;
    this.isTracking = false;
  }

  // Get or generate persistent user ID (stored in localStorage)
  getUserId() {
    if (typeof window === 'undefined' || !window.localStorage) {
      // Server-side or no localStorage support
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let userId = localStorage.getItem('radio_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('radio_user_id', userId);
      debugLog('[Analytics] Generated new user ID:', userId.substring(0, 20) + '...');
    }
    return userId;
  }

  // Generate a random session ID (no personal data)
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track stream start event
  async trackStreamStart(station, quality) {
    try {
      await fetch('/api/analytics/stream-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          sessionId: this.sessionId,
          event: 'start',
          station,
          quality
        })
      });

      // Start heartbeat to keep session alive
      this.startHeartbeat();
      this.isTracking = true;

      debugLog('[Analytics] Stream started:', { station, quality });
    } catch (error) {
      console.error('[Analytics] Error tracking stream start:', error);
    }
  }

  // Track stream stop event
  async trackStreamStop() {
    try {
      await fetch('/api/analytics/stream-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          event: 'stop'
        })
      });

      // Stop heartbeat
      this.stopHeartbeat();
      this.isTracking = false;

      debugLog('[Analytics] Stream stopped');
    } catch (error) {
      console.error('[Analytics] Error tracking stream stop:', error);
    }
  }

  // Track station switch
  async trackStationSwitch(newStation, quality) {
    if (!this.isTracking) {
      // If not currently tracking, start a new session
      return this.trackStreamStart(newStation, quality);
    }

    try {
      await fetch('/api/analytics/stream-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          sessionId: this.sessionId,
          event: 'switch_station',
          station: newStation,
          quality
        })
      });

      debugLog('[Analytics] Station switched:', newStation);
    } catch (error) {
      console.error('[Analytics] Error tracking station switch:', error);
    }
  }

  // Track quality change
  async trackQualityChange(station, newQuality) {
    if (!this.isTracking) {
      return; // Only track if already playing
    }

    try {
      await fetch('/api/analytics/stream-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          sessionId: this.sessionId,
          event: 'change_quality',
          station,
          quality: newQuality
        })
      });

      debugLog('[Analytics] Quality changed:', newQuality);
    } catch (error) {
      console.error('[Analytics] Error tracking quality change:', error);
    }
  }

  // Send heartbeat to keep session alive
  async sendHeartbeat() {
    try {
      const response = await fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        debugLog('[Analytics] Heartbeat sent successfully');
      } else {
        console.error('[Analytics] Heartbeat failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[Analytics] Error sending heartbeat:', error);
    }
  }

  // Start heartbeat interval (every 30 seconds)
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval

    // Send first heartbeat immediately
    this.sendHeartbeat();

    // Then send every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds

    debugLog('[Analytics] Heartbeat interval started (30s)');
  }

  // Stop heartbeat interval
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      debugLog('[Analytics] Stopping heartbeat interval');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Track article view
  async trackArticleView(articleId, title) {
    try {
      await fetch('/api/analytics/article-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          title
        })
      });

      debugLog('[Analytics] Article viewed:', title);
    } catch (error) {
      console.error('[Analytics] Error tracking article view:', error);
    }
  }

  // Cleanup on page unload
  cleanup() {
    if (this.isTracking) {
      // Use sendBeacon for reliable tracking on page unload
      navigator.sendBeacon('/api/analytics/stream-event', JSON.stringify({
        sessionId: this.sessionId,
        event: 'stop'
      }));
    }
    this.stopHeartbeat();
  }
}

// Create singleton instance
const analytics = new AnalyticsClient();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.cleanup();
  });
}

export default analytics;
