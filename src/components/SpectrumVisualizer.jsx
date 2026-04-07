import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

const BAR_COUNT = 29;
const MIN_FREQUENCY = 40;
const MAX_FREQUENCY = 14000;

export default function SpectrumVisualizer({
  analyserRef,
  isPlaying,
  className,
  style,
  tone = 'light'
}) {
  const canvasRef = useRef(null);
  const smoothedValuesRef = useRef(Array(BAR_COUNT).fill(0.08));
  const peakValuesRef = useRef(Array(BAR_COUNT).fill(0.1));

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
      const gap = 1.25;
      const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount);
      const baseColor = tone === 'dark' ? '17,24,39' : '255,255,255';

      context.clearRect(0, 0, width, height);
      context.fillStyle = `rgba(${baseColor},${alpha})`;

      values.forEach((value, index) => {
        const normalizedHeight = Math.max(2, Math.min(height, value * height * 1.08));
        const x = index * (barWidth + gap);
        const y = height - normalizedHeight;
        context.fillRect(x, y, barWidth, normalizedHeight);

        const peak = Math.max(2, Math.min(height, (peakValuesRef.current[index] || value) * height * 1.08));
        context.fillStyle = `rgba(${baseColor},${alpha * 0.68})`;
        context.fillRect(x, Math.max(0, height - peak - 1), barWidth, 1.5);
        context.fillStyle = `rgba(${baseColor},${alpha})`;
      });
    };

    const getFrequencyWindow = (index, sampleRate, binCount) => {
      const minLog = Math.log10(MIN_FREQUENCY);
      const maxLog = Math.log10(MAX_FREQUENCY);
      const startFrequency = 10 ** (minLog + ((maxLog - minLog) * index) / BAR_COUNT);
      const endFrequency = 10 ** (minLog + ((maxLog - minLog) * (index + 1)) / BAR_COUNT);
      const nyquist = sampleRate / 2;

      const start = Math.max(0, Math.floor((startFrequency / nyquist) * binCount));
      const end = Math.min(binCount, Math.max(start + 1, Math.ceil((endFrequency / nyquist) * binCount)));

      return [start, end];
    };

    const render = () => {
      resizeCanvas();

      const analyser = analyserRef?.current;
      if (isPlaying && analyser) {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);

        const sampleRate = analyser.context.sampleRate || 48000;
        const visualValues = Array.from({ length: BAR_COUNT }, (_, index) => {
          const [start, end] = getFrequencyWindow(index, sampleRate, buffer.length);
          const slice = buffer.slice(start, end);

          if (!slice.length) {
            return 0.04;
          }

          const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
          const rms = Math.sqrt(slice.reduce((sum, value) => sum + value * value, 0) / slice.length);
          const weightedEnergy = average * 0.45 + rms * 0.55;
          const normalized = weightedEnergy / 255;

          return Math.max(0.02, Math.min(0.72, Math.pow(normalized, 1.48)));
        }).map((value, index) => {
          const previous = smoothedValuesRef.current[index] || 0.08;
          const smoothed = value > previous
            ? previous * 0.58 + value * 0.42
            : previous * 0.88 + value * 0.12;
          smoothedValuesRef.current[index] = smoothed;

          const previousPeak = peakValuesRef.current[index] || smoothed;
          peakValuesRef.current[index] = smoothed > previousPeak
            ? smoothed
            : Math.max(smoothed, previousPeak - 0.026);

          return smoothed;
        });

        drawBars(visualValues, 0.92);
      } else {
        idlePhase += 0.06;
        const idleValues = Array.from({ length: BAR_COUNT }, (_, index) => {
          return 0.05 + Math.max(0, Math.sin(idlePhase + index * 0.28)) * 0.08;
        });
        peakValuesRef.current = idleValues;

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
  }, [analyserRef, isPlaying, tone]);

  return (
    <canvas
      ref={canvasRef}
      className={clsx(className || 'h-14 w-full')}
      style={style}
      aria-hidden="true"
    />
  );
}
