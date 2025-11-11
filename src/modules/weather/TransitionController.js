/**
 * TransitionController
 * Handles smooth crossfades and transitions between weather states
 * Centralized control for all animation transitions in the app
 *
 * Features:
 * - Smooth crossfades between weather states
 * - Custom easing functions for premium feel
 * - Performance-aware transition configurations
 * - Coordinated timing for multiple animated elements
 */

/**
 * Transition configurations for different performance levels
 * Fast, snappy transitions for responsive feel
 */
export const TRANSITION_CONFIG = {
  high: {
    duration: 0.8,
    easingCurve: [0.4, 0, 0.2, 1], // Smooth easeInOut
    staggerDelay: 0.05,
    enableBlur: true,
    enableScale: true
  },
  medium: {
    duration: 0.6,
    easingCurve: [0.4, 0, 0.2, 1], // Standard easeInOut
    staggerDelay: 0.05,
    enableBlur: true,
    enableScale: true
  },
  low: {
    duration: 0.4,
    easingCurve: [0.25, 0.1, 0.25, 1], // Fast easeInOut
    staggerDelay: 0,
    enableBlur: false,
    enableScale: false
  }
};

/**
 * Animation variants for Framer Motion components
 */
export const ANIMATION_VARIANTS = {
  // Background layer transitions
  backgroundLayer: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Particle layer transitions
  particleLayer: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  },

  // Aurora layer transitions
  auroraLayer: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },

  // UI element fade transitions
  uiFade: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
  }
};

/**
 * Get transition configuration based on performance level
 */
export function getTransitionConfig(performanceLevel = 'medium', type = 'default') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  const baseConfig = {
    duration: config.duration,
    ease: config.easingCurve
  };

  // Type-specific adjustments
  switch (type) {
    case 'fast':
      return {
        ...baseConfig,
        duration: config.duration * 0.7
      };

    case 'slow':
      return {
        ...baseConfig,
        duration: config.duration * 1.5
      };

    case 'crossfade':
      return {
        ...baseConfig,
        duration: config.duration * 1.2
      };

    default:
      return baseConfig;
  }
}

/**
 * Get stagger configuration for multiple elements
 */
export function getStaggerConfig(performanceLevel = 'medium') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  return {
    staggerChildren: config.staggerDelay,
    delayChildren: config.staggerDelay * 0.5
  };
}

/**
 * Smooth crossfade transition preset
 * Perfect for weather state changes
 */
export function getCrossfadeTransition(performanceLevel = 'medium') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: config.duration,
      ease: config.easingCurve
    }
  };
}

/**
 * Scale and fade transition preset
 * Used for dramatic weather changes (e.g., entering storm)
 */
export function getScaleFadeTransition(performanceLevel = 'medium') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  if (!config.enableScale) {
    return getCrossfadeTransition(performanceLevel);
  }

  return {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: {
      duration: config.duration,
      ease: config.easingCurve
    }
  };
}

/**
 * Slide and fade transition preset
 * Used for UI elements
 */
export function getSlideFadeTransition(direction = 'up', performanceLevel = 'medium') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  const offsets = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  const offset = offsets[direction] || offsets.up;

  return {
    initial: { opacity: 0, ...offset },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...offset },
    transition: {
      duration: config.duration * 0.8,
      ease: config.easingCurve
    }
  };
}

/**
 * Blur transition preset
 * Used for fog and depth effects
 */
export function getBlurTransition(performanceLevel = 'medium') {
  const config = TRANSITION_CONFIG[performanceLevel] || TRANSITION_CONFIG.medium;

  if (!config.enableBlur) {
    return getCrossfadeTransition(performanceLevel);
  }

  return {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: {
      duration: config.duration * 1.3,
      ease: config.easingCurve
    }
  };
}

/**
 * Coordinate multiple transitions
 * Ensures all layers transition harmoniously
 */
export class TransitionCoordinator {
  constructor(performanceLevel = 'medium') {
    this.performanceLevel = performanceLevel;
    this.activeTransitions = new Set();
  }

  /**
   * Start a coordinated transition
   */
  startTransition(transitionId) {
    this.activeTransitions.add(transitionId);
    return () => this.endTransition(transitionId);
  }

  /**
   * End a transition
   */
  endTransition(transitionId) {
    this.activeTransitions.delete(transitionId);
  }

  /**
   * Check if any transitions are active
   */
  isTransitioning() {
    return this.activeTransitions.size > 0;
  }

  /**
   * Get delay for staggered element
   */
  getStaggerDelay(index) {
    const config = TRANSITION_CONFIG[this.performanceLevel] || TRANSITION_CONFIG.medium;
    return index * config.staggerDelay;
  }

  /**
   * Update performance level
   */
  setPerformanceLevel(level) {
    this.performanceLevel = level;
  }
}

/**
 * Default export - singleton coordinator instance
 */
export default new TransitionCoordinator();
