/**
 * AuroraLayer - Canvas-Based
 * Renders aurora using canvas with smooth gradients
 * No CSS gradient banding, better performance
 */

import { useEffect, useRef } from 'react';

export const AuroraLayer = ({ visualState, performanceLevel }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!visualState?.aurora?.enabled || performanceLevel === 'low') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const auroraConfig = visualState.aurora;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const drawAurora = (time) => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      // Simple, gentle animation on high performance
      const animationProgress = performanceLevel === 'high' ? Math.sin(time * 0.00005) * 0.01 : 0;

      // Parse colors from hex
      const colors = auroraConfig.colors.map(hexToRgb);

      // Main aurora glow
      const gradient1 = ctx.createRadialGradient(
        width * (0.5 + animationProgress),
        height * 0.1,
        0,
        width * 0.5,
        height * 0.4,
        width * 0.6
      );

      gradient1.addColorStop(0, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, ${auroraConfig.intensity * 0.3})`);
      gradient1.addColorStop(0.4, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, ${auroraConfig.intensity * 0.15})`);
      gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);

      // Add dithering to aurora to prevent circular banding
      addAuroraDithering(ctx, width, height, 2);

      // Animation frame loop (high performance only)
      if (performanceLevel === 'high') {
        timeRef.current = time;
        animationFrameRef.current = requestAnimationFrame(drawAurora);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial draw
    drawAurora(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualState, performanceLevel]);

  if (!visualState?.aurora?.enabled || performanceLevel === 'low') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        mixBlendMode: 'screen',
        filter: 'blur(50px)', // Consistent blur regardless of performance
        // No global opacity - intensity controlled in canvas drawing
      }}
    />
  );
};

/**
 * Add dithering to aurora canvas to eliminate circular banding
 */
function addAuroraDithering(ctx, width, height, intensity = 2) {
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
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

export default AuroraLayer;
