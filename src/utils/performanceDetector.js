/**
 * Performance Detector
 * Detects device capabilities and determines the appropriate performance level
 * Ensures smooth experience on mobile, desktop, and smart TV devices
 */

export class PerformanceDetector {
  constructor() {
    this.performanceLevel = 'medium';
    this.isMobile = false;
    this.isTablet = false;
    this.isTV = false;
    this.isLowEnd = false;

    this.detect();
  }

  detect() {
    // Detect device type
    this.detectDeviceType();

    // Detect performance capabilities
    this.detectPerformanceLevel();
  }

  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    // Check for TV
    this.isTV = /smart-?tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast\.tv/i.test(userAgent) ||
                width > 1920;

    // Check for mobile
    this.isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) &&
                    width < 768;

    // Check for tablet
    this.isTablet = (/android|ipad|tablet|playbook|silk/i.test(userAgent) ||
                     (navigator.maxTouchPoints > 1 && width >= 768)) &&
                    !this.isMobile;
  }

  detectPerformanceLevel() {
    let score = 0;

    // Device type scoring
    if (this.isTV) {
      score += 3; // TVs usually have good performance
    } else if (this.isTablet) {
      score += 2;
    } else if (this.isMobile) {
      score += 1;
    } else {
      score += 2; // Desktop
    }

    // Hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 2;
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 1;

    // Memory (if available)
    if (navigator.deviceMemory) {
      if (navigator.deviceMemory >= 8) score += 3;
      else if (navigator.deviceMemory >= 4) score += 2;
      else score += 1;
    } else {
      score += 2; // Default if not available
    }

    // Connection type (if available)
    if (navigator.connection) {
      const effectiveType = navigator.connection.effectiveType;
      if (effectiveType === '4g') score += 2;
      else if (effectiveType === '3g') score += 1;
    }

    // Screen resolution
    const pixels = window.innerWidth * window.innerHeight;
    if (pixels >= 3840 * 2160) score += 2; // 4K+
    else if (pixels >= 1920 * 1080) score += 1; // Full HD+

    // Battery status check (reduce performance on battery)
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (battery.charging === false && battery.level < 0.3) {
          // Low battery, reduce performance
          if (this.performanceLevel === 'high') {
            this.performanceLevel = 'medium';
          } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'low';
          }
        }
      });
    }

    // Determine performance level based on score
    if (score >= 10) {
      this.performanceLevel = 'high';
    } else if (score >= 6) {
      this.performanceLevel = 'medium';
    } else {
      this.performanceLevel = 'low';
      this.isLowEnd = true;
    }

    // Additional check: measure rendering performance
    this.measureRenderingPerformance();
  }

  measureRenderingPerformance() {
    // Simple FPS test
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;

    const measureFrame = (currentTime) => {
      frames++;

      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;

        // Adjust performance level based on FPS
        if (fps < 30 && this.performanceLevel === 'high') {
          this.performanceLevel = 'medium';
        } else if (fps < 20 && this.performanceLevel === 'medium') {
          this.performanceLevel = 'low';
          this.isLowEnd = true;
        }

        return; // Stop after first measurement
      }

      if (frames < 60) {
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  getPerformanceLevel() {
    return this.performanceLevel;
  }

  getDeviceInfo() {
    return {
      performanceLevel: this.performanceLevel,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isTV: this.isTV,
      isLowEnd: this.isLowEnd,
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  // Allow manual override for testing
  setPerformanceLevel(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.performanceLevel = level;
    }
  }
}

export default new PerformanceDetector();
