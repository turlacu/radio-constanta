const isDebugEnabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === 'true';

export const clientDebug = (...args) => {
  if (isDebugEnabled) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export const clientWarn = (...args) => {
  if (isDebugEnabled) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

export const clientError = (...args) => {
  if (isDebugEnabled) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};
