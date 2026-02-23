import type { PrismaClientLike, SeedRunnerConfig } from "./types";

/**
 * Seed configuration
 */
export interface SeedConfig<
  TClient extends PrismaClientLike = PrismaClientLike,
> {
  /**
   * Prisma client instance
   */
  client: TClient;

  /**
   * Path to seeders directory (relative to config file)
   * @default './seeders'
   */
  seedersPath?: string;

  /**
   * File pattern to match seeder files
   * @default '*.ts'
   */
  seedersPattern?: string;

  /**
   * Seed runner configuration
   */
  config?: SeedRunnerConfig;
}

/**
 * Define seed configuration
 */
export function defineSeedConfig<
  TClient extends PrismaClientLike = PrismaClientLike,
>(config: SeedConfig<TClient>): SeedConfig<TClient> {
  return config;
}
