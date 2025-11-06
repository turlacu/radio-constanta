import { useState, useEffect } from 'react';

/**
 * Device detection hook that identifies device type and provides responsive utilities
 * Detects: mobile, tablet, desktop, or TV based on user agent and screen size
 */
export function useDeviceDetection() {
  const [device, setDevice] = useState({
    type: 'mobile', // mobile | tablet | desktop | tv
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isTV: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    isPortrait: true,
    supportsTouch: false,
    supportsHover: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;

      // Touch support detection
      const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Hover support detection (important for TV detection)
      const supportsHover = window.matchMedia('(hover: hover)').matches;

      // Smart TV detection (Tizen, WebOS, Android TV, etc.)
      const isTizenTV = /tizen/i.test(ua) && /tv/i.test(ua);
      const isWebOSTV = /webos/i.test(ua) && /tv/i.test(ua);
      const isAndroidTV = /android/i.test(ua) && /tv/i.test(ua);
      const isGenericTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|nettv/i.test(ua);

      // Large screen without touch is likely TV or desktop
      const isLargeScreen = width >= 1920 && height >= 1080;
      const isTV = isTizenTV || isWebOSTV || isAndroidTV || isGenericTV || (isLargeScreen && !supportsTouch);

      let deviceType = 'mobile';

      if (isTV) {
        deviceType = 'tv';
      } else if (width >= 1024) {
        deviceType = 'desktop';
      } else if (width >= 768) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }

      setDevice({
        type: deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isTV: deviceType === 'tv',
        screenWidth: width,
        screenHeight: height,
        isPortrait,
        supportsTouch,
        supportsHover,
      });
    };

    // Detect on mount
    detectDevice();

    // Re-detect on resize and orientation change
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return device;
}
