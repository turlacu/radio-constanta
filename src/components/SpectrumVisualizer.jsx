import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export default function SpectrumVisualizer({
  analyserRef,
  isPlaying,
  className
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    let animationFrameId = null;
    let idlePhase = 0;

    const resizeCanvas = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawBars = (values, alpha = 0.9) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const barCount = values.length;
      const gap = 2;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

      context.clearRect(0, 0, width, height);
      context.fillStyle = `rgba(255,255,255,${alpha})`;

      values.forEach((value, index) => {
        const normalizedHeight = Math.max(3, value * height);
        const x = index * (barWidth + gap);
        const y = height - normalizedHeight;
        context.fillRect(x, y, barWidth, normalizedHeight);
      });
    };

    const render = () => {
      resizeCanvas();

      const analyser = analyserRef?.current;
      if (isPlaying && analyser) {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);

        const visualValues = Array.from({ length: 32 }, (_, index) => {
          const sampleIndex = Math.min(buffer.length - 1, index * 2);
          return Math.max(0.08, buffer[sampleIndex] / 255);
        });

        drawBars(visualValues, 0.92);
      } else {
        idlePhase += 0.06;
        const idleValues = Array.from({ length: 32 }, (_, index) => {
          return 0.05 + Math.max(0, Math.sin(idlePhase + index * 0.28)) * 0.08;
        });

        drawBars(idleValues, 0.36);
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyserRef, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className={clsx('h-14 w-full', className)}
      aria-hidden="true"
    />
  );
}
