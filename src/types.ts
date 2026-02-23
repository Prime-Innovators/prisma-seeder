/**
 * Base Prisma client interface - compatible with any generated PrismaClient
 */
export interface PrismaClientLike {
  $disconnect: () => Promise<void>;
  [key: string]: any;
}

/**
 * Seeder definition
 */
export interface Seeder<TClient extends PrismaClientLike = PrismaClientLike> {
  /**
   * Unique identifier for this seeder (e.g., "001_roles")
   */
  name: string;

  /**
   * Optional list of environments where this seeder should run
   * If not specified, runs in all environments
   */
  environments?: string[];

  /**
   * The seeding logic - should be idempotent
   */
  run: (client: TClient) => Promise<void>;
}

/**
 * Seed run record interface
 */
export interface SeedRunRecord {
  id: string;
  name: string;
  environment: string | null;
  appliedAt: Date;
}

/**
 * Seed runner configuration
 */
export interface SeedRunnerConfig {
  /**
   * Current environment (defaults to NODE_ENV or 'development')
   */
  environment?: string;

  /**
   * Optional custom logger
   */
  logger?: SeedLogger;

  /**
   * Whether to use seed run tracking (requires SeedRun model)
   * @default true
   */
  trackRuns?: boolean;

  /**
   * Custom seed run table name
   * @default 'seedRun'
   */
  seedRunModel?: string;
}

/**
 * Logger interface
 */
export interface SeedLogger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}
