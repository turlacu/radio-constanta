/**
 * BackgroundRenderer - Canvas-Based Gradient System
 * Eliminates banding using canvas with dithering
 * Better performance with GPU-accelerated rendering
 */

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const BackgroundRenderer = ({ visualState, performanceLevel }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!visualState) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });

    // Set canvas size to match container
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      drawGradient();
    };

    const drawGradient = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      // Add all gradient stops
      visualState.gradients.forEach(stop => {
        const color = hexToRgba(stop.color, stop.opacity);
        gradient.addColorStop(stop.position / 100, color);
      });

      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add dithering noise to prevent banding
      // High performance gets LESS dithering to avoid graininess
      // The cleaner the rendering, the less dithering needed
      if (performanceLevel !== 'low') {
        const isNightMode = visualState.isNight || visualState.stateKey?.includes('night');
        // Reduced dithering - too much causes visible grain
        const baseIntensity = performanceLevel === 'high' ? 2 : 3;
        const nightBoost = isNightMode ? 1 : 0;
        addDithering(ctx, width, height, baseIntensity + nightBoost);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualState, performanceLevel]);

  if (!visualState) {
    // Simple solid color fallback during initial load
    return (
      <div className="bg-layer" style={{ background: '#3B82F6' }} />
    );
  }

  return (
    <div className="bg-layer" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Canvas-based gradient */}
      <canvas
        ref={canvasRef}
        className="bg-layer"
        style={{
          imageRendering: 'high-quality',
          willChange: 'opacity'
        }}
      />

      {/* Subtle atmospheric darkening for storms - no gradient, no banding */}
      {visualState.pulseEffect && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Solid color, no gradient
            mixBlendMode: 'multiply',
            willChange: 'opacity'
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 0.5
          }}
        />
      )}

      {/* Lightning flash for storms */}
      {visualState.pulseEffect && performanceLevel !== 'low' && (
        <LightningFlash />
      )}

      {/* Fog atmosphere - removed backdrop-blur to prevent banding */}
      {visualState.blurEffect && performanceLevel !== 'low' && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)', // Very subtle white haze
            mixBlendMode: 'screen',
            willChange: 'opacity'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

/**
 * Add dithering to canvas to eliminate banding
 * This adds random noise to break up color bands
 */
function addDithering(ctx, width, height, intensity = 2) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Add random noise to each color channel
    const noise = (Math.random() - 0.5) * intensity;
    data[i] += noise;     // Red
    data[i + 1] += noise; // Green
    data[i + 2] += noise; // Blue
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Lightning Flash Component
 * Uses CSS gradient (acceptable here - brief flash, screen blend mode, high intensity hides any banding)
 */
const LightningFlash = () => {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.9) 0%, rgba(200, 220, 255, 0.4) 20%, transparent 50%)',
        mixBlendMode: 'screen',
        willChange: 'opacity'
      }}
      animate={{
        opacity: [0, 0, 0, 0, 0.8, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
        times: [0, 0.1, 0.12, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.5, 0.7, 0.8, 0.9, 0.95, 1]
      }}
    />
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
