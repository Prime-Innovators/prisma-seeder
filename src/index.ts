/**
 * @repo/prisma-seeder
 * A scalable, environment-aware seeding framework for Prisma
 */

export * from './types';
export * from './runner';
export * from './logger';
export * from './config';
export * from './discovery';

// Re-export for convenience
export { SeedRunner, runSeeders } from './runner';
export { defineSeedConfig } from './config';
export { discoverSeeders } from './discovery';
export type {
  Seeder,
  PrismaClientLike,
  SeedRunnerConfig,
  SeedLogger,
  SeedRunRecord,
} from './types';
export type { SeedConfig } from './config';
