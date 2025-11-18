// Analytics utility for tracking user events
// Minimal tracking - only session counts, no personal data

class AnalyticsClient {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.heartbeatInterval = null;
    this.isTracking = false;
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
          sessionId: this.sessionId,
          event: 'start',
          station,
          quality
        })
      });

      // Start heartbeat to keep session alive
      this.startHeartbeat();
      this.isTracking = true;

      console.log('[Analytics] Stream started:', { station, quality });
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

      console.log('[Analytics] Stream stopped');
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
          sessionId: this.sessionId,
          event: 'switch_station',
          station: newStation,
          quality
        })
      });

      console.log('[Analytics] Station switched:', newStation);
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
          sessionId: this.sessionId,
          event: 'change_quality',
          station,
          quality: newQuality
        })
      });

      console.log('[Analytics] Quality changed:', newQuality);
    } catch (error) {
      console.error('[Analytics] Error tracking quality change:', error);
    }
  }

  // Send heartbeat to keep session alive
  async sendHeartbeat() {
    try {
      await fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });
    } catch (error) {
      console.error('[Analytics] Error sending heartbeat:', error);
    }
  }

  // Start heartbeat interval (every 30 seconds)
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds
  }

  // Stop heartbeat interval
  stopHeartbeat() {
    if (this.heartbeatInterval) {
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

      console.log('[Analytics] Article viewed:', title);
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
