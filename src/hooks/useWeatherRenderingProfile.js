import { useScreenProtection } from '../contexts/ScreenProtectionContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createFrameMonitor,
  DESKTOP_PROFILE,
  isTvBrowser,
  STATIC_PROFILE,
  TV_PROFILES,
} from '../modules/weather/rendering';

// Survives weather component unmounts (playback, route and settings changes).
let sessionTier = 0;

export function useWeatherRenderingProfile() {
  const { active: screenProtectionActive } = useScreenProtection();
  const [isTV] = useState(() => isTvBrowser(navigator.userAgent));
  const [hidden, setHidden] = useState(() => document.hidden);
  const [tier, setTier] = useState(() => sessionTier);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const downgrade = useCallback(() => {
    sessionTier = Math.min(2, sessionTier + 1);
    setTier(sessionTier);
  }, []);
  const fail = useCallback(() => {
    sessionTier = 2;
    setTier(2);
  }, []);
  const monitor = useMemo(() => createFrameMonitor(downgrade), [downgrade]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(query.matches);
    // Older TV engines only implement addListener.
    if (query.addEventListener) query.addEventListener('change', change);
    else query.addListener(change);
    change();
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', change);
      else query.removeListener(change);
    };
  }, []);

  useEffect(() => {
    const change = () => {
      setHidden(document.hidden);
    };
    change();
    document.addEventListener('visibilitychange', change);
    return () => {
      document.removeEventListener('visibilitychange', change);
    };
  }, []);

  const profile =
    screenProtectionActive || reducedMotion || hidden || tier >= 2
      ? STATIC_PROFILE
      : isTV
        ? TV_PROFILES[tier]
        : DESKTOP_PROFILE;
  useEffect(() => {
    const root = document.documentElement;
    if (isTV || profile.static) root.dataset.weatherRendering = profile.name;
    return () => {
      delete root.dataset.weatherRendering;
    };
  }, [isTV, profile]);

  return {
    profile,
    onFrame: isTV ? monitor.frame : undefined,
    onReset: monitor.reset,
    onError: fail,
  };
}
