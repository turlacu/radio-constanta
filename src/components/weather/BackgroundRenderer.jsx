/** Static weather colors with lightweight atmospheric overlays. */
import { motion } from 'framer-motion';

export const BackgroundRenderer = ({ visualState, performanceLevel, profile }) => {
  if (!visualState) return <div className="absolute inset-0 bg-bg-primary" />;
  const background = `linear-gradient(135deg, ${visualState.gradients
    .map(stop => `${hexToRgba(stop.color, stop.opacity)} ${stop.position}%`)
    .join(', ')})`;
  const effects = performanceLevel !== 'low';
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background }}>
      {/* A tiny reusable texture replaces full-screen pixel read/write passes. */}
      {effects && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'url(/weather-noise.png)', opacity: 0.025 }}
        />
      )}
      {visualState.pulseEffect && profile.static && (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.035)' }} />
      )}
      {visualState.pulseEffect && !profile.static && (
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
        />
      )}
      {visualState.pulseEffect && effects && !profile.static && <LightningFlash />}
      {visualState.blurEffect && effects && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.015)' }}
        />
      )}
      {visualState.sunGlow?.enabled && effects && (
        <SunGlow config={visualState.sunGlow} staticMode={profile.static} />
      )}
    </div>
  );
};

/**
 * Lightning Flash Component
 * Uses CSS gradient (acceptable here - brief flash, screen blend mode, high intensity hides any banding)
 */
const LightningFlash = () => {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.9) 0%, rgba(200, 220, 255, 0.4) 20%, transparent 50%)',
        mixBlendMode: 'screen',
        willChange: 'opacity',
      }}
      animate={{
        opacity: [0, 0, 0, 0, 0.8, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
        times: [0, 0.1, 0.12, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.5, 0.7, 0.8, 0.9, 0.95, 1],
      }}
    />
  );
};

/**
 * Sun Glow Component
 * Renders a soft, animated sun glow with halos for lens flare effect
 */
const SunGlow = ({ config, staticMode }) => {
  const { position, colors, radius, halos, animate, pulseScale, pulseDuration } = config;

  // Create the main sun glow gradient
  const mainGlowGradient = `radial-gradient(circle at ${position.x}% ${position.y}%,
    ${colors[0]} 0%,
    ${colors[1]} ${(radius.inner / radius.outer) * 40}%,
    ${colors[2]} ${(radius.inner / radius.outer) * 70}%,
    transparent 100%)`;

  // Create halo gradients
  const haloElements = halos.map((halo, index) => (
    <div
      key={`halo-${index}`}
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at ${position.x}% ${position.y}%,
          rgba(255, 255, 255, ${halo.opacity}) 0%,
          rgba(255, 255, 255, ${halo.opacity * 0.5}) 30%,
          transparent ${(halo.radius / 500) * 100}%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  ));

  return (
    <>
      {/* Main sun glow with animation */}
      {staticMode ? (
        <div
          className="absolute inset-0"
          style={{ background: mainGlowGradient, pointerEvents: 'none' }}
        />
      ) : (
        <motion.div
          className="absolute inset-0"
          style={{
            background: mainGlowGradient,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
          animate={
            animate && !staticMode
              ? {
                  scale: [1, 1 + pulseScale, 1],
                }
              : {}
          }
          transition={
            animate && !staticMode
              ? {
                  duration: pulseDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        />
      )}

      {/* Halo layers */}
      {haloElements}
    </>
  );
};

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex, opacity = 1) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default BackgroundRenderer;
