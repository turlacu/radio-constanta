/**
 * Detects if the current device is running iOS or macOS
 * Used to determine whether to use ALAC (Apple Lossless) or FLAC for lossless audio
 *
 * @returns {boolean} True if the device is iOS or macOS, false otherwise
 */
export const isAppleDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const platform = navigator.platform || '';

  // Check for iOS devices (iPhone, iPad, iPod)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

  // Check for macOS
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) ||
                  (platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro in desktop mode

  return isIOS || isMacOS;
};

/**
 * Gets the appropriate stream URL based on device OS
 * For Apple devices (iOS, macOS), returns ALAC URL if available, otherwise falls back to FLAC URL
 * For other devices, returns FLAC URL
 *
 * @param {string} flacUrl - The FLAC stream URL
 * @param {string} alacUrl - The ALAC stream URL (optional)
 * @returns {string} The appropriate stream URL for the current device
 */
export const getLosslessStreamUrl = (flacUrl, alacUrl) => {
  if (!flacUrl) {
    return '';
  }

  // If no ALAC URL is provided, use FLAC for all devices
  if (!alacUrl) {
    return flacUrl;
  }

  // Use ALAC for Apple devices if available
  if (isAppleDevice()) {
    return alacUrl;
  }

  // Use FLAC for all other devices
  return flacUrl;
};

/**
 * Gets a human-readable format label based on the current device
 *
 * @returns {string} 'ALAC' for Apple devices, 'FLAC' for others
 */
export const getLosslessFormatLabel = () => {
  return isAppleDevice() ? 'ALAC' : 'FLAC';
};
