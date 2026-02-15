const isDev = __DEV__;

export const logger = {
    log: (...args: unknown[]) => isDev && console.log(...args),
    warn: (...args: unknown[]) => isDev && console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
    info: (...args: unknown[]) => isDev && console.info(...args),
};


