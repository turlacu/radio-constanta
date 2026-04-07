import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

const BAR_COUNT = 29;

export default function SpectrumVisualizer({
  analyserRef,
  isPlaying,
  className
}) {
  const canvasRef = useRef(null);
  const smoothedValuesRef = useRef(Array(BAR_COUNT).fill(0.08));

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
      const gap = 1.1;
      const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount);

      context.clearRect(0, 0, width, height);
      context.fillStyle = `rgba(255,255,255,${alpha})`;

      values.forEach((value, index) => {
        const normalizedHeight = Math.max(3, Math.min(height, value * height * 1.7));
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

        const overallEnergy = buffer.reduce((sum, value) => sum + value, 0) / (buffer.length * 255 || 1);
        const visualValues = Array.from({ length: BAR_COUNT }, (_, index) => {
          const start = Math.floor(Math.pow(index / BAR_COUNT, 1.85) * (buffer.length - 1));
          const end = Math.max(start + 1, Math.floor(Math.pow((index + 1) / BAR_COUNT, 1.85) * buffer.length));
          const slice = buffer.slice(start, end);
          const sliceAverage = slice.length
            ? slice.reduce((sum, value) => sum + value, 0) / (slice.length * 255)
            : 0;
          const normalizedSlice = Math.pow(sliceAverage, 0.92);
          const spectralTilt = Math.max(0.4, 0.86 - index * 0.012);
          const energyScale = 0.52 + overallEnergy * 0.24;
          const trailingMotion = overallEnergy * 0.08 * (0.45 + Math.sin(performance.now() / 260 + index * 0.75) * 0.55);
          return Math.max(0.04, Math.min(0.78, normalizedSlice * spectralTilt * energyScale + trailingMotion));
        }).map((value, index) => {
          const previous = smoothedValuesRef.current[index] || 0.08;
          const smoothed = previous * 0.68 + value * 0.32;
          smoothedValuesRef.current[index] = smoothed;
          return smoothed;
        });

        drawBars(visualValues, 0.92);
      } else {
        idlePhase += 0.06;
        const idleValues = Array.from({ length: BAR_COUNT }, (_, index) => {
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
      className={clsx(className || 'h-14 w-full')}
      aria-hidden="true"
    />
  );
}
