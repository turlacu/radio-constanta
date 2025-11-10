/**
 * Generate particle data for animated background
 * Returns array of particle objects with randomized properties
 */
export const createParticles = (count) => {
  const particles = [];

  const colors = [
    'rgba(139, 92, 246, 0.15)',   // Purple
    'rgba(59, 130, 246, 0.15)',   // Blue
    'rgba(6, 182, 212, 0.15)',    // Cyan
    'rgba(168, 85, 247, 0.12)',   // Light purple
    'rgba(147, 197, 253, 0.12)',  // Light blue
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      size: Math.random() * 200 + 100, // 100-300px
      left: Math.random() * 100, // 0-100%
      top: Math.random() * 100, // 0-100%
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 20 + 15, // 15-35s
      delay: Math.random() * 10, // 0-10s
      blur: Math.random() * 40 + 60, // 60-100px blur
      animationType: Math.random() > 0.5 ? 'float-up' : 'float-diagonal',
    });
  }

  return particles;
};

/**
 * Get particle count based on screen width and device type
 */
export const getParticleCount = (screenWidth, isMobile, isTV) => {
  if (isMobile) {
    return 10; // Mobile: minimal particles for performance
  } else if (isTV || screenWidth >= 1920) {
    return 30; // TV/4K: more particles for larger screen
  } else if (screenWidth >= 1280) {
    return 25; // Desktop: medium-high count
  } else {
    return 15; // Tablet: medium count
  }
};
