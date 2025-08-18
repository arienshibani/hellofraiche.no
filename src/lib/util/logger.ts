import { dev } from '$app/environment';

/**
 * Logger utility that only logs in development mode
 * Usage: logger.debug('message'), logger.info('message'), etc.
 */
export const logger = {
  debug: (...args: any[]) => {
    if (dev) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (dev) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (dev) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (dev) {
      console.error(...args);
    }
  }
};

/**
 * Simple debug log function
 * Usage: debugLog('message')
 */
export const debugLog = (...args: any[]) => {
  if (dev) {
    console.log(...args);
  }
};
