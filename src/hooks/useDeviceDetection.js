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
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    viewportScale: 1,
    isPortrait: true,
    supportsTouch: false,
    supportsHover: false,
    layoutMode: 'mobile-stack',
    showDesktopShell: false,
    compactDesktop: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const visualViewport = window.visualViewport;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const viewportWidth = Math.round(visualViewport?.width || width);
      const viewportHeight = Math.round(visualViewport?.height || height);
      const viewportScale = visualViewport?.scale || 1;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const effectiveWidth = Math.min(width, viewportWidth);
      const effectiveHeight = Math.min(height, viewportHeight);
      const isPortrait = effectiveHeight > effectiveWidth;

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
      const isLargeScreen = effectiveWidth >= 1920 && effectiveHeight >= 1080;
      const isTV = isTizenTV || isWebOSTV || isAndroidTV || isGenericTV || (isLargeScreen && !supportsTouch);

      let deviceType = 'mobile';

      if (isTV) {
        deviceType = 'tv';
      } else if (effectiveWidth >= 1024) {
        deviceType = 'desktop';
      } else if (effectiveWidth >= 768) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }

      const showDesktopShell = !isTV && !isPortrait && effectiveWidth >= 1180 && effectiveHeight >= 680;
      const compactDesktop = !showDesktopShell && !isPortrait && effectiveWidth >= 900 && effectiveHeight >= 560;
      const layoutMode = isTV
        ? 'tv-shell'
        : showDesktopShell
        ? 'desktop-shell'
        : compactDesktop
        ? 'landscape-stack'
        : 'mobile-stack';

      document.documentElement.style.setProperty('--app-width', `${effectiveWidth}px`);
      document.documentElement.style.setProperty('--app-height', `${effectiveHeight}px`);

      setDevice({
        type: deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isTV: deviceType === 'tv',
        screenWidth: width,
        screenHeight: height,
        viewportWidth: effectiveWidth,
        viewportHeight: effectiveHeight,
        devicePixelRatio,
        viewportScale,
        isPortrait,
        supportsTouch,
        supportsHover,
        layoutMode,
        showDesktopShell,
        compactDesktop,
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
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return device;
}
