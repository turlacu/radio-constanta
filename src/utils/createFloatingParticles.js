/**
 * Generate floating particle data for background animation
 * Creates particles that float upward with random properties
 */
export const createFloatingParticles = (count = 100) => {
  const particles = [];

  for (let i = 0; i < count; i++) {
    const size = Math.random() * 8 + 2; // 2-10px
    const startX = Math.random() * 100; // 0-100vw
    const startY = 100 + Math.random() * 10; // 100-110vh (below screen)
    const endX = Math.random() * 100; // 0-100vw
    const endY = -(100 + Math.random() * 30); // -100 to -130vh (above screen)
    const duration = 28 + Math.random() * 9; // 28-37 seconds
    const delay = Math.random() * 37; // 0-37 seconds
    const scaleDelay = Math.random() * 4; // 0-4 seconds for scale animation

    particles.push({
      id: i,
      size,
      startX,
      startY,
      endX,
      endY,
      duration,
      delay,
      scaleDelay,
    });
  }

  return particles;
};
