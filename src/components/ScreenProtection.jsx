import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { ScreenProtectionContext } from '../contexts/ScreenProtectionContext';
import {
  bindScreenProtectionInput,
  createScreenProtectionController,
} from '../utils/screenProtection';

export default function ScreenProtection({ stationName, children }) {
  const { screenProtectionMode: mode, screenProtectionTimeoutMinutes: timeoutMinutes } =
    useSettings();
  const { pathname } = useLocation();
  const [stage, setStage] = useState('awake');
  const [videoPlaying, reportVideoPlayback] = useState(false);
  const uiRef = useRef(null);
  const overlayRef = useRef(null);
  const lastFocusRef = useRef(null);
  const active = stage !== 'awake';
  const excluded = pathname === '/admin' || pathname.startsWith('/admin/') || videoPlaying;

  useEffect(() => {
    const controller = createScreenProtectionController({
      mode,
      timeoutMinutes,
      onChange: setStage,
    });
    const visibility = () => controller.suspend(excluded || document.hidden);
    visibility();
    const unbind = mode === 'off' ? () => {} : bindScreenProtectionInput(controller);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      unbind();
      controller.destroy();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [mode, timeoutMinutes, excluded, pathname]);

  useLayoutEffect(() => {
    if (!active) return;
    const ui = uiRef.current;
    const previousFocus = lastFocusRef.current || document.activeElement;
    ui.setAttribute('inert', '');
    try {
      overlayRef.current?.focus({ preventScroll: true });
    } catch {
      overlayRef.current?.focus();
    }
    return () => {
      ui.removeAttribute('inert');
      const canFocus = element =>
        element?.isConnected &&
        element !== document.body &&
        !element.disabled &&
        element.getClientRects().length &&
        getComputedStyle(element).visibility !== 'hidden';
      const target = canFocus(previousFocus)
        ? previousFocus
        : [...ui.querySelectorAll('[data-dpad-default], button:not([disabled]), a[href]')].find(
            canFocus
          );
      if (target) {
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }
      }
    };
  }, [active]);

  const value = useMemo(() => ({ active, reportVideoPlayback }), [active]);
  return (
    <ScreenProtectionContext.Provider value={value}>
      <div
        ref={uiRef}
        onFocusCapture={event => {
          lastFocusRef.current = event.target;
        }}
        data-screen-protection-ui={active ? 'hidden' : undefined}
        aria-hidden={active ? true : undefined}
        style={active ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
      >
        {children}
      </div>
      {active && (
        <div
          ref={overlayRef}
          className="screen-protection-overlay"
          data-screen-protection-stage={stage}
          role="dialog"
          aria-modal="true"
          aria-label="Protecție ecran activă. Apăsați o tastă pentru revenire."
          tabIndex={-1}
        >
          {stage === 'text' && <MovingStationName stationName={stationName} />}
        </div>
      )}
    </ScreenProtectionContext.Provider>
  );
}

function MovingStationName({ stationName }) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    let quadrant = -1;
    const move = () => {
      const text = ref.current;
      if (!text) return;
      const { width, height } = text.getBoundingClientRect();
      const roomX = Math.max(0, window.innerWidth - width - 32);
      const roomY = Math.max(0, window.innerHeight - height - 32);
      quadrant = (quadrant + 1 + Math.floor(Math.random() * 3)) % 4;
      setPosition({
        left: 16 + roomX * ((quadrant % 2) * 0.65 + Math.random() * 0.35),
        top: 16 + roomY * (Math.floor(quadrant / 2) * 0.65 + Math.random() * 0.35),
      });
    };
    move();
    const timer = window.setInterval(move, 25000);
    window.addEventListener('resize', move);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', move);
    };
  }, [stationName]);
  return (
    <div
      ref={ref}
      className="screen-protection-station"
      style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
    >
      {stationName}
    </div>
  );
}
