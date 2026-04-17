import { useEffect } from 'react';

const DIRECTION_KEYS = {
  ArrowUp: 'up',
  Up: 'up',
  38: 'up',
  ArrowDown: 'down',
  Down: 'down',
  40: 'down',
  ArrowLeft: 'left',
  Left: 'left',
  37: 'left',
  ArrowRight: 'right',
  Right: 'right',
  39: 'right',
};

const ACTIVATE_KEYS = new Set([
  'Enter',
  'OK',
  'Select',
  'NumpadEnter',
  13,
]);

const BACK_KEYS = new Set([
  'Escape',
  'Backspace',
  'BrowserBack',
  'GoBack',
  'Back',
  8,
  27,
  166,
  461,
  10009,
]);

const FOCUSABLE_SELECTOR = [
  '[data-dpad="true"]',
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getEventCode = (event) => {
  if (typeof event.keyCode === 'number') return event.keyCode;
  if (typeof event.which === 'number') return event.which;
  return null;
};

const isVisible = (el) => {
  if (!el || !(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (style.pointerEvents === 'none') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (rect.bottom < 0 || rect.right < 0) return false;
  if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false;
  return true;
};

const getRectCenter = (rect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

const getDirectionFromEvent = (event) => {
  const code = getEventCode(event);
  return DIRECTION_KEYS[event.key] || DIRECTION_KEYS[event.code] || DIRECTION_KEYS[code] || null;
};

const isActivationEvent = (event) => {
  const code = getEventCode(event);
  return ACTIVATE_KEYS.has(event.key) || ACTIVATE_KEYS.has(event.code) || ACTIVATE_KEYS.has(code);
};

const isBackEvent = (event) => {
  const code = getEventCode(event);
  return BACK_KEYS.has(event.key) || BACK_KEYS.has(event.code) || BACK_KEYS.has(code);
};

const getFocusableCandidates = (scopeRoot) => {
  const root = scopeRoot || document;
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((el) => el instanceof HTMLElement)
    .filter((el) => isVisible(el));
};

const isTextInput = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
};

const pickBestDirectionalCandidate = (currentEl, candidates, direction) => {
  if (!currentEl || !candidates.length) return null;
  const fromRect = currentEl.getBoundingClientRect();
  const from = getRectCenter(fromRect);

  const directional = [];
  for (const candidate of candidates) {
    if (candidate === currentEl) continue;
    const rect = candidate.getBoundingClientRect();
    const center = getRectCenter(rect);
    const dx = center.x - from.x;
    const dy = center.y - from.y;

    if (direction === 'left' && dx >= -4) continue;
    if (direction === 'right' && dx <= 4) continue;
    if (direction === 'up' && dy >= -4) continue;
    if (direction === 'down' && dy <= 4) continue;

    const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    directional.push({ candidate, score: primary * 1000 + secondary });
  }

  if (!directional.length) return null;
  directional.sort((a, b) => a.score - b.score);
  return directional[0].candidate;
};

const focusElement = (el) => {
  if (!el || !(el instanceof HTMLElement)) return false;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  return document.activeElement === el;
};

export function useTvDpadNavigation({
  enabled,
  showSettingsModal,
  showInlineNews,
  onCloseSettings,
  onCloseInlineNews,
  onNavigateHome,
  onNavigateBack,
}) {
  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove('tv-dpad-active');
      return undefined;
    }

    document.body.classList.add('tv-dpad-active');

    const getActiveScopeRoot = () => {
      if (showSettingsModal) {
        const modalScope = document.querySelector('[data-dpad-scope="settings-modal"]');
        if (modalScope instanceof HTMLElement) return modalScope;
      }
      return document;
    };

    const focusDefault = () => {
      const scopeRoot = getActiveScopeRoot();
      const explicitDefault = scopeRoot.querySelector('[data-dpad-default="play"], [data-dpad-default="true"]');
      if (explicitDefault instanceof HTMLElement && isVisible(explicitDefault)) {
        return focusElement(explicitDefault);
      }

      const candidates = getFocusableCandidates(scopeRoot);
      if (!candidates.length) return false;
      return focusElement(candidates[0]);
    };

    const moveFocus = (direction) => {
      const scopeRoot = getActiveScopeRoot();
      const candidates = getFocusableCandidates(scopeRoot);
      if (!candidates.length) return;

      const current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

      if (!current || !candidates.includes(current)) {
        focusDefault();
        return;
      }

      const currentGroup = current.closest('[data-dpad-group]')?.getAttribute('data-dpad-group') || null;
      const sameGroup = currentGroup
        ? candidates.filter((el) => el.closest('[data-dpad-group]')?.getAttribute('data-dpad-group') === currentGroup)
        : candidates;

      let next = pickBestDirectionalCandidate(current, sameGroup, direction);
      if (next) {
        focusElement(next);
        return;
      }

      if (
        showInlineNews
        && (direction === 'left' || direction === 'right')
        && (currentGroup === 'player' || currentGroup === 'news')
      ) {
        const oppositeGroup = currentGroup === 'player' ? 'news' : 'player';
        const oppositeCandidates = candidates.filter(
          (el) => el.closest('[data-dpad-group]')?.getAttribute('data-dpad-group') === oppositeGroup
        );
        next = pickBestDirectionalCandidate(current, oppositeCandidates, direction)
          || oppositeCandidates[0]
          || null;
        if (next) {
          focusElement(next);
          return;
        }
      }

      next = pickBestDirectionalCandidate(current, candidates, direction);
      if (next) {
        focusElement(next);
      }
    };

    const activateFocused = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (active.hasAttribute('disabled')) return;

      if (active.tagName.toLowerCase() === 'a') {
        active.click();
        return;
      }

      if (active.tagName.toLowerCase() === 'button' || active.getAttribute('role') === 'button') {
        active.click();
        return;
      }

      if (active.getAttribute('tabindex') !== null) {
        active.click();
      }
    };

    const handleBack = () => {
      if (showSettingsModal) {
        onCloseSettings?.();
        return;
      }

      const articleBack = document.querySelector('[data-dpad-action="news-back"]');
      if (articleBack instanceof HTMLElement && isVisible(articleBack)) {
        articleBack.click();
        return;
      }

      if (showInlineNews) {
        onCloseInlineNews?.();
        return;
      }

      if (onNavigateBack?.() === false) {
        onNavigateHome?.();
      }
    };

    const handleKeyDown = (event) => {
      if (!enabled) return;
      if (event.defaultPrevented) return;

      const active = document.activeElement;
      const direction = getDirectionFromEvent(event);
      if (direction) {
        if (isTextInput(active)) return;
        event.preventDefault();
        moveFocus(direction);
        return;
      }

      if (isActivationEvent(event)) {
        if (isTextInput(active)) return;
        event.preventDefault();
        activateFocused();
        return;
      }

      if (isBackEvent(event)) {
        event.preventDefault();
        handleBack();
      }
    };

    const bootFocusTimer = window.setTimeout(() => {
      const active = document.activeElement;
      const hasValidFocus = active instanceof HTMLElement && isVisible(active);
      if (!hasValidFocus || active === document.body) {
        focusDefault();
      }
    }, 120);

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.clearTimeout(bootFocusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('tv-dpad-active');
    };
  }, [
    enabled,
    showSettingsModal,
    showInlineNews,
    onCloseSettings,
    onCloseInlineNews,
    onNavigateHome,
    onNavigateBack,
  ]);
}

