/** A small, cached soft glow. Motion only composites the cached canvas. */
import { useEffect, useRef } from 'react';
import { getCanvasSize } from '../../modules/weather/rendering';

export const AuroraLayer = ({ visualState, performanceLevel, profile, onError }) => {
  const canvasRef = useRef(null);
  const enabled = visualState?.aurora?.enabled && performanceLevel !== 'low';

  useEffect(() => {
    if (!enabled || profile.static) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Aurora canvas unavailable');
        const rect = canvas.getBoundingClientRect();
        const size = getCanvasSize(rect.width, rect.height, 1, { maxWidth: 640, maxHeight: 360 });
        canvas.width = size.width;
        canvas.height = size.height;
        const { colors, intensity } = visualState.aurora;
        const gradient = ctx.createRadialGradient(
          size.width * 0.5,
          size.height * 0.1,
          0,
          size.width * 0.5,
          size.height * 0.4,
          size.width * 0.6
        );
        gradient.addColorStop(0, rgba(colors[0], intensity * 0.3));
        gradient.addColorStop(0.4, rgba(colors[1], intensity * 0.15));
        gradient.addColorStop(1, rgba(colors[1], 0));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size.width, size.height);
      } catch (error) {
        onError(error);
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => {
      window.removeEventListener('resize', draw);
      canvas.width = canvas.height = 1;
    };
  }, [enabled, visualState, profile, onError]);

  if (!enabled) return null;
  if (profile.static) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, ${rgba(visualState.aurora.colors[0], visualState.aurora.intensity * 0.3)}, transparent 70%)`,
        }}
      />
    );
  }
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${profile.name !== 'full' || performanceLevel === 'high' ? 'weather-aurora-drift' : ''}`}
      style={{ opacity: 1 }}
    />
  );
};

function rgba(hex, alpha) {
  return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${alpha})`;
}

export default AuroraLayer;
