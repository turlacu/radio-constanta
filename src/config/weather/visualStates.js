/**
 * Visual State Configuration
 * Defines all possible visual states and their properties for Style C (Hybrid Modern Weather)
 *
 * Each state includes:
 * - Gradient colors (soft, modern, premium feel)
 * - Particle settings (type, density, speed, direction)
 * - Aurora settings (for night modes)
 * - Animation parameters
 */

export const VISUAL_STATES = {
  // ===== DAY STATES =====
  sunny_day: {
    name: 'Sunny Day',
    // Warm orange gradient - comfortable for 4K viewing, less harsh than bright yellow
    gradients: [
      { color: '#F5C89B', opacity: 1, position: 0 },    // Soft peach
      { color: '#F1C292', opacity: 1, position: 11 },   // Peachy
      { color: '#EDBC88', opacity: 1, position: 22 },   // Light apricot
      { color: '#E9B67F', opacity: 1, position: 33 },   // Apricot
      { color: '#E5AF75', opacity: 1, position: 44 },   // Light orange
      { color: '#E0A86B', opacity: 1, position: 55 },   // Warm orange
      { color: '#DBA162', opacity: 1, position: 66 },   // Deeper orange
      { color: '#D69A58', opacity: 1, position: 77 },   // Medium orange
      { color: '#D1934E', opacity: 1, position: 88 },   // Burnt orange
      { color: '#CC8C45', opacity: 1, position: 100 }   // Deep warm orange
    ],
    particles: {
      type: 'dust',
      count: 30,
      speed: 0.3,
      size: { min: 1, max: 3 },
      opacity: { min: 0.2, max: 0.5 },
      direction: 'float'
    },
    aurora: false,
    overlayColor: 'rgba(0, 0, 0, 0.05)', // Slight darkening for eye comfort
    animationSpeed: 0.5
  },

  cloudy_day: {
    name: 'Cloudy Day',
    // Enhanced with more stops to prevent banding in grays
    gradients: [
      { color: '#B8C5CC', opacity: 1, position: 0 },
      { color: '#B0BEC5', opacity: 1, position: 12 },
      { color: '#A8B6BE', opacity: 1, position: 24 },
      { color: '#A0AEB7', opacity: 1, position: 36 },
      { color: '#98A6B0', opacity: 1, position: 48 },
      { color: '#909EA9', opacity: 1, position: 60 },
      { color: '#8896A2', opacity: 1, position: 72 },
      { color: '#808E9B', opacity: 1, position: 84 },
      { color: '#708491', opacity: 1, position: 92 },
      { color: '#607D8B', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'dust',
      count: 20,
      speed: 0.4,
      size: { min: 2, max: 4 },
      opacity: { min: 0.1, max: 0.3 },
      direction: 'drift'
    },
    aurora: false,
    overlayColor: null, // Removed to prevent banding
    animationSpeed: 0.6
  },

  rain_day: {
    name: 'Rainy Day',
    // Enhanced with 9 stops for smooth dark blue-gray gradient
    gradients: [
      { color: '#546E7A', opacity: 1, position: 0 },
      { color: '#50696F', opacity: 1, position: 12 },
      { color: '#4C6469', opacity: 1, position: 25 },
      { color: '#475F64', opacity: 1, position: 37 },
      { color: '#42595E', opacity: 1, position: 50 },
      { color: '#3D5258', opacity: 1, position: 62 },
      { color: '#374D53', opacity: 1, position: 75 },
      { color: '#31444A', opacity: 1, position: 87 },
      { color: '#263238', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'rain',
      count: 100,
      speed: 2.5,
      size: { min: 1, max: 2 },
      opacity: { min: 0.3, max: 0.6 },
      direction: 'diagonal',
      angle: 75
    },
    aurora: false,
    overlayColor: 'rgba(100, 120, 140, 0.2)',
    animationSpeed: 1.2
  },

  storm_day: {
    name: 'Stormy Day',
    // Enhanced with 10 stops for dramatic storm gradient
    gradients: [
      { color: '#455A64', opacity: 1, position: 0 },
      { color: '#40545E', opacity: 1, position: 11 },
      { color: '#3B4E58', opacity: 1, position: 22 },
      { color: '#374852', opacity: 1, position: 33 },
      { color: '#32424C', opacity: 1, position: 44 },
      { color: '#2D3C46', opacity: 1, position: 55 },
      { color: '#293640', opacity: 1, position: 66 },
      { color: '#24303A', opacity: 1, position: 77 },
      { color: '#202A34', opacity: 1, position: 88 },
      { color: '#1C2833', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'rain',
      count: 150,
      speed: 3.5,
      size: { min: 1, max: 3 },
      opacity: { min: 0.4, max: 0.7 },
      direction: 'diagonal',
      angle: 70
    },
    aurora: false,
    overlayColor: 'rgba(70, 80, 90, 0.3)',
    animationSpeed: 2.0,
    pulseEffect: true
  },

  snow_day: {
    name: 'Snowy Day',
    // Enhanced with 10 stops for soft winter gradient
    gradients: [
      { color: '#CFD8DC', opacity: 1, position: 0 },
      { color: '#C7D2D7', opacity: 1, position: 11 },
      { color: '#BFCCD2', opacity: 1, position: 22 },
      { color: '#B7C6CD', opacity: 1, position: 33 },
      { color: '#AFC0C8', opacity: 1, position: 44 },
      { color: '#A0B2BC', opacity: 1, position: 55 },
      { color: '#98ACB6', opacity: 1, position: 66 },
      { color: '#8FA6B0', opacity: 1, position: 77 },
      { color: '#87A0AA', opacity: 1, position: 88 },
      { color: '#78909C', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'snow',
      count: 80,
      speed: 0.8,
      size: { min: 2, max: 5 },
      opacity: { min: 0.4, max: 0.8 },
      direction: 'drift',
      sway: true
    },
    aurora: false,
    overlayColor: 'rgba(255, 255, 255, 0.2)',
    animationSpeed: 0.7
  },

  fog_day: {
    name: 'Foggy Day',
    // Enhanced for ultra-smooth fog gradients
    gradients: [
      { color: '#F2F5F7', opacity: 1, position: 0 },
      { color: '#ECEFF1', opacity: 1, position: 10 },
      { color: '#E5E9EB', opacity: 1, position: 20 },
      { color: '#DFE3E6', opacity: 1, position: 30 },
      { color: '#D8DDE0', opacity: 1, position: 40 },
      { color: '#D2D7DA', opacity: 1, position: 50 },
      { color: '#C4CCD1', opacity: 1, position: 60 },
      { color: '#B8C1C7', opacity: 1, position: 70 },
      { color: '#ACB6BD', opacity: 1, position: 80 },
      { color: '#A0ABB3', opacity: 1, position: 90 },
      { color: '#95A1AA', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'fog',
      count: 20, // Increased from 15
      speed: 0.15, // Slower for more haze effect
      size: { min: 60, max: 120 }, // Larger fog particles
      opacity: { min: 0.15, max: 0.35 }, // More visible
      direction: 'drift'
    },
    aurora: false,
    overlayColor: null,
    animationSpeed: 0.3,
    blurEffect: true
  },

  // ===== NIGHT STATES =====
  clear_night: {
    name: 'Clear Night',
    // Enhanced with 10 stops for deep blue night sky gradient
    gradients: [
      { color: '#1A237E', opacity: 1, position: 0 },
      { color: '#1E2885', opacity: 1, position: 11 },
      { color: '#232D8B', opacity: 1, position: 22 },
      { color: '#283593', opacity: 1, position: 33 },
      { color: '#2C3996', opacity: 1, position: 44 },
      { color: '#2E3C99', opacity: 1, position: 55 },
      { color: '#303F9F', opacity: 1, position: 66 },
      { color: '#3442A3', opacity: 1, position: 77 },
      { color: '#3745A7', opacity: 1, position: 88 },
      { color: '#3949AB', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'stars',
      count: 100,
      speed: 0.1,
      size: { min: 1, max: 2 },
      opacity: { min: 0.3, max: 0.9 },
      direction: 'static',
      twinkle: true
    },
    aurora: false, // Disabled - removed aurora entirely for consistent, fast, banding-free rendering
    overlayColor: 'rgba(26, 35, 126, 0.2)',
    animationSpeed: 0.4
  },

  cloudy_night: {
    name: 'Cloudy Night',
    // Enhanced gradient with more stops and subtle color shifts to prevent banding
    gradients: [
      { color: '#2D3A41', opacity: 1, position: 0 },     // Darker start with blue tint
      { color: '#374650', opacity: 1, position: 15 },
      { color: '#3F4F58', opacity: 1, position: 25 },
      { color: '#455A64', opacity: 1, position: 35 },
      { color: '#4D6169', opacity: 1, position: 45 },
      { color: '#546E7A', opacity: 1, position: 55 },
      { color: '#5C7580', opacity: 1, position: 65 },
      { color: '#657D87', opacity: 1, position: 75 },
      { color: '#6E858F', opacity: 1, position: 85 },
      { color: '#778D96', opacity: 1, position: 95 },
      { color: '#7A919A', opacity: 1, position: 100 }   // Lighter end
    ],
    particles: {
      type: 'dust',
      count: 15,
      speed: 0.3,
      size: { min: 2, max: 4 },
      opacity: { min: 0.1, max: 0.2 },
      direction: 'drift'
    },
    aurora: false, // Disabled - gray aurora causes circular banding with minimal visual benefit
    overlayColor: null, // Removed overlay to prevent banding
    animationSpeed: 0.5
  },

  rain_night: {
    name: 'Rainy Night',
    // Enhanced with 9 stops for smooth rainy night gradient
    gradients: [
      { color: '#263238', opacity: 1, position: 0 },
      { color: '#2B383F', opacity: 1, position: 12 },
      { color: '#313F46', opacity: 1, position: 25 },
      { color: '#36454D', opacity: 1, position: 37 },
      { color: '#3C4C54', opacity: 1, position: 50 },
      { color: '#41525A', opacity: 1, position: 62 },
      { color: '#47585F', opacity: 1, position: 75 },
      { color: '#4D616A', opacity: 1, position: 87 },
      { color: '#546E7A', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'rain',
      count: 100,
      speed: 2.5,
      size: { min: 1, max: 2 },
      opacity: { min: 0.3, max: 0.6 },
      direction: 'diagonal',
      angle: 75
    },
    aurora: false,
    overlayColor: 'rgba(38, 50, 56, 0.4)',
    animationSpeed: 1.2
  },

  storm_night: {
    name: 'Stormy Night',
    // Enhanced with 10 stops for dramatic night storm gradient
    gradients: [
      { color: '#1C2833', opacity: 1, position: 0 },
      { color: '#1F2B35', opacity: 1, position: 11 },
      { color: '#232E38', opacity: 1, position: 22 },
      { color: '#27323C', opacity: 1, position: 33 },
      { color: '#2B3742', opacity: 1, position: 44 },
      { color: '#303D48', opacity: 1, position: 55 },
      { color: '#36454D', opacity: 1, position: 66 },
      { color: '#3C4D56', opacity: 1, position: 77 },
      { color: '#41535D', opacity: 1, position: 88 },
      { color: '#455A64', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'rain',
      count: 150,
      speed: 3.5,
      size: { min: 1, max: 3 },
      opacity: { min: 0.4, max: 0.7 },
      direction: 'diagonal',
      angle: 70
    },
    aurora: false,
    overlayColor: 'rgba(28, 40, 51, 0.5)',
    animationSpeed: 2.0,
    pulseEffect: true
  },

  snow_night: {
    name: 'Snowy Night',
    // Enhanced with 10 stops for gentle snowy night gradient
    gradients: [
      { color: '#455A64', opacity: 1, position: 0 },
      { color: '#4A6169', opacity: 1, position: 11 },
      { color: '#4F676F', opacity: 1, position: 22 },
      { color: '#546E7A', opacity: 1, position: 33 },
      { color: '#5A7480', opacity: 1, position: 44 },
      { color: '#5F7A85', opacity: 1, position: 55 },
      { color: '#657E88', opacity: 1, position: 66 },
      { color: '#6B858F', opacity: 1, position: 77 },
      { color: '#728B96', opacity: 1, position: 88 },
      { color: '#78909C', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'snow',
      count: 80,
      speed: 0.8,
      size: { min: 2, max: 5 },
      opacity: { min: 0.4, max: 0.8 },
      direction: 'drift',
      sway: true
    },
    aurora: false, // Disabled - aurora radial gradients cause circular banding and slow performance
    overlayColor: 'rgba(69, 90, 100, 0.3)',
    animationSpeed: 0.7
  },

  fog_night: {
    name: 'Foggy Night',
    // Enhanced with more stops for smooth foggy night
    gradients: [
      { color: '#2F3C43', opacity: 1, position: 0 },
      { color: '#37474F', opacity: 1, position: 12 },
      { color: '#3F4F57', opacity: 1, position: 24 },
      { color: '#47575F', opacity: 1, position: 36 },
      { color: '#4F5F67', opacity: 1, position: 48 },
      { color: '#57676F', opacity: 1, position: 60 },
      { color: '#5F6F77', opacity: 1, position: 72 },
      { color: '#677781', opacity: 1, position: 84 },
      { color: '#6F7F89', opacity: 1, position: 92 },
      { color: '#758188', opacity: 1, position: 100 }
    ],
    particles: {
      type: 'fog',
      count: 20, // Increased from 15
      speed: 0.15, // Slower for more haze effect
      size: { min: 60, max: 120 }, // Larger fog particles
      opacity: { min: 0.15, max: 0.35 }, // More visible
      direction: 'drift'
    },
    aurora: false,
    overlayColor: null,
    animationSpeed: 0.3,
    blurEffect: true
  }
};

/**
 * Maps OpenWeatherMap condition codes to visual states
 */
export const WEATHER_CODE_MAP = {
  // Thunderstorm
  200: 'storm', 201: 'storm', 202: 'storm',
  210: 'storm', 211: 'storm', 212: 'storm',
  221: 'storm', 230: 'storm', 231: 'storm', 232: 'storm',

  // Drizzle
  300: 'rain', 301: 'rain', 302: 'rain',
  310: 'rain', 311: 'rain', 312: 'rain',
  313: 'rain', 314: 'rain', 321: 'rain',

  // Rain
  500: 'rain', 501: 'rain', 502: 'rain',
  503: 'rain', 504: 'rain', 511: 'rain',
  520: 'rain', 521: 'rain', 522: 'rain', 531: 'rain',

  // Snow
  600: 'snow', 601: 'snow', 602: 'snow',
  611: 'snow', 612: 'snow', 613: 'snow',
  615: 'snow', 616: 'snow', 620: 'snow',
  621: 'snow', 622: 'snow',

  // Atmosphere (Fog, Mist, etc.)
  701: 'fog', 711: 'fog', 721: 'fog',
  731: 'fog', 741: 'fog', 751: 'fog',
  761: 'fog', 762: 'fog', 771: 'fog', 781: 'fog',

  // Clear
  800: 'sunny',

  // Clouds
  801: 'cloudy', 802: 'cloudy', 803: 'cloudy', 804: 'cloudy'
};

/**
 * Time-based configuration
 */
export const TIME_CONFIG = {
  dayStart: 6,    // 6 AM
  dayEnd: 18,     // 6 PM
  sunriseBuffer: 1,  // 1 hour buffer for sunrise
  sunsetBuffer: 1    // 1 hour buffer for sunset
};

/**
 * Performance configuration
 * Defines particle counts for different device capabilities
 */
export const PERFORMANCE_CONFIG = {
  high: {
    particleMultiplier: 1.0,
    auroraEnabled: true,
    effectsEnabled: true
  },
  medium: {
    particleMultiplier: 0.6,
    auroraEnabled: true,
    effectsEnabled: true
  },
  low: {
    particleMultiplier: 0.3,
    auroraEnabled: false,
    effectsEnabled: false
  }
};
