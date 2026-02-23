import type { SeedLogger } from './types';

/**
 * Default console logger
 */
export const defaultLogger: SeedLogger = {
  info: (message: string, ...args: any[]) =>
    console.log(`[Seed]`, message, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[Seed]`, message, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[Seed]`, message, ...args),
};
