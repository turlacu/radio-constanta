/**
 * ParticleLayer
 * Canvas-based particle system for weather effects
 * Supports: rain, snow, stars, dust, fog particles
 * Optimized for performance across devices
 */

import { useEffect, useRef } from 'react';
import { PERFORMANCE_CONFIG } from '../config/visualStates';

export const ParticleLayer = ({ visualState, performanceLevel }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!visualState || !visualState.particles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get performance multiplier
    const perfConfig = PERFORMANCE_CONFIG[performanceLevel] || PERFORMANCE_CONFIG.medium;
    const particleCount = Math.floor(
      visualState.particles.count * perfConfig.particleMultiplier
    );

    // Initialize particles
    particlesRef.current = createParticles(
      particleCount,
      visualState.particles,
      canvas.width / dpr,
      canvas.height / dpr
    );

    // Animation loop
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        updateParticle(particle, visualState.particles, canvas.width / dpr, canvas.height / dpr, deltaTime);
        drawParticle(ctx, particle, visualState.particles);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
    };
  }, [visualState, performanceLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        // No global opacity - let individual particles control their own opacity
        // Global opacity compounds with background layers causing banding
      }}
    />
  );
};

/**
 * Create particles based on configuration
 */
function createParticles(count, config, width, height) {
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push(createParticle(config, width, height));
  }

  return particles;
}

/**
 * Create a single particle
 */
function createParticle(config, width, height) {
  const size = randomRange(config.size.min, config.size.max);
  const opacity = randomRange(config.opacity.min, config.opacity.max);

  const particle = {
    x: Math.random() * width,
    y: Math.random() * height,
    size,
    opacity,
    baseOpacity: opacity,
    speed: config.speed * randomRange(0.5, 1.5),
    vx: 0,
    vy: 0,
    angle: config.angle || 0,
    phase: Math.random() * Math.PI * 2, // For sine wave motion
    lifetime: 0,
    twinklePhase: Math.random() * Math.PI * 2 // For star twinkling
  };

  // Set initial velocity based on particle type
  switch (config.type) {
    case 'rain':
      particle.vy = particle.speed * 100;
      particle.vx = Math.sin((config.angle || 75) * Math.PI / 180) * particle.speed * 30;
      break;

    case 'snow':
      particle.vy = particle.speed * 20;
      particle.vx = Math.sin(particle.phase) * particle.speed * 5;
      break;

    case 'dust':
    case 'fog':
      particle.vx = particle.speed * randomRange(-10, 10);
      particle.vy = particle.speed * randomRange(-5, 5);
      break;

    case 'stars':
      particle.vx = 0;
      particle.vy = 0;
      break;

    default:
      particle.vx = 0;
      particle.vy = particle.speed * 10;
  }

  return particle;
}

/**
 * Update particle position
 */
function updateParticle(particle, config, width, height, deltaTime) {
  particle.lifetime += deltaTime;

  // Update position based on particle type
  switch (config.type) {
    case 'rain':
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      break;

    case 'snow':
      if (config.sway) {
        particle.x += Math.sin(particle.lifetime * 2 + particle.phase) * 20 * deltaTime;
      }
      particle.y += particle.vy * deltaTime;
      break;

    case 'dust':
    case 'fog':
      particle.x += particle.vx * deltaTime;
      particle.y += Math.sin(particle.lifetime + particle.phase) * 10 * deltaTime;
      break;

    case 'stars':
      // Stars don't move, but twinkle
      if (config.twinkle) {
        particle.twinklePhase += deltaTime * 2;
        particle.opacity = particle.baseOpacity * (0.5 + Math.sin(particle.twinklePhase) * 0.5);
      }
      break;

    default:
      particle.y += particle.vy * deltaTime;
  }

  // Wrap or reset particles that go off screen
  if (particle.y > height + particle.size) {
    particle.y = -particle.size;
    particle.x = Math.random() * width;
  }

  if (particle.x > width + particle.size) {
    particle.x = -particle.size;
  } else if (particle.x < -particle.size) {
    particle.x = width + particle.size;
  }

  // For fog, slowly fade in and out
  if (config.type === 'fog') {
    particle.opacity = particle.baseOpacity * (0.5 + Math.sin(particle.lifetime * 0.5) * 0.5);
  }
}

/**
 * Draw particle on canvas
 */
function drawParticle(ctx, particle, config) {
  ctx.save();

  switch (config.type) {
    case 'rain':
      drawRain(ctx, particle);
      break;

    case 'snow':
      drawSnow(ctx, particle);
      break;

    case 'dust':
      drawDust(ctx, particle);
      break;

    case 'fog':
      drawFog(ctx, particle);
      break;

    case 'stars':
      drawStar(ctx, particle);
      break;

    default:
      drawDust(ctx, particle);
  }

  ctx.restore();
}

/**
 * Draw rain drop (stylized line)
 */
function drawRain(ctx, particle) {
  const length = particle.size * 10;

  ctx.strokeStyle = `rgba(200, 220, 255, ${particle.opacity})`;
  ctx.lineWidth = particle.size * 0.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(particle.x, particle.y);
  ctx.lineTo(
    particle.x - particle.vx * 0.02,
    particle.y - length
  );
  ctx.stroke();
}

/**
 * Draw snow flake (stylized circle/hexagon)
 */
function drawSnow(ctx, particle) {
  // Simple circle for performance
  ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();

  // Add subtle glow
  ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.3})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw dust particle (small circle)
 */
function drawDust(ctx, particle) {
  ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw fog particle (large blurred circle)
 */
function drawFog(ctx, particle) {
  const gradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, particle.size
  );

  gradient.addColorStop(0, `rgba(200, 200, 220, ${particle.opacity})`);
  gradient.addColorStop(0.5, `rgba(200, 200, 220, ${particle.opacity * 0.5})`);
  gradient.addColorStop(1, 'rgba(200, 200, 220, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw star (small glowing point)
 */
function drawStar(ctx, particle) {
  // Main star
  ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  const gradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, particle.size * 3
  );

  gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity * 0.5})`);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Helper: Generate random number in range
 */
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export default ParticleLayer;
